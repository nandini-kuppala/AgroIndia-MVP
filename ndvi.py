# !pip install earthengine-api geemap shapely geopandas
# Authenticate GEE
import ee
from google.colab import auth

auth.authenticate_user()
ee.Authenticate()
ee.Initialize(project='nurture-sync')
import geemap
from geemap import foliumap

# Create map
m = geemap.Map(center=[16.5, 80.5], zoom=7)  # Andhra/Telangana region
m.add_basemap('SATELLITE')

# Add drawing controls
m.add_draw_control()

m
# Fetch drawn geometries
drawn = m.user_rois

if not drawn:
    raise Exception("Draw a polygon on the map first!")

# Fix: Use .first() to get the first feature from the FeatureCollection
roi = drawn.first()

# Fix: Get the GeoJSON representation of the geometry from the feature
geojson_roi = roi.geometry().getInfo()

print("Polygon GeoJSON:")
print(geojson_roi)

# Convert to Earth Engine geometry
aoi = ee.Geometry.Polygon(geojson_roi['coordinates'])

# Polygon GeoJSON:
# {'geodesic': False, 'type': 'Polygon', 'coordinates': [[[79.616559, 16.004504], [79.616312, 16.002802], [79.618759, 16.002493], [79.618888, 16.004019], [79.618791, 16.004164], [79.616559, 16.004504]]]}

import datetime
from datetime import timedelta
import numpy as np

# ==========================================
# STEP 1: Enhanced helper functions
# ==========================================

def get_growth_season_dates(location='andhra'):
    """
    Get typical crop growth season dates for Andhra Pradesh/Telangana
    Major seasons: Kharif (June-Oct), Rabi (Nov-Feb)
    We'll use mid-Kharif (August) as default
    """
    current_year = datetime.datetime.now().year
    # Use August 15th as a good date in Kharif season (monsoon crop season)
    return datetime.date(current_year - 1, 8, 15)  # Start from last year to ensure data availability

def get_cloud_free_image_iterative(collection, aoi, target_date, max_cloud_cover=10, max_search_days=15):
    """
    Iteratively search for cloud-free image by moving date day by day
    Alternates between forward and backward search within the same month
    """
    original_month = target_date.month

    # Try the target date first
    dates_to_try = [target_date]

    # Generate alternating forward/backward dates within the same month
    for offset in range(1, max_search_days + 1):
        # Try forward
        forward_date = target_date + timedelta(days=offset)
        if forward_date.month == original_month:
            dates_to_try.append(forward_date)

        # Try backward
        backward_date = target_date - timedelta(days=offset)
        if backward_date.month == original_month:
            dates_to_try.append(backward_date)

    print(f"  Searching for cloud-free image (max cloud cover: {max_cloud_cover}%)")

    best_image = None
    best_cloud_cover = 100
    best_date = None

    for search_date in dates_to_try:
        date_str = search_date.strftime('%Y-%m-%d')
        next_day_str = (search_date + timedelta(days=1)).strftime('%Y-%m-%d')

        # Filter for specific date
        daily_images = collection.filterBounds(aoi) \
                                .filterDate(date_str, next_day_str) \
                                .filter(ee.Filter.lt('CLOUD_COVER', max_cloud_cover))

        # Check if we have images
        count = daily_images.size().getInfo()
        if count > 0:
            # Get the image with lowest cloud cover for this date
            image = daily_images.sort('CLOUD_COVER').first()
            cloud_cover = image.get('CLOUD_COVER').getInfo()

            print(f"    {date_str}: Found image with {cloud_cover:.1f}% cloud cover")

            if cloud_cover < best_cloud_cover:
                best_image = image
                best_cloud_cover = cloud_cover
                best_date = search_date

            # If we found a very clear image, use it
            if cloud_cover < 5:
                print(f"  ✓ Selected {date_str} (excellent quality: {cloud_cover:.1f}% clouds)")
                return image, search_date, cloud_cover

    if best_image is not None:
        print(f"  ✓ Selected {best_date.strftime('%Y-%m-%d')} (best available: {best_cloud_cover:.1f}% clouds)")
        return best_image, best_date, best_cloud_cover

    # If no suitable image found, expand search
    print(f"  ⚠️ No suitable image found in month {original_month}, expanding search...")
    return get_cloud_free_image_fallback(collection, aoi, target_date, max_cloud_cover * 2)

def get_cloud_free_image_fallback(collection, aoi, target_date, max_cloud_cover=20):
    """
    Fallback method: search ±30 days if no good image found in the month
    """
    start_date = (target_date - timedelta(days=30)).strftime('%Y-%m-%d')
    end_date = (target_date + timedelta(days=30)).strftime('%Y-%m-%d')

    filtered = collection.filterBounds(aoi) \
                        .filterDate(start_date, end_date) \
                        .filter(ee.Filter.lt('CLOUD_COVER', max_cloud_cover))

    count = filtered.size().getInfo()
    if count == 0:
        raise Exception(f"No suitable images found for {target_date.year} even with {max_cloud_cover}% cloud threshold")

    best_image = filtered.sort('CLOUD_COVER').first()
    actual_date = datetime.datetime.fromtimestamp(
        best_image.get('system:time_start').getInfo() / 1000
    ).date()
    cloud_cover = best_image.get('CLOUD_COVER').getInfo()

    print(f"  ✓ Fallback: Selected {actual_date} ({cloud_cover:.1f}% clouds)")
    return best_image, actual_date, cloud_cover

def mask_clouds_landsat89(image):
    """
    Mask clouds for Landsat 8-9 using QA_PIXEL band
    """
    qa = image.select('QA_PIXEL')
    # Bits 3 and 4 are cloud and cloud shadow
    cloud_mask = qa.bitwiseAnd(1 << 3).eq(0).And(qa.bitwiseAnd(1 << 4).eq(0))
    return image.updateMask(cloud_mask)

def add_ndvi_landsat89(image):
    """
    Calculate NDVI for Landsat 8-9
    NDVI = (NIR - Red) / (NIR + Red)
    For Landsat 8-9: NIR = B5, Red = B4
    """
    ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI')
    return image.addBands(ndvi)

# ==========================================
# STEP 2: Set up Landsat collection
# ==========================================

# Use Landsat 8-9 Collection 2 Surface Reflectance
landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2') \
            .merge(ee.ImageCollection('LANDSAT/LC09/C02/T1_L2'))

print("Landsat collection loaded successfully!")

# ==========================================
# STEP 3: Get EXACTLY 5 years of imagery
# ==========================================

# Define target date (you can make this user-configurable later)
base_date = get_growth_season_dates()
print(f"\nBase date for imagery: {base_date}")
print(f"Target month: {base_date.strftime('%B')}")
print("="*70)

# Get images for past 5 years - GUARANTEED 5 YEARS
years_to_fetch = 5
ndvi_images = []
image_metadata = []

print(f"\nFetching cloud-free imagery for EXACTLY {years_to_fetch} years...\n")

years_processed = 0
year_offset = 0
max_attempts = 10  # Safety limit to prevent infinite loop

while years_processed < years_to_fetch and year_offset < max_attempts:
    target_year = base_date.year - year_offset
    target_date = datetime.date(target_year, base_date.month, base_date.day)

    print(f"\n{'='*70}")
    print(f"Processing Year {years_processed + 1}/{years_to_fetch}: {target_year}")
    print(f"{'='*70}")
    print(f"Target date: {target_date}")

    try:
        # Get cloud-free image for this year
        image, actual_date, cloud_cover = get_cloud_free_image_iterative(
            landsat, aoi, target_date, max_cloud_cover=10, max_search_days=15
        )

        # Mask clouds and calculate NDVI
        image_masked = mask_clouds_landsat89(image)
        image_ndvi = add_ndvi_landsat89(image_masked)

        # Clip to AOI
        ndvi_clipped = image_ndvi.select('NDVI').clip(aoi)

        # Store results
        ndvi_images.append(ndvi_clipped)
        image_metadata.append({
            'year': target_year,
            'target_date': target_date.strftime('%Y-%m-%d'),
            'actual_date': actual_date.strftime('%Y-%m-%d'),
            'cloud_cover': cloud_cover,
            'date_difference': abs((actual_date - target_date).days)
        })

        years_processed += 1
        print(f"✅ SUCCESS: Year {target_year} complete!")
        print(f"   Date used: {actual_date} (±{abs((actual_date - target_date).days)} days from target)")

    except Exception as e:
        print(f"❌ FAILED: Could not get image for {target_year}")
        print(f"   Error: {str(e)}")
        print(f"   Skipping to next year...")

    year_offset += 1

# Check if we got all 5 years
if years_processed < years_to_fetch:
    print(f"\n⚠️ WARNING: Only retrieved {years_processed} out of {years_to_fetch} years")
    print(f"   Consider adjusting the base date or cloud cover threshold")
else:
    print(f"\n{'='*70}")
    print(f"✅ SUCCESS: Retrieved EXACTLY {years_to_fetch} years of NDVI data!")
    print(f"{'='*70}")

# ==========================================
# STEP 4: Display summary of retrieved data
# ==========================================

print("\n\n📊 DATA RETRIEVAL SUMMARY")
print("="*70)
print(f"{'Year':<8} {'Target Date':<15} {'Actual Date':<15} {'Days Diff':<12} {'Cloud %':<10}")
print("-"*70)

for metadata in image_metadata:
    print(f"{metadata['year']:<8} {metadata['target_date']:<15} {metadata['actual_date']:<15} "
          f"±{metadata['date_difference']:<11} {metadata['cloud_cover']:<10.1f}")

print("="*70)

# Calculate average date difference
avg_diff = sum(m['date_difference'] for m in image_metadata) / len(image_metadata)
max_diff = max(m['date_difference'] for m in image_metadata)
print(f"\nDate Consistency:")
print(f"  Average deviation from target: ±{avg_diff:.1f} days")
print(f"  Maximum deviation: ±{max_diff} days")
print(f"  All dates in same month: {all(m['date_difference'] <= 15 for m in image_metadata)}")

# ==========================================
# STEP 5: Visualize NDVI images
# ==========================================

print("\n\n🗺️  CREATING VISUALIZATION...")

# NDVI visualization parameters
ndvi_vis_params = {
    'min': 0,
    'max': 0.8,
    'palette': ['red', 'yellow', 'green', 'darkgreen']
}

# Create a new map for visualization
m2 = geemap.Map(center=[aoi.centroid().coordinates().getInfo()[1],
                        aoi.centroid().coordinates().getInfo()[0]],
                zoom=14)

# Add the field boundary
m2.addLayer(aoi, {'color': 'white'}, 'Field Boundary')

# Add each NDVI image as a layer
print("\nAdding NDVI layers to map:")
for idx, (ndvi_img, metadata) in enumerate(zip(ndvi_images, image_metadata)):
    layer_name = f"NDVI {metadata['year']} ({metadata['actual_date']})"
    m2.addLayer(ndvi_img, ndvi_vis_params, layer_name, shown=(idx==0))  # Show only the most recent
    print(f"  ✓ {layer_name}")

# Add legend
m2.add_colorbar(ndvi_vis_params, label="NDVI Value", layer_name="NDVI")

print("\n" + "="*70)
print("✅ VISUALIZATION READY!")
print("="*70)
print("\n📊 NDVI Color Scale:")
print("  🔴 Red (0.0-0.2):       Bare soil / Non-vegetated / Water")
print("  🟡 Yellow (0.2-0.4):    Sparse vegetation / Stressed crops")
print("  🟢 Green (0.4-0.6):     Moderate vegetation / Healthy crops")
print("  🟢 Dark Green (0.6-0.8): Dense vegetation / Very healthy crops")
print("\n💡 TIP: Use the layer control (top-right) to toggle between years!")
print("="*70)

m2

# ==========================================
# STEP 6: Extract NDVI statistics for each year
# ==========================================

def get_ndvi_stats(ndvi_image, aoi):
    """
    Extract comprehensive NDVI statistics for the field
    """
    stats = ndvi_image.reduceRegion(
        reducer=ee.Reducer.mean().combine(
            reducer2=ee.Reducer.minMax(),
            sharedInputs=True
        ).combine(
            reducer2=ee.Reducer.stdDev(),
            sharedInputs=True
        ).combine(
            reducer2=ee.Reducer.percentile([25, 50, 75]),
            sharedInputs=True
        ),
        geometry=aoi,
        scale=30,  # Landsat resolution
        maxPixels=1e9
    )
    return stats.getInfo()

print("\n\n📈 NDVI STATISTICS FOR ALL YEARS")
print("="*70)

all_stats = []
for metadata, ndvi_img in zip(image_metadata, ndvi_images):
    stats = get_ndvi_stats(ndvi_img, aoi)
    all_stats.append(stats)

    print(f"\n{metadata['year']} ({metadata['actual_date']}):")
    # Helper for formatting None values
    def format_stat(value):
        return f"{value:.3f}" if value is not None else "N/A"

    print(f"  Mean NDVI:      {format_stat(stats.get('NDVI_mean'))}")
    print(f"  Median NDVI:    {format_stat(stats.get('NDVI_p50'))}")
    print(f"  Min NDVI:       {format_stat(stats.get('NDVI_min'))}")
    print(f"  Max NDVI:       {format_stat(stats.get('NDVI_max'))}")
    print(f"  25th percentile: {format_stat(stats.get('NDVI_p25'))}")
    print(f"  75th percentile: {format_stat(stats.get('NDVI_p75'))}")
    print(f"  Std Dev:        {format_stat(stats.get('NDVI_stdDev'))}")
    print(f"  Cloud Cover:    {metadata['cloud_cover']:.1f}%")

print("="*70)


# ==========================================
# STEP 7: Export NDVI data for classification
# ==========================================


print("\n\n💾 EXPORTING NDVI DATA FOR CLASSIFICATION")
print("="*70)

def get_ndvi_as_array(ndvi_image, aoi, scale=30):
    """
    Get NDVI as numpy array directly (works for fields up to ~500 hectares)
    """
    region = aoi.bounds()
    sample = ndvi_image.sampleRectangle(region=region, defaultValue=0)
    ndvi_array = np.array(sample.get('NDVI').getInfo())
    return ndvi_array

# Try to get arrays directly
ndvi_arrays = []
successful_arrays = 0

for metadata, ndvi_img in zip(image_metadata, ndvi_images):
    try:
        arr = get_ndvi_as_array(ndvi_img, aoi)
        ndvi_arrays.append(arr)
        successful_arrays += 1
        print(f"✓ {metadata['year']}: Array shape {arr.shape}, "
              f"Range: [{np.nanmin(arr):.3f}, {np.nanmax(arr):.3f}], "
              f"Mean: {np.nanmean(arr):.3f}")
    except Exception as e:
        print(f"⚠️ {metadata['year']}: Field too large for direct array export")
        print(f"   Use GeoTIFF export instead (see download URLs below)")
        # Generate download URL as fallback
        region = aoi.bounds().getInfo()['coordinates']
        url = ndvi_img.getDownloadURL({
            'region': region,
            'scale': 30,
            'format': 'GEO_TIFF'
        })
        print(f"   Download URL: {url[:80]}...")
        ndvi_arrays.append(None)

if successful_arrays == years_to_fetch:
    print(f"\n✅ Successfully loaded all {years_to_fetch} NDVI arrays!")
    print("\n🎯 Ready for classification algorithm:")
    print(f"   - ndvi_arrays is a list of {len(ndvi_arrays)} numpy arrays")
    print(f"   - Each array shape: {ndvi_arrays[0].shape}")
    print(f"   - ndvi_arrays[0] = Most recent year ({image_metadata[0]['year']})")
    print(f"   - ndvi_arrays[-1] = Oldest year ({image_metadata[-1]['year']})")
    print("\n📝 Next steps:")
    print("   1. Stack arrays: ndvi_stack = np.stack(ndvi_arrays, axis=0)")
    print("   2. Apply your Affinity Propagation clustering")
    print("   3. Classify into 6 growth classes")
else:
    print(f"\n⚠️ Only {successful_arrays} arrays loaded directly")
    print("   For large fields, download GeoTIFFs using the URLs above")

print("="*70)
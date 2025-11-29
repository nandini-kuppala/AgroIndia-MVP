import ee
import numpy as np
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor
import os
import json

class NDVIService:
    """
    Service for fetching and processing NDVI satellite imagery
    Based on ndvi.py logic
    """

    def __init__(self, project_id: str = None):
        """
        Initialize Earth Engine

        Args:
            project_id: Google Cloud Project ID (optional, but recommended)
        """
        try:
            # Check for service account credentials (for production)
            service_account_key = os.getenv("GOOGLE_SERVICE_ACCOUNT_KEY")

            if service_account_key:
                # Production mode: Use service account
                print("Initializing Earth Engine with service account...")
                try:
                    # Parse the JSON key
                    credentials_dict = json.loads(service_account_key)
                    service_account = credentials_dict.get('client_email')

                    # Create credentials from the service account key
                    credentials = ee.ServiceAccountCredentials(
                        email=service_account,
                        key_data=service_account_key
                    )

                    # Initialize with service account credentials
                    ee.Initialize(credentials=credentials, project=project_id)
                    print(f"✅ Earth Engine initialized with service account: {service_account}")
                except Exception as e:
                    print(f"❌ Failed to initialize with service account: {str(e)}")
                    raise

            elif project_id:
                # Development mode: Use authenticated user credentials
                print("Initializing Earth Engine with user credentials...")
                ee.Initialize(project=project_id)
                print(f"Earth Engine initialized successfully with project: {project_id}")
            else:
                # Try without project (legacy method)
                try:
                    ee.Initialize()
                    print("Earth Engine initialized successfully (legacy mode)")
                except Exception as legacy_error:
                    print(f"Legacy initialization failed: {legacy_error}")
                    print("\nℹ️  Earth Engine now requires a Google Cloud Project.")
                    print("Please provide a project ID in your .env file:")
                    print("GOOGLE_CLOUD_PROJECT=your-project-id")
                    raise
        except Exception as e:
            print(f"\n❌ Earth Engine initialization failed: {e}")
            print("\n📝 Setup Instructions:")
            print("1. Register for Earth Engine: https://code.earthengine.google.com/")
            print("2. Create a Google Cloud Project: https://console.cloud.google.com/")
            print("3. Enable Earth Engine API for your project")
            print("4. Run: earthengine authenticate")
            print("5. Add GOOGLE_CLOUD_PROJECT=your-project-id to .env")
            raise

    def get_growth_season_dates(self, location='andhra'):
        """
        Get typical crop growth season dates for Andhra Pradesh/Telangana
        Major seasons: Kharif (June-Oct), Rabi (Nov-Feb)
        We'll use mid-Kharif (August) as default

        Returns a fixed date for consistent seasonal analysis
        """
        current_year = datetime.now().year
        current_month = datetime.now().month

        # Use August 15th as a good date in Kharif season (monsoon crop season)
        # If we're before August, use last year, otherwise use current year
        if current_month < 8:
            base_year = current_year - 1
        else:
            base_year = current_year

        return date(base_year, 8, 15)

    def get_cloud_free_image_iterative(
        self,
        collection: ee.ImageCollection,
        aoi: ee.Geometry,
        target_date: date,
        max_cloud_cover: int = 20,
        max_search_days: int = 45
    ) -> Tuple[ee.Image, date, float]:
        """
        Iteratively search for cloud-free image by moving date day by day
        Searches backwards and forwards up to max_search_days (default 45, can go higher)
        """
        # Allow flexible search range - no hard limit

        # Try the target date first
        dates_to_try = [target_date]

        # Generate alternating forward/backward dates (not restricted to same month)
        for offset in range(1, max_search_days + 1):
            # Try backward first (older data)
            backward_date = target_date - timedelta(days=offset)
            dates_to_try.append(backward_date)

            # Then try forward
            forward_date = target_date + timedelta(days=offset)
            dates_to_try.append(forward_date)

        print(f"  Searching for cloud-free image (max cloud cover: {max_cloud_cover}%, search range: ±{max_search_days} days)")

        best_image = None
        best_cloud_cover = 100
        best_date = None
        images_found = 0

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
                images_found += 1
                image = daily_images.sort('CLOUD_COVER').first()
                cloud_cover = image.get('CLOUD_COVER').getInfo()

                days_diff = abs((search_date - target_date).days)
                print(f"    {date_str} (±{days_diff}d): Found image with {cloud_cover:.1f}% cloud cover")

                if cloud_cover < best_cloud_cover:
                    best_image = image
                    best_cloud_cover = cloud_cover
                    best_date = search_date

                # Accept very good quality immediately
                if cloud_cover < 5:
                    print(f"  ✓ Selected {date_str} (excellent quality: {cloud_cover:.1f}% clouds)")
                    return image, search_date, cloud_cover

        if best_image is not None:
            days_diff = abs((best_date - target_date).days)
            print(f"  ✓ Selected {best_date.strftime('%Y-%m-%d')} (±{days_diff}d, {best_cloud_cover:.1f}% clouds, found {images_found} candidates)")
            return best_image, best_date, best_cloud_cover

        raise Exception(f"No suitable image found within ±{max_search_days} days of {target_date.strftime('%Y-%m-%d')} with <{max_cloud_cover}% cloud cover")

    def mask_clouds_landsat89(self, image: ee.Image) -> ee.Image:
        """Mask clouds for Landsat 8-9 using QA_PIXEL band"""
        qa = image.select('QA_PIXEL')
        cloud_mask = qa.bitwiseAnd(1 << 3).eq(0).And(qa.bitwiseAnd(1 << 4).eq(0))
        return image.updateMask(cloud_mask)

    def add_ndvi_landsat89(self, image: ee.Image) -> ee.Image:
        """
        Calculate NDVI for Landsat 8-9
        NDVI = (NIR - Red) / (NIR + Red)
        For Landsat 8-9: NIR = B5, Red = B4
        """
        ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI')
        return image.addBands(ndvi)

    def get_ndvi_stats(self, ndvi_image: ee.Image, aoi: ee.Geometry) -> Dict[str, float]:
        """Extract comprehensive NDVI statistics for the field"""
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

    def get_ndvi_as_array(self, ndvi_image: ee.Image, aoi: ee.Geometry) -> np.ndarray:
        """Get NDVI as numpy array"""
        region = aoi.bounds()
        sample = ndvi_image.sampleRectangle(region=region, defaultValue=0)
        ndvi_array = np.array(sample.get('NDVI').getInfo())
        return ndvi_array

    async def fetch_ndvi_imagery(
        self,
        polygon_coords: List[List[float]],
        years: int = 5
    ) -> Dict[str, Any]:
        """
        Main method to fetch NDVI imagery for specified years
        Returns NDVI arrays and metadata

        IMPORTANT: Only analyzes years from 2019 to present (past 5 years max)
        """
        # Convert polygon coordinates to Earth Engine geometry
        aoi = ee.Geometry.Polygon(polygon_coords)

        # Load Landsat collection
        landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2') \
                    .merge(ee.ImageCollection('LANDSAT/LC09/C02/T1_L2'))

        # Get base date (fixed seasonal date)
        base_date = self.get_growth_season_dates()
        print(f"\n{'='*70}")
        print(f"Starting NDVI Analysis")
        print(f"{'='*70}")
        print(f"Base date for imagery: {base_date} (Fixed seasonal reference)")
        print(f"Target: {years} years of data")

        # IMPORTANT: Do not go beyond 2019
        earliest_year = 2019
        current_year = base_date.year

        # Calculate actual years we can fetch
        available_years = current_year - earliest_year + 1
        if years > available_years:
            print(f"⚠️  Requested {years} years, but only {available_years} years available since 2019")
            years = available_years

        print(f"Will fetch data from {current_year} back to {max(current_year - years + 1, earliest_year)}")
        print(f"{'='*70}\n")

        # Fetch images for past N years
        ndvi_images = []
        image_metadata = []
        ndvi_arrays = []

        years_processed = 0
        year_offset = 0
        max_attempts = min(years + 3, available_years + 2)  # Allow some extra attempts

        # Process years sequentially (Earth Engine has rate limits)
        results = []

        while years_processed < years and year_offset < max_attempts:
            target_year = base_date.year - year_offset

            # STOP if we go beyond 2019
            if target_year < earliest_year:
                print(f"\n⚠️  Reached earliest year limit (2019). Stopping.")
                break

            target_date = date(target_year, base_date.month, base_date.day)

            print(f"\n{'='*70}")
            print(f"Processing Year {years_processed + 1}/{years}: {target_year}")
            print(f"{'='*70}")
            print(f"Target date: {target_date}")

            try:
                # Get cloud-free image for this year with 20% max cloud cover
                # Will search up to 45 days in each direction
                image, actual_date, cloud_cover = self.get_cloud_free_image_iterative(
                    landsat, aoi, target_date, max_cloud_cover=20, max_search_days=45
                )

                # Mask clouds and calculate NDVI
                image_masked = self.mask_clouds_landsat89(image)
                image_ndvi = self.add_ndvi_landsat89(image_masked)

                # Clip to AOI
                ndvi_clipped = image_ndvi.select('NDVI').clip(aoi)

                # Get statistics
                stats = self.get_ndvi_stats(ndvi_clipped, aoi)

                # Get as array
                ndvi_array = self.get_ndvi_as_array(ndvi_clipped, aoi)

                print(f"✅ SUCCESS: Year {target_year} complete!")
                print(f"   NDVI range: [{np.nanmin(ndvi_array):.3f}, {np.nanmax(ndvi_array):.3f}]")
                print(f"   NDVI mean: {np.nanmean(ndvi_array):.3f}")

                result = {
                    'year': target_year,
                    'ndvi_image': ndvi_clipped,
                    'ndvi_array': ndvi_array,
                    'metadata': {
                        'year': target_year,
                        'target_date': target_date.strftime('%Y-%m-%d'),
                        'actual_date': actual_date.strftime('%Y-%m-%d'),
                        'cloud_cover': cloud_cover,
                        'date_difference': abs((actual_date - target_date).days)
                    },
                    'stats': stats
                }

                results.append(result)
                years_processed += 1

            except Exception as e:
                print(f"❌ FAILED: Could not get image for {target_year}")
                print(f"   Error: {str(e)}")
                print(f"   Skipping to next year...")

            year_offset += 1

        if years_processed < years:
            if years_processed == 0:
                raise Exception(f"Failed to retrieve any imagery. Check field coordinates and try again.")
            else:
                print(f"\n⚠️ WARNING: Retrieved {years_processed} out of {years} requested years")
                print(f"   Continuing with available data...")

        # Extract data from results
        for result in results:
            ndvi_arrays.append(result['ndvi_array'])
            image_metadata.append(result['metadata'])

        # Calculate aggregate statistics
        all_ndvi_means = [np.nanmean(arr) for arr in ndvi_arrays]
        aggregate_stats = {
            'mean_ndvi_across_years': float(np.mean(all_ndvi_means)),
            'min_ndvi_across_years': float(np.min(all_ndvi_means)),
            'max_ndvi_across_years': float(np.max(all_ndvi_means)),
            'trend': 'improving' if all_ndvi_means[-1] > all_ndvi_means[0] else 'declining',
            'years_analyzed': years_processed,
            'yearly_stats': image_metadata
        }

        print(f"\n{'='*70}")
        print(f"✅ NDVI Analysis Complete")
        print(f"{'='*70}")
        print(f"Years analyzed: {years_processed}")
        print(f"Date range: {image_metadata[-1]['year']} to {image_metadata[0]['year']}")
        print(f"Average NDVI: {aggregate_stats['mean_ndvi_across_years']:.3f}")
        print(f"Trend: {aggregate_stats['trend']}")
        print(f"{'='*70}\n")

        return {
            'ndvi_arrays': ndvi_arrays,
            'metadata': image_metadata,
            'statistics': aggregate_stats,
            'analysis_date': datetime.now().isoformat()
        }

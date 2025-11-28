"""
Quick test script to verify Earth Engine setup
"""
import ee
import os
from dotenv import load_dotenv

load_dotenv()

project_id = os.getenv("GOOGLE_CLOUD_PROJECT")

print(f"\n{'='*60}")
print("Testing Earth Engine Setup")
print(f"{'='*60}\n")

print(f"📍 Project ID: {project_id}")

try:
    # Initialize Earth Engine
    if project_id:
        ee.Initialize(project=project_id)
        print(f"✅ Earth Engine initialized successfully with project: {project_id}")
    else:
        ee.Initialize()
        print("✅ Earth Engine initialized successfully (legacy mode)")

    # Test a simple operation
    image = ee.Image('LANDSAT/LC08/C02/T1_L2/LC08_001001_20230101')
    print(f"✅ Successfully accessed Landsat imagery")

    # Get image info
    info = image.getInfo()
    print(f"✅ Successfully retrieved image metadata")

    print(f"\n{'='*60}")
    print("🎉 All tests passed! Earth Engine is working correctly.")
    print(f"{'='*60}\n")

except Exception as e:
    print(f"\n❌ Error: {e}\n")
    print("📝 Troubleshooting:")
    print("1. Enable Earth Engine API:")
    print(f"   https://console.cloud.google.com/apis/api/earthengine.googleapis.com/overview?project={project_id}")
    print("\n2. Register for Earth Engine access:")
    print("   https://code.earthengine.google.com/")
    print("\n3. Set your project:")
    print(f"   earthengine set_project {project_id}")
    print("\n4. Wait a few minutes for changes to propagate")
    print(f"\n{'='*60}\n")

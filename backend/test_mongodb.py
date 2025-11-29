"""
Test MongoDB Connection
Run this to verify MongoDB connectivity before starting the server
"""
import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

mongodb_uri = os.getenv("MONGODB_URI")

print("="*70)
print("MongoDB Connection Test")
print("="*70)

# Check if URI is loaded
print(f"\n1. Environment Variable Check:")
print(f"   MONGODB_URI exists: {'Yes' if mongodb_uri else 'No'}")
if mongodb_uri:
    # Mask the password for security
    masked_uri = mongodb_uri.replace(mongodb_uri.split('@')[0].split('://')[1], '***:***')
    print(f"   URI format: {masked_uri}")
else:
    print("   ❌ ERROR: MONGODB_URI not found in .env file")
    exit(1)

# Test connection
print(f"\n2. Connection Test:")
try:
    client = MongoClient(
        mongodb_uri,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=5000
    )

    # Ping the server
    print("   Attempting to connect...")
    client.admin.command('ping')
    print("   ✅ Connection successful!")

    # Test database access
    print(f"\n3. Database Access Test:")
    db = client['AgroIndia']
    collections = db.list_collection_names()
    print(f"   Database: AgroIndia")
    print(f"   Collections: {collections if collections else 'None (will be created on first insert)'}")

    # Test a simple operation
    print(f"\n4. Test Operation:")
    fields_collection = db['Fields']
    count = fields_collection.count_documents({})
    print(f"   Total documents in Fields collection: {count}")

    print(f"\n{'='*70}")
    print("✅ All tests passed! MongoDB is working correctly.")
    print("="*70)

    client.close()

except Exception as e:
    print(f"   ❌ Connection failed!")
    print(f"\n   Error: {str(e)}")
    print(f"\n{'='*70}")
    print("❌ MongoDB connection test failed")
    print("="*70)
    print("\nPossible solutions:")
    print("1. Check if your IP is whitelisted in MongoDB Atlas")
    print("2. Verify the connection string is correct")
    print("3. Check your internet connection")
    print("4. Verify MongoDB Atlas cluster is running")
    exit(1)

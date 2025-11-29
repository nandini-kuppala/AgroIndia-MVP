from pymongo import MongoClient, DESCENDING
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import sys


class MongoDBService:
    """
    Service for managing field analysis data in MongoDB
    Stores analysis results with max 2 analyses per field
    """

    def __init__(self, mongodb_uri: str):
        """Initialize MongoDB connection"""
        try:
            # Add connection timeout settings
            self.client = MongoClient(
                mongodb_uri,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=5000,
                socketTimeoutMS=5000
            )
            # Test the connection
            self.client.admin.command('ping')
            print("[MongoDB] Connection test successful")

            self.db = self.client['AgroIndia']
            self.fields_collection = self.db['Fields']
            print(f"[MongoDB] Using database: AgroIndia, collection: Fields")
        except Exception as e:
            print(f"[MongoDB] Connection failed: {str(e)}")
            raise

    def save_analysis(
        self,
        field_id: str,
        analysis_data: Dict[str, Any]
    ) -> bool:
        """
        Save analysis result for a field
        Maintains max 2 analyses per field (last and present)
        """
        try:
            print(f"[MongoDB] Starting save_analysis for field_id: {field_id}", flush=True)
            sys.stdout.flush()

            # Prepare analysis document
            analysis_doc = {
                "field_id": field_id,
                "classification": analysis_data.get("classification"),
                "classification_map_url": analysis_data.get("classification_map_url"),
                "ndvi_stats": analysis_data.get("ndvi_stats"),
                "crop_recommendations": analysis_data.get("crop_recommendations"),
                "profitability_score": analysis_data.get("profitability_score"),
                "analysis_date": analysis_data.get("analysis_date"),
                "created_at": datetime.utcnow().isoformat()
            }
            print(f"[MongoDB] Analysis document prepared", flush=True)

            # Find the field document
            print(f"[MongoDB] Searching for existing field document...", flush=True)
            field = self.fields_collection.find_one({"field_id": field_id})

            if field:
                print(f"[MongoDB] Found existing field document, updating...", flush=True)
                # Get existing analyses
                analyses = field.get("analyses", [])
                print(f"[MongoDB] Existing analyses count: {len(analyses)}", flush=True)

                # Add new analysis
                analyses.append(analysis_doc)

                # Keep only last 2 analyses (sorted by created_at)
                analyses.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                analyses = analyses[:2]

                # Update field document
                result = self.fields_collection.update_one(
                    {"field_id": field_id},
                    {
                        "$set": {
                            "analyses": analyses,
                            "updated_at": datetime.utcnow().isoformat()
                        }
                    }
                )
                print(f"[MongoDB] Update result - Matched: {result.matched_count}, Modified: {result.modified_count}", flush=True)
            else:
                print(f"[MongoDB] No existing field document, creating new one...", flush=True)
                # Create new field document
                result = self.fields_collection.insert_one({
                    "field_id": field_id,
                    "analyses": [analysis_doc],
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                })
                print(f"[MongoDB] Insert result - Inserted ID: {result.inserted_id}", flush=True)

            print(f"[MongoDB] ✅ Successfully saved analysis for field_id: {field_id}", flush=True)
            return True

        except Exception as e:
            print(f"[MongoDB] ❌ Save error: {str(e)}", flush=True)
            import traceback
            traceback.print_exc()
            return False

    def get_recent_analysis(self, field_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the most recent analysis for a field
        """
        try:
            field = self.fields_collection.find_one({"field_id": field_id})

            if field and "analyses" in field and field["analyses"]:
                # Analyses are already sorted, return the first one (most recent)
                return field["analyses"][0]

            return None

        except Exception as e:
            print(f"MongoDB fetch error: {str(e)}")
            return None

    def get_all_analyses(self, field_id: str) -> List[Dict[str, Any]]:
        """
        Get all analyses for a field (max 2)
        """
        try:
            field = self.fields_collection.find_one({"field_id": field_id})

            if field and "analyses" in field:
                return field["analyses"]

            return []

        except Exception as e:
            print(f"MongoDB fetch error: {str(e)}")
            return []

    def close(self):
        """Close MongoDB connection"""
        self.client.close()

from pymongo import MongoClient, DESCENDING
from typing import Optional, List, Dict, Any
from datetime import datetime
import os


class MongoDBService:
    """
    Service for managing field analysis data in MongoDB
    Stores analysis results with max 2 analyses per field
    """

    def __init__(self, mongodb_uri: str):
        """Initialize MongoDB connection"""
        self.client = MongoClient(mongodb_uri)
        self.db = self.client['AgroIndia']
        self.fields_collection = self.db['Fields']

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

            # Find the field document
            field = self.fields_collection.find_one({"field_id": field_id})

            if field:
                # Get existing analyses
                analyses = field.get("analyses", [])

                # Add new analysis
                analyses.append(analysis_doc)

                # Keep only last 2 analyses (sorted by created_at)
                analyses.sort(key=lambda x: x.get("created_at", ""), reverse=True)
                analyses = analyses[:2]

                # Update field document
                self.fields_collection.update_one(
                    {"field_id": field_id},
                    {
                        "$set": {
                            "analyses": analyses,
                            "updated_at": datetime.utcnow().isoformat()
                        }
                    }
                )
            else:
                # Create new field document
                self.fields_collection.insert_one({
                    "field_id": field_id,
                    "analyses": [analysis_doc],
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                })

            return True

        except Exception as e:
            print(f"MongoDB save error: {str(e)}")
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

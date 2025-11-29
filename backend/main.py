from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

from services.ndvi_service import NDVIService
from services.clustering_service import ClusteringService
from services.gemini_service import GeminiCropRecommendation
from services.mongodb_service import MongoDBService

load_dotenv()

app = FastAPI(title="AgroIndia Field Analysis API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class FieldCoordinates(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]  # GeoJSON Polygon format

class AnalysisRequest(BaseModel):
    field_id: str
    field_name: str
    coordinates: FieldCoordinates
    soil_type: str
    water_source: str
    crop_type: str
    location: str
    district: str
    state: str

class ClassificationResult(BaseModel):
    class_1: float  # Percentage for each class
    class_2: float
    class_3: float
    class_4: float
    class_5: float
    class_6: float

class CropRecommendation(BaseModel):
    crop: str
    confidence: int
    expectedYield: str
    expectedRevenue: str
    season: str
    reasoning: str

class AnalysisResponse(BaseModel):
    field_id: str
    classification: ClassificationResult
    classification_map_url: str  # Base64 or URL to classification image
    ndvi_stats: Dict[str, Any]
    crop_recommendations: List[CropRecommendation]
    profitability_score: int
    analysis_date: str

# Initialize services
project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
mongodb_uri = os.getenv("MONGODB_URI")
ndvi_service = NDVIService(project_id=project_id)
clustering_service = ClusteringService()
gemini_service = GeminiCropRecommendation(api_key=os.getenv("GEMINI_API_KEY"))
mongodb_service = MongoDBService(mongodb_uri=mongodb_uri) if mongodb_uri else None


@app.get("/")
async def root():
    return {
        "message": "AgroIndia Field Analysis API",
        "version": "1.0.0",
        "status": "running"
    }


@app.post("/api/analyze-field", response_model=AnalysisResponse)
async def analyze_field(request: AnalysisRequest):
    """
    Main endpoint for field analysis:
    1. Fetch 5 years of NDVI satellite imagery
    2. Perform Affinity Propagation clustering
    3. Generate 6-class classification map
    4. Get AI crop recommendations from Gemini
    """
    try:
        # Step 1: Extract coordinates from GeoJSON
        polygon_coords = request.coordinates.coordinates[0]

        # Step 2: Fetch NDVI imagery for 5 years
        print(f"Fetching NDVI data for field: {request.field_name}")
        ndvi_data = await ndvi_service.fetch_ndvi_imagery(
            polygon_coords=polygon_coords,
            years=5
        )

        # Step 3: Perform Affinity Propagation clustering
        print("Performing Affinity Propagation clustering...")
        clustering_result = await clustering_service.perform_clustering(
            ndvi_arrays=ndvi_data['ndvi_arrays'],
            metadata=ndvi_data['metadata']
        )

        # Step 4: Get crop recommendations from Gemini AI
        print("Generating AI crop recommendations...")
        recommendations = await gemini_service.get_recommendations(
            field_data={
                "name": request.field_name,
                "location": f"{request.district}, {request.state}",
                "soil_type": request.soil_type,
                "water_source": request.water_source,
                "current_crop": request.crop_type,
                "ndvi_stats": ndvi_data['statistics'],
                "classification": clustering_result['classification_percentages']
            }
        )

        # Step 5: Build response
        response = AnalysisResponse(
            field_id=request.field_id,
            classification=ClassificationResult(**clustering_result['classification_percentages']),
            classification_map_url=clustering_result['map_base64'],
            ndvi_stats=ndvi_data['statistics'],
            crop_recommendations=recommendations,
            profitability_score=clustering_result['profitability_score'],
            analysis_date=ndvi_data['analysis_date']
        )

        # Step 6: Save to MongoDB
        if mongodb_service:
            try:
                mongodb_service.save_analysis(
                    field_id=request.field_id,
                    analysis_data={
                        "classification": clustering_result['classification_percentages'],
                        "classification_map_url": clustering_result['map_base64'],
                        "ndvi_stats": ndvi_data['statistics'],
                        "crop_recommendations": [rec.dict() for rec in recommendations],
                        "profitability_score": clustering_result['profitability_score'],
                        "analysis_date": ndvi_data['analysis_date']
                    }
                )
                print(f"Analysis saved to MongoDB for field: {request.field_id}")
            except Exception as mongo_error:
                print(f"Failed to save to MongoDB: {str(mongo_error)}")
                # Don't fail the request if MongoDB save fails

        return response

    except Exception as e:
        print(f"Error in analyze_field: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/recent-analysis/{field_id}")
async def get_recent_analysis(field_id: str):
    """
    Get the most recent analysis for a field from MongoDB
    """
    if not mongodb_service:
        raise HTTPException(status_code=503, detail="MongoDB service not available")

    try:
        analysis = mongodb_service.get_recent_analysis(field_id)

        if not analysis:
            raise HTTPException(status_code=404, detail="No analysis found for this field")

        return analysis

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching recent analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analysis: {str(e)}")


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "ndvi": "operational",
            "clustering": "operational",
            "gemini_ai": "operational",
            "mongodb": "operational" if mongodb_service else "unavailable"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

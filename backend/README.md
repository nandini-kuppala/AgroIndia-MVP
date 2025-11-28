# AgroIndia Field Analysis Backend

Python FastAPI backend for satellite imagery analysis, NDVI clustering, and AI-powered crop recommendations.

## Features

- **NDVI Analysis**: Fetches 5 years of Landsat satellite imagery using Google Earth Engine
- **Affinity Propagation Clustering**: Classifies fields into 6 productivity classes
- **AI Crop Recommendations**: Uses Google Gemini AI for context-aware crop suggestions
- **RESTful API**: Clean API endpoints for frontend integration

## Prerequisites

1. **Python 3.10+**
2. **Google Earth Engine Account**: Sign up at https://earthengine.google.com/
3. **Gemini API Key**: Get from https://aistudio.google.com/apikey

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Authenticate Google Earth Engine

```bash
earthengine authenticate
```

This will open a browser window for you to authenticate with your Google account.

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```
GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Run the Server

```bash
python main.py
```

Or use uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### `POST /api/analyze-field`

Analyzes a field using satellite imagery and AI.

**Request Body:**
```json
{
  "field_id": "uuid",
  "field_name": "My Farm Field",
  "coordinates": {
    "type": "Polygon",
    "coordinates": [[[lng, lat], [lng, lat], ...]]
  },
  "soil_type": "Red Soil",
  "water_source": "Borewell",
  "crop_type": "Rice",
  "location": "Village Name",
  "district": "Guntur",
  "state": "Andhra Pradesh"
}
```

**Response:**
```json
{
  "field_id": "uuid",
  "classification": {
    "class_1": 5.2,
    "class_2": 8.3,
    "class_3": 15.6,
    "class_4": 22.1,
    "class_5": 28.4,
    "class_6": 20.4
  },
  "classification_map_url": "data:image/png;base64,...",
  "ndvi_stats": {...},
  "crop_recommendations": [...],
  "profitability_score": 78,
  "analysis_date": "2024-01-15T10:30:00"
}
```

### `GET /api/health`

Health check endpoint.

## Deployment

### Option 1: Railway

1. Create account on Railway.app
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Deploy!

### Option 2: Render

1. Create account on Render.com
2. Create new Web Service
3. Connect repository
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables

### Option 3: AWS/GCP/Azure

Deploy as a containerized application using Docker.

## Notes

- **Rate Limits**: Google Earth Engine has rate limits. For production, implement request queuing.
- **Image Processing**: Large fields may take 2-5 minutes to process.
- **Caching**: Consider adding Redis for caching NDVI results.

## Troubleshooting

**Earth Engine Authentication Failed:**
```bash
earthengine authenticate --force
```

**Module Not Found:**
```bash
pip install -r requirements.txt --upgrade
```

**CORS Errors:**
Update the `allow_origins` in `main.py` to include your frontend URL.

## License

MIT

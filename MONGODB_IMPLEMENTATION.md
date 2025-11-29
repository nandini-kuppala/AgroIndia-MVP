# MongoDB Integration for Analysis Storage

This document explains the MongoDB integration for storing and displaying field analysis results.

## What Was Implemented

### 1. Backend Changes

#### New Dependencies
- Added `pymongo==4.6.1` to `requirements.txt`

#### MongoDB Service (`backend/services/mongodb_service.py`)
A new service that handles all MongoDB operations:
- **`save_analysis()`**: Saves analysis results to MongoDB
  - Maintains max 2 analyses per field (last one and present one)
  - Automatically removes older analyses
  - Stores in `AgroIndia` database, `Fields` collection
- **`get_recent_analysis()`**: Retrieves the most recent analysis for a field
- **`get_all_analyses()`**: Gets all analyses (max 2) for a field

#### Updated `backend/main.py`
- Integrated MongoDB service with connection from `.env`
- Updated `/api/analyze-field` endpoint to save results to MongoDB after successful analysis
- Added new endpoint: `/api/recent-analysis/{field_id}` to fetch recent analysis from MongoDB

### 2. Frontend Changes

#### Updated `src/pages/Dashboard.tsx`
- Added "Recent Analysis" button to each field card
- Clicking the button fetches and displays the recent analysis from MongoDB
- Display includes:
  - 6-class classification map
  - Classification legend
  - Productivity distribution bar chart
  - Profitability score
  - Percentage of good to excellent productivity
- Uses the same styling as the Analysis page
- Toggle functionality (click again to hide)
- Loading states and error handling

## Data Structure

### MongoDB Document Structure
```json
{
  "field_id": "uuid-of-field",
  "analyses": [
    {
      "field_id": "uuid-of-field",
      "classification": {
        "class_1": 5.2,
        "class_2": 12.3,
        "class_3": 20.1,
        "class_4": 25.5,
        "class_5": 22.4,
        "class_6": 14.5
      },
      "classification_map_url": "data:image/png;base64,...",
      "ndvi_stats": {...},
      "crop_recommendations": [...],
      "profitability_score": 75,
      "analysis_date": "2024-08-15T10:30:00",
      "created_at": "2024-08-15T10:30:00"
    }
  ],
  "created_at": "2024-08-15T10:30:00",
  "updated_at": "2024-08-15T10:30:00"
}
```

## Setup Instructions

### 1. Environment Variables
Make sure your `.env` file in the `backend` folder contains:
```env
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLOUD_PROJECT=your-project-id
GEMINI_API_KEY=your-gemini-api-key
```

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. MongoDB Setup
The system will automatically create:
- Database: `AgroIndia`
- Collection: `Fields`

No manual setup required - the service handles everything.

### 4. Running the Application

#### Start Backend
```bash
cd backend
python main.py
# or
uvicorn main:app --reload
```

#### Start Frontend
```bash
npm run dev
```

## Features

### Analysis Storage
- Every analysis run is automatically saved to MongoDB
- Each field stores maximum 2 analyses
- Older analyses are automatically removed
- Also saved to Supabase for compatibility

### Dashboard Display
1. Navigate to Dashboard
2. Find the field you want to view
3. Click "Recent Analysis" button
4. View the analysis results inline:
   - Classification map
   - Productivity distribution
   - Key metrics (profitability score, good/excellent percentage)
5. Click "Hide Analysis" to collapse
6. Click "View Full" to go to the complete analysis page

## API Endpoints

### GET `/api/recent-analysis/{field_id}`
Fetches the most recent analysis for a field from MongoDB.

**Response:**
```json
{
  "field_id": "uuid",
  "classification": {...},
  "classification_map_url": "base64-image",
  "ndvi_stats": {...},
  "profitability_score": 75,
  "analysis_date": "2024-08-15T10:30:00",
  "created_at": "2024-08-15T10:30:00"
}
```

**Error Codes:**
- `404`: No analysis found for this field
- `503`: MongoDB service not available
- `500`: Server error

## Benefits

1. **Dual Storage**: Data stored in both MongoDB (for analysis history) and Supabase (for user management)
2. **History Management**: Automatic cleanup keeps only relevant analyses
3. **Fast Access**: Recent analysis readily available without full page navigation
4. **Consistent UI**: Same styling as the full Analysis page
5. **User-Friendly**: Toggle view inline without navigation

## Files Modified

### Backend
- `backend/requirements.txt` - Added pymongo
- `backend/services/mongodb_service.py` - New service
- `backend/main.py` - Integration and new endpoint

### Frontend
- `src/pages/Dashboard.tsx` - Recent analysis button and display

## Notes

- MongoDB connection is optional - system works without it (will just log errors)
- Analysis results are always saved to Supabase regardless of MongoDB status
- The 6-class map is stored as base64-encoded PNG in MongoDB
- All timestamps are in ISO 8601 format (UTC)

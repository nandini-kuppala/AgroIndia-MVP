# AgroIndia Field Analysis - Complete Setup Guide

This guide will help you set up and run the complete field analysis system with satellite imagery, AI-powered crop recommendations, and NDVI clustering.

## Architecture Overview

The system consists of two main parts:

1. **Frontend**: React + TypeScript + Vite + Supabase
2. **Backend**: Python FastAPI with Google Earth Engine & Gemini AI

## Prerequisites

### Frontend
- Node.js 18+ and npm
- Supabase account (already configured)

### Backend
- Python 3.10+
- Google Earth Engine account
- Google Gemini API key

## Part 1: Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Create Python Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Authenticate Google Earth Engine

1. Sign up for Google Earth Engine: https://earthengine.google.com/
2. Wait for approval (usually instant for development)
3. Run authentication:

```bash
earthengine authenticate
```

This will open a browser window. Follow the instructions to authenticate.

### Step 5: Get Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Create a new API key
3. Copy the key

### Step 6: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Step 7: Test the Backend

```bash
python main.py
```

The API should start on `http://localhost:8000`

Visit `http://localhost:8000/docs` to see the interactive API documentation.

**Test health endpoint:**
```bash
curl http://localhost:8000/api/health
```

You should see:
```json
{
  "status": "healthy",
  "services": {
    "ndvi": "operational",
    "clustering": "operational",
    "gemini_ai": "operational"
  }
}
```

## Part 2: Frontend Setup

### Step 1: Install Frontend Dependencies

Open a new terminal (keep the backend running) and navigate to the project root:

```bash
npm install
```

### Step 2: Update Backend API URL (If Deployed)

If you deploy the backend to a cloud service, update the API URL in `src/pages/AnalysisNew.tsx`:

```typescript
const BACKEND_API_URL = "http://localhost:8000"; // Change to your deployed URL
```

### Step 3: Run the Frontend

```bash
npm run dev
```

The app will open at `http://localhost:8080`

## Part 3: Using the System

### Step 1: Sign In

1. Go to `http://localhost:8080`
2. Click "Get Started" or "Sign In"
3. Sign in with your existing account or create a new one

### Step 2: Add a Field (if you haven't already)

1. Go to "Add Field" from the dashboard
2. Fill in all field details
3. Submit the form

### Step 3: Run Field Analysis

1. Click on "Analysis" in the navigation
2. Click "New Analysis" button
3. Select a field from your field list
4. If the field doesn't have coordinates:
   - A map will appear
   - Use the polygon drawing tool (on the left side of the map)
   - Draw around your field boundary
   - Click "Save Coordinates"
5. Click "Run Analysis"
6. Wait 2-5 minutes for the analysis to complete

The system will:
- Fetch 5 years of Landsat satellite imagery
- Calculate NDVI for each year
- Perform Affinity Propagation clustering
- Generate a 6-class productivity map
- Get AI crop recommendations from Gemini

### Step 4: View Results

Once complete, you'll see:

- **6-Class Classification Map**: Visual representation of field productivity
- **Classification Analysis**: Percentage distribution across classes
- **NDVI Statistics**: 5-year vegetation health data
- **AI Crop Recommendations**: Context-aware suggestions from Gemini AI

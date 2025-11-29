import google.generativeai as genai
from typing import List, Dict, Any, Optional
import json
import datetime
import requests


class GeminiCropRecommendation:
    """
    Service for generating crop recommendations using Gemini AI
    Provides context-aware agentic recommendations based on field analysis
    Enriched with real-time weather data and location-based soil inference
    """

    def __init__(self, api_key: str):
        """Initialize Gemini API and data enrichment services"""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

        # Free APIs for data enrichment
        self.GEO_API_URL = "https://geocoding-api.open-meteo.com/v1/search"
        self.WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"

    async def get_recommendations(
        self,
        field_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate crop recommendations using Gemini AI
        Uses agentic system with detailed field analysis
        Enriched with real-time weather and location context
        """
        # Get coordinates from location
        location_query = f"{field_data.get('location')}"
        coords = self._get_coordinates(location_query)

        # Get real-time weather data
        weather = {}
        if coords:
            weather = self._get_weather_data(coords['lat'], coords['lon'])

        # Get current season
        season = self._get_current_season()

        # Build comprehensive prompt with enriched data
        prompt = self._build_analysis_prompt(field_data, coords, weather, season)

        try:
            # Generate content using Gemini
            response = self.model.generate_content(prompt)

            # Parse the response
            recommendations = self._parse_recommendations(response.text, field_data)

            return recommendations

        except Exception as e:
            print(f"Gemini API error: {str(e)}")
            # Return fallback recommendations
            return self._get_fallback_recommendations(field_data)

    def _build_analysis_prompt(
        self,
        field_data: Dict[str, Any],
        coords: Optional[Dict[str, Any]],
        weather: Dict[str, Any],
        season: str
    ) -> str:
        """
        Build detailed prompt for Gemini AI with field context and real-time data
        """
        classification = field_data.get('classification', {})
        ndvi_stats = field_data.get('ndvi_stats', {})

        # Build location string
        location_str = coords['name'] if coords else field_data.get('location')
        lat_lon = f"(Lat: {coords['lat']}, Lon: {coords['lon']})" if coords else ""

        # Build weather context
        weather_str = ""
        if weather:
            weather_str = f"""
REAL-TIME WEATHER CONDITIONS:
- Temperature: {weather.get('current_temp', 'N/A')}
- Humidity: {weather.get('humidity', 'N/A')}
- Raining Currently: {weather.get('is_raining', 'N/A')}
- Recent Precipitation: {weather.get('recent_rainfall', 'N/A')}
"""

        prompt = f"""You are an expert Agronomist Advisor specializing in Andhra Pradesh and Telangana farming systems.
Analyze the field data and provide EXACTLY 3 crop recommendations optimized for current conditions.

LOCATION CONTEXT:
- Location: {location_str} {lat_lon}
- Current Season: {season} (Date: {datetime.datetime.now().strftime("%Y-%m-%d")})
{weather_str}
FIELD INFORMATION:
- Name: {field_data.get('name')}
- Soil Type: {field_data.get('soil_type')}
- Water Source: {field_data.get('water_source')}
- Current Crop: {field_data.get('current_crop')}

SATELLITE ANALYSIS (5-YEAR NDVI DATA):
- Average NDVI: {ndvi_stats.get('mean_ndvi_across_years', 'N/A')}
- NDVI Trend: {ndvi_stats.get('trend', 'N/A')}

LAND CLASSIFICATION (6-CLASS PRODUCTIVITY):
- Highly Productive (Class 6): {classification.get('class_6', 0):.1f}%
- Very Good (Class 5): {classification.get('class_5', 0):.1f}%
- Good (Class 4): {classification.get('class_4', 0):.1f}%
- Average (Class 3): {classification.get('class_3', 0):.1f}%
- Below Average (Class 2): {classification.get('class_2', 0):.1f}%
- Poor (Class 1): {classification.get('class_1', 0):.1f}%

ANALYSIS INSTRUCTIONS:
1. SOIL INFERENCE: Based on coordinates {lat_lon}, infer the likely soil characteristics specific to this region of AP/TG
2. WEATHER INTEGRATION: If currently raining or high humidity, factor in disease risks and water availability
3. FIELD PRODUCTIVITY: Match crops to the field's productivity distribution (Classes 4-6 indicate high-value crop potential)
4. WATER MATCHING: Align crop water needs with the water source availability
5. MARKET TIMING: Consider current season and market conditions

OUTPUT 3 CROPS:
- Crop 1: Safest, most traditional choice for this region and season
- Crop 2: High-value cash crop suitable for the field conditions
- Crop 3: Resilient alternative (drought/pest resistant)

RESPONSE FORMAT (VALID JSON ONLY, NO MARKDOWN):
[
  {{
    "crop": "Crop Name",
    "confidence": 90,
    "expectedYield": "XX quintals/acre",
    "expectedRevenue": "₹X.XL",
    "season": "{season}",
    "reasoning": "Concise reason linking {location_str}'s soil, current weather, and field productivity to this crop (max 2 sentences)"
  }}
]

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON array
- Exactly 3 recommendations ordered by confidence
- Keep reasoning concise (max 2 sentences)
- Use realistic AP/TG yields and current market prices
- Link recommendations to specific data points (soil type, weather, NDVI, water source)
"""

        return prompt

    def _parse_recommendations(
        self,
        response_text: str,
        field_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Parse Gemini response and extract recommendations
        """
        try:
            # Remove markdown code blocks if present
            text = response_text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

            # Parse JSON
            recommendations = json.loads(text)

            # Validate and ensure we have exactly 3 recommendations
            if not isinstance(recommendations, list):
                raise ValueError("Response is not a list")

            if len(recommendations) > 3:
                recommendations = recommendations[:3]
            elif len(recommendations) < 3:
                # Add fallback recommendations if needed
                recommendations.extend(
                    self._get_fallback_recommendations(field_data)[len(recommendations):]
                )

            # Ensure all required fields are present
            required_fields = ['crop', 'confidence', 'expectedYield', 'expectedRevenue', 'season', 'reasoning']
            for rec in recommendations:
                for field in required_fields:
                    if field not in rec:
                        rec[field] = 'N/A'

            return recommendations

        except Exception as e:
            print(f"Failed to parse Gemini response: {str(e)}")
            print(f"Response text: {response_text}")
            return self._get_fallback_recommendations(field_data)

    def _get_coordinates(self, location_name: str) -> Optional[Dict[str, Any]]:
        """
        Fetches Lat/Lon for a given location using Open-Meteo Geocoding API
        """
        try:
            params = {"name": location_name, "count": 1, "language": "en", "format": "json"}
            response = requests.get(self.GEO_API_URL, params=params, timeout=5)
            data = response.json()

            if "results" in data and data["results"]:
                result = data["results"][0]
                return {
                    "name": f"{result.get('name')}, {result.get('admin1', '')}, {result.get('country', '')}",
                    "lat": result["latitude"],
                    "lon": result["longitude"]
                }
            return None
        except Exception as e:
            print(f"Geocoding Error: {e}")
            return None

    def _get_weather_data(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Fetches current weather and recent precipitation data
        """
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,rain",
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
                "timezone": "auto"
            }
            response = requests.get(self.WEATHER_API_URL, params=params, timeout=5)
            data = response.json()

            # Safe extraction
            current = data.get("current", {})
            daily = data.get("daily", {})
            recent_precip = sum(daily.get("precipitation_sum", [0])[:7])

            return {
                "current_temp": f"{current.get('temperature_2m', 'N/A')}°C",
                "humidity": f"{current.get('relative_humidity_2m', 'N/A')}%",
                "is_raining": "Yes" if current.get('rain', 0) > 0 else "No",
                "recent_rainfall": f"{recent_precip:.1f}mm (Last 7 days)"
            }
        except Exception as e:
            print(f"Weather API Error: {e}")
            return {
                "current_temp": "Unknown",
                "humidity": "Unknown",
                "is_raining": "Unknown",
                "recent_rainfall": "Unknown"
            }

    def _get_current_season(self) -> str:
        """
        Determines Indian Agricultural Season based on current month
        """
        month = datetime.datetime.now().month
        year = datetime.datetime.now().year

        if 6 <= month <= 10:
            return f"Kharif (Monsoon Season) {year}"
        elif month >= 11 or month <= 3:
            return f"Rabi (Winter Season) {year if month >= 11 else year}"
        else:
            return f"Zaid (Summer Season) {year}"

    def _get_fallback_recommendations(self, field_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Provide fallback recommendations based on soil type, water source, and season
        """
        soil_type = field_data.get('soil_type', '').lower()
        water_source = field_data.get('water_source', '').lower()
        current_season = self._get_current_season()

        # Default recommendations for AP/TG region
        recommendations = [
            {
                "crop": "Rice (Paddy)",
                "confidence": 85,
                "expectedYield": "22 quintals/acre",
                "expectedRevenue": "₹3.2L",
                "season": current_season,
                "reasoning": "Well-suited for regional climate and water availability. Good productivity expected."
            },
            {
                "crop": "Cotton",
                "confidence": 75,
                "expectedYield": "12 quintals/acre",
                "expectedRevenue": "₹2.8L",
                "season": current_season,
                "reasoning": "Performs well in AP/TG with moderate water needs. Strong market demand."
            },
            {
                "crop": "Maize",
                "confidence": 70,
                "expectedYield": "28 quintals/acre",
                "expectedRevenue": "₹2.1L",
                "season": current_season,
                "reasoning": "Resilient crop with good market linkages and adaptable to varying conditions."
            }
        ]

        # Adjust based on soil type
        if 'red' in soil_type:
            recommendations[0] = {
                "crop": "Groundnut",
                "confidence": 82,
                "expectedYield": "10 quintals/acre",
                "expectedRevenue": "₹3.5L",
                "season": current_season,
                "reasoning": "Red soil ideal for groundnut. High market value expected."
            }
        elif 'black' in soil_type:
            recommendations[0] = {
                "crop": "Cotton",
                "confidence": 88,
                "expectedYield": "14 quintals/acre",
                "expectedRevenue": "₹3.2L",
                "season": current_season,
                "reasoning": "Black soil excellent for cotton cultivation. Strong productivity potential."
            }

        # Adjust based on water source
        if 'borewell' in water_source or 'limited' in water_source:
            recommendations[1] = {
                "crop": "Millets (Bajra/Jowar)",
                "confidence": 78,
                "expectedYield": "8 quintals/acre",
                "expectedRevenue": "₹1.8L",
                "season": current_season,
                "reasoning": "Drought-resistant with limited water needs. Growing market demand."
            }

        return recommendations

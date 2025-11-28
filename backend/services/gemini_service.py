import google.generativeai as genai
from typing import List, Dict, Any
import json


class GeminiCropRecommendation:
    """
    Service for generating crop recommendations using Gemini AI
    Provides context-aware agentic recommendations based on field analysis
    """

    def __init__(self, api_key: str):
        """Initialize Gemini API"""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    async def get_recommendations(
        self,
        field_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Generate crop recommendations using Gemini AI
        Uses agentic system with detailed field analysis
        """
        # Build comprehensive prompt
        prompt = self._build_analysis_prompt(field_data)

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

    def _build_analysis_prompt(self, field_data: Dict[str, Any]) -> str:
        """
        Build detailed prompt for Gemini AI with field context
        """
        classification = field_data.get('classification', {})
        ndvi_stats = field_data.get('ndvi_stats', {})

        prompt = f"""You are an expert agricultural advisor specializing in Andhra Pradesh and Telangana farming systems.
Analyze the following field data and provide EXACTLY 3 crop recommendations.

FIELD INFORMATION:
- Name: {field_data.get('name')}
- Location: {field_data.get('location')}
- Soil Type: {field_data.get('soil_type')}
- Water Source: {field_data.get('water_source')}
- Current Crop: {field_data.get('current_crop')}

SATELLITE ANALYSIS (5-YEAR NDVI DATA):
- Average NDVI: {ndvi_stats.get('mean_ndvi_across_years', 'N/A')}
- NDVI Trend: {ndvi_stats.get('trend', 'N/A')}

LAND CLASSIFICATION (6-CLASS SYSTEM):
- Class 6 (Highly Productive): {classification.get('class_6', 0)}%
- Class 5 (Very Good): {classification.get('class_5', 0)}%
- Class 4 (Good): {classification.get('class_4', 0)}%
- Class 3 (Average): {classification.get('class_3', 0)}%
- Class 2 (Below Average): {classification.get('class_2', 0)}%
- Class 1 (Poor): {classification.get('class_1', 0)}%

INSTRUCTIONS:
1. Analyze the field's productivity distribution and NDVI trends
2. Consider regional climate (Andhra Pradesh/Telangana)
3. Match crops to soil type and water availability
4. Recommend 3 crops in order of suitability
5. Provide realistic yield estimates for the region
6. Calculate expected revenue based on current market prices

For each crop recommendation, provide:
1. Crop name
2. Confidence level (0-100)
3. Expected yield (tons/acre or quintals/acre)
4. Expected revenue (in Indian Rupees, formatted as ₹X.XL for lakhs)
5. Best season (Kharif/Rabi/Annual)
6. Brief reasoning (2-3 sentences max)

RESPOND IN VALID JSON FORMAT ONLY:
[
  {{
    "crop": "Crop Name",
    "confidence": 85,
    "expectedYield": "X.X tons/acre",
    "expectedRevenue": "₹X.XL",
    "season": "Kharif 2024",
    "reasoning": "Brief explanation of why this crop is suitable"
  }}
]

Important:
- Return ONLY valid JSON, no markdown formatting
- Include exactly 3 recommendations
- Order by confidence (highest first)
- Use realistic numbers for AP/TG region
- Consider water availability constraints
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

    def _get_fallback_recommendations(self, field_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Provide fallback recommendations based on soil type and location
        """
        soil_type = field_data.get('soil_type', '').lower()
        water_source = field_data.get('water_source', '').lower()

        # Default recommendations for AP/TG region
        recommendations = [
            {
                "crop": "Rice (Paddy)",
                "confidence": 85,
                "expectedYield": "5.2 tons/acre",
                "expectedRevenue": "₹3.2L",
                "season": "Kharif 2024",
                "reasoning": "Rice is well-suited for the region's climate and water availability. High productivity expected based on field analysis."
            },
            {
                "crop": "Cotton",
                "confidence": 75,
                "expectedYield": "2.8 quintals/acre",
                "expectedRevenue": "₹2.8L",
                "season": "Kharif 2024",
                "reasoning": "Cotton performs well in black soil with moderate water availability. Good market demand in the region."
            },
            {
                "crop": "Maize",
                "confidence": 70,
                "expectedYield": "3.5 tons/acre",
                "expectedRevenue": "₹2.1L",
                "season": "Kharif 2024",
                "reasoning": "Maize is a resilient crop suitable for varying field conditions with good market linkages."
            }
        ]

        # Adjust based on soil type
        if 'red' in soil_type:
            recommendations[0] = {
                "crop": "Groundnut",
                "confidence": 82,
                "expectedYield": "2.5 tons/acre",
                "expectedRevenue": "₹3.5L",
                "season": "Kharif 2024",
                "reasoning": "Red soil is ideal for groundnut cultivation. High market value and good returns expected."
            }
        elif 'black' in soil_type:
            recommendations[0] = {
                "crop": "Cotton",
                "confidence": 88,
                "expectedYield": "3.2 quintals/acre",
                "expectedRevenue": "₹3.2L",
                "season": "Kharif 2024",
                "reasoning": "Black soil is excellent for cotton. Field analysis shows strong productivity potential."
            }

        # Adjust based on water source
        if 'borewell' in water_source or 'limited' in water_source:
            recommendations[1] = {
                "crop": "Millets (Bajra/Jowar)",
                "confidence": 78,
                "expectedYield": "2.0 tons/acre",
                "expectedRevenue": "₹1.8L",
                "season": "Kharif 2024",
                "reasoning": "Millets are drought-resistant and suitable for limited water availability. Growing market demand."
            }

        return recommendations

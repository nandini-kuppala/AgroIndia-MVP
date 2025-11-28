import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fields } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create a prompt with field information
    const fieldInfo = fields.map((f: any) => 
      `Field: ${f.name}, Location: ${f.location}, ${f.district}, ${f.state}, Crop: ${f.crop_type}, Soil: ${f.soil_type}`
    ).join('\n');

    const prompt = `You are an agricultural climate advisor for fields in Andhra Pradesh and Telangana, India. 
Based on current climate patterns and seasonal trends, generate 3 specific, actionable alerts for these fields:

${fieldInfo}

For each alert, provide:
1. Type (weather/irrigation/pest/market)
2. A specific, actionable message (under 100 characters)
3. Which field it applies to (use the field name)
4. Priority (high/medium/low)

Return ONLY a JSON array of alerts in this format:
[
  {
    "type": "weather",
    "message": "Alert message here",
    "field": "Field name",
    "priority": "high"
  }
]

Be specific about timing, quantities, and actions. Focus on realistic climate concerns for these regions.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const alertsText = data.choices[0].message.content;
    
    // Parse the JSON response
    let alerts;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = alertsText.match(/```json\n([\s\S]*?)\n```/) || alertsText.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : alertsText;
      alerts = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse alerts:', alertsText);
      // Fallback to a default alert if parsing fails
      alerts = [{
        type: 'weather',
        message: 'Check weather conditions for your region',
        field: fields[0]?.name || 'All fields',
        priority: 'medium'
      }];
    }

    return new Response(JSON.stringify({ alerts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-climate-alerts:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

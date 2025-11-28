import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const AddField = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    district: "",
    state: "",
    coordinates: "",
    area: "",
    areaUnit: "acres",
    soilType: "",
    waterSource: "",
    cropType: "",
    plantingDate: "",
    expectedHarvestDate: "",
    notes: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add fields.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("fields").insert({
      user_id: user.id,
      name: formData.name,
      location: formData.location,
      district: formData.district,
      state: formData.state,
      coordinates: formData.coordinates,
      area: parseFloat(formData.area),
      area_unit: formData.areaUnit,
      soil_type: formData.soilType,
      water_source: formData.waterSource,
      crop_type: formData.cropType,
      planting_date: formData.plantingDate,
      expected_harvest_date: formData.expectedHarvestDate || null,
      notes: formData.notes,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add field. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Field Added Successfully! 🌾",
      description: `${formData.name} has been added to your field management system.`,
    });
    
    navigate("/fields");
  };

  const districts = {
    "Andhra Pradesh": [
      "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", 
      "Kurnool", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram",
      "West Godavari", "YSR Kadapa"
    ],
    "Telangana": [
      "Adilabad", "Hyderabad", "Jagtial", "Jangaon", "Karimnagar",
      "Khammam", "Mahabubabad", "Medak", "Nalgonda", "Nizamabad",
      "Ranga Reddy", "Sangareddy", "Warangal"
    ]
  };

  const cropTypes = [
    "Rice (Paddy)", "Cotton", "Maize", "Turmeric", "Red Chilli", 
    "Groundnut", "Sugarcane", "Mango", "Tomato", "Onion",
    "Banana", "Papaya", "Guava", "Brinjal", "Okra (Bhindi)",
    "Other Vegetables", "Other Fruits", "Other Crops"
  ];

  const soilTypes = [
    "Red Soil", "Black Soil", "Alluvial Soil", "Laterite Soil",
    "Clay Soil", "Sandy Soil", "Loamy Soil", "Mixed Soil"
  ];

  const waterSources = [
    "Borewell", "Canal Irrigation", "Pond/Tank", "River",
    "Drip Irrigation", "Sprinkler", "Rainfed", "Multiple Sources"
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/fields")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Fields
          </Button>
          
          <Badge className="mb-4" variant="secondary">
            New Field Registration
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Add New Field
          </h1>
          <p className="text-muted-foreground">
            Register your agricultural field to start monitoring and analysis
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the essential details about your field
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Field Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Farm - North Wing"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                        <SelectItem value="Telangana">Telangana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">District *</Label>
                    <Select 
                      value={formData.district} 
                      onValueChange={(value) => handleInputChange("district", value)}
                      disabled={!formData.state}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.state && districts[formData.state as keyof typeof districts]?.map(district => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Village/Location *</Label>
                  <Input
                    id="location"
                    placeholder="Enter village or locality name"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coordinates">GPS Coordinates (Optional)</Label>
                  <Input
                    id="coordinates"
                    placeholder="e.g., 16.2970° N, 80.4365° E"
                    value={formData.coordinates}
                    onChange={(e) => handleInputChange("coordinates", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can get coordinates from Google Maps
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Field Specifications */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Field Specifications</CardTitle>
                <CardDescription>
                  Physical characteristics and resources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area">Field Area *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="area"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={formData.area}
                        onChange={(e) => handleInputChange("area", e.target.value)}
                        required
                        className="flex-1"
                      />
                      <Select value={formData.areaUnit} onValueChange={(value) => handleInputChange("areaUnit", value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="acres">Acres</SelectItem>
                          <SelectItem value="hectares">Hectares</SelectItem>
                          <SelectItem value="guntas">Guntas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="soilType">Soil Type *</Label>
                    <Select value={formData.soilType} onValueChange={(value) => handleInputChange("soilType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select soil type" />
                      </SelectTrigger>
                      <SelectContent>
                        {soilTypes.map(soil => (
                          <SelectItem key={soil} value={soil}>{soil}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waterSource">Water Source *</Label>
                  <Select value={formData.waterSource} onValueChange={(value) => handleInputChange("waterSource", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select water source" />
                    </SelectTrigger>
                    <SelectContent>
                      {waterSources.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Current Crop Information */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Current Crop Information</CardTitle>
                <CardDescription>
                  Details about the crop currently planted
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cropType">Crop Type *</Label>
                  <Select value={formData.cropType} onValueChange={(value) => handleInputChange("cropType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop type" />
                    </SelectTrigger>
                    <SelectContent>
                      {cropTypes.map(crop => (
                        <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plantingDate">Planting Date *</Label>
                    <Input
                      id="plantingDate"
                      type="date"
                      value={formData.plantingDate}
                      onChange={(e) => handleInputChange("plantingDate", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedHarvestDate">Expected Harvest Date</Label>
                    <Input
                      id="expectedHarvestDate"
                      type="date"
                      value={formData.expectedHarvestDate}
                      onChange={(e) => handleInputChange("expectedHarvestDate", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
                <CardDescription>
                  Any other relevant information about this field
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g., Previous crops, special conditions, nearby landmarks..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/fields")}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add Field
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddField;

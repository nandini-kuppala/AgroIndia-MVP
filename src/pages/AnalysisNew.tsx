import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Satellite,
  Download,
  Calendar,
  MapPin,
  BarChart3,
  Leaf,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  PlayCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import axios from "axios";
import FieldSelectionDialog from "@/components/FieldSelectionDialog";
import FieldMap from "@/components/FieldMap";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface Field {
  id: string;
  name: string;
  location: string;
  district: string;
  state: string;
  area: number;
  area_unit: string;
  soil_type: string;
  water_source: string;
  crop_type: string;
  planting_date: string;
  coordinates: string | null;
}

interface AnalysisResult {
  field_id: string;
  classification: {
    class_1: number;
    class_2: number;
    class_3: number;
    class_4: number;
    class_5: number;
    class_6: number;
  };
  classification_map_url: string;
  ndvi_stats: any;
  crop_recommendations: Array<{
    crop: string;
    confidence: number;
    expectedYield: string;
    expectedRevenue: string;
    season: string;
    reasoning: string;
  }>;
  profitability_score: number;
  analysis_date: string;
}

const AnalysisNew = () => {
  const [showFieldSelection, setShowFieldSelection] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleFieldSelect = (field: Field) => {
    setSelectedField(field);
    if (!field.coordinates) {
      setShowMap(true);
      toast.info("Please draw the field boundary on the map");
    }
  };

  const handleCoordinatesSave = async (coordinates: number[][][]) => {
    if (!selectedField) return;

    try {
      const { error } = await supabase
        .from("fields")
        .update({ coordinates: JSON.stringify(coordinates) })
        .eq("id", selectedField.id);

      if (error) throw error;

      setSelectedField({
        ...selectedField,
        coordinates: JSON.stringify(coordinates),
      });

      toast.success("Coordinates saved successfully!");
      setShowMap(false);
    } catch (error) {
      console.error("Error saving coordinates:", error);
      toast.error("Failed to save coordinates");
    }
  };

  const runAnalysis = async () => {
    if (!selectedField) {
      toast.error("Please select a field first");
      return;
    }

    if (!selectedField.coordinates) {
      toast.error("Please draw field boundaries first");
      setShowMap(true);
      return;
    }

    setAnalysisLoading(true);
    toast.info("Starting analysis... This may take 2-5 minutes");

    try {
      const response = await axios.post(`${BACKEND_API_URL}/api/analyze-field`, {
        field_id: selectedField.id,
        field_name: selectedField.name,
        coordinates: {
          type: "Polygon",
          coordinates: JSON.parse(selectedField.coordinates),
        },
        soil_type: selectedField.soil_type,
        water_source: selectedField.water_source,
        crop_type: selectedField.crop_type,
        location: selectedField.location,
        district: selectedField.district,
        state: selectedField.state,
      });

      setAnalysisResult(response.data);
      toast.success("Analysis completed successfully!");
    } catch (error: any) {
      console.error("Analysis error:", error);
      const errorMsg = error.response?.data?.detail || "Failed to complete analysis";
      toast.error(errorMsg);
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Field Analysis</h1>
            <p className="text-muted-foreground">
              Comprehensive satellite imagery and AI-powered agricultural analysis
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowFieldSelection(true)}
              disabled={analysisLoading}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              New Analysis
            </Button>
            {analysisResult && (
              <Button variant="default">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            )}
          </div>
        </div>

        {/* Field Selection Dialog */}
        <FieldSelectionDialog
          open={showFieldSelection}
          onOpenChange={setShowFieldSelection}
          onFieldSelect={handleFieldSelect}
        />

        {/* Selected Field Card */}
        {selectedField && (
          <Card className="shadow-medium mb-8">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{selectedField.name}</span>
                    <Badge variant="secondary">{selectedField.id.slice(0, 8)}</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-4 mt-1">
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {selectedField.district}, {selectedField.state}
                      </span>
                    </span>
                    {analysisResult && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Last analyzed:{" "}
                          {new Date(analysisResult.analysis_date).toLocaleDateString()}
                        </span>
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Profitability Score</p>
                    <p className="text-2xl font-bold text-success">
                      {analysisResult?.profitability_score || "--"}%
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="font-semibold">
                    {selectedField.area} {selectedField.area_unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Soil Type</p>
                  <p className="font-semibold">{selectedField.soil_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Water Source</p>
                  <p className="font-semibold">{selectedField.water_source}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Crop</p>
                  <p className="font-semibold">{selectedField.crop_type}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="default"
                  onClick={runAnalysis}
                  disabled={analysisLoading || !selectedField.coordinates}
                >
                  {analysisLoading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Satellite className="mr-2 h-4 w-4" />
                  )}
                  {analysisLoading ? "Analyzing..." : "Run Analysis"}
                </Button>
                <Button variant="outline" onClick={() => setShowMap(!showMap)}>
                  <MapPin className="mr-2 h-4 w-4" />
                  {selectedField.coordinates ? "Edit" : "Draw"} Boundaries
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interactive Map */}
        {showMap && selectedField && (
          <div className="mb-8">
            <FieldMap
              initialCoordinates={selectedField.coordinates || undefined}
              onCoordinatesSave={handleCoordinatesSave}
              centerLat={16.5}
              centerLng={80.5}
            />
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Analysis Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="satellite" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="satellite">Satellite Imagery</TabsTrigger>
                  <TabsTrigger value="classification">Land Classification</TabsTrigger>
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="satellite" className="space-y-6">
                  <Card className="shadow-medium">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Satellite className="h-5 w-5 text-primary" />
                        <span>6-Class Classification Map</span>
                      </CardTitle>
                      <CardDescription>
                        Based on 5 years of NDVI satellite imagery and Affinity Propagation clustering
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <img
                            src={analysisResult.classification_map_url}
                            alt="Classification Map"
                            className="max-w-2xl w-full rounded-lg shadow-medium"
                            style={{ maxHeight: '500px', objectFit: 'contain' }}
                          />
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold mb-3">Classification Legend</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-[#89FC00] rounded"></div>
                              <span>Class 6: Highly Productive</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-[#16C172] rounded"></div>
                              <span>Class 5: Very Good</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-[#E6E18F] rounded"></div>
                              <span>Class 4: Good</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-[#92977E] rounded"></div>
                              <span>Class 3: Average</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-[#FCAA67] rounded"></div>
                              <span>Class 2: Below Average</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-[#C1292E] rounded"></div>
                              <span>Class 1: Poor</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="classification" className="space-y-6">
                  <Card className="shadow-medium">
                    <CardHeader>
                      <CardTitle>Land Classification Analysis</CardTitle>
                      <CardDescription>
                        Percentage distribution across 6 productivity classes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Classification Chart */}
                        <div>
                          <div className="flex h-8 rounded-lg overflow-hidden mb-4">
                            {[6, 5, 4, 3, 2, 1].map((classNum) => {
                              const percentage =
                                analysisResult.classification[
                                  `class_${classNum}` as keyof typeof analysisResult.classification
                                ];
                              const colors = {
                                6: "#89FC00",
                                5: "#16C172",
                                4: "#E6E18F",
                                3: "#92977E",
                                2: "#FCAA67",
                                1: "#C1292E",
                              };
                              return percentage > 0 ? (
                                <div
                                  key={classNum}
                                  className="flex items-center justify-center text-white text-xs font-medium"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: colors[classNum as keyof typeof colors],
                                  }}
                                >
                                  {percentage.toFixed(1)}%
                                </div>
                              ) : null;
                            })}
                          </div>

                          {/* Classification Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[6, 5, 4, 3, 2, 1].map((classNum) => {
                              const percentage =
                                analysisResult.classification[
                                  `class_${classNum}` as keyof typeof analysisResult.classification
                                ];
                              const labels = {
                                6: "Highly Productive",
                                5: "Very Good",
                                4: "Good",
                                3: "Average",
                                2: "Below Average",
                                1: "Poor",
                              };
                              return (
                                <div key={classNum} className="flex items-center space-x-3">
                                  <div
                                    className="w-4 h-4 rounded"
                                    style={{
                                      backgroundColor:
                                        {
                                          6: "#89FC00",
                                          5: "#16C172",
                                          4: "#E6E18F",
                                          3: "#92977E",
                                          2: "#FCAA67",
                                          1: "#C1292E",
                                        }[classNum],
                                    }}
                                  ></div>
                                  <div>
                                    <p className="font-medium">
                                      Class {classNum}: {labels[classNum as keyof typeof labels]}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {percentage.toFixed(1)}% of field
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Key Insights */}
                        <div className="border-t border-border pt-4">
                          <h4 className="font-semibold mb-3">Key Insights</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              <p>
                                {(
                                  analysisResult.classification.class_6 +
                                  analysisResult.classification.class_5 +
                                  analysisResult.classification.class_4
                                ).toFixed(1)}
                                % of your field shows good to excellent productivity
                              </p>
                            </div>
                            {(analysisResult.classification.class_1 +
                              analysisResult.classification.class_2) >
                              10 && (
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                                <p>
                                  {(
                                    analysisResult.classification.class_1 +
                                    analysisResult.classification.class_2
                                  ).toFixed(1)}
                                  % of the field may need soil improvement or better irrigation
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="stats" className="space-y-6">
                  <Card className="shadow-medium">
                    <CardHeader>
                      <CardTitle>NDVI Statistics</CardTitle>
                      <CardDescription>5-year vegetation health analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-success">
                              {analysisResult.ndvi_stats.mean_ndvi_across_years?.toFixed(3) || "N/A"}
                            </p>
                            <p className="text-sm text-muted-foreground">Mean NDVI</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-primary">
                              {analysisResult.ndvi_stats.trend || "N/A"}
                            </p>
                            <p className="text-sm text-muted-foreground">Trend</p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>
                            Analysis based on Landsat 8/9 satellite imagery with cloud cover filtering
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Recommendations */}
            <div className="space-y-6">
              {/* Crop Recommendations */}
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Leaf className="h-5 w-5 text-success" />
                    <span>AI Crop Recommendations</span>
                  </CardTitle>
                  <CardDescription>
                    Powered by Google Gemini AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.crop_recommendations.map((rec, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-primary">{rec.crop}</h4>
                          <Badge variant="success">{rec.confidence}% match</Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Expected Yield:</span>
                            <span className="font-medium">{rec.expectedYield}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Expected Revenue:</span>
                            <span className="font-medium text-primary">{rec.expectedRevenue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Season:</span>
                            <span className="font-medium">{rec.season}</span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-muted-foreground">
                          {rec.reasoning}
                        </div>

                        <div className="mt-3">
                          <Progress value={rec.confidence} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Summary */}
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Field Health Score</span>
                        <span className="font-medium">
                          {analysisResult.profitability_score}%
                        </span>
                      </div>
                      <Progress value={analysisResult.profitability_score} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>High Productivity Area</span>
                        <span className="font-medium">
                          {(
                            analysisResult.classification.class_6 +
                            analysisResult.classification.class_5
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          analysisResult.classification.class_6 +
                          analysisResult.classification.class_5
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedField && !analysisLoading && (
          <Card className="shadow-medium">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Satellite className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Field Selected</h3>
              <p className="text-muted-foreground mb-6">
                Select a field to start analyzing with satellite imagery and AI
              </p>
              <Button onClick={() => setShowFieldSelection(true)}>
                <PlayCircle className="mr-2 h-4 w-4" />
                Select Field
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnalysisNew;

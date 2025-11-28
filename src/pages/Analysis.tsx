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
  TrendingUp,
  TrendingDown,
  MapPin,
  BarChart3,
  Leaf,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import satelliteAnalysis from "@/assets/satellite-analysis.jpg";

const Analysis = () => {
  const [selectedField, setSelectedField] = useState("AP001");
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Mock field data
  const fieldData = {
    AP001: {
      name: "Main Farm - North",
      location: "Guntur, Andhra Pradesh",
      area: "25.5 acres",
      coordinates: "16.2970° N, 80.4365° E",
      lastAnalyzed: "2024-08-15",
      profitabilityScore: 85,
      classification: {
        highlyProfitable: 40,
        moderatelyProfitable: 30,
        average: 20,
        low: 7,
        nonProfitable: 3
      },
      ndviTrend: [68, 72, 75, 78, 82, 85],
      soilHealth: 82,
      moistureLevel: 68,
      temperatureIndex: 75,
      recommendations: [
        {
          type: "crop",
          crop: "Rice",
          confidence: 92,
          expectedYield: "5.2 tons/acre",
          expectedRevenue: "₹3.2L",
          season: "Kharif 2024"
        },
        {
          type: "crop", 
          crop: "Cotton",
          confidence: 78,
          expectedYield: "2.8 tons/acre",
          expectedRevenue: "₹2.8L",
          season: "Kharif 2024"
        },
        {
          type: "crop",
          crop: "Sugarcane",
          confidence: 65,
          expectedYield: "65 tons/acre", 
          expectedRevenue: "₹4.1L",
          season: "Annual Crop"
        }
      ],
      historicalData: [
        { year: "2019", yield: "4.2 tons/acre", profit: "₹2.1L", crop: "Rice" },
        { year: "2020", yield: "4.6 tons/acre", profit: "₹2.4L", crop: "Rice" },
        { year: "2021", yield: "4.8 tons/acre", profit: "₹2.7L", crop: "Cotton" },
        { year: "2022", yield: "5.0 tons/acre", profit: "₹2.9L", crop: "Rice" },
        { year: "2023", yield: "5.1 tons/acre", profit: "₹3.0L", crop: "Rice" }
      ]
    }
  };

  const currentField = fieldData[selectedField as keyof typeof fieldData];

  const runNewAnalysis = () => {
    setAnalysisLoading(true);
    // Simulate analysis process
    setTimeout(() => {
      setAnalysisLoading(false);
    }, 3000);
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
            <Button variant="outline" onClick={runNewAnalysis} disabled={analysisLoading}>
              {analysisLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Satellite className="mr-2 h-4 w-4" />
              )}
              {analysisLoading ? "Analyzing..." : "New Analysis"}
            </Button>
            <Button variant="default">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Field Overview */}
        <Card className="shadow-medium mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{currentField.name}</span>
                  <Badge variant="secondary">AP001</Badge>
                </CardTitle>
                <CardDescription className="flex items-center space-x-4 mt-1">
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{currentField.location}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Last analyzed: {currentField.lastAnalyzed}</span>
                  </span>
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Profitability Score</p>
                  <p className="text-2xl font-bold text-success">{currentField.profitabilityScore}%</p>
                </div>
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Area</p>
                <p className="font-semibold">{currentField.area}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coordinates</p>
                <p className="font-semibold">{currentField.coordinates}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Soil Health</p>
                <p className="font-semibold text-success">{currentField.soilHealth}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Moisture Level</p>
                <p className="font-semibold text-primary">{currentField.moistureLevel}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Analysis Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="satellite" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="satellite">Satellite Imagery</TabsTrigger>
                <TabsTrigger value="classification">Land Classification</TabsTrigger>
                <TabsTrigger value="historical">Historical Data</TabsTrigger>
              </TabsList>

              <TabsContent value="satellite" className="space-y-6">
                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Satellite className="h-5 w-5 text-primary" />
                      <span>NDVI Analysis</span>
                    </CardTitle>
                    <CardDescription>
                      Normalized Difference Vegetation Index showing vegetation health and productivity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <img
                        src={satelliteAnalysis}
                        alt="Satellite NDVI Analysis"
                        className="w-full rounded-lg shadow-medium"
                      />
                      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-ndvi-high rounded"></div>
                            <span>High Vegetation</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-ndvi-moderate rounded"></div>
                            <span>Moderate Vegetation</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-ndvi-average rounded"></div>
                            <span>Average Vegetation</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-ndvi-low rounded"></div>
                            <span>Low Vegetation</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-ndvi-poor rounded"></div>
                            <span>Poor Vegetation</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-success">{currentField.profitabilityScore}%</p>
                        <p className="text-sm text-muted-foreground">Overall Health</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{currentField.soilHealth}%</p>
                        <p className="text-sm text-muted-foreground">Soil Quality</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{currentField.moistureLevel}%</p>
                        <p className="text-sm text-muted-foreground">Moisture</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-warning">{currentField.temperatureIndex}%</p>
                        <p className="text-sm text-muted-foreground">Temperature</p>
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
                      AI-powered 6-class land profitability assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Classification Chart */}
                      <div>
                        <div className="flex h-8 rounded-lg overflow-hidden mb-4">
                          <div 
                            className="bg-ndvi-high flex items-center justify-center text-white text-xs font-medium"
                            style={{ width: `${currentField.classification.highlyProfitable}%` }}
                          >
                            {currentField.classification.highlyProfitable}%
                          </div>
                          <div 
                            className="bg-ndvi-moderate flex items-center justify-center text-white text-xs font-medium"
                            style={{ width: `${currentField.classification.moderatelyProfitable}%` }}
                          >
                            {currentField.classification.moderatelyProfitable}%
                          </div>
                          <div 
                            className="bg-ndvi-average flex items-center justify-center text-black text-xs font-medium"
                            style={{ width: `${currentField.classification.average}%` }}
                          >
                            {currentField.classification.average}%
                          </div>
                          <div 
                            className="bg-ndvi-low flex items-center justify-center text-white text-xs font-medium"
                            style={{ width: `${currentField.classification.low}%` }}
                          >
                            {currentField.classification.low}%
                          </div>
                          <div 
                            className="bg-ndvi-poor flex items-center justify-center text-white text-xs font-medium"
                            style={{ width: `${currentField.classification.nonProfitable}%` }}
                          >
                            {currentField.classification.nonProfitable}%
                          </div>
                        </div>

                        {/* Classification Legend */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 bg-ndvi-high rounded"></div>
                              <div>
                                <p className="font-medium">Highly Profitable</p>
                                <p className="text-sm text-muted-foreground">{currentField.classification.highlyProfitable}% of field</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 bg-ndvi-moderate rounded"></div>
                              <div>
                                <p className="font-medium">Moderately Profitable</p>
                                <p className="text-sm text-muted-foreground">{currentField.classification.moderatelyProfitable}% of field</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 bg-ndvi-average rounded"></div>
                              <div>
                                <p className="font-medium">Average Productivity</p>
                                <p className="text-sm text-muted-foreground">{currentField.classification.average}% of field</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 bg-ndvi-low rounded"></div>
                              <div>
                                <p className="font-medium">Low Productivity</p>
                                <p className="text-sm text-muted-foreground">{currentField.classification.low}% of field</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 bg-ndvi-poor rounded"></div>
                              <div>
                                <p className="font-medium">Non-Profitable</p>
                                <p className="text-sm text-muted-foreground">{currentField.classification.nonProfitable}% of field</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Analysis Insights */}
                      <div className="border-t border-border pt-4">
                        <h4 className="font-semibold mb-3">Key Insights</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <p>70% of your field shows high to moderate profitability potential</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                            <p>10% of the field may need soil improvement or better irrigation</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <p>Consider focusing on the highly profitable areas for premium crops</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historical" className="space-y-6">
                <Card className="shadow-medium">
                  <CardHeader>
                    <CardTitle>Historical Performance</CardTitle>
                    <CardDescription>
                      5-year yield and profitability trends for this field
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Trend Chart Placeholder */}
                      <div className="h-40 bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">NDVI Trend Chart</p>
                          <p className="text-xs text-muted-foreground">
                            Showing {currentField.ndviTrend.length} months of vegetation health data
                          </p>
                        </div>
                      </div>

                      {/* Historical Data Table */}
                      <div>
                        <h4 className="font-semibold mb-3">Yearly Performance</h4>
                        <div className="space-y-3">
                          {currentField.historicalData.map((data, index) => (
                            <div key={index} className="flex justify-between items-center p-3 border border-border rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="text-center">
                                  <p className="font-semibold">{data.year}</p>
                                  <p className="text-xs text-muted-foreground">{data.crop}</p>
                                </div>
                                <div>
                                  <p className="font-medium">{data.yield}</p>
                                  <p className="text-sm text-muted-foreground">Yield</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-primary">{data.profit}</p>
                                <p className="text-sm text-muted-foreground">Profit</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Performance Summary */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <TrendingUp className="h-4 w-4 text-success" />
                            <span className="font-semibold text-success">+21%</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Yield improvement over 5 years</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-primary">+43%</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Profit increase over 5 years</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Recommendations & Actions */}
          <div className="space-y-6">
            {/* Crop Recommendations */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Leaf className="h-5 w-5 text-success" />
                  <span>Crop Recommendations</span>
                </CardTitle>
                <CardDescription>
                  AI-powered suggestions based on analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentField.recommendations.map((rec, index) => (
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
                      
                      <div className="mt-3">
                        <Progress value={rec.confidence} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="default" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Download Full Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Consultation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Compare with Other Fields
                </Button>
                <Button variant="success" className="w-full justify-start">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Implement Recommendations
                </Button>
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
                      <span className="font-medium">{currentField.profitabilityScore}%</span>
                    </div>
                    <Progress value={currentField.profitabilityScore} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Profitable Area</span>
                      <span className="font-medium">70%</span>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Optimization Potential</span>
                      <span className="font-medium">High</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
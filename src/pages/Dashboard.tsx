import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  Map as MapIcon,
  Plus,
  BarChart3,
  TrendingUp,
  MapPin,
  Calendar,
  Leaf,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface Field {
  id: string;
  name: string;
  location: string;
  district: string;
  state: string;
  area: number;
  area_unit: string;
  crop_type: string;
  soil_type: string;
  water_source: string;
  planting_date: string;
  expected_harvest_date: string | null;
}
interface Alert {
  type: string;
  message: string;
  field: string;
  priority: string;
}

interface FieldAnalysis {
  field_id: string;
  profitability_score: number;
  analysis_date: string;
  classification: {
    class_1: number;
    class_2: number;
    class_3: number;
    class_4: number;
    class_5: number;
    class_6: number;
  };
}

interface RecentAnalysis {
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
  profitability_score: number;
  analysis_date: string;
}

const Dashboard = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [fieldAnalyses, setFieldAnalyses] = useState<Map<string, FieldAnalysis>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [recentAnalysis, setRecentAnalysis] = useState<RecentAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchRecentAnalysis = async (fieldId: string) => {
    if (expandedFieldId === fieldId) {
      // Toggle off if already expanded
      setExpandedFieldId(null);
      setRecentAnalysis(null);
      return;
    }

    setAnalysisLoading(true);
    setExpandedFieldId(fieldId);

    try {
      const response = await axios.get(`${BACKEND_API_URL}/api/recent-analysis/${fieldId}`);
      setRecentAnalysis(response.data);
    } catch (error: any) {
      console.error("Error fetching recent analysis:", error);
      if (error.response?.status === 404) {
        toast.error("No analysis found for this field");
      } else {
        toast.error("Failed to load recent analysis");
      }
      setExpandedFieldId(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);

    // Fetch fields
    const { data: fieldsData, error: fieldsError } = await supabase
      .from("fields")
      .select("*")
      .order("created_at", { ascending: false });

    if (fieldsError) {
      toast.error("Failed to load fields");
      setLoading(false);
      return;
    }

    setFields(fieldsData || []);

    // Fetch latest analysis for each field from MongoDB backend
    if (fieldsData && fieldsData.length > 0) {
      try {
        const analysesMap = new Map<string, FieldAnalysis>();

        // Fetch analysis for each field from MongoDB
        for (const field of fieldsData) {
          try {
            const response = await axios.get(`${BACKEND_API_URL}/api/recent-analysis/${field.id}`);
            if (response.data) {
              analysesMap.set(field.id, {
                field_id: field.id,
                profitability_score: response.data.profitability_score,
                analysis_date: response.data.analysis_date,
                classification: response.data.classification
              });
            }
          } catch (error: any) {
            // Skip if no analysis found (404)
            if (error.response?.status !== 404) {
              console.error(`Failed to fetch analysis for field ${field.id}:`, error);
            }
          }
        }

        setFieldAnalyses(analysesMap);
      } catch (error) {
        console.error("Failed to fetch field analyses:", error);
      }
    }

    // Fetch climate alerts if there are fields
    if (fieldsData && fieldsData.length > 0) {
      try {
        const { data: alertsData, error: alertsError } = await supabase.functions.invoke('get-climate-alerts', {
          body: { fields: fieldsData }
        });

        if (alertsError) throw alertsError;
        setAlerts(alertsData?.alerts || []);
      } catch (error) {
        console.error("Failed to fetch climate alerts:", error);
        // Don't show error toast for alerts, just use empty array
      }
    }

    setLoading(false);
  };

  // Mock data for user's fields (keeping for reference if no fields exist)
  const mockFields = [
    {
      id: "AP001",
      name: "Main Farm - North",
      location: "Guntur, Andhra Pradesh",
      area: "25.5 acres",
      lastAnalyzed: "2024-08-15",
      profitabilityScore: 85,
      recommendedCrop: "Rice",
      status: "healthy",
      ndviClassification: {
        highlyProfitable: 40,
        moderatelyProfitable: 30,
        average: 20,
        low: 7,
        nonProfitable: 3
      }
    },
    {
      id: "AP002",
      name: "Cotton Field - East",
      location: "Warangal, Telangana",
      area: "18.2 acres",
      lastAnalyzed: "2024-08-10",
      profitabilityScore: 72,
      recommendedCrop: "Cotton",
      status: "attention",
      ndviClassification: {
        highlyProfitable: 25,
        moderatelyProfitable: 35,
        average: 25,
        low: 12,
        nonProfitable: 3
      }
    },
    {
      id: "AP003",
      name: "Experimental Plot",
      location: "Karimnagar, Telangana",
      area: "8.7 acres",
      lastAnalyzed: "2024-08-12",
      profitabilityScore: 58,
      recommendedCrop: "Maize",
      status: "needs_attention",
      ndviClassification: {
        highlyProfitable: 15,
        moderatelyProfitable: 25,
        average: 35,
        low: 20,
        nonProfitable: 5
      }
    }
  ];

  // Use real fields or mock fields if none exist
  const displayFields = fields.length > 0 ? fields : mockFields;
  const displayAlerts = alerts.length > 0 ? alerts : [];

  // Calculate real stats
  const totalArea = fields.reduce((sum, field) => sum + field.area, 0);
  const overallStats = {
    totalFields: fields.length,
    totalArea: fields.length > 0 ? `${totalArea.toFixed(1)} acres` : "0 acres",
    avgProfitability: 72, // This would come from analysis data
    estimatedRevenue: "₹8.2L" // This would come from market data
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-success";
      case "attention": return "bg-warning";
      case "needs_attention": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return CheckCircle;
      case "attention": return AlertTriangle;
      case "needs_attention": return AlertTriangle;
      default: return Leaf;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "warning";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, Farmer! 🌱
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your agricultural fields and their performance.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
              <MapIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{overallStats.totalFields}</div>
              <p className="text-xs text-muted-foreground">
                Actively monitored
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Area</CardTitle>
              <MapPin className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{overallStats.totalArea}</div>
              <p className="text-xs text-muted-foreground">
                Under cultivation
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Profitability</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{overallStats.avgProfitability}%</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{overallStats.estimatedRevenue}</div>
              <p className="text-xs text-muted-foreground">
                This season
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Fields Section */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">My Fields</h2>
              <Button variant="default" asChild>
                <NavLink to="/fields">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Field
                </NavLink>
              </Button>
            </div>

            <div className="space-y-6">
              {fields.length === 0 ? (
                <Card className="shadow-soft">
                  <CardContent className="pt-8 pb-8 text-center">
                    <MapIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Fields Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by adding your first field to track its performance
                    </p>
                    <Button variant="default" asChild>
                      <NavLink to="/fields/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Field
                      </NavLink>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                fields.map((field) => {
                  const analysis = fieldAnalyses.get(field.id);
                  return (
                    <Card key={field.id} className="shadow-medium hover:shadow-strong transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <span>{field.name}</span>
                            </CardTitle>
                            <CardDescription className="flex items-center space-x-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              <span>{field.location}, {field.district}, {field.state}</span>
                            </CardDescription>
                          </div>
                          {analysis && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Profitability</p>
                              <p className="text-xl font-bold text-success">{analysis.profitability_score}%</p>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Area</p>
                            <p className="font-semibold">{field.area} {field.area_unit}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Crop Type</p>
                            <p className="font-semibold">{field.crop_type}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Soil Type</p>
                            <p className="font-semibold">{field.soil_type}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Water Source</p>
                            <p className="font-semibold">{field.water_source}</p>
                          </div>
                        </div>

                        {analysis && (
                          <div className="mb-4 pt-2 border-t border-border">
                            <div className="text-sm space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Last Analyzed:</span>
                                <span className="font-medium">{new Date(analysis.analysis_date).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">High Productivity Area</p>
                                <Progress
                                  value={analysis.classification.class_5 + analysis.classification.class_6}
                                  className="h-2"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {(analysis.classification.class_5 + analysis.classification.class_6).toFixed(1)}% of field
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mb-4 pt-2 border-t border-border">
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Planted:</span>
                              <span className="font-medium">{new Date(field.planting_date).toLocaleDateString()}</span>
                            </div>
                            {field.expected_harvest_date && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Expected Harvest:</span>
                                <span className="font-medium">{new Date(field.expected_harvest_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchRecentAnalysis(field.id)}
                            disabled={analysisLoading && expandedFieldId === field.id}
                          >
                            {expandedFieldId === field.id ? (
                              <>
                                <ChevronUp className="mr-2 h-4 w-4" />
                                Hide Analysis
                              </>
                            ) : (
                              <>
                                <ChevronDown className="mr-2 h-4 w-4" />
                                Recent Analysis
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <NavLink to={`/analysis/${field.id}`}>
                              {analysis ? 'View Full' : 'Run Analysis'}
                            </NavLink>
                          </Button>
                          <Button variant="default" size="sm" asChild>
                            <NavLink to="/fields">
                              Manage Field
                            </NavLink>
                          </Button>
                        </div>

                        {/* Recent Analysis Display */}
                        {expandedFieldId === field.id && recentAnalysis && (
                          <div className="mt-6 pt-6 border-t border-border space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-lg">Recent Analysis Results</h4>
                              <Badge variant="secondary">
                                {new Date(recentAnalysis.analysis_date).toLocaleDateString()}
                              </Badge>
                            </div>

                            {/* Classification Map */}
                            <div className="space-y-3">
                              <div className="flex justify-center">
                                <img
                                  src={recentAnalysis.classification_map_url}
                                  alt="Classification Map"
                                  className="max-w-full rounded-lg shadow-medium"
                                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                                />
                              </div>

                              {/* Classification Legend */}
                              <div className="bg-muted/50 rounded-lg p-4">
                                <h5 className="text-sm font-semibold mb-3">Classification Legend</h5>
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

                              {/* Classification Distribution */}
                              <div className="space-y-3">
                                <h5 className="text-sm font-semibold">Productivity Distribution</h5>
                                <div className="flex h-6 rounded-lg overflow-hidden">
                                  {[6, 5, 4, 3, 2, 1].map((classNum) => {
                                    const percentage =
                                      recentAnalysis.classification[
                                        `class_${classNum}` as keyof typeof recentAnalysis.classification
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
                                        title={`Class ${classNum}: ${percentage.toFixed(1)}%`}
                                      >
                                        {percentage > 5 ? `${percentage.toFixed(1)}%` : ''}
                                      </div>
                                    ) : null;
                                  })}
                                </div>

                                {/* Key Insights */}
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                  <div className="text-center p-3 bg-success/10 rounded-lg">
                                    <p className="text-2xl font-bold text-success">
                                      {recentAnalysis.profitability_score}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">Profitability Score</p>
                                  </div>
                                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                                    <p className="text-2xl font-bold text-primary">
                                      {(
                                        recentAnalysis.classification.class_6 +
                                        recentAnalysis.classification.class_5 +
                                        recentAnalysis.classification.class_4
                                      ).toFixed(1)}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">Good to Excellent</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {expandedFieldId === field.id && analysisLoading && (
                          <div className="mt-6 pt-6 border-t border-border text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-sm text-muted-foreground">Loading analysis...</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar - Alerts & Quick Actions */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span>Recent Alerts</span>
                </CardTitle>
                <CardDescription>
                  Important notifications for your fields
                </CardDescription>
              </CardHeader>
              <CardContent>
                {displayAlerts.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      {fields.length === 0
                        ? "Add fields to get climate alerts"
                        : "No alerts at this time"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayAlerts.map((alert, index) => (
                      <div key={index} className="p-3 border border-border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant={getPriorityColor(alert.priority)} className="text-xs">
                            {alert.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground mb-1">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.field}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <NavLink to="/analysis">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Run New Analysis
                  </NavLink>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <NavLink to="/consultation">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Consultation
                  </NavLink>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <NavLink to="/fields">
                    <MapIcon className="mr-2 h-4 w-4" />
                    View All Fields
                  </NavLink>
                </Button>
                <Button variant="default" className="w-full justify-start" asChild>
                  <NavLink to="/pricing">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </NavLink>
                </Button>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>This Month's Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Analysis Completed</span>
                      <span>8/10</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Profit Optimization</span>
                      <span>72%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Recommendation Follow-up</span>
                      <span>6/8</span>
                    </div>
                    <Progress value={75} className="h-2" />
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

export default Dashboard;
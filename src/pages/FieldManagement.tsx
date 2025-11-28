import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  MapPin, 
  Calendar,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Map
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface Field {
  id: string;
  name: string;
  location: string;
  district: string;
  state: string;
  coordinates: string | null;
  area: number;
  area_unit: string;
  soil_type: string;
  water_source: string;
  crop_type: string;
  planting_date: string;
  expected_harvest_date: string | null;
  notes: string | null;
}

const FieldManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFields();
    }
  }, [user]);

  const fetchFields = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fields")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFields(data);
    }
    setLoading(false);
  };

  const filteredFields = fields.filter(field => {
    const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.crop_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading fields...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Field Management</h1>
            <p className="text-muted-foreground">
              Manage and monitor all your agricultural fields in one place
            </p>
          </div>
          <Button variant="hero" asChild>
            <NavLink to="/fields/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Field
            </NavLink>
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="shadow-soft mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search fields by name, location, or crop type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
            </div>
          </CardContent>
        </Card>

        {/* Fields Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFields.map((field) => (
            <Card key={field.id} className="shadow-medium hover:shadow-strong transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{field.name}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{field.location}, {field.district}, {field.state}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Field Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Area</p>
                      <p className="font-semibold">{field.area} {field.area_unit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Crop Type</p>
                      <p className="font-semibold">{field.crop_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Soil Type</p>
                      <p className="font-semibold">{field.soil_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Water Source</p>
                      <p className="font-semibold">{field.water_source}</p>
                    </div>
                  </div>

                  {/* Crop Timeline */}
                  <div className="pt-2 border-t border-border">
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

                  {/* Action Buttons */}
                  <div className="pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <NavLink to={`/fields/${field.id}`}>
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </NavLink>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <NavLink to={`/analysis/${field.id}`}>
                          <Map className="mr-1 h-3 w-3" />
                          Analyze
                        </NavLink>
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredFields.length === 0 && (
          <Card className="shadow-soft">
            <CardContent className="pt-8 pb-8 text-center">
              <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Fields Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "You haven't added any fields yet. Start by adding your first field."
                }
              </p>
              {!searchTerm && filterStatus === "all" && (
                <Button variant="hero" asChild>
                  <NavLink to="/fields/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Field
                  </NavLink>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{fields.length}</div>
              <p className="text-sm text-muted-foreground">Total Fields</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {fields.reduce((sum, field) => sum + field.area, 0).toFixed(1)} acres
              </div>
              <p className="text-sm text-muted-foreground">Total Area</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FieldManagement;
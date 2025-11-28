import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

interface FieldSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldSelect: (field: Field) => void;
}

const FieldSelectionDialog = ({
  open,
  onOpenChange,
  onFieldSelect,
}: FieldSelectionDialogProps) => {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchFields();
    }
  }, [open, user]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fields")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error("Error fetching fields:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select a Field for Analysis</DialogTitle>
          <DialogDescription>
            Choose a field to analyze with satellite imagery and AI-powered insights
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Loading fields...</div>
        ) : fields.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No fields found</p>
            <Button onClick={() => window.location.href = "/add-field"}>
              Add Your First Field
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {fields.map((field) => (
              <Card
                key={field.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  onFieldSelect(field);
                  onOpenChange(false);
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{field.name}</span>
                    {field.coordinates && (
                      <Badge variant="success">Has Coordinates</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <MapPin className="h-3 w-3" />
                    <span>{field.district}, {field.state}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Area:</span>
                      <span className="font-medium">
                        {field.area} {field.area_unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Soil Type:</span>
                      <span className="font-medium">{field.soil_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Water Source:</span>
                      <span className="font-medium">{field.water_source}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center space-x-1">
                        <Sprout className="h-3 w-3" />
                        <span>Current Crop:</span>
                      </span>
                      <span className="font-medium">{field.crop_type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Planted:</span>
                      </span>
                      <span className="font-medium">
                        {new Date(field.planting_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FieldSelectionDialog;

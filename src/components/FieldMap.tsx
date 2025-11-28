import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { MapPin, Save } from "lucide-react";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface FieldMapProps {
  initialCoordinates?: string; // JSON string of coordinates
  onCoordinatesSave: (coordinates: number[][][]) => void;
  centerLat?: number;
  centerLng?: number;
}

const FieldMap = ({
  initialCoordinates,
  onCoordinatesSave,
  centerLat = 16.5,
  centerLng = 80.5,
}: FieldMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [coordinates, setCoordinates] = useState<number[][][] | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    // Initialize map
    if (!mapRef.current) {
      const map = L.map("field-map").setView([centerLat, centerLng], 13);

      // Add satellite tile layer
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Esri",
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      // Initialize FeatureGroup for drawn items
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // Initialize draw control with proper polygon settings
      const drawControl = new L.Control.Draw({
        position: 'topleft',
        edit: {
          featureGroup: drawnItems,
          remove: true,
        },
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            showLength: true,
            metric: ['km', 'm'],
            feet: false,
            nautic: false,
            shapeOptions: {
              stroke: true,
              color: '#3388ff',
              weight: 4,
              opacity: 0.8,
              fill: true,
              fillColor: null, // same as color by default
              fillOpacity: 0.2,
              clickable: true
            },
            drawError: {
              color: '#e74c3c',
              message: '<strong>Error:</strong> Shape edges cannot cross!',
              timeout: 2500
            },
            // IMPORTANT: No restrictions on vertices
            guidelineDistance: 20,
            maxGuideLineLength: 4000,
            // repeatMode allows drawing multiple shapes
            repeatMode: false
          },
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
      });
      map.addControl(drawControl);

      // Add help text when starting to draw
      map.on(L.Draw.Event.DRAWSTART, (event: any) => {
        console.log('Drawing started - you can add unlimited points!');
      });

      // Handle polygon creation
      map.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        drawnItems.clearLayers(); // Clear previous drawings
        drawnItems.addLayer(layer);

        const coords = (layer.toGeoJSON() as any).geometry.coordinates;
        console.log('Polygon created with coordinates:', coords);
        console.log('Number of points:', coords[0].length);

        setCoordinates(coords);
        setHasDrawn(true);
      });

      // Handle polygon edit
      map.on(L.Draw.Event.EDITED, (event: any) => {
        const layers = event.layers;
        layers.eachLayer((layer: any) => {
          const coords = layer.toGeoJSON().geometry.coordinates;
          setCoordinates(coords);
        });
      });

      // Load initial coordinates if provided
      if (initialCoordinates) {
        try {
          const parsedCoords = JSON.parse(initialCoordinates);
          if (parsedCoords && parsedCoords.length > 0) {
            const polygon = L.polygon(
              parsedCoords[0].map((coord: number[]) => [coord[1], coord[0]])
            );
            drawnItems.addLayer(polygon);
            map.fitBounds(polygon.getBounds());
            setCoordinates(parsedCoords);
            setHasDrawn(true);
          }
        } catch (e) {
          console.error("Failed to parse initial coordinates:", e);
        }
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleSave = () => {
    if (coordinates) {
      onCoordinatesSave(coordinates);
    }
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span>Field Boundary</span>
        </CardTitle>
        <CardDescription>
          <div className="space-y-2">
            <p>
              <strong>How to draw your field boundary:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click the polygon tool (square icon with dots) on the left side of the map</li>
              <li>Click on the map to place points - you can add as many points as you need (4, 5, 10, 20+ points)</li>
              <li>To finish: Click on the <strong>first point again</strong> to close the polygon OR press <strong>Finish</strong> button</li>
              <li>Do NOT double-click - just click each point once, then click the first point to close</li>
            </ol>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="font-semibold text-blue-900 mb-1">⚠️ Important Drawing Instructions:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Click once for each corner point (don't double-click)</li>
            <li>You'll see a dotted line following your cursor</li>
            <li>Keep clicking to add more points (4, 5, 6, 10+ points)</li>
            <li>To finish: Click on the <strong>first point</strong> you created to close the shape</li>
            <li>If you make a mistake, click the trash icon to delete and start over</li>
          </ul>
        </div>
        <div
          id="field-map"
          style={{ height: "500px", width: "100%", borderRadius: "8px" }}
          className="mb-4"
        />
        {hasDrawn && (
          <div className="flex justify-end">
            <Button onClick={handleSave} className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Save Coordinates</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FieldMap;

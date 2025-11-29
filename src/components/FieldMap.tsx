import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
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
  initialCoordinates?: string;
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
    // Initialize map only once
    if (!mapRef.current) {
      const map = L.map("field-map", {
        center: [centerLat, centerLng],
        zoom: 13,
        preferCanvas: false,
        trackResize: true
      });

      // Add satellite tile layer
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Esri",
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      // Add search control
      const provider = new OpenStreetMapProvider();
      const searchControl = new (GeoSearchControl as any)({
        provider: provider,
        style: 'bar',
        showMarker: true,
        showPopup: false,
        marker: {
          icon: new L.Icon.Default(),
          draggable: false,
        },
        popupFormat: ({ query, result }: any) => result.label,
        maxMarkers: 1,
        retainZoomLevel: false,
        animateZoom: true,
        autoClose: true,
        searchLabel: 'Search for a location (e.g., Thondamanadu)',
        keepResult: true,
      });
      map.addControl(searchControl);

      // Initialize FeatureGroup for drawn items
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // Configure draw control - DISABLE measurement tooltips to avoid leaflet-draw bug
      const drawControl = new L.Control.Draw({
        position: 'topleft',
        edit: {
          featureGroup: drawnItems,
          remove: true
        },
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: false,  // DISABLED to prevent "type is not defined" error
            showLength: false, // DISABLED to prevent "type is not defined" error
            metric: false,
            feet: false,
            drawError: {
              color: '#e74c3c',
              timeout: 1000,
              message: '<strong>Error:</strong> Shape edges cannot cross!'
            },
            shapeOptions: {
              stroke: true,
              color: '#3498db',
              weight: 3,
              opacity: 0.8,
              fill: true,
              fillColor: '#3498db',
              fillOpacity: 0.2,
              clickable: true
            },
            icon: new L.DivIcon({
              iconSize: new L.Point(8, 8),
              className: 'leaflet-div-icon leaflet-editing-icon'
            }),
            touchIcon: new L.DivIcon({
              iconSize: new L.Point(20, 20),
              className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
            }),
            guidelineDistance: 20,
            maxGuideLineLength: 4000,
            repeatMode: false
          },
          rectangle: {
            showArea: false, // DISABLED to prevent errors
            metric: false,
            shapeOptions: {
              stroke: true,
              color: '#3498db',
              weight: 3,
              opacity: 0.8,
              fill: true,
              fillColor: '#3498db',
              fillOpacity: 0.2
            },
            repeatMode: false
          },
          circle: {
            showRadius: false, // DISABLED to prevent errors
            metric: false,
            shapeOptions: {
              stroke: true,
              color: '#3498db',
              weight: 3,
              opacity: 0.8,
              fill: true,
              fillColor: '#3498db',
              fillOpacity: 0.2
            },
            repeatMode: false
          },
          circlemarker: false,
          marker: false,
          polyline: false
        }
      });

      map.addControl(drawControl);

      // Disable double-click zoom during drawing
      let isDrawing = false;

      map.on(L.Draw.Event.DRAWSTART, (e: any) => {
        console.log('Drawing started:', e.layerType);
        isDrawing = true;
        map.doubleClickZoom.disable();
      });

      map.on(L.Draw.Event.DRAWSTOP, (e: any) => {
        console.log('Drawing stopped');
        setTimeout(() => {
          isDrawing = false;
          map.doubleClickZoom.enable();
        }, 100);
      });

      map.on(L.Draw.Event.DRAWVERTEX, (e: any) => {
        console.log('Vertex added, total layers:', e.layers.getLayers().length);
      });

      // Handle shape creation
      map.on(L.Draw.Event.CREATED, (event: any) => {
        console.log('Shape created:', event.layerType);
        const layer = event.layer;
        drawnItems.clearLayers();
        drawnItems.addLayer(layer);

        const geojson = layer.toGeoJSON();
        let coords: number[][][] | null = null;

        if (geojson.geometry.type === 'Polygon') {
          coords = geojson.geometry.coordinates;
          console.log('Polygon coordinates:', coords);
        } else if (geojson.geometry.type === 'Point' && layer instanceof L.Circle) {
          const bounds = layer.getBounds();
          const southWest = bounds.getSouthWest();
          const northEast = bounds.getNorthEast();

          coords = [
            [
              [southWest.lng, southWest.lat],
              [southWest.lng, northEast.lat],
              [northEast.lng, northEast.lat],
              [northEast.lng, southWest.lat],
              [southWest.lng, southWest.lat],
            ]
          ];
          console.log('Circle bounding box coordinates:', coords);
        }

        if (coords) {
          setCoordinates(coords);
          setHasDrawn(true);
        }
      });

      // Handle polygon edit
      map.on(L.Draw.Event.EDITED, (event: any) => {
        const layers = event.layers;
        layers.eachLayer((layer: any) => {
          const geojson = layer.toGeoJSON();
          let coords: number[][][] | null = null;

          if (geojson.geometry.type === 'Polygon') {
            coords = geojson.geometry.coordinates;
          } else if (geojson.geometry.type === 'Point' && layer instanceof L.Circle) {
            const bounds = layer.getBounds();
            const southWest = bounds.getSouthWest();
            const northEast = bounds.getNorthEast();
            coords = [
              [
                [southWest.lng, southWest.lat],
                [southWest.lng, northEast.lat],
                [northEast.lng, northEast.lat],
                [northEast.lng, southWest.lat],
                [southWest.lng, southWest.lat],
              ]
            ];
          }

          if (coords) {
            setCoordinates(coords);
          }
        });
      });

      // Handle polygon deletion
      map.on(L.Draw.Event.DELETED, () => {
        setCoordinates(null);
        setHasDrawn(false);
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
  }, [initialCoordinates, centerLat, centerLng]);

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
          <div className="space-y-3">
            <p className="font-semibold text-base">
              How to draw your field boundary:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Search:</strong> Use the search bar to find your location (e.g., "Thondamanadu, Andhra Pradesh")</li>

            </ol>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg text-sm shadow-sm">
          <p className="font-bold text-green-900 mb-2 flex items-center gap-2">
            ✅ Drawing Instructions:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-green-900">
            <li><strong>Polygon</strong>: Click each corner → Click first point again OR double-click last point to finish</li>
            <li><strong>Rectangle</strong>: Click and drag from one corner to opposite corner</li>
            <li><strong>Circle</strong>: Click center point, then drag to set radius</li>
            <li>If polygon stops responding: Cancel (press ESC), then start over</li>
            <li>Check browser console (F12) for debugging info if issues persist</li>
          </ul>
        </div>
        <div
          id="field-map"
          style={{ height: "500px", width: "100%", borderRadius: "8px" }}
          className="mb-4 border-2 border-gray-300"
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
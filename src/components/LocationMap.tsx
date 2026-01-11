import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Clock, Navigation } from "lucide-react";

interface LocationMapProps {
  customerLat: number;
  customerLng: number;
  mechanicLat?: number | null;
  mechanicLng?: number | null;
  showMechanic?: boolean;
}

interface RouteInfo {
  duration: number; // in minutes
  distance: number; // in km
}

const LocationMap = ({
  customerLat,
  customerLng,
  mechanicLat,
  mechanicLng,
  showMechanic = false,
}: LocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const customerMarker = useRef<mapboxgl.Marker | null>(null);
  const mechanicMarker = useRef<mapboxgl.Marker | null>(null);
  const mapboxToken = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  const fetchRoute = async (
    startLng: number,
    startLat: number,
    endLng: number,
    endLat: number
  ) => {
    if (!map.current || !mapboxToken.current) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full&access_token=${mapboxToken.current}`
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;

        // Update route info
        setRouteInfo({
          duration: Math.round(route.duration / 60), // Convert seconds to minutes
          distance: Math.round((route.distance / 1000) * 10) / 10, // Convert meters to km
        });

        // Add or update the route layer
        if (map.current.getSource("route")) {
          (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: coordinates,
            },
          });
        } else {
          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: coordinates,
              },
            },
          });

          // Add route background (wider, for outline effect)
          map.current.addLayer({
            id: "route-background",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#1e40af",
              "line-width": 8,
              "line-opacity": 0.4,
            },
          });

          // Add main route line
          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3b82f6",
              "line-width": 5,
            },
          });

          // Add animated dashes
          map.current.addLayer({
            id: "route-dashes",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#60a5fa",
              "line-width": 3,
              "line-dasharray": [0, 4, 3],
            },
          });
        }

        // Fit map to show entire route
        const bounds = coordinates.reduce(
          (bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
            return bounds.extend(coord);
          },
          new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
        );

        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        });
      }
    } catch (err) {
      console.error("Error fetching route:", err);
    }
  };

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current) return;

      try {
        // Fetch Mapbox token from edge function
        const { data, error: fetchError } = await supabase.functions.invoke(
          "get-mapbox-token"
        );

        if (fetchError || !data?.token) {
          throw new Error("Failed to load map configuration");
        }

        mapboxToken.current = data.token;
        mapboxgl.accessToken = data.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [customerLng, customerLat],
          zoom: 14,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        map.current.on("load", () => {
          setIsLoading(false);

          // Add customer marker (red pin)
          const customerEl = document.createElement("div");
          customerEl.className = "customer-marker";
          customerEl.innerHTML = `
            <div style="
              background-color: #ef4444;
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          `;

          customerMarker.current = new mapboxgl.Marker({
            element: customerEl,
            anchor: "bottom",
          })
            .setLngLat([customerLng, customerLat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                "<strong>Your Location</strong>"
              )
            )
            .addTo(map.current!);

          // Add mechanic marker and route if available
          if (showMechanic && mechanicLat && mechanicLng) {
            addMechanicMarker(mechanicLat, mechanicLng);
            fetchRoute(mechanicLng, mechanicLat, customerLng, customerLat);
          }
        });
      } catch (err) {
        console.error("Map initialization error:", err);
        setError(err instanceof Error ? err.message : "Failed to load map");
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      map.current?.remove();
    };
  }, [customerLat, customerLng]);

  // Update mechanic marker and route when position changes
  useEffect(() => {
    if (!map.current || !showMechanic) return;

    if (mechanicLat && mechanicLng) {
      if (mechanicMarker.current) {
        mechanicMarker.current.setLngLat([mechanicLng, mechanicLat]);
      } else if (map.current.loaded()) {
        addMechanicMarker(mechanicLat, mechanicLng);
      }

      // Update route when mechanic position changes
      if (map.current.loaded()) {
        fetchRoute(mechanicLng, mechanicLat, customerLng, customerLat);
      }
    }
  }, [mechanicLat, mechanicLng, showMechanic, customerLat, customerLng]);

  const addMechanicMarker = (lat: number, lng: number) => {
    if (!map.current) return;

    const mechanicEl = document.createElement("div");
    mechanicEl.className = "mechanic-marker";
    mechanicEl.innerHTML = `
      <div style="
        background-color: #3b82f6;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      ">
        <svg style="width: 20px; height: 20px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"></path>
          <path d="m14 7 3 3"></path>
          <path d="M5 6v4"></path>
          <path d="M19 14v4"></path>
          <path d="M10 2v2"></path>
          <path d="M7 8H3"></path>
          <path d="M21 16h-4"></path>
          <path d="M11 3H9"></path>
        </svg>
      </div>
    `;

    mechanicMarker.current = new mapboxgl.Marker({
      element: mechanicEl,
      anchor: "center",
    })
      .setLngLat([lng, lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          "<strong>Mechanic Location</strong><br/>On the way!"
        )
      )
      .addTo(map.current);
  };

  if (error) {
    return (
      <div className="rounded-xl bg-secondary/50 h-48 flex items-center justify-center border border-border">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border">
      {isLoading && (
        <div className="absolute inset-0 bg-secondary/50 flex items-center justify-center z-10">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      )}
      <div ref={mapContainer} className="h-48 w-full" />
      
      {/* Route info overlay */}
      {routeInfo && (
        <div className="absolute bottom-2 left-2 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-accent">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{routeInfo.duration} min</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Navigation className="w-4 h-4" />
              <span>{routeInfo.distance} km</span>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default LocationMap;

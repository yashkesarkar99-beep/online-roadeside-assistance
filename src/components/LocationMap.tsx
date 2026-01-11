import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin } from "lucide-react";

interface LocationMapProps {
  customerLat: number;
  customerLng: number;
  mechanicLat?: number | null;
  mechanicLng?: number | null;
  showMechanic?: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

          // Add mechanic marker if available (blue pin with wrench)
          if (showMechanic && mechanicLat && mechanicLng) {
            addMechanicMarker(mechanicLat, mechanicLng);
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

  // Update mechanic marker when position changes
  useEffect(() => {
    if (!map.current || !showMechanic) return;

    if (mechanicLat && mechanicLng) {
      if (mechanicMarker.current) {
        mechanicMarker.current.setLngLat([mechanicLng, mechanicLat]);
      } else if (map.current.loaded()) {
        addMechanicMarker(mechanicLat, mechanicLng);
      }

      // Fit bounds to show both markers
      if (customerMarker.current && mechanicMarker.current) {
        const bounds = new mapboxgl.LngLatBounds()
          .extend([customerLng, customerLat])
          .extend([mechanicLng, mechanicLat]);

        map.current.fitBounds(bounds, {
          padding: 60,
          maxZoom: 15,
        });
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

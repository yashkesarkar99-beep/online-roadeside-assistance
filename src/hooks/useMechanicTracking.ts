import { useState, useEffect, useCallback, useRef } from "react";

interface MechanicPosition {
  lat: number;
  lng: number;
}

interface UseMechanicTrackingProps {
  customerLat: number;
  customerLng: number;
  isTracking: boolean;
  simulatedSpeed?: number; // km per update interval
}

interface RouteCoordinate {
  lng: number;
  lat: number;
}

export const useMechanicTracking = ({
  customerLat,
  customerLng,
  isTracking,
  simulatedSpeed = 0.5,
}: UseMechanicTrackingProps) => {
  const [mechanicPosition, setMechanicPosition] = useState<MechanicPosition | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [isArrived, setIsArrived] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapboxTokenRef = useRef<string | null>(null);

  // Generate a random starting position near the customer (1-5 km away)
  const generateStartingPosition = useCallback((): MechanicPosition => {
    const distanceKm = 1 + Math.random() * 4; // 1-5 km
    const angle = Math.random() * 2 * Math.PI; // Random direction

    // Approximate conversion: 1 degree latitude ≈ 111 km
    const latOffset = (distanceKm * Math.cos(angle)) / 111;
    const lngOffset = (distanceKm * Math.sin(angle)) / (111 * Math.cos(customerLat * (Math.PI / 180)));

    return {
      lat: customerLat + latOffset,
      lng: customerLng + lngOffset,
    };
  }, [customerLat, customerLng]);

  // Fetch route from Mapbox Directions API
  const fetchRoute = useCallback(async (startPos: MechanicPosition) => {
    try {
      // Get token from edge function if not cached
      if (!mapboxTokenRef.current) {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase.functions.invoke("get-mapbox-token");
        if (data?.token) {
          mapboxTokenRef.current = data.token;
        }
      }

      if (!mapboxTokenRef.current) return;

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${startPos.lng},${startPos.lat};${customerLng},${customerLat}?geometries=geojson&overview=full&access_token=${mapboxTokenRef.current}`
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => ({
            lng: coord[0],
            lat: coord[1],
          })
        );
        setRouteCoordinates(coordinates);
        setCurrentRouteIndex(0);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  }, [customerLat, customerLng]);

  // Initialize tracking
  useEffect(() => {
    if (isTracking && !mechanicPosition) {
      const startPos = generateStartingPosition();
      setMechanicPosition(startPos);
      setIsArrived(false);
      fetchRoute(startPos);
    }
  }, [isTracking, mechanicPosition, generateStartingPosition, fetchRoute]);

  // Animate mechanic movement along the route
  useEffect(() => {
    if (!isTracking || routeCoordinates.length === 0 || isArrived) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentRouteIndex((prevIndex) => {
        // Move through route coordinates based on speed
        // Skip more points for faster movement
        const step = Math.max(1, Math.floor(simulatedSpeed * 3));
        const newIndex = prevIndex + step;

        if (newIndex >= routeCoordinates.length - 1) {
          // Arrived at destination
          setIsArrived(true);
          setMechanicPosition({
            lat: customerLat,
            lng: customerLng,
          });
          return routeCoordinates.length - 1;
        }

        // Update position to current route coordinate
        const coord = routeCoordinates[newIndex];
        setMechanicPosition({
          lat: coord.lat,
          lng: coord.lng,
        });

        return newIndex;
      });
    }, 1000); // Update every second

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTracking, routeCoordinates, isArrived, simulatedSpeed, customerLat, customerLng]);

  // Reset when tracking stops
  useEffect(() => {
    if (!isTracking) {
      setMechanicPosition(null);
      setRouteCoordinates([]);
      setCurrentRouteIndex(0);
      setIsArrived(false);
    }
  }, [isTracking]);

  const progress = routeCoordinates.length > 0 
    ? Math.round((currentRouteIndex / (routeCoordinates.length - 1)) * 100)
    : 0;

  return {
    mechanicPosition,
    isArrived,
    progress,
    routeCoordinates,
  };
};

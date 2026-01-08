import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AssistanceRequest = Database["public"]["Tables"]["assistance_requests"]["Row"];
type ServiceType = Database["public"]["Enums"]["service_type"];

// Map form values to database enum values
const serviceTypeMap: Record<string, ServiceType> = {
  "flat-tire": "flat_tire",
  "battery": "battery_jump",
  "fuel": "fuel_delivery",
  "towing": "towing",
  "lockout": "lockout",
  "accident": "accident_recovery",
};

export interface CreateRequestData {
  serviceType: string;
  name: string;
  phone: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  description?: string;
}

export const useCreateAssistanceRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRequest = async (data: CreateRequestData): Promise<AssistanceRequest | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { data: result, error: insertError } = await supabase
        .from("assistance_requests")
        .insert({
          service_type: serviceTypeMap[data.serviceType] || "flat_tire",
          contact_name: data.name,
          contact_phone: data.phone,
          location_address: data.location,
          location_lat: data.locationLat || null,
          location_lng: data.locationLng || null,
          vehicle_make: data.vehicleMake,
          vehicle_model: data.vehicleModel,
          vehicle_year: data.vehicleYear,
          vehicle_color: data.vehicleColor || null,
          issue_description: data.description || null,
          user_id: session?.session?.user?.id || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating request:", insertError);
        setError(insertError.message);
        return null;
      }

      return result;
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createRequest, isLoading, error };
};

export const useRealtimeAssistanceRequests = () => {
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch initial requests
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("assistance_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching requests:", error);
      } else {
        setRequests(data || []);
      }
      setIsLoading(false);
    };

    fetchRequests();

    // Set up realtime subscription
    const channel = supabase
      .channel("assistance-requests-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assistance_requests",
        },
        (payload) => {
          console.log("Realtime update:", payload);
          
          if (payload.eventType === "INSERT") {
            setRequests((prev) => [payload.new as AssistanceRequest, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setRequests((prev) =>
              prev.map((req) =>
                req.id === (payload.new as AssistanceRequest).id
                  ? (payload.new as AssistanceRequest)
                  : req
              )
            );
          } else if (payload.eventType === "DELETE") {
            setRequests((prev) =>
              prev.filter((req) => req.id !== (payload.old as AssistanceRequest).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { requests, isLoading };
};

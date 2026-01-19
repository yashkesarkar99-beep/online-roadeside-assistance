import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LocationMap from "@/components/LocationMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useMechanicTracking } from "@/hooks/useMechanicTracking";
import {
  MapPin,
  Phone,
  Car,
  Clock,
  CheckCircle,
  Loader2,
  User,
  Wrench,
  Battery,
  Fuel,
  Truck,
  Key,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

type AssistanceRequest = Database["public"]["Tables"]["assistance_requests"]["Row"];
type RequestStatus = Database["public"]["Enums"]["request_status"];

const serviceTypeLabels: Record<string, { label: string; icon: typeof Wrench }> = {
  flat_tire: { label: "Flat Tire Change", icon: Wrench },
  battery_jump: { label: "Battery Jump Start", icon: Battery },
  fuel_delivery: { label: "Fuel Delivery", icon: Fuel },
  towing: { label: "Towing Service", icon: Truck },
  lockout: { label: "Lockout Assistance", icon: Key },
  accident_recovery: { label: "Accident Recovery", icon: AlertTriangle },
};

const statusConfig: Record<RequestStatus, { label: string; color: string; description: string }> = {
  pending: {
    label: "Pending",
    color: "bg-warning/10 text-warning border-warning/20",
    description: "Looking for a nearby mechanic...",
  },
  accepted: {
    label: "Accepted",
    color: "bg-accent/10 text-accent border-accent/20",
    description: "A mechanic has accepted your request and is on the way!",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-primary/10 text-primary border-primary/20",
    description: "The mechanic is working on your vehicle.",
  },
  completed: {
    label: "Completed",
    color: "bg-success/10 text-success border-success/20",
    description: "Service completed successfully!",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    description: "This request has been cancelled.",
  },
};

const TrackRequest = () => {
  const { requestId, token } = useParams<{ requestId: string; token?: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<AssistanceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate tracking values before the hook (hooks must be called unconditionally)
  const shouldTrackMechanic = request?.status === "accepted" || request?.status === "in_progress";
  const customerLat = Number(request?.location_lat) || 0;
  const customerLng = Number(request?.location_lng) || 0;
  const isTrackingEnabled = shouldTrackMechanic && !!request?.location_lat && !!request?.location_lng;

  // Hook must be called unconditionally (before any early returns)
  const { mechanicPosition, isArrived, progress } = useMechanicTracking({
    customerLat,
    customerLng,
    isTracking: isTrackingEnabled,
    simulatedSpeed: 0.8,
  });

  useEffect(() => {
    if (!requestId) {
      setError("No request ID provided");
      setIsLoading(false);
      return;
    }

    const fetchRequest = async () => {
      // If we have a tracking token, use the secure edge function
      if (token) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-request-by-token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({ requestId, trackingToken: token }),
            }
          );

          if (!response.ok) {
            console.error("Error fetching request via token");
            setError("Request not found or invalid tracking link");
            setIsLoading(false);
            return;
          }

          const result = await response.json();
          if (result.data) {
            setRequest(result.data);
          } else {
            setError("Request not found");
          }
        } catch (err) {
          console.error("Error fetching request:", err);
          setError("Request not found");
        }
        setIsLoading(false);
        return;
      }

      // For authenticated users, use direct Supabase query
      const { data, error: fetchError } = await supabase
        .from("assistance_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (fetchError) {
        console.error("Error fetching request:", fetchError);
        setError("Request not found");
      } else {
        setRequest(data);
      }
      setIsLoading(false);
    };

    fetchRequest();

    // Set up realtime subscription for this specific request (only for authenticated users)
    // Anonymous users with tokens won't receive realtime updates for security
    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "assistance_requests",
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          // Debug logging only in development to prevent info disclosure
          if (import.meta.env.DEV) {
            console.log("Request updated:", { id: (payload.new as AssistanceRequest)?.id, status: (payload.new as AssistanceRequest)?.status });
          }
          setRequest(payload.new as AssistanceRequest);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
              <p className="text-muted-foreground">Loading request details...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto border-2 border-destructive/50">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                  Request Not Found
                </h2>
                <p className="text-muted-foreground mb-6">
                  {error || "We couldn't find this assistance request."}
                </p>
                <Button variant="hero" onClick={() => navigate("/")}>
                  Return Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const serviceInfo = serviceTypeLabels[request.service_type] || {
    label: "Unknown Service",
    icon: Wrench,
  };
  const ServiceIcon = serviceInfo.icon;
  const statusInfo = statusConfig[request.status];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
                Track Your Request
              </h1>
              <p className="text-muted-foreground font-mono">
                Request ID: #{request.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Status Card */}
            <Card className="border-2 border-border mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-full ${statusInfo.color}`}>
                      {request.status === "pending" ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : request.status === "completed" ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : (
                        <RefreshCw className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <Badge className={`${statusInfo.color} border mb-2`}>
                        {statusInfo.label}
                      </Badge>
                      <p className="text-foreground font-medium">
                        {statusInfo.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium text-foreground">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card className="border-2 border-border mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {(["pending", "accepted", "in_progress", "completed"] as RequestStatus[]).map(
                    (step, index) => {
                      const isActive = request.status === step;
                      const isPast =
                        ["pending", "accepted", "in_progress", "completed"].indexOf(request.status) >=
                        index;
                      const stepConfig = statusConfig[step];

                      return (
                        <div key={step} className="flex items-start gap-4 pb-6 last:pb-0">
                          <div className="relative flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                isPast
                                  ? "bg-accent border-accent text-accent-foreground"
                                  : "bg-background border-border text-muted-foreground"
                              }`}
                            >
                              {isPast ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <span className="text-sm font-medium">{index + 1}</span>
                              )}
                            </div>
                            {index < 3 && (
                              <div
                                className={`w-0.5 h-full min-h-[40px] transition-colors ${
                                  isPast && request.status !== step
                                    ? "bg-accent"
                                    : "bg-border"
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <p
                              className={`font-medium ${
                                isActive ? "text-accent" : isPast ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {stepConfig.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {stepConfig.description}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Service Details */}
              <Card className="border-2 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ServiceIcon className="w-5 h-5 text-accent" />
                    Service Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Service Type</p>
                    <p className="font-medium text-foreground">{serviceInfo.label}</p>
                  </div>
                  {request.issue_description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="font-medium text-foreground">{request.issue_description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="border-2 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-foreground mb-3">{request.location_address}</p>
                  {request.location_lat && request.location_lng ? (
                    <>
                      <LocationMap
                        customerLat={Number(request.location_lat)}
                        customerLng={Number(request.location_lng)}
                        mechanicLat={mechanicPosition?.lat}
                        mechanicLng={mechanicPosition?.lng}
                        showMechanic={shouldTrackMechanic && !!mechanicPosition}
                      />
                      {shouldTrackMechanic && mechanicPosition && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {isArrived ? "Mechanic has arrived!" : "Mechanic en route..."}
                            </span>
                            <span className="font-medium text-accent">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl bg-secondary/50 h-48 flex items-center justify-center border border-border">
                      <div className="text-center text-muted-foreground">
                        <MapPin className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Location not available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Details */}
              <Card className="border-2 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-accent" />
                    Contact Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{request.contact_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`tel:${request.contact_phone}`}
                      className="text-accent hover:underline"
                    >
                      {request.contact_phone}
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Details */}
              <Card className="border-2 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-accent" />
                    Vehicle Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-foreground">
                    <span className="font-medium">{request.vehicle_year}</span>{" "}
                    {request.vehicle_make} {request.vehicle_model}
                  </p>
                  {request.vehicle_color && (
                    <p className="text-muted-foreground">Color: {request.vehicle_color}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button variant="hero" onClick={() => navigate("/request")}>
                Submit New Request
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Return Home
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackRequest;

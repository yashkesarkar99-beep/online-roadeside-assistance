import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Database } from "@/integrations/supabase/types";
import {
  Wrench,
  MapPin,
  Phone,
  Car,
  Clock,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Play,
  Battery,
  Fuel,
  Truck,
  Key,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";

type AssistanceRequest = Database["public"]["Tables"]["assistance_requests"]["Row"];
type RequestStatus = Database["public"]["Enums"]["request_status"];

// Type for pending request preview (masked data from view)
type PendingRequestPreview = {
  id: string;
  service_type: Database["public"]["Enums"]["service_type"];
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_color: string | null;
  contact_name_masked: string;
  contact_phone_masked: string;
  location_area: string;
  location_lat_approx: number | null;
  location_lng_approx: number | null;
  issue_description: string | null;
};

const serviceTypeLabels: Record<string, { label: string; icon: typeof Wrench }> = {
  flat_tire: { label: "Flat Tire", icon: Wrench },
  battery_jump: { label: "Battery Jump", icon: Battery },
  fuel_delivery: { label: "Fuel Delivery", icon: Fuel },
  towing: { label: "Towing", icon: Truck },
  lockout: { label: "Lockout", icon: Key },
  accident_recovery: { label: "Accident Recovery", icon: AlertTriangle },
};

const statusColors: Record<RequestStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-accent/10 text-accent border-accent/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const MechanicDashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isMechanic, isLoading: roleLoading } = useUserRole();
  const [pendingRequests, setPendingRequests] = useState<PendingRequestPreview[]>([]);
  const [myRequests, setMyRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || roleLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    if (!isMechanic) {
      navigate("/");
      toast.error("Access denied. Mechanic privileges required.");
      return;
    }
  }, [user, isMechanic, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (!isMechanic || !user) return;

    const fetchRequests = async () => {
      setIsLoading(true);

      // Fetch pending requests from edge function (returns masked data for privacy)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-pending-requests`,
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            setPendingRequests(data.requests || []);
          } else {
            console.error("Error fetching pending requests:", await response.text());
            setPendingRequests([]);
          }
        }
      } catch (error) {
        console.error("Error fetching pending requests:", error);
        setPendingRequests([]);
      }

      // Fetch my assigned requests
      const { data: assigned, error: assignedError } = await supabase
        .from("assistance_requests")
        .select("*")
        .eq("assigned_mechanic_id", user.id)
        .in("status", ["accepted", "in_progress"])
        .order("created_at", { ascending: false });

      if (assignedError) {
        console.error("Error fetching assigned requests:", assignedError);
      } else {
        setMyRequests(assigned || []);
      }

      setIsLoading(false);
    };

    fetchRequests();

    // Subscribe to changes
    const channel = supabase
      .channel("mechanic-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assistance_requests",
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMechanic, user]);

  const handleAcceptRequest = async (requestId: string) => {
    if (!user) return;

    setAcceptingId(requestId);
    const { error } = await supabase
      .from("assistance_requests")
      .update({
        status: "accepted",
        assigned_mechanic_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("status", "pending");

    if (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request. It may have been taken by another mechanic.");
    } else {
      toast.success("Request accepted! Navigate to the customer location.");
    }
    setAcceptingId(null);
  };

  const handleUpdateStatus = async (requestId: string, newStatus: RequestStatus) => {
    setUpdatingId(requestId);
    const { error } = await supabase
      .from("assistance_requests")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } else {
      toast.success(`Request marked as ${newStatus.replace("_", " ")}`);
    }
    setUpdatingId(null);
  };

  const openNavigation = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isMechanic) {
    return null;
  }

  // Card for assigned requests (shows full contact info)
  const AssignedRequestCard = ({ request }: { request: AssistanceRequest }) => {
    const serviceInfo = serviceTypeLabels[request.service_type] || { label: "Unknown", icon: Wrench };
    const ServiceIcon = serviceInfo.icon;

    return (
      <Card className="border-2 border-border hover:border-accent/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <ServiceIcon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">{serviceInfo.label}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(request.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <Badge className={`${statusColors[request.status]} border capitalize`}>
              {request.status.replace("_", " ")}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">{request.location_address}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a href={`tel:${request.contact_phone}`} className="text-sm text-accent hover:underline">
                {request.contact_phone}
              </a>
              <span className="text-sm text-muted-foreground">({request.contact_name})</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-foreground">
                {request.vehicle_year} {request.vehicle_make} {request.vehicle_model}
                {request.vehicle_color && ` (${request.vehicle_color})`}
              </p>
            </div>
            {request.issue_description && (
              <p className="text-sm text-muted-foreground italic">
                "{request.issue_description}"
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {request.location_lat && request.location_lng && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openNavigation(Number(request.location_lat), Number(request.location_lng))}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </Button>
            )}
            {request.status === "accepted" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleUpdateStatus(request.id, "in_progress")}
                disabled={updatingId === request.id}
              >
                {updatingId === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Start Work
              </Button>
            )}
            {request.status === "in_progress" && (
              <Button
                variant="hero"
                size="sm"
                onClick={() => handleUpdateStatus(request.id, "completed")}
                disabled={updatingId === request.id}
              >
                {updatingId === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Complete
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate(`/track/${request.id}`)}>
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Card for pending requests (shows masked contact info for privacy)
  const PendingRequestCard = ({ request }: { request: PendingRequestPreview }) => {
    const serviceInfo = serviceTypeLabels[request.service_type] || { label: "Unknown", icon: Wrench };
    const ServiceIcon = serviceInfo.icon;

    return (
      <Card className="border-2 border-border hover:border-accent/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <ServiceIcon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">{serviceInfo.label}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(request.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <Badge className={`${statusColors[request.status]} border capitalize`}>
              {request.status.replace("_", " ")}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">{request.location_area}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground italic">
                {request.contact_phone_masked}
              </span>
              <span className="text-sm text-muted-foreground">({request.contact_name_masked})</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-foreground">
                {request.vehicle_year} {request.vehicle_make} {request.vehicle_model}
                {request.vehicle_color && ` (${request.vehicle_color})`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="hero"
              size="sm"
              onClick={() => handleAcceptRequest(request.id)}
              disabled={acceptingId === request.id}
            >
              {acceptingId === request.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Accept Request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-accent/10">
              <Wrench className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Mechanic Dashboard
              </h1>
              <p className="text-muted-foreground">
                View and manage assistance requests
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* My Active Requests */}
              <div>
                <Card className="border-2 border-accent/50 mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-accent" />
                      My Active Requests ({myRequests.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myRequests.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6">
                        No active requests. Accept a pending request to get started.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {myRequests.map((request) => (
                          <AssignedRequestCard key={request.id} request={request} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Pending Requests */}
              <div>
                <Card className="border-2 border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      Pending Requests ({pendingRequests.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingRequests.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6">
                        No pending requests at the moment.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {pendingRequests.map((request) => (
                          <PendingRequestCard key={request.id} request={request} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MechanicDashboard;

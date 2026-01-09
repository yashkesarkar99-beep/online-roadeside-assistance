import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  ArrowLeft,
  Clock,
  MapPin,
  Car,
  Wrench,
  Battery,
  Fuel,
  Truck,
  Key,
  AlertTriangle,
  ChevronRight,
  FileText,
} from "lucide-react";

type AssistanceRequest = Database["public"]["Tables"]["assistance_requests"]["Row"];
type RequestStatus = Database["public"]["Enums"]["request_status"];

const serviceTypeLabels: Record<string, { label: string; icon: typeof Wrench }> = {
  flat_tire: { label: "Flat Tire", icon: Wrench },
  battery_jump: { label: "Battery Jump", icon: Battery },
  fuel_delivery: { label: "Fuel Delivery", icon: Fuel },
  towing: { label: "Towing", icon: Truck },
  lockout: { label: "Lockout", icon: Key },
  accident_recovery: { label: "Accident Recovery", icon: AlertTriangle },
};

const statusConfig: Record<RequestStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20" },
  accepted: { label: "Accepted", color: "bg-accent/10 text-accent border-accent/20" },
  in_progress: { label: "In Progress", color: "bg-primary/10 text-primary border-primary/20" },
  completed: { label: "Completed", color: "bg-success/10 text-success border-success/20" },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

const MyRequests = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("assistance_requests")
        .select("*")
        .eq("user_id", user.id)
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
      .channel("my-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assistance_requests",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
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
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-20 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your requests...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
                  My Requests
                </h1>
                <p className="text-muted-foreground mt-1">
                  View and track all your assistance requests
                </p>
              </div>
              <Button variant="hero" onClick={() => navigate("/request")}>
                New Request
              </Button>
            </div>

            {requests.length === 0 ? (
              <Card className="border-2 border-border">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="font-heading text-xl font-bold text-foreground mb-2">
                    No requests yet
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    You haven't submitted any assistance requests yet.
                  </p>
                  <Button variant="hero" onClick={() => navigate("/request")}>
                    Submit Your First Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const serviceInfo = serviceTypeLabels[request.service_type] || {
                    label: "Unknown",
                    icon: Wrench,
                  };
                  const ServiceIcon = serviceInfo.icon;
                  const statusInfo = statusConfig[request.status];

                  return (
                    <Card
                      key={request.id}
                      className="border-2 border-border hover:border-accent/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/track/${request.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-accent/10">
                              <ServiceIcon className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-heading font-semibold text-foreground">
                                  {serviceInfo.label}
                                </h3>
                                <Badge className={`${statusInfo.color} border`}>
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(request.created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Car className="w-3 h-3" />
                                  {request.vehicle_year} {request.vehicle_make} {request.vehicle_model}
                                </span>
                              </div>
                              <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                {request.location_address}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyRequests;

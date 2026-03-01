import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
  Users,
  Wrench,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";

type AssistanceRequest = Database["public"]["Tables"]["assistance_requests"]["Row"];

interface AdminOverviewProps {
  requests: AssistanceRequest[];
}

const AdminOverview = ({ requests }: AdminOverviewProps) => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalMechanics, setTotalMechanics] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const [profilesRes, mechanicsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "mechanic"),
      ]);
      setTotalUsers(profilesRes.count ?? 0);
      setTotalMechanics(mechanicsRes.count ?? 0);
    };
    fetchCounts();
  }, []);

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    active: requests.filter((r) => r.status === "accepted" || r.status === "in_progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
    cancelled: requests.filter((r) => r.status === "cancelled").length,
  };

  const todayRequests = requests.filter(
    (r) => new Date(r.created_at).toDateString() === new Date().toDateString()
  ).length;

  const statCards = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Mechanics", value: totalMechanics, icon: Wrench, color: "text-accent-foreground" },
    { label: "Total Requests", value: stats.total, icon: ClipboardList, color: "text-primary" },
    { label: "Today's Requests", value: todayRequests, icon: TrendingUp, color: "text-success" },
    { label: "Pending", value: stats.pending, icon: AlertTriangle, color: "text-warning" },
    { label: "Active", value: stats.active, icon: Activity, color: "text-primary" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-success" },
    { label: "Cancelled", value: stats.cancelled, icon: Clock, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Dashboard Overview</h2>
        <p className="text-muted-foreground text-sm">Real-time statistics and system health</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-2 border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold font-heading text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="border-2 border-border">
        <CardContent className="p-5">
          <h3 className="font-heading font-semibold text-lg mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {requests.slice(0, 5).map((req) => (
              <div key={req.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    req.status === "pending" ? "bg-warning" :
                    req.status === "completed" ? "bg-success" :
                    req.status === "cancelled" ? "bg-destructive" : "bg-primary"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{req.contact_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {req.service_type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground capitalize">{req.status.replace("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No requests yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;

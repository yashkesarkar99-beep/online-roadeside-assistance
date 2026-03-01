import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Database } from "@/integrations/supabase/types";
import {
  Shield,
  LayoutDashboard,
  ClipboardList,
  Wrench,
  BarChart3,
  UserCog,
  Loader2,
  Menu,
} from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import RequestManagement from "@/components/admin/RequestManagement";
import MechanicManagement from "@/components/admin/MechanicManagement";
import ReportsAnalytics from "@/components/admin/ReportsAnalytics";
import RoleManagement from "@/components/admin/RoleManagement";

type AssistanceRequest = Database["public"]["Tables"]["assistance_requests"]["Row"];

type Tab = "overview" | "requests" | "mechanics" | "reports" | "roles";

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "requests", label: "Requests", icon: ClipboardList },
  { id: "mechanics", label: "Mechanics", icon: Wrench },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "roles", label: "Roles", icon: UserCog },
];

const AdminDashboard = () => {
  const { isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("assistance_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setRequests(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchRequests();

    const channel = supabase
      .channel("admin-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "assistance_requests" }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16 md:pt-20 flex min-h-[calc(100vh-4rem)]">
        {/* Mobile sidebar toggle */}
        <button
          className="md:hidden fixed bottom-4 left-4 z-40 p-3 bg-primary text-primary-foreground border-2 border-border shadow-md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-16 md:top-20 left-0 z-30 h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]
            w-64 bg-card border-r-2 border-border flex flex-col p-4 transition-transform
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <div className="flex items-center gap-2 mb-6 px-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold text-foreground">Admin Panel</span>
          </div>

          <nav className="flex-1 space-y-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  activeTab === tab.id ? "" : "text-muted-foreground"
                }`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-background/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {activeTab === "overview" && <AdminOverview requests={requests} />}
              {activeTab === "requests" && <RequestManagement requests={requests} onRefresh={fetchRequests} />}
              {activeTab === "mechanics" && <MechanicManagement requests={requests} />}
              {activeTab === "reports" && <ReportsAnalytics requests={requests} />}
              {activeTab === "roles" && <RoleManagement />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

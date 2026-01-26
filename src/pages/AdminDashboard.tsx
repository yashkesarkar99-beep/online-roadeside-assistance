import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Database } from "@/integrations/supabase/types";
import {
  Shield,
  Users,
  Wrench,
  ClipboardList,
  Loader2,
  AlertTriangle,
  Search,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

type AssistanceRequest = Database["public"]["Tables"]["assistance_requests"]["Row"];
type RequestStatus = Database["public"]["Enums"]["request_status"];

const statusColors: Record<RequestStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-accent/10 text-accent border-accent/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  // Role assignment state
  const [newRoleEmail, setNewRoleEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "mechanic">("mechanic");
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchRequests = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("assistance_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching requests:", error);
        toast.error("Failed to load requests");
      } else {
        setRequests(data || []);
        calculateStats(data || []);
      }
      setIsLoading(false);
    };

    fetchRequests();

    // Subscribe to changes
    const channel = supabase
      .channel("admin-requests")
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
  }, [isAdmin]);

  const calculateStats = (data: AssistanceRequest[]) => {
    setStats({
      total: data.length,
      pending: data.filter((r) => r.status === "pending").length,
      inProgress: data.filter((r) => r.status === "in_progress" || r.status === "accepted").length,
      completed: data.filter((r) => r.status === "completed").length,
    });
  };

  const handleAssignRole = async () => {
    if (!newRoleEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newRoleEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsAssigningRole(true);
    try {
      const { data, error } = await supabase.functions.invoke("assign-user-role", {
        body: { email: newRoleEmail.trim(), role: newRole }
      });

      if (error) {
        // Handle specific error messages from the edge function
        const errorMessage = error.message || "Failed to assign role";
        toast.error(errorMessage);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`Successfully assigned ${newRole} role to ${newRoleEmail}`);
      setNewRoleEmail("");
      setNewRole("mechanic");
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to assign role. Please try again.");
    } finally {
      setIsAssigningRole(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.contact_phone.includes(searchTerm) ||
      request.location_address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Route access is enforced at the router level via <RequireRole />.

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-accent/10">
              <Shield className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage requests, users, and system settings
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-2 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-8 h-8 text-accent" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-warning" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Wrench className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Role Assignment Card */}
          <Card className="border-2 border-border mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-accent" />
                Assign User Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="User email address"
                  value={newRoleEmail}
                  onChange={(e) => setNewRoleEmail(e.target.value)}
                  className="flex-1"
                />
                <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "mechanic")}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAssignRole} disabled={isAssigningRole}>
                  {isAssigningRole ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Assign Role
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card className="border-2 border-border">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-accent" />
                  All Assistance Requests
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-full sm:w-[200px]"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No requests found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-mono text-sm">
                            {request.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.contact_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {request.contact_phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {request.service_type.replace("_", " ")}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {request.location_address}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[request.status]} border capitalize`}>
                              {request.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/track/${request.id}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

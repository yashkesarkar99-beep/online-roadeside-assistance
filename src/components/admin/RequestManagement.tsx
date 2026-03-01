import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
  Search,
  ClipboardList,
  MapPin,
  Phone,
  Car,
  Clock,
  User,
  FileText,
  UserPlus,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type AssistanceRequest = Database["public"]["Tables"]["assistance_requests"]["Row"];
type RequestStatus = Database["public"]["Enums"]["request_status"];

interface RequestManagementProps {
  requests: AssistanceRequest[];
  onRefresh: () => void;
}

const statusColors: Record<RequestStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-accent/10 text-accent-foreground border-border",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

interface Mechanic {
  user_id: string;
  full_name: string | null;
  phone: string | null;
}

const RequestManagement = ({ requests, onRefresh }: RequestManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<AssistanceRequest | null>(null);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [assigningMechanic, setAssigningMechanic] = useState(false);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>("");

  useEffect(() => {
    const fetchMechanics = async () => {
      const { data: mechanicRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "mechanic");

      if (mechanicRoles && mechanicRoles.length > 0) {
        const userIds = mechanicRoles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone")
          .in("user_id", userIds);
        setMechanics(profiles || []);
      }
    };
    fetchMechanics();
  }, []);

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.contact_phone.includes(searchTerm) ||
      request.location_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAssignMechanic = async () => {
    if (!selectedRequest || !selectedMechanicId) return;
    setAssigningMechanic(true);
    try {
      // Use service role via edge function or direct update for admin
      const { error } = await supabase
        .from("assistance_requests")
        .update({
          assigned_mechanic_id: selectedMechanicId,
          status: "accepted" as RequestStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      if (error) {
        toast.error("Failed to assign mechanic: " + error.message);
      } else {
        toast.success("Mechanic assigned successfully");
        setSelectedRequest(null);
        setSelectedMechanicId("");
        onRefresh();
      }
    } catch (err) {
      toast.error("Failed to assign mechanic");
    }
    setAssigningMechanic(false);
  };

  const handleCancelRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("assistance_requests")
      .update({ status: "cancelled" as RequestStatus, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      toast.error("Failed to cancel request");
    } else {
      toast.success("Request cancelled");
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Request Management</h2>
        <p className="text-muted-foreground text-sm">View, manage and assign all service requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, location, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
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

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredRequests.length} of {requests.length} requests
      </p>

      {/* Table */}
      <Card className="border-2 border-border">
        <CardContent className="p-0">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No requests found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRequest(request)}>
                      <TableCell className="font-mono text-xs">{request.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{request.contact_name}</p>
                          <p className="text-xs text-muted-foreground">{request.contact_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-sm">
                        {request.service_type.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {request.vehicle_year} {request.vehicle_make} {request.vehicle_model}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">
                        {request.location_address}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[request.status]} border capitalize text-xs`}>
                          {request.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                            View
                          </Button>
                          {request.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelRequest(request.id)}
                            >
                              <XCircle className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">ID: {selectedRequest.id.slice(0, 12)}</span>
                <Badge className={`${statusColors[selectedRequest.status]} border capitalize`}>
                  {selectedRequest.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{selectedRequest.contact_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${selectedRequest.contact_phone}`} className="text-sm text-primary hover:underline">
                    {selectedRequest.contact_phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    {selectedRequest.vehicle_year} {selectedRequest.vehicle_make} {selectedRequest.vehicle_model}
                    {selectedRequest.vehicle_color && ` (${selectedRequest.vehicle_color})`}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">{selectedRequest.location_address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{new Date(selectedRequest.created_at).toLocaleString()}</span>
                </div>
                {selectedRequest.issue_description && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm italic">{selectedRequest.issue_description}</span>
                  </div>
                )}
              </div>

              {/* Map link */}
              {selectedRequest.location_lat && selectedRequest.location_lng && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${selectedRequest.location_lat},${selectedRequest.location_lng}`,
                      "_blank"
                    )
                  }
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View on Map
                </Button>
              )}

              {/* Assign Mechanic */}
              {(selectedRequest.status === "pending" || selectedRequest.status === "accepted") && (
                <Card className="border-2 border-border">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Assign Mechanic
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="flex gap-2">
                      <Select value={selectedMechanicId} onValueChange={setSelectedMechanicId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a mechanic" />
                        </SelectTrigger>
                        <SelectContent>
                          {mechanics.map((m) => (
                            <SelectItem key={m.user_id} value={m.user_id}>
                              {m.full_name || "Unknown"} {m.phone ? `(${m.phone})` : ""}
                            </SelectItem>
                          ))}
                          {mechanics.length === 0 && (
                            <SelectItem value="none" disabled>
                              No mechanics available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleAssignMechanic}
                        disabled={!selectedMechanicId || assigningMechanic}
                        size="sm"
                      >
                        {assigningMechanic ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedRequest.assigned_mechanic_id && (
                <p className="text-xs text-muted-foreground">
                  Assigned Mechanic ID: {selectedRequest.assigned_mechanic_id.slice(0, 12)}...
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestManagement;

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
  Wrench,
  UserPlus,
  Loader2,
  Search,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

type AssistanceRequest = Database["public"]["Tables"]["assistance_requests"]["Row"];

interface MechanicProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface MechanicManagementProps {
  requests: AssistanceRequest[];
}

const MechanicManagement = ({ requests }: MechanicManagementProps) => {
  const [mechanics, setMechanics] = useState<MechanicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Add mechanic state
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchMechanics = async () => {
    setIsLoading(true);
    const { data: mechanicRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "mechanic");

    if (mechanicRoles && mechanicRoles.length > 0) {
      const userIds = mechanicRoles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, created_at")
        .in("user_id", userIds);
      setMechanics(profiles || []);
    } else {
      setMechanics([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMechanics();
  }, []);

  const handleAddMechanic = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke("assign-user-role", {
        body: { email: newEmail.trim(), role: "mechanic" },
      });

      if (error) {
        toast.error(error.message || "Failed to add mechanic");
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(`Mechanic role assigned to ${newEmail}`);
        setNewEmail("");
        fetchMechanics();
      }
    } catch {
      toast.error("Failed to add mechanic");
    }
    setIsAdding(false);
  };

  const handleRemoveMechanic = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "mechanic");

    if (error) {
      toast.error("Failed to remove mechanic role");
    } else {
      toast.success("Mechanic role removed");
      fetchMechanics();
    }
  };

  const getMechanicWorkload = (mechanicUserId: string) => {
    const active = requests.filter(
      (r) => r.assigned_mechanic_id === mechanicUserId && (r.status === "accepted" || r.status === "in_progress")
    ).length;
    const completed = requests.filter(
      (r) => r.assigned_mechanic_id === mechanicUserId && r.status === "completed"
    ).length;
    return { active, completed };
  };

  const filteredMechanics = mechanics.filter(
    (m) =>
      (m.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.phone || "").includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Mechanic Management</h2>
        <p className="text-muted-foreground text-sm">Add, view, and manage mechanics</p>
      </div>

      {/* Add Mechanic */}
      <Card className="border-2 border-border">
        <CardHeader className="py-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add New Mechanic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="User email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddMechanic} disabled={isAdding}>
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Add Mechanic
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search mechanics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Mechanics Table */}
      <Card className="border-2 border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMechanics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No mechanics found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Active Jobs</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMechanics.map((mechanic) => {
                    const workload = getMechanicWorkload(mechanic.user_id);
                    return (
                      <TableRow key={mechanic.user_id}>
                        <TableCell className="font-medium">
                          {mechanic.full_name || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {mechanic.phone || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={workload.active > 0 ? "default" : "secondary"} className="text-xs">
                            <ClipboardList className="w-3 h-3 mr-1" />
                            {workload.active}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{workload.completed}</TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              workload.active > 0
                                ? "bg-success/10 text-success border border-success/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {workload.active > 0 ? "Busy" : "Available"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(mechanic.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMechanic(mechanic.user_id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MechanicManagement;

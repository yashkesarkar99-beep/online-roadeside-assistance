import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

const RoleManagement = () => {
  const [newRoleEmail, setNewRoleEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "mechanic">("mechanic");
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  const handleAssignRole = async () => {
    if (!newRoleEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newRoleEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsAssigningRole(true);
    try {
      const { data, error } = await supabase.functions.invoke("assign-user-role", {
        body: { email: newRoleEmail.trim(), role: newRole },
      });

      if (error) {
        toast.error(error.message || "Failed to assign role");
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`Successfully assigned ${newRole} role to ${newRoleEmail}`);
      setNewRoleEmail("");
      setNewRole("mechanic");
    } catch {
      toast.error("Failed to assign role. Please try again.");
    } finally {
      setIsAssigningRole(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Role Management</h2>
        <p className="text-muted-foreground text-sm">Assign admin or mechanic roles to users</p>
      </div>

      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" />
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
    </div>
  );
};

export default RoleManagement;

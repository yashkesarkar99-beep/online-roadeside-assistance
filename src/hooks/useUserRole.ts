import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "mechanic" | "user";

interface UserRoleState {
  roles: AppRole[];
  isAdmin: boolean;
  isMechanic: boolean;
  isLoading: boolean;
}

export const useUserRole = (): UserRoleState => {
  const { user, isLoading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRoles([]);
      setIsLoading(false);
      return;
    }

    const fetchRoles = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching roles:", error);
          setRoles([]);
        } else {
          setRoles((data || []).map((r) => r.role as AppRole));
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();

    // Subscribe to role changes
    const channel = supabase
      .channel(`user-roles-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchRoles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading]);

  return {
    roles,
    isAdmin: roles.includes("admin"),
    isMechanic: roles.includes("mechanic"),
    isLoading: authLoading || isLoading,
  };
};

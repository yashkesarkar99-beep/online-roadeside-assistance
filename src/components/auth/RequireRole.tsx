import { ReactNode, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/hooks/useUserRole";

type Props = {
  allowedRoles: AppRole[];
  children: ReactNode;
  unauthenticatedRedirectTo?: string;
  unauthorizedRedirectTo?: string;
  unauthorizedMessage?: string;
};

const FullPageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-accent" />
  </div>
);

export default function RequireRole({
  allowedRoles,
  children,
  unauthenticatedRedirectTo = "/auth",
  unauthorizedRedirectTo = "/",
  unauthorizedMessage = "Access denied.",
}: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const toastShownRef = useRef(false);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["user_roles", user?.id],
    enabled: !!user && !authLoading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);

      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  const isAllowed = !!roles?.some((r) => allowedRoles.includes(r));

  useEffect(() => {
    if (authLoading || rolesLoading) return;
    if (!user) return;
    if (isAllowed) return;

    if (!toastShownRef.current) {
      toast.error(unauthorizedMessage);
      toastShownRef.current = true;
    }
  }, [authLoading, rolesLoading, user, isAllowed, unauthorizedMessage]);

  if (authLoading || rolesLoading) return <FullPageLoader />;

  if (!user) {
    return <Navigate to={unauthenticatedRedirectTo} replace />;
  }

  if (!isAllowed) {
    return <Navigate to={unauthorizedRedirectTo} replace />;
  }

  return <>{children}</>;
}

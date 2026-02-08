import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SmsNotification = {
  id: string;
  notification_type: string;
  status: string;
  created_at: string;
  recipient_phone: string;
  error_message: string | null;
};

interface NotificationHistoryProps {
  requestId: string;
}

const NotificationHistory = ({ requestId }: NotificationHistoryProps) => {
  const [notifications, setNotifications] = useState<SmsNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("sms_notifications")
        .select("id, notification_type, status, created_at, recipient_phone, error_message")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
      } else {
        setNotifications(data || []);
      }
      setIsLoading(false);
    };

    fetchNotifications();
  }, [requestId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs py-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Loading notifications...</span>
      </div>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  const typeLabels: Record<string, string> = {
    dispatched: "Dispatched",
    arrived: "Arrived",
  };

  const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone;
    return "***" + phone.slice(-4);
  };

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-1.5 mb-2">
        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          SMS Notifications ({notifications.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <div className="flex items-center gap-1.5">
              {notif.status === "sent" ? (
                <CheckCircle className="w-3 h-3 text-success shrink-0" />
              ) : (
                <XCircle className="w-3 h-3 text-destructive shrink-0" />
              )}
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 capitalize"
              >
                {typeLabels[notif.notification_type] || notif.notification_type}
              </Badge>
              <span className="text-muted-foreground">
                to {maskPhone(notif.recipient_phone)}
              </span>
            </div>
            <span className="text-muted-foreground whitespace-nowrap">
              {new Date(notif.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationHistory;

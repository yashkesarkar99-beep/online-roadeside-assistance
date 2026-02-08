import { supabase } from "@/integrations/supabase/client";

type SmsType = "dispatched" | "arrived";

export const sendSmsNotification = async (
  to: string,
  type: SmsType,
  mechanicName?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("send-sms", {
      body: { to, type, mechanicName },
    });

    if (error) {
      console.error("SMS notification error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to send SMS notification:", err);
    return { success: false, error: "Failed to send notification" };
  }
};

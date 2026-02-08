import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = claimsData.claims.sub;

  // Verify caller is a mechanic
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("is_mechanic")
    .eq("user_id", userId)
    .single();

  if (!profile?.is_mechanic) {
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "mechanic")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden - mechanic role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Parse request body
  let body: { to: string; type: "dispatched" | "arrived"; mechanicName?: string; requestId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { to, type, mechanicName, requestId } = body;

  if (!to || !type) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: to, type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!["dispatched", "arrived"].includes(type)) {
    return new Response(
      JSON.stringify({ error: "Invalid type. Must be 'dispatched' or 'arrived'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate phone format (basic check)
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  if (!phoneRegex.test(to.replace(/[\s\-()]/g, ""))) {
    return new Response(
      JSON.stringify({ error: "Invalid phone number format" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get Twilio credentials
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !twilioPhone) {
    console.error("Missing Twilio configuration");
    return new Response(
      JSON.stringify({ error: "SMS service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Build SMS message
  const name = mechanicName || "A mechanic";
  const message =
    type === "dispatched"
      ? `🚗 ${name} has been dispatched to your location! They are on their way. You'll receive another notification when they arrive. - Online Roadside Assistance`
      : `✅ ${name} has arrived at your location! Please look out for them. - Online Roadside Assistance`;

  // Send SMS via Twilio API
  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("To", to);
    formData.append("From", twilioPhone);
    formData.append("Body", message);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
      body: formData.toString(),
    });

    const result = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio API error:", JSON.stringify(result));

      // Log failed SMS
      if (requestId) {
        await serviceClient.from("sms_notifications").insert({
          request_id: requestId,
          mechanic_id: userId,
          recipient_phone: to,
          notification_type: type,
          status: "failed",
          error_message: result.message || "Unknown Twilio error",
        });
      }

      return new Response(
        JSON.stringify({ error: "Failed to send SMS", details: result.message }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SMS sent successfully:", result.sid);

    // Log successful SMS
    if (requestId) {
      await serviceClient.from("sms_notifications").insert({
        request_id: requestId,
        mechanic_id: userId,
        recipient_phone: to,
        notification_type: type,
        message_sid: result.sid,
        status: "sent",
      });
    }

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error sending SMS:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Download, FileText } from "lucide-react";
import { toast } from "sonner";

type AssistanceRequest = Database["public"]["Tables"]["assistance_requests"]["Row"];

interface ReportsAnalyticsProps {
  requests: AssistanceRequest[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--chart-1))",
];

const ReportsAnalytics = ({ requests }: ReportsAnalyticsProps) => {
  // Service type breakdown
  const serviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => {
      const label = r.service_type.replace("_", " ");
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [requests]);

  // Status breakdown
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => {
      const label = r.status.replace("_", " ");
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [requests]);

  // Daily requests over last 30 days
  const dailyData = useMemo(() => {
    const last30 = new Map<string, number>();
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      last30.set(d.toISOString().slice(0, 10), 0);
    }
    requests.forEach((r) => {
      const day = r.created_at.slice(0, 10);
      if (last30.has(day)) {
        last30.set(day, (last30.get(day) || 0) + 1);
      }
    });
    return Array.from(last30.entries()).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
      requests: count,
    }));
  }, [requests]);

  // Monthly completion rate
  const monthlyData = useMemo(() => {
    const months: Record<string, { total: number; completed: number }> = {};
    requests.forEach((r) => {
      const month = new Date(r.created_at).toLocaleDateString("en", { year: "numeric", month: "short" });
      if (!months[month]) months[month] = { total: 0, completed: 0 };
      months[month].total++;
      if (r.status === "completed") months[month].completed++;
    });
    return Object.entries(months)
      .slice(-6)
      .map(([month, data]) => ({
        month,
        total: data.total,
        completed: data.completed,
        rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }));
  }, [requests]);

  const completionRate =
    requests.length > 0
      ? Math.round((requests.filter((r) => r.status === "completed").length / requests.length) * 100)
      : 0;

  const avgResponseTime = useMemo(() => {
    const accepted = requests.filter((r) => r.status !== "pending" && r.status !== "cancelled");
    if (accepted.length === 0) return "N/A";
    const totalMs = accepted.reduce((sum, r) => {
      return sum + (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime());
    }, 0);
    const avgMinutes = Math.round(totalMs / accepted.length / 60000);
    return avgMinutes < 60 ? `${avgMinutes}m` : `${Math.round(avgMinutes / 60)}h ${avgMinutes % 60}m`;
  }, [requests]);

  const downloadFile = useCallback((content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportCSV = useCallback(() => {
    const headers = [
      "ID", "Contact Name", "Contact Phone", "Vehicle", "Service Type",
      "Status", "Location", "Created At", "Updated At",
    ];
    const rows = requests.map((r) => [
      r.id,
      r.contact_name,
      r.contact_phone,
      `${r.vehicle_year} ${r.vehicle_make} ${r.vehicle_model}`,
      r.service_type.replace("_", " "),
      r.status.replace("_", " "),
      r.location_address,
      new Date(r.created_at).toLocaleString(),
      new Date(r.updated_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadFile(csv, `roadside-report-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    toast.success("CSV report downloaded");
  }, [requests, downloadFile]);

  const exportPDF = useCallback(() => {
    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Roadside Assistance Report</title>
<style>
body{font-family:system-ui,sans-serif;padding:40px;color:#1a1a1a}
h1{font-size:22px;margin-bottom:4px}
p.sub{color:#666;margin-bottom:24px;font-size:13px}
.cards{display:flex;gap:16px;margin-bottom:28px}
.card{border:1px solid #ddd;border-radius:8px;padding:16px;min-width:140px}
.card .val{font-size:28px;font-weight:700}
.card .lbl{font-size:12px;color:#666}
table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}
th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f5f5f5;font-weight:600}
h2{font-size:16px;margin-top:28px}
</style></head><body>
<h1>Roadside Assistance Report</h1>
<p class="sub">Generated on ${new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</p>
<div class="cards">
<div class="card"><div class="val">${requests.length}</div><div class="lbl">Total Services</div></div>
<div class="card"><div class="val">${completionRate}%</div><div class="lbl">Completion Rate</div></div>
<div class="card"><div class="val">${avgResponseTime}</div><div class="lbl">Avg Response</div></div>
</div>
<h2>Service Type Breakdown</h2>
<table><tr><th>Service Type</th><th>Count</th></tr>
${serviceData.map((s) => `<tr><td>${s.name}</td><td>${s.value}</td></tr>`).join("")}
</table>
<h2>Status Distribution</h2>
<table><tr><th>Status</th><th>Count</th></tr>
${statusData.map((s) => `<tr><td>${s.name}</td><td>${s.value}</td></tr>`).join("")}
</table>
<h2>Monthly Performance</h2>
<table><tr><th>Month</th><th>Total</th><th>Completed</th><th>Rate</th></tr>
${monthlyData.map((m) => `<tr><td>${m.month}</td><td>${m.total}</td><td>${m.completed}</td><td>${m.rate}%</td></tr>`).join("")}
</table>
<h2>All Requests</h2>
<table><tr><th>Name</th><th>Phone</th><th>Vehicle</th><th>Service</th><th>Status</th><th>Date</th></tr>
${requests.map((r) => `<tr><td>${r.contact_name}</td><td>${r.contact_phone}</td><td>${r.vehicle_year} ${r.vehicle_make} ${r.vehicle_model}</td><td>${r.service_type.replace("_", " ")}</td><td>${r.status.replace("_", " ")}</td><td>${new Date(r.created_at).toLocaleDateString()}</td></tr>`).join("")}
</table>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => { w.print(); }, 500);
      toast.success("PDF print dialog opened");
    } else {
      toast.error("Please allow popups to generate PDF");
    }
  }, [requests, completionRate, avgResponseTime, serviceData, statusData, monthlyData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Reports & Analytics</h2>
          <p className="text-muted-foreground text-sm">Service statistics and performance tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <p className="text-3xl font-bold font-heading text-foreground">{completionRate}%</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
            <p className="text-3xl font-bold font-heading text-foreground">{avgResponseTime}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-border">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Services</p>
            <p className="text-3xl font-bold font-heading text-foreground">{requests.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Requests Line Chart */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Daily Requests (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "2px solid hsl(var(--border))",
                    borderRadius: "0",
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="requests" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Type Breakdown */}
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              Service Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {serviceData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "2px solid hsl(var(--border))",
                      borderRadius: "0",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "2px solid hsl(var(--border))",
                      borderRadius: "0",
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="hsl(var(--primary))" name="Total" />
                  <Bar dataKey="completed" fill="hsl(var(--success))" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "2px solid hsl(var(--border))",
                    borderRadius: "0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsAnalytics;

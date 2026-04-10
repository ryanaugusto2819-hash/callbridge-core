import { useState, useEffect } from "react";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

type CallLog = {
  id: string;
  created_at: string;
  direction: string;
  status: string;
  duration: number | null;
  phone_number: string;
};

const PIE_COLORS: Record<string, string> = {
  completed: "hsl(142, 71%, 45%)",
  "no-answer": "hsl(38, 92%, 50%)",
  failed: "hsl(0, 72%, 51%)",
  canceled: "hsl(0, 72%, 51%)",
  "in-progress": "hsl(217, 91%, 60%)",
  initiated: "hsl(217, 91%, 60%)",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Atendida",
  "no-answer": "Sem resposta",
  failed: "Falhou",
  canceled: "Cancelada",
  "in-progress": "Em andamento",
  initiated: "Iniciada",
};

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [todayCalls, setTodayCalls] = useState<CallLog[]>([]);
  const [weekCalls, setWeekCalls] = useState<CallLog[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [todayRes, weekRes] = await Promise.all([
      supabase.from("call_logs").select("*").gte("created_at", today.toISOString()),
      supabase.from("call_logs").select("*").gte("created_at", sevenDaysAgo.toISOString()),
    ]);

    setTodayCalls((todayRes.data as CallLog[]) || []);
    setWeekCalls((weekRes.data as CallLog[]) || []);
    setLoading(false);
  };

  // --- Métricas de hoje ---
  const totalToday = todayCalls.length;
  const answered = todayCalls.filter((c) => c.status === "completed").length;
  const missed = todayCalls.filter((c) => ["no-answer", "failed", "canceled"].includes(c.status)).length;
  const durations = todayCalls.filter((c) => c.duration != null).map((c) => c.duration!);
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const serviceLevel = totalToday > 0 ? Math.round((answered / totalToday) * 100) : 0;

  const formatDuration = (secs: number) =>
    `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}`;

  // --- Chamadas por hora (hoje, 8h–17h) ---
  const hourlyData = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 8;
    return {
      hour: `${hour}h`,
      calls: todayCalls.filter((c) => new Date(c.created_at).getHours() === hour).length,
    };
  });

  // --- Volume dos últimos 7 dias ---
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayCalls = weekCalls.filter((c) => {
      const d = new Date(c.created_at);
      return d >= date && d < nextDate;
    });

    return {
      day: DAY_NAMES[date.getDay()],
      entrada: dayCalls.filter((c) => c.direction === "inbound").length,
      saída: dayCalls.filter((c) => c.direction === "outbound").length,
    };
  });

  // --- Distribuição por status (hoje) ---
  const statusCounts = todayCalls.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([status, value]) => ({
    name: STATUS_LABEL[status] || status,
    value,
    color: PIE_COLORS[status] || "hsl(217, 91%, 60%)",
  }));

  // --- Últimas chamadas do dia ---
  const recentCalls = [...todayCalls]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-status-available/20 text-status-available";
    if (["failed", "no-answer", "canceled"].includes(status)) return "bg-destructive/20 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  const metrics = [
    { label: "Total Hoje", value: String(totalToday), icon: PhoneIncoming },
    { label: "Atendidas", value: String(answered), icon: PhoneOutgoing },
    { label: "Perdidas", value: String(missed), icon: PhoneMissed },
    { label: "Tempo Médio", value: avgDuration > 0 ? formatDuration(avgDuration) : "—", icon: Clock },
    { label: "Nível de Serviço", value: `${serviceLevel}%`, icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel</h1>
        <p className="text-sm text-muted-foreground">Visão geral em tempo real das operações do call center</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <m.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chamadas por Hora (Hoje)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Chamadas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 text-xs justify-center mt-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-16">Nenhuma chamada hoje</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volume Semanal + Últimas chamadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Line type="monotone" dataKey="entrada" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Entrada" />
                <Line type="monotone" dataKey="saída" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} name="Saída" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-xs mt-2 justify-center">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Entrada
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "hsl(142, 71%, 45%)" }} /> Saída
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Últimas Chamadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma chamada hoje</p>
            ) : (
              recentCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium font-mono">{call.phone_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(call.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}
                      {call.direction === "inbound" ? "Entrada" : "Saída"}
                    </p>
                  </div>
                  <Badge className={`text-xs ${statusColor(call.status)}`}>
                    {STATUS_LABEL[call.status] || call.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

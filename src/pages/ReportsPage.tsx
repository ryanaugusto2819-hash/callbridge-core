import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CallLog = {
  id: string;
  created_at: string;
  direction: string;
  status: string;
  duration: number | null;
  phone_number: string;
  notes: string | null;
};

const STATUS_COLORS: Record<string, string> = {
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

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [calls, setCalls] = useState<CallLog[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("call_logs")
      .select("*")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    setCalls((data as CallLog[]) || []);
    setLoading(false);
  };

  // --- Volume diário (30 dias) ---
  const dailyVolume = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    return {
      day: date.getDate(),
      calls: calls.filter((c) => {
        const d = new Date(c.created_at);
        return d >= date && d < nextDate;
      }).length,
    };
  });

  // --- Entrada vs Saída ---
  const inbound = calls.filter((c) => c.direction === "inbound").length;
  const outbound = calls.filter((c) => c.direction === "outbound").length;
  const directionData = [
    { name: "Entrada", value: inbound, color: "hsl(217, 91%, 60%)" },
    { name: "Saída", value: outbound, color: "hsl(142, 71%, 45%)" },
  ].filter((d) => d.value > 0);

  // --- Chamadas por status ---
  const statusCounts = calls.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([status, total]) => ({
    status: STATUS_LABEL[status] || status,
    total,
    color: STATUS_COLORS[status] || "hsl(217, 91%, 60%)",
  }));

  // --- Totais resumo ---
  const totalCalls = calls.length;
  const completedCalls = calls.filter((c) => c.status === "completed").length;
  const durations = calls.filter((c) => c.duration != null).map((c) => c.duration!);
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const formatAvg = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // --- Exportar CSV completo ---
  const exportCSV = async () => {
    const { data } = await supabase
      .from("call_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) return;

    const headers = ["ID", "Telefone", "Direção", "Status", "Duração (s)", "Data/Hora", "Notas"];
    const rows = data.map((c) => [
      c.id,
      c.phone_number,
      c.direction === "inbound" ? "Entrada" : "Saída",
      STATUS_LABEL[c.status] || c.status,
      c.duration ?? "",
      new Date(c.created_at).toLocaleString("pt-BR"),
      c.notes ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chamadas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios e Análises</h1>
          <p className="text-sm text-muted-foreground">Últimos 30 dias — dados reais do banco de dados</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCSV} disabled={calls.length === 0}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total de Chamadas", value: String(totalCalls) },
          { label: "Atendidas", value: String(completedCalls) },
          { label: "Entrada", value: String(inbound) },
          { label: "Tempo Médio", value: avgDuration > 0 ? formatAvg(avgDuration) : "—" },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume de Chamadas (30 Dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  formatter={(v) => [v, "Chamadas"]}
                  labelFormatter={(l) => `Dia ${l}`}
                />
                <Line type="monotone" dataKey="calls" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Chamadas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entrada vs Saída</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {directionData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={directionData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                      {directionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 text-xs mt-2">
                  {directionData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-16">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Chamadas por Status</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  formatter={(v) => [v, "Chamadas"]}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Chamadas">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">
              Nenhuma chamada nos últimos 30 dias
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const hourlyData = [
  { hour: "8h", calls: 12 }, { hour: "9h", calls: 28 }, { hour: "10h", calls: 35 },
  { hour: "11h", calls: 42 }, { hour: "12h", calls: 25 }, { hour: "13h", calls: 30 },
  { hour: "14h", calls: 38 }, { hour: "15h", calls: 45 }, { hour: "16h", calls: 33 },
  { hour: "17h", calls: 20 },
];

const weeklyData = [
  { day: "Seg", inbound: 120, outbound: 80 }, { day: "Ter", inbound: 145, outbound: 95 },
  { day: "Qua", inbound: 130, outbound: 110 }, { day: "Qui", inbound: 160, outbound: 85 },
  { day: "Sex", inbound: 140, outbound: 100 }, { day: "Sáb", inbound: 60, outbound: 30 },
  { day: "Dom", inbound: 40, outbound: 20 },
];

const callTypeData = [
  { name: "Atendidas", value: 340, color: "hsl(142, 71%, 45%)" },
  { name: "Perdidas", value: 45, color: "hsl(0, 72%, 51%)" },
  { name: "Caixa Postal", value: 28, color: "hsl(38, 92%, 50%)" },
];

const agentActivity = [
  { name: "Sarah Chen", status: "on-call", calls: 24, avgDuration: "3:42" },
  { name: "Mike Johnson", status: "available", calls: 18, avgDuration: "4:15" },
  { name: "Emily Davis", status: "wrap-up", calls: 22, avgDuration: "3:58" },
  { name: "James Wilson", status: "break", calls: 15, avgDuration: "5:01" },
  { name: "Lisa Park", status: "available", calls: 20, avgDuration: "3:30" },
];

const statusColors: Record<string, string> = {
  available: "status-available",
  "on-call": "status-on-call",
  "wrap-up": "status-wrap-up",
  break: "status-break",
  offline: "status-offline",
};

const metrics = [
  { label: "Total de Chamadas Hoje", value: "413", icon: PhoneIncoming, change: "+12%", positive: true },
  { label: "Atendidas", value: "340", icon: PhoneOutgoing, change: "+8%", positive: true },
  { label: "Chamadas Perdidas", value: "45", icon: PhoneMissed, change: "-15%", positive: true },
  { label: "Tempo Médio", value: "4:12", icon: Clock, change: "-3%", positive: true },
  { label: "Agentes Online", value: "12", icon: Users, change: "", positive: true },
  { label: "Nível de Serviço", value: "92%", icon: TrendingUp, change: "+2%", positive: true },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel</h1>
        <p className="text-sm text-muted-foreground">Visão geral em tempo real das operações do call center</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <m.icon className="h-4 w-4 text-muted-foreground" />
                {m.change && (
                  <span className={`text-xs font-medium ${m.positive ? "text-status-available" : "text-status-on-call"}`}>
                    {m.change}
                  </span>
                )}
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
            <CardTitle className="text-sm font-medium">Chamadas por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição de Chamadas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={callTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                  {callTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-xs">
              {callTypeData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volume Semanal + Atividade dos Agentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Line type="monotone" dataKey="inbound" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="outbound" stroke="hsl(var(--status-available))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atividade dos Agentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agentActivity.map((agent) => (
              <div key={agent.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${statusColors[agent.status]}`} />
                  <span className="text-sm font-medium">{agent.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{agent.calls} chamadas</span>
                  <Badge variant="secondary" className="text-xs">{agent.avgDuration}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

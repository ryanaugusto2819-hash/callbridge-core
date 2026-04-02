import { Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useState } from "react";

const agents = [
  { id: "1", name: "Sarah Chen", email: "sarah@company.com", role: "agente", status: "available", extension: "101", skills: ["Vendas", "Suporte"], callsToday: 24 },
  { id: "2", name: "Mike Johnson", email: "mike@company.com", role: "agente", status: "on-call", extension: "102", skills: ["Suporte"], callsToday: 18 },
  { id: "3", name: "Emily Davis", email: "emily@company.com", role: "supervisor", status: "available", extension: "103", skills: ["Vendas", "Financeiro"], callsToday: 22 },
  { id: "4", name: "James Wilson", email: "james@company.com", role: "agente", status: "break", extension: "104", skills: ["Financeiro"], callsToday: 15 },
  { id: "5", name: "Lisa Park", email: "lisa@company.com", role: "admin", status: "available", extension: "105", skills: ["Vendas", "Suporte", "Financeiro"], callsToday: 20 },
];

const statusColors: Record<string, string> = {
  available: "status-available",
  "on-call": "status-on-call",
  break: "status-break",
  offline: "status-offline",
};

export default function AgentsPage() {
  const [search, setSearch] = useState("");
  const filtered = agents.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agentes</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua equipe e atribuições de agentes</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Agente
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar agentes..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Ramal</TableHead>
                <TableHead>Habilidades</TableHead>
                <TableHead>Chamadas Hoje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <span className={`h-2.5 w-2.5 rounded-full inline-block ${statusColors[a.status] || "status-offline"}`} />
                  </TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">{a.role}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{a.extension}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {a.skills.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{a.callsToday}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

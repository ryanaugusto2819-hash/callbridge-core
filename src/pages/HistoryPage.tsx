import { useState } from "react";
import { Search, Download, Play, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const callLogs = [
  { id: "1", agent: "Sarah Chen", contact: "John Smith", phone: "+1 (555) 123-4567", direction: "entrada", status: "atendida", duration: "5:23", date: "15/01/2024 10:30", hasRecording: true },
  { id: "2", agent: "Mike Johnson", contact: "Jane Doe", phone: "+1 (555) 987-6543", direction: "saída", status: "atendida", duration: "3:11", date: "15/01/2024 10:15", hasRecording: true },
  { id: "3", agent: "Emily Davis", contact: "Desconhecido", phone: "+1 (555) 456-7890", direction: "entrada", status: "perdida", duration: "0:00", date: "15/01/2024 09:45", hasRecording: false },
  { id: "4", agent: "James Wilson", contact: "Robert Wilson", phone: "+1 (555) 321-0987", direction: "saída", status: "caixa postal", duration: "0:32", date: "15/01/2024 09:30", hasRecording: true },
  { id: "5", agent: "Lisa Park", contact: "Maria Garcia", phone: "+1 (555) 654-3210", direction: "entrada", status: "atendida", duration: "8:45", date: "15/01/2024 09:00", hasRecording: true },
];

const directionIcon: Record<string, React.ReactNode> = {
  entrada: <PhoneIncoming className="h-3.5 w-3.5 text-status-available" />,
  saída: <PhoneOutgoing className="h-3.5 w-3.5 text-primary" />,
};

const statusBadge: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  atendida: { label: "Atendida", variant: "default" },
  perdida: { label: "Perdida", variant: "destructive" },
  "caixa postal": { label: "Caixa Postal", variant: "secondary" },
};

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState("todos");

  const filtered = callLogs.filter((log) => {
    const matchesSearch = log.contact.toLowerCase().includes(search.toLowerCase()) || log.phone.includes(search);
    const matchesDirection = directionFilter === "todos" || log.direction === directionFilter;
    return matchesSearch && matchesDirection;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Chamadas</h1>
          <p className="text-sm text-muted-foreground">Revise chamadas anteriores e gravações</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar chamadas..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saída">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Direção</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => {
                const sBadge = statusBadge[log.status] || statusBadge.atendida;
                return (
                  <TableRow key={log.id}>
                    <TableCell>{directionIcon[log.direction]}</TableCell>
                    <TableCell className="text-sm">{log.agent}</TableCell>
                    <TableCell className="font-medium">{log.contact}</TableCell>
                    <TableCell className="font-mono text-sm">{log.phone}</TableCell>
                    <TableCell>
                      <Badge variant={sBadge.variant}>{sBadge.label}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.duration}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.date}</TableCell>
                    <TableCell>
                      {log.hasRecording && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Reproduzir gravação">
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

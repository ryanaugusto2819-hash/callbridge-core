import { useState, useEffect, useRef } from "react";
import { Search, Download, Play, Pause, PhoneIncoming, PhoneOutgoing, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CallLog = {
  id: string;
  phone_number: string;
  direction: string;
  status: string;
  duration: number | null;
  recording_url: string | null;
  twilio_call_sid: string | null;
  created_at: string;
  notes: string | null;
};

const statusBadge: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  completed: { label: "Atendida", variant: "default" },
  "no-answer": { label: "Sem Resposta", variant: "destructive" },
  busy: { label: "Ocupado", variant: "secondary" },
  failed: { label: "Falhou", variant: "destructive" },
  canceled: { label: "Cancelada", variant: "secondary" },
  initiated: { label: "Iniciada", variant: "outline" },
  ringing: { label: "Tocando", variant: "outline" },
  "in-progress": { label: "Em Andamento", variant: "outline" },
};

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState("todos");
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadCallLogs();
  }, []);

  const loadCallLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("call_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast.error("Erro ao carregar histórico");
      console.error(error);
    } else {
      setCallLogs(data || []);
    }
    setLoading(false);
  };

  const filtered = callLogs.filter((log) => {
    const matchesSearch = log.phone_number.includes(search);
    const matchesDirection =
      directionFilter === "todos" ||
      (directionFilter === "saída" && log.direction === "outbound") ||
      (directionFilter === "entrada" && log.direction === "inbound");
    return matchesSearch && matchesDirection;
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handlePlayRecording = (log: CallLog) => {
    if (playingId === log.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (!log.recording_url) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(log.recording_url);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      toast.error("Erro ao reproduzir gravação");
      setPlayingId(null);
    };
    audio.play();
    audioRef.current = audio;
    setPlayingId(log.id);
  };

  const handleExportCsv = () => {
    const headers = ["Telefone", "Direção", "Status", "Duração", "Data", "Gravação"];
    const rows = filtered.map((log) => [
      log.phone_number,
      log.direction === "outbound" ? "Saída" : "Entrada",
      statusBadge[log.status]?.label || log.status,
      formatDuration(log.duration),
      new Date(log.created_at).toLocaleString("pt-BR"),
      log.recording_url || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chamadas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Chamadas</h1>
          <p className="text-sm text-muted-foreground">Revise chamadas anteriores e gravações</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportCsv}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por telefone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">Nenhuma chamada encontrada</p>
              <p className="text-sm">Use o discador para iniciar chamadas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direção</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[80px]">Gravação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => {
                  const sBadge = statusBadge[log.status] || { label: log.status, variant: "outline" as const };
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.direction === "inbound" ? (
                          <PhoneIncoming className="h-3.5 w-3.5 text-status-available" />
                        ) : (
                          <PhoneOutgoing className="h-3.5 w-3.5 text-primary" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.phone_number}</TableCell>
                      <TableCell>
                        <Badge variant={sBadge.variant}>{sBadge.label}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{formatDuration(log.duration)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {log.recording_url ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePlayRecording(log)}
                            aria-label={playingId === log.id ? "Pausar gravação" : "Reproduzir gravação"}
                          >
                            {playingId === log.id ? (
                              <Pause className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Search, Download, Play, Pause, PhoneIncoming, PhoneOutgoing, Loader2, User, Calendar } from "lucide-react";
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
  contact_name: string | null;
  agent_name: string | null;
  direction: string;
  status: string;
  duration: number | null;
  recording_url: string | null;
  twilio_call_sid: string | null;
  created_at: string;
  notes: string | null;
};

const statusBadge: Record<string, { label: string; className: string }> = {
  completed:    { label: "Atendida",      className: "badge-success" },
  "no-answer":  { label: "Sem Resposta",  className: "badge-warning" },
  busy:         { label: "Ocupado",       className: "badge-warning" },
  failed:       { label: "Falhou",        className: "badge-danger" },
  canceled:     { label: "Cancelada",     className: "badge-neutral" },
  initiated:    { label: "Iniciada",      className: "badge-info" },
  ringing:      { label: "Tocando",       className: "badge-info" },
  "in-progress":{ label: "Em Andamento",  className: "badge-purple" },
};

export default function HistoryPage() {
  const [search, setSearch]               = useState("");
  const [directionFilter, setDirection]   = useState("todos");
  const [statusFilter, setStatus]         = useState("todos");
  const [callLogs, setCallLogs]           = useState<CallLog[]>([]);
  const [loading, setLoading]             = useState(true);
  const [playingId, setPlayingId]         = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { loadCallLogs(); }, []);

  const loadCallLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("call_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Erro ao carregar histórico");
    else setCallLogs(data || []);
    setLoading(false);
  };

  const filtered = callLogs.filter((log) => {
    const term = search.toLowerCase();
    const matchSearch =
      log.phone_number.includes(search) ||
      (log.contact_name || "").toLowerCase().includes(term) ||
      (log.agent_name || "").toLowerCase().includes(term);
    const matchDir =
      directionFilter === "todos" ||
      (directionFilter === "saída" && log.direction === "outbound") ||
      (directionFilter === "entrada" && log.direction === "inbound");
    const matchStatus = statusFilter === "todos" || log.status === statusFilter;
    return matchSearch && matchDir && matchStatus;
  });

  const formatDuration = (s: number | null) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handlePlay = (log: CallLog) => {
    if (!log.recording_url) return;
    if (playingId === log.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(log.recording_url);
    audio.ontimeupdate = () => {
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      setAudioProgress((p) => ({ ...p, [log.id]: pct }));
    };
    audio.onended = () => { setPlayingId(null); setAudioProgress((p) => ({ ...p, [log.id]: 0 })); };
    audio.onerror = () => { toast.error("Erro ao reproduzir gravação"); setPlayingId(null); };
    audio.play();
    audioRef.current = audio;
    setPlayingId(log.id);
  };

  const handleExportCsv = () => {
    const headers = ["Contato","Telefone","Agente","Direção","Status","Duração","Data","Gravação"];
    const rows = filtered.map((l) => [
      l.contact_name || "—",
      l.phone_number,
      l.agent_name || "—",
      l.direction === "outbound" ? "Saída" : "Entrada",
      statusBadge[l.status]?.label || l.status,
      formatDuration(l.duration),
      new Date(l.created_at).toLocaleString("pt-BR"),
      l.recording_url || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `chamadas_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Chamadas</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Carregando..." : `${filtered.length} chamada${filtered.length !== 1 ? "s" : ""} encontrada${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportCsv}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por contato, telefone ou agente..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={directionFilter} onValueChange={setDirection}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Direção</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saída">Saída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="completed">Atendida</SelectItem>
                <SelectItem value="no-answer">Sem Resposta</SelectItem>
                <SelectItem value="busy">Ocupado</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <PhoneIncoming className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhuma chamada encontrada</p>
              <p className="text-sm">Use o discador para iniciar chamadas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead>Data / Horário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead className="text-center">Gravação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => {
                  const sb = statusBadge[log.status] || { label: log.status, className: "badge-neutral" };
                  const isPlaying = playingId === log.id;
                  const progress = audioProgress[log.id] || 0;
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.direction === "inbound"
                          ? <PhoneIncoming className="h-4 w-4 text-status-available" />
                          : <PhoneOutgoing className="h-4 w-4 text-primary" />}
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {log.contact_name || <span className="text-muted-foreground">Desconhecido</span>}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">{log.phone_number}</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{log.agent_name || <span className="text-muted-foreground">—</span>}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{new Date(log.created_at).toLocaleDateString("pt-BR")}</p>
                            <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sb.className}`}>
                          {sb.label}
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-sm">{formatDuration(log.duration)}</TableCell>

                      <TableCell>
                        {log.recording_url && log.status === "completed" ? (
                          <div className="flex items-center gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => handlePlay(log)}
                              aria-label={isPlaying ? "Pausar" : "Reproduzir gravação"}
                            >
                              {isPlaying
                                ? <Pause className="h-3.5 w-3.5 text-primary" />
                                : <Play className="h-3.5 w-3.5" />}
                            </Button>
                            {isPlaying && (
                              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground block text-center">—</span>
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

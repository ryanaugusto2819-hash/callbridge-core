import { useState, useCallback, useEffect } from "react";
import { Phone, Delete, Search, Mic, MicOff, Pause, Play, PhoneOff, Grid3X3, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const dialPad = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

export default function DialerPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isInCall, setIsInCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showDtmf, setShowDtmf] = useState(false);
  const [callNotes, setCallNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);

  // Timer para duração da chamada
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  // Carregar chamadas recentes
  useEffect(() => {
    loadRecentCalls();
  }, []);

  const loadRecentCalls = async () => {
    const { data } = await supabase
      .from("call_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setRecentCalls(data);
  };

  const handleDigit = useCallback((digit: string) => {
    if (isInCall) {
      console.log("DTMF:", digit);
    } else {
      setPhoneNumber((prev) => prev + digit);
    }
  }, [isInCall]);

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error("Digite um número de telefone válido");
      return;
    }

    setIsCalling(true);

    try {
      const { data, error } = await supabase.functions.invoke("twilio-make-call", {
        body: { phone: phoneNumber },
      });

      if (error) {
        console.error("Edge function error:", error);
        toast.error(`Erro ao iniciar chamada: ${error.message}`);
        setIsCalling(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setIsCalling(false);
        return;
      }

      setCurrentCallSid(data.call_sid);
      setIsInCall(true);
      setCallDuration(0);
      toast.success("📞 Chamada iniciada com sucesso!");
      loadRecentCalls();
    } catch (err: any) {
      console.error("Call error:", err);
      toast.error(`Erro: ${err.message}`);
    } finally {
      setIsCalling(false);
    }
  };

  const handleHangup = () => {
    setIsInCall(false);
    setIsMuted(false);
    setIsOnHold(false);
    setCurrentCallSid(null);
    setCallDuration(0);
    setCallNotes("");
    toast.info("Chamada encerrada");
    loadRecentCalls();
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      initiated: "Iniciada",
      ringing: "Tocando",
      "in-progress": "Em andamento",
      completed: "Completada",
      failed: "Falhou",
      busy: "Ocupado",
      "no-answer": "Sem resposta",
      canceled: "Cancelada",
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-status-available/20 text-status-available";
    if (status === "failed" || status === "busy" || status === "no-answer") return "bg-destructive/20 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discador</h1>
        <p className="text-sm text-muted-foreground">Fazer e receber chamadas via Twilio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teclado */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+55 11 99999-0000"
                  className="text-2xl font-mono text-center bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground"
                />
                {phoneNumber && (
                  <Button variant="ghost" size="icon" onClick={handleBackspace} aria-label="Apagar">
                    <Delete className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {dialPad.map(({ digit, letters }) => (
                <button
                  key={digit}
                  onClick={() => handleDigit(digit)}
                  className="keypad-btn flex flex-col items-center justify-center h-14 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  aria-label={`Discar ${digit}`}
                >
                  <span className="text-lg font-semibold text-foreground">{digit}</span>
                  {letters && <span className="text-[10px] text-muted-foreground tracking-widest">{letters}</span>}
                </button>
              ))}
            </div>

            {!isInCall ? (
              <Button
                onClick={handleCall}
                disabled={!phoneNumber || isCalling}
                className="w-full h-12 text-base gap-2 bg-status-available hover:bg-status-available/90 text-primary-foreground"
                aria-label="Iniciar chamada"
              >
                {isCalling ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Chamando...
                  </>
                ) : (
                  <>
                    <Phone className="h-5 w-5" />
                    Ligar
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleHangup}
                className="w-full h-12 text-base gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                aria-label="Encerrar chamada"
              >
                <PhoneOff className="h-5 w-5" />
                Encerrar
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Painel de chamada ativa + Histórico */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {isInCall ? (
                <>
                  <span className="h-2 w-2 rounded-full status-on-call animate-pulse" />
                  Chamada Ativa
                </>
              ) : (
                "Painel de Chamada"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isInCall ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{phoneNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentCallSid ? `SID: ${currentCallSid.slice(0, 20)}...` : "Contato Desconhecido"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono">{formatDuration(callDuration)}</p>
                    <Badge variant="secondary" className="mt-1">Saída</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant={isMuted ? "destructive" : "secondary"}
                    size="lg"
                    onClick={() => setIsMuted(!isMuted)}
                    className="gap-2"
                    aria-label={isMuted ? "Desmutar" : "Mutar"}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isMuted ? "Desmutar" : "Mutar"}
                  </Button>

                  <Button
                    variant={isOnHold ? "default" : "secondary"}
                    size="lg"
                    onClick={() => setIsOnHold(!isOnHold)}
                    className="gap-2"
                    aria-label={isOnHold ? "Retomar" : "Espera"}
                  >
                    {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {isOnHold ? "Retomar" : "Espera"}
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setShowDtmf(!showDtmf)}
                    className="gap-2"
                    aria-label="Teclado DTMF"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Teclado
                  </Button>
                </div>

                {showDtmf && (
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {dialPad.map(({ digit }) => (
                      <button
                        key={`dtmf-${digit}`}
                        onClick={() => handleDigit(digit)}
                        className="keypad-btn h-10 rounded-md bg-secondary hover:bg-secondary/80 text-foreground font-semibold"
                      >
                        {digit}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Notas da Chamada</label>
                  <Textarea
                    placeholder="Adicionar notas sobre esta chamada..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCalls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Phone className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nenhuma chamada recente</p>
                    <p className="text-sm">Use o discador para iniciar uma chamada</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground">Chamadas Recentes</h3>
                    <div className="space-y-2">
                      {recentCalls.map((call) => (
                        <div
                          key={call.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer"
                          onClick={() => setPhoneNumber(call.phone_number)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Phone className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{call.phone_number}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(call.created_at).toLocaleString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${statusColor(call.status)}`}>
                              {statusLabel(call.status)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhoneNumber(call.phone_number);
                                handleCall();
                              }}
                              aria-label="Ligar novamente"
                            >
                              <Phone className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

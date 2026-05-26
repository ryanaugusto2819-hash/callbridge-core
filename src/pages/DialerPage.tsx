import { useState, useCallback, useEffect, useRef } from "react";
import { Phone, Delete, Search, Mic, MicOff, Pause, Play, PhoneOff, Grid3X3, User, Loader2, PhoneIncoming, Volume2, FileText, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Device, Call } from "@twilio/voice-sdk";
import { ScrollArea } from "@/components/ui/scroll-area";

type ResponseOption = { objection: string; response: string };

type Script = {
  id: string;
  title: string;
  category: string;
  content: string;
  response_options: ResponseOption[];
  is_active: boolean;
};

type AudioClip = {
  id: string;
  title: string;
  audio_url: string;
  shortcut_key: string | null;
};

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
  const [deviceReady, setDeviceReady] = useState(false);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);

  const [scripts, setScripts] = useState<Script[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [scriptTab, setScriptTab] = useState("todos");

  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const callLogIdRef = useRef<string | null>(null);
  const callDurationRef = useRef(0);
  const callNotesRef = useRef("");

  useEffect(() => {
    if (isInCall) { loadScripts(); loadAudioClips(); }
  }, [isInCall]);

  // Atalhos de teclado para tocar áudios durante a chamada
  useEffect(() => {
    if (!isInCall) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const clip = audioClips.find((c) => c.shortcut_key && c.shortcut_key.toLowerCase() === e.key.toLowerCase());
      if (clip) {
        e.preventDefault();
        playAudioClip(clip);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInCall, audioClips, currentCallSid]);

  // Timer de duração da chamada
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => {
          const next = prev + 1;
          callDurationRef.current = next;
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  // Inicializar Twilio Device ao montar
  useEffect(() => {
    initDevice();
    return () => {
      deviceRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    loadRecentCalls();
  }, []);

  const initDevice = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("twilio-access-token", {
        body: { identity: "agent" },
      });

      if (error || !data?.token) {
        console.warn("Twilio Device não disponível:", error?.message || "Token ausente");
        setDeviceReady(false);
        return;
      }

      const device = new Device(data.token, { logLevel: "warn" });

      device.on("registering", () => {
        setDeviceReady(false);
      });

      device.on("registered", () => {
        setDeviceReady(true);
        toast.success("Dispositivo de voz pronto");
      });

      device.on("unregistered", () => {
        setDeviceReady(false);
      });

      device.on("error", (err: Error) => {
        setDeviceReady(false);
        toast.error(`Erro Twilio: ${err.message}`);
      });

      device.on("incoming", (call: Call) => {
        setIncomingCall(call);
        toast.info(`Chamada recebida de ${call.parameters.From || "número desconhecido"}`, {
          duration: 30000,
        });
      });

      deviceRef.current = device;
      await device.register();
    } catch (err: any) {
      setDeviceReady(false);
      console.warn("Twilio Device não inicializado:", err.message);
    }
  };

  const setupCallListeners = (call: Call, phone: string, direction: "outbound" | "inbound" = "outbound") => {
    call.on("accept", () => {
      setIsInCall(true);
      setIsCalling(false);
      callDurationRef.current = 0;
      const sid = call.parameters.CallSid || null;
      setCurrentCallSid(sid);
      supabase.from("call_logs").insert({
        phone_number: phone,
        direction,
        status: "in-progress",
        twilio_call_sid: sid,
      }).select("id").single().then(({ data }) => {
        if (data) callLogIdRef.current = data.id;
      });
    });

    call.on("disconnect", () => {
      if (callLogIdRef.current) {
        supabase.from("call_logs").update({
          status: "completed",
          duration: callDurationRef.current,
          notes: callNotesRef.current || null,
        }).eq("id", callLogIdRef.current);
        callLogIdRef.current = null;
      }
      callDurationRef.current = 0;
      callNotesRef.current = "";
      setIsInCall(false);
      setIsMuted(false);
      setIsOnHold(false);
      setCurrentCallSid(null);
      setCallDuration(0);
      setCallNotes("");
      callRef.current = null;
      setIncomingCall(null);
      loadRecentCalls();
    });

    call.on("error", (err: Error) => {
      toast.error(`Erro na chamada: ${err.message}`);
      setIsCalling(false);
    });
  };

  const loadScripts = async () => {
    setLoadingScripts(true);
    const { data } = await supabase
      .from("scripts")
      .select("*")
      .eq("is_active", true)
      .order("category");
    if (data) setScripts(data as unknown as Script[]);
    setLoadingScripts(false);
  };

  const loadAudioClips = async () => {
    const { data } = await supabase
      .from("audio_clips")
      .select("id, title, audio_url, shortcut_key")
      .eq("is_active", true)
      .order("display_order")
      .order("created_at");
    if (data) setAudioClips(data as AudioClip[]);
  };

  const playAudioClip = async (clip: AudioClip) => {
    if (!currentCallSid) {
      toast.error("Nenhuma chamada ativa para reproduzir o áudio");
      return;
    }
    setPlayingClipId(clip.id);
    try {
      const { error } = await supabase.functions.invoke("twilio-play-audio", {
        body: { callSid: currentCallSid, audioUrl: clip.audio_url },
      });
      if (error) throw error;
      toast.success(`▶ Tocando: ${clip.title}`);
    } catch (e) {
      toast.error(`Erro ao tocar áudio: ${(e as Error).message}`);
    } finally {
      setTimeout(() => setPlayingClipId(null), 1500);
    }
  };

  const playScript = (script: Script) => {
    setActiveScript((prev) => (prev?.id === script.id ? null : script));
    // TODO: quando backend estiver pronto, chamar endpoint que injeta o áudio na chamada via Twilio
    toast.info(`Roteiro selecionado: ${script.title}`, { duration: 2000 });
  };

  const playResponseOption = (opt: ResponseOption) => {
    // TODO: conectar ao backend para tocar o áudio da resposta
    toast.info(`Resposta: ${opt.objection}`, { duration: 2000 });
  };

  const loadRecentCalls = async () => {
    const { data } = await supabase
      .from("call_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setRecentCalls(data);
  };

  const handleDigit = useCallback((digit: string) => {
    if (isInCall && callRef.current) {
      callRef.current.sendDigits(digit);
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

    if (!deviceRef.current || !deviceReady) {
      toast.error("Dispositivo de voz não pronto. Verifique as configurações do Twilio.");
      return;
    }

    setIsCalling(true);

    try {
      const call = await deviceRef.current.connect({
        params: { To: phoneNumber },
      });

      callRef.current = call;
      setupCallListeners(call, phoneNumber, "outbound");
      toast.success("📞 Chamando...");
      loadRecentCalls();
    } catch (err: any) {
      toast.error(`Erro ao ligar: ${err.message}`);
      setIsCalling(false);
    }
  };

  const handleAcceptIncoming = () => {
    if (!incomingCall) return;
    const fromNumber = incomingCall.parameters.From || "Desconhecido";
    incomingCall.accept();
    callRef.current = incomingCall;
    setPhoneNumber(fromNumber);
    setIsInCall(true);
    setIncomingCall(null);
    setupCallListeners(incomingCall, fromNumber, "inbound");
    // Para chamadas inbound o evento "accept" já disparou antes dos listeners,
    // então inserimos o log diretamente aqui.
    callDurationRef.current = 0;
    supabase.from("call_logs").insert({
      phone_number: fromNumber,
      direction: "inbound",
      status: "in-progress",
      twilio_call_sid: incomingCall.parameters.CallSid || null,
    }).select("id").single().then(({ data }) => {
      if (data) callLogIdRef.current = data.id;
    });
    toast.success("Chamada aceita");
  };

  const handleRejectIncoming = () => {
    incomingCall?.reject();
    setIncomingCall(null);
    toast.info("Chamada rejeitada");
  };

  const handleHangup = () => {
    callRef.current?.disconnect();
    deviceRef.current?.disconnectAll();
    setIsInCall(false);
    setIsMuted(false);
    setIsOnHold(false);
    setCurrentCallSid(null);
    setCallDuration(0);
    setCallNotes("");
    callRef.current = null;
    toast.info("Chamada encerrada");
    loadRecentCalls();
  };

  const handleMute = () => {
    if (callRef.current) {
      const newMuted = !isMuted;
      callRef.current.mute(newMuted);
      setIsMuted(newMuted);
    }
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

  const scriptCategories = [...new Set(scripts.map((s) => s.category))];
  const filteredScripts =
    scriptTab === "todos" ? scripts : scripts.filter((s) => s.category === scriptTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discador</h1>
        <p className="text-sm text-muted-foreground">
          Fazer e receber chamadas via Twilio
          {deviceReady && <span className="ml-2 text-green-500">● Dispositivo pronto</span>}
          {!deviceReady && <span className="ml-2 text-yellow-500">● Dispositivo não conectado</span>}
        </p>
      </div>

      {/* Chamada entrante */}
      {incomingCall && (
        <Card className="border-2 border-green-500 animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PhoneIncoming className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-semibold">Chamada Entrante</p>
                  <p className="text-sm text-muted-foreground">{incomingCall.parameters.From || "Número desconhecido"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAcceptIncoming} className="bg-green-500 hover:bg-green-600 gap-2">
                  <Phone className="h-4 w-4" /> Atender
                </Button>
                <Button onClick={handleRejectIncoming} variant="destructive" className="gap-2">
                  <PhoneOff className="h-4 w-4" /> Rejeitar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                disabled={!phoneNumber || isCalling || !deviceReady}
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
                    onClick={handleMute}
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

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {/* Notas */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Notas da Chamada</label>
                    <Textarea
                      placeholder="Adicionar notas sobre esta chamada..."
                      value={callNotes}
                      onChange={(e) => { setCallNotes(e.target.value); callNotesRef.current = e.target.value; }}
                      rows={5}
                    />
                  </div>

                  {/* Painel de Roteiros */}
                  <div className="border rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Roteiros</span>
                      {loadingScripts && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
                    </div>

                    {/* Filtro por categoria */}
                    <div className="flex gap-1 flex-wrap">
                      {["todos", ...scriptCategories].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setScriptTab(cat)}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            scriptTab === cat
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:bg-secondary"
                          }`}
                        >
                          {cat === "todos" ? "Todos" : cat}
                        </button>
                      ))}
                    </div>

                    {/* Lista de roteiros */}
                    <ScrollArea className="h-44">
                      <div className="space-y-1.5 pr-2">
                        {filteredScripts.length === 0 && !loadingScripts && (
                          <p className="text-xs text-muted-foreground text-center py-6">
                            {scripts.length === 0 ? "Nenhum roteiro cadastrado" : "Nenhum roteiro nesta categoria"}
                          </p>
                        )}
                        {filteredScripts.map((script) => (
                          <div key={script.id} className="rounded-md border bg-secondary/30">
                            <button
                              className="w-full flex items-center gap-2 p-2 text-left hover:bg-secondary/60 rounded-md transition-colors"
                              onClick={() => playScript(script)}
                            >
                              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium flex-1 truncate">{script.title}</span>
                              <span className="text-xs text-muted-foreground shrink-0 border rounded px-1.5 py-0.5 bg-background">
                                {script.category}
                              </span>
                              <Volume2 className="h-3.5 w-3.5 text-primary shrink-0" />
                            </button>

                            {activeScript?.id === script.id && (
                              <div className="px-3 pb-3 space-y-2 border-t mt-0.5 pt-2">
                                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                                  {script.content}
                                </p>
                                {script.response_options.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">Objeções:</p>
                                    {script.response_options.map((opt, i) => (
                                      <button
                                        key={i}
                                        className="w-full text-left text-xs rounded p-2 bg-background hover:bg-primary/10 transition-colors border"
                                        onClick={() => playResponseOption(opt)}
                                      >
                                        <span className="font-medium text-primary block">"{opt.objection}"</span>
                                        <span className="text-muted-foreground mt-0.5 block">{opt.response}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
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

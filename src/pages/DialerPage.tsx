import { useState, useCallback } from "react";
import { Phone, Delete, Search, Mic, MicOff, Pause, Play, PhoneOff, Grid3X3, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

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
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showDtmf, setShowDtmf] = useState(false);
  const [callNotes, setCallNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleCall = () => {
    if (phoneNumber.length > 0) {
      setIsInCall(true);
    }
  };

  const handleHangup = () => {
    setIsInCall(false);
    setIsMuted(false);
    setIsOnHold(false);
    setCallDuration(0);
    setCallNotes("");
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discador</h1>
        <p className="text-sm text-muted-foreground">Fazer e receber chamadas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  placeholder="Digite o número"
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
                disabled={!phoneNumber}
                className="w-full h-12 text-base gap-2 bg-status-available hover:bg-status-available/90 text-primary-foreground"
                aria-label="Iniciar chamada"
              >
                <Phone className="h-5 w-5" />
                Ligar
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

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {isInCall ? (
                <>
                  <span className="h-2 w-2 rounded-full status-on-call animate-pulse" />
                  Chamada Ativa
                </>
              ) : (
                "Nenhuma Chamada Ativa"
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
                      <p className="text-sm text-muted-foreground">Contato Desconhecido</p>
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
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Phone className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Nenhuma chamada ativa</p>
                <p className="text-sm">Use o discador para iniciar uma chamada ou aguarde uma chamada recebida</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Plus, Play, Pause, BarChart3, Loader2, Upload, Trash2, PhoneOutgoing, CheckCircle, XCircle, Clock, SkipForward, StopCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Device, Call } from "@twilio/voice-sdk";

type Campaign = {
  id: string;
  name: string;
  status: string;
  total_contacts: number;
  called: number;
  answered: number;
  created_at: string;
};

type CampaignContact = {
  id: string;
  campaign_id: string;
  name: string | null;
  phone: string;
  status: string;
  notes: string | null;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  draft:     { label: "Rascunho",  className: "badge-neutral" },
  running:   { label: "Ativa",     className: "badge-success" },
  paused:    { label: "Pausada",   className: "badge-warning" },
  completed: { label: "Concluída", className: "badge-info" },
};

const contactStatusIcon: Record<string, React.ReactNode> = {
  pending:   <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
  calling:   <PhoneOutgoing className="h-3.5 w-3.5 text-primary animate-pulse" />,
  answered:  <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
  "no-answer": <XCircle className="h-3.5 w-3.5 text-yellow-500" />,
  failed:    <XCircle className="h-3.5 w-3.5 text-red-500" />,
  skipped:   <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />,
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns]     = useState<Campaign[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [newName, setNewName]         = useState("");
  const [saving, setSaving]           = useState(false);

  // Detalhes de uma campanha aberta
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [contacts, setContacts]       = useState<CampaignContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Adicionar contato manual
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  // Discadora automática
  const [isAutoDialing, setIsAutoDialing] = useState(false);
  const [currentContact, setCurrentContact] = useState<CampaignContact | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const deviceRef = useRef<Device | null>(null);
  const callRef   = useRef<Call | null>(null);
  const autoDialRef = useRef(false);

  useEffect(() => { loadCampaigns(); }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isAutoDialing && currentContact) {
      timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isAutoDialing, currentContact]);

  const loadCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns((data as Campaign[]) || []);
    setLoading(false);
  };

  const loadContacts = async (campaignId: string) => {
    setLoadingContacts(true);
    const { data } = await supabase
      .from("campaign_contacts")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });
    setContacts((data as CampaignContact[]) || []);
    setLoadingContacts(false);
  };

  const openCampaign = async (c: Campaign) => {
    setActiveCampaign(c);
    await loadContacts(c.id);
  };

  const handleCreateCampaign = async () => {
    if (!newName.trim()) { toast.error("Nome obrigatório"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("campaigns").insert({ name: newName }).select().single();
    if (error) toast.error("Erro ao criar campanha");
    else {
      toast.success("Campanha criada");
      setNewName("");
      setShowCreate(false);
      loadCampaigns();
      openCampaign(data as Campaign);
    }
    setSaving(false);
  };

  const handleAddContact = async () => {
    if (!newContactPhone.trim() || !activeCampaign) { toast.error("Telefone obrigatório"); return; }
    const { error } = await supabase.from("campaign_contacts").insert({
      campaign_id: activeCampaign.id,
      name: newContactName.trim() || null,
      phone: newContactPhone.trim(),
    });
    if (error) toast.error("Erro ao adicionar contato");
    else {
      await supabase.from("campaigns").update({ total_contacts: (activeCampaign.total_contacts || 0) + 1 }).eq("id", activeCampaign.id);
      setNewContactName(""); setNewContactPhone("");
      loadContacts(activeCampaign.id);
      loadCampaigns();
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCampaign) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const toInsert = lines.map((line) => {
        const [name, phone] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        return { campaign_id: activeCampaign.id, name: name || null, phone: phone || name };
      }).filter((c) => c.phone);

      if (toInsert.length === 0) { toast.error("Nenhum contato válido encontrado"); return; }
      const { error } = await supabase.from("campaign_contacts").insert(toInsert);
      if (error) toast.error("Erro ao importar contatos");
      else {
        await supabase.from("campaigns").update({ total_contacts: (activeCampaign.total_contacts || 0) + toInsert.length }).eq("id", activeCampaign.id);
        toast.success(`${toInsert.length} contatos importados`);
        loadContacts(activeCampaign.id);
        loadCampaigns();
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDeleteContact = async (id: string) => {
    await supabase.from("campaign_contacts").delete().eq("id", id);
    if (activeCampaign) {
      await supabase.from("campaigns").update({ total_contacts: Math.max(0, (activeCampaign.total_contacts || 1) - 1) }).eq("id", activeCampaign.id);
      loadContacts(activeCampaign.id);
      loadCampaigns();
    }
  };

  // === AUTO-DIALER ===
  const initDevice = async () => {
    if (deviceRef.current) return;
    const { data } = await supabase.functions.invoke("twilio-access-token", { body: { identity: "agent" } });
    if (!data?.token) { toast.error("Dispositivo Twilio não pronto"); return; }
    const device = new Device(data.token, { logLevel: "warn" });
    await device.register();
    deviceRef.current = device;
  };

  const dialContact = async (contact: CampaignContact) => {
    if (!deviceRef.current || !activeCampaign) return;
    setCurrentContact(contact);
    setCallDuration(0);

    // Marcar como "calling"
    await supabase.from("campaign_contacts").update({ status: "calling" }).eq("id", contact.id);
    setContacts((prev) => prev.map((c) => c.id === contact.id ? { ...c, status: "calling" } : c));

    try {
      const call = await deviceRef.current.connect({ params: { To: contact.phone } });
      callRef.current = call;

      call.on("accept", () => toast.info(`Discando para ${contact.name || contact.phone}...`));

      call.on("disconnect", async () => {
        const finalStatus = call.status() === "closed" ? "answered" : "no-answer";
        await supabase.from("campaign_contacts").update({ status: finalStatus }).eq("id", contact.id);
        await supabase.from("campaigns").update({
          called: (activeCampaign.called || 0) + 1,
          ...(finalStatus === "answered" ? { answered: (activeCampaign.answered || 0) + 1 } : {}),
        }).eq("id", activeCampaign.id);

        setContacts((prev) => prev.map((c) => c.id === contact.id ? { ...c, status: finalStatus } : c));
        callRef.current = null;
        setCurrentContact(null);

        if (autoDialRef.current) {
          setTimeout(() => dialNextPending(), 2000);
        }
      });

      call.on("error", async () => {
        await supabase.from("campaign_contacts").update({ status: "failed" }).eq("id", contact.id);
        setContacts((prev) => prev.map((c) => c.id === contact.id ? { ...c, status: "failed" } : c));
        callRef.current = null; setCurrentContact(null);
        if (autoDialRef.current) setTimeout(() => dialNextPending(), 1500);
      });
    } catch {
      await supabase.from("campaign_contacts").update({ status: "failed" }).eq("id", contact.id);
      setContacts((prev) => prev.map((c) => c.id === contact.id ? { ...c, status: "failed" } : c));
      setCurrentContact(null);
      if (autoDialRef.current) setTimeout(() => dialNextPending(), 1500);
    }
  };

  const dialNextPending = () => {
    if (!autoDialRef.current) return;
    setContacts((prev) => {
      const next = prev.find((c) => c.status === "pending");
      if (!next) {
        autoDialRef.current = false;
        setIsAutoDialing(false);
        toast.success("Campanha concluída! Todos os contatos foram discados.");
        if (activeCampaign) supabase.from("campaigns").update({ status: "completed" }).eq("id", activeCampaign.id);
        return prev;
      }
      dialContact(next);
      return prev;
    });
  };

  const startAutoDial = async () => {
    await initDevice();
    autoDialRef.current = true;
    setIsAutoDialing(true);
    if (activeCampaign) await supabase.from("campaigns").update({ status: "running" }).eq("id", activeCampaign.id);
    dialNextPending();
  };

  const pauseAutoDial = async () => {
    autoDialRef.current = false;
    setIsAutoDialing(false);
    callRef.current?.disconnect();
    setCurrentContact(null);
    if (activeCampaign) await supabase.from("campaigns").update({ status: "paused" }).eq("id", activeCampaign.id);
    toast.info("Discadora pausada");
  };

  const skipCurrent = async () => {
    if (!currentContact) return;
    callRef.current?.disconnect();
    await supabase.from("campaign_contacts").update({ status: "skipped" }).eq("id", currentContact.id);
    setContacts((prev) => prev.map((c) => c.id === currentContact.id ? { ...c, status: "skipped" } : c));
    setCurrentContact(null);
  };

  const formatDur = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  const pending  = contacts.filter((c) => c.status === "pending").length;
  const answered = contacts.filter((c) => c.status === "answered").length;
  const called   = contacts.filter((c) => c.status !== "pending").length;
  const progress = contacts.length > 0 ? (called / contacts.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campanhas / Discadora</h1>
          <p className="text-sm text-muted-foreground">Discagem automática e gestão de campanhas</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Nova Campanha
        </Button>
      </div>

      {/* Painel da campanha aberta */}
      {activeCampaign ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => { setActiveCampaign(null); setIsAutoDialing(false); autoDialRef.current = false; }}>
                ← Campanhas
              </Button>
              <h2 className="text-lg font-semibold">{activeCampaign.name}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[activeCampaign.status]?.className}`}>
                {statusConfig[activeCampaign.status]?.label}
              </span>
            </div>
          </div>

          {/* Stats + Controles */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso: {called}/{contacts.length}</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="grid grid-cols-3 gap-4 text-center pt-1">
                  <div>
                    <p className="text-2xl font-bold text-primary">{pending}</p>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">{answered}</p>
                    <p className="text-xs text-muted-foreground">Atendidas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{called}</p>
                    <p className="text-xs text-muted-foreground">Discadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center gap-3 h-full">
                {currentContact ? (
                  <div className="text-center space-y-1">
                    <PhoneOutgoing className="h-6 w-6 text-primary mx-auto animate-pulse" />
                    <p className="font-medium text-sm">{currentContact.name || "Contato"}</p>
                    <p className="text-xs font-mono text-muted-foreground">{currentContact.phone}</p>
                    <p className="text-lg font-mono font-bold">{formatDur(callDuration)}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    {pending === 0 ? "Todos contatos discados" : "Discadora pronta"}
                  </p>
                )}
                <div className="flex flex-col gap-2 w-full">
                  {!isAutoDialing ? (
                    <Button className="gap-2 w-full" disabled={pending === 0} onClick={startAutoDial}>
                      <Play className="h-4 w-4" />
                      {activeCampaign.status === "paused" ? "Retomar" : "Iniciar Discagem"}
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" className="gap-2 w-full" onClick={pauseAutoDial}>
                        <Pause className="h-4 w-4" /> Pausar
                      </Button>
                      {currentContact && (
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={skipCurrent}>
                          <SkipForward className="h-3 w-3" /> Pular
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Adicionar contatos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Contatos ({contacts.length})</CardTitle>
                <label className="cursor-pointer">
                  <input type="file" accept=".csv,.txt" className="hidden" onChange={handleImportCSV} />
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <span><Upload className="h-3.5 w-3.5" /> Importar CSV</span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">CSV: coluna 1 = nome, coluna 2 = telefone</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Nome (opcional)" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} className="flex-1" />
                <Input placeholder="+55 11 99999-0000" value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} className="flex-1" />
                <Button onClick={handleAddContact} className="gap-1 shrink-0"><Plus className="h-4 w-4" /> Adicionar</Button>
              </div>

              {loadingContacts ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : contacts.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">Nenhum contato adicionado</p>
              ) : (
                <div className="max-h-64 overflow-y-auto scrollbar-thin">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-6"></TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((c) => (
                        <TableRow key={c.id} className={c.id === currentContact?.id ? "bg-primary/5" : ""}>
                          <TableCell>{contactStatusIcon[c.status] || null}</TableCell>
                          <TableCell className="text-sm">{c.name || <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell className="font-mono text-xs">{c.phone}</TableCell>
                          <TableCell>
                            <span className="text-xs capitalize text-muted-foreground">{c.status}</span>
                          </TableCell>
                          <TableCell>
                            {c.status === "pending" && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => handleDeleteContact(c.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Lista de campanhas */
        loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhuma campanha criada</p>
            <p className="text-sm">Clique em "Nova Campanha" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {campaigns.map((c) => {
              const prog = c.total_contacts > 0 ? (c.called / c.total_contacts) * 100 : 0;
              const sc = statusConfig[c.status] || statusConfig.draft;
              return (
                <Card key={c.id} className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => openCampaign(c)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sc.className}`}>
                        {sc.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{c.called}/{c.total_contacts} discadas</span>
                      <span>{Math.round(prog)}%</span>
                    </div>
                    <Progress value={prog} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{c.answered} atendidas</span>
                      <span>{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* Modal: Nova Campanha */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) setShowCreate(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
          <Input placeholder="Nome da campanha" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateCampaign()} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreateCampaign} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

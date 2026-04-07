import { useState, useEffect } from "react";
import { Plus, FileText, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, Save, X, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ResponseOption = { objection: string; response: string };

type Script = {
  id: string;
  title: string;
  category: string;
  content: string;
  response_options: ResponseOption[];
  is_active: boolean;
  created_at: string;
};

const CATEGORIES = ["Saída", "Entrada", "Vendas", "Suporte", "Cobrança"];

const categoryColors: Record<string, string> = {
  Saída:     "badge-info",
  Entrada:   "badge-success",
  Vendas:    "badge-purple",
  Suporte:   "badge-warning",
  Cobrança:  "badge-danger",
};

const emptyForm = (): Omit<Script, "id" | "created_at"> => ({
  title: "",
  category: "Saída",
  content: "",
  response_options: [],
  is_active: true,
});

export default function ScriptsPage() {
  const [scripts, setScripts]         = useState<Script[]>([]);
  const [loading, setLoading]         = useState(true);
  const [openScript, setOpenScript]   = useState<Script | null>(null);
  const [editMode, setEditMode]       = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState(emptyForm());
  const [saving, setSaving]           = useState(false);
  const [expandedRO, setExpandedRO]   = useState<number | null>(null);
  const [filterCat, setFilterCat]     = useState("todos");

  useEffect(() => { loadScripts(); }, []);

  const loadScripts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scripts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar scripts");
    else setScripts((data as Script[]) || []);
    setLoading(false);
  };

  const filtered = scripts.filter(
    (s) => filterCat === "todos" || s.category === filterCat
  );

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Título e conteúdo são obrigatórios");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      category: form.category,
      content: form.content,
      response_options: form.response_options,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };
    if (editMode && openScript) {
      const { error } = await supabase.from("scripts").update(payload).eq("id", openScript.id);
      if (error) toast.error("Erro ao salvar script");
      else { toast.success("Script atualizado"); setOpenScript(null); setEditMode(false); loadScripts(); }
    } else {
      const { error } = await supabase.from("scripts").insert(payload);
      if (error) toast.error("Erro ao criar script");
      else { toast.success("Script criado"); setShowCreate(false); setForm(emptyForm()); loadScripts(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("scripts").delete().eq("id", id);
    if (error) toast.error("Erro ao deletar script");
    else { toast.success("Script removido"); setOpenScript(null); loadScripts(); }
  };

  const openEdit = (script: Script) => {
    setForm({ ...script });
    setOpenScript(script);
    setEditMode(true);
  };

  const addResponseOption = () => {
    setForm((f) => ({ ...f, response_options: [...f.response_options, { objection: "", response: "" }] }));
  };

  const updateResponseOption = (i: number, field: keyof ResponseOption, value: string) => {
    setForm((f) => {
      const opts = [...f.response_options];
      opts[i] = { ...opts[i], [field]: value };
      return { ...f, response_options: opts };
    });
  };

  const removeResponseOption = (i: number) => {
    setForm((f) => ({ ...f, response_options: f.response_options.filter((_, idx) => idx !== i) }));
  };

  const FormPanel = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-sm font-medium mb-1 block">Título do Script</label>
          <Input
            placeholder="Ex: Abordagem inicial - Vendas"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Categoria</label>
          <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Conteúdo do Script</label>
        <p className="text-xs text-muted-foreground mb-2">Use {"{{nome_cliente}}"} e {"{{nome_vendedor}}"} como variáveis.</p>
        <Textarea
          placeholder="Olá {{nome_cliente}}, meu nome é {{nome_vendedor}} da empresa X..."
          rows={8}
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          className="font-mono text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Opções de Resposta / Objeções</label>
          <Button variant="outline" size="sm" onClick={addResponseOption} className="gap-1 h-7 text-xs">
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        </div>
        <div className="space-y-2">
          {form.response_options.map((opt, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Objeção #{i + 1}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeResponseOption(i)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Input
                placeholder='Ex: "Não tenho interesse agora"'
                value={opt.objection}
                onChange={(e) => updateResponseOption(i, "objection", e.target.value)}
                className="text-sm"
              />
              <Textarea
                placeholder="Sua resposta para essa objeção..."
                rows={2}
                value={opt.response}
                onChange={(e) => updateResponseOption(i, "response", e.target.value)}
                className="text-sm"
              />
            </div>
          ))}
          {form.response_options.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">
              Nenhuma opção de resposta. Clique em "Adicionar" para criar.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scripts de Chamada</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie scripts com opções de resposta para sua equipe</p>
        </div>
        <Button className="gap-2" onClick={() => { setForm(emptyForm()); setShowCreate(true); }}>
          <Plus className="h-4 w-4" /> Novo Script
        </Button>
      </div>

      {/* Filtro por categoria */}
      <div className="flex gap-2 flex-wrap">
        {["todos", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterCat === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {cat === "todos" ? "Todos" : cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Nenhum script cadastrado</p>
          <p className="text-sm">Clique em "Novo Script" para criar o primeiro</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((script) => (
            <Card
              key={script.id}
              className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-elevated group"
              onClick={() => { setOpenScript(script); setEditMode(false); }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[script.category] || "badge-neutral"}`}>
                    {script.category}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(script)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(script.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base mt-2 leading-snug">{script.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{script.content}</p>
                {script.response_options.length > 0 && (
                  <div className="flex items-center gap-1 mt-3">
                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {script.response_options.length} opção{script.response_options.length !== 1 ? "ões" : ""} de resposta
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Visualizar Script */}
      <Dialog open={!!openScript && !editMode} onOpenChange={(o) => { if (!o) setOpenScript(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {openScript && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[openScript.category] || "badge-neutral"}`}>
                    {openScript.category}
                  </span>
                </div>
                <DialogTitle>{openScript.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div>
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wide">Script</h3>
                  <div className="bg-muted/40 rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed">
                    {openScript.content}
                  </div>
                </div>

                {openScript.response_options.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                      Opções de Resposta ({openScript.response_options.length})
                    </h3>
                    <div className="space-y-2">
                      {openScript.response_options.map((opt, i) => (
                        <div key={i} className="border rounded-lg overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/40 transition-colors"
                            onClick={() => setExpandedRO(expandedRO === i ? null : i)}
                          >
                            <span className="text-sm font-medium">{opt.objection || `Objeção #${i+1}`}</span>
                            {expandedRO === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          {expandedRO === i && (
                            <div className="px-3 pb-3 text-sm text-muted-foreground bg-muted/20 whitespace-pre-wrap leading-relaxed">
                              {opt.response}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => handleDelete(openScript.id)} className="text-destructive gap-2">
                  <Trash2 className="h-4 w-4" /> Excluir
                </Button>
                <Button onClick={() => openEdit(openScript)} className="gap-2">
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Script */}
      <Dialog open={editMode} onOpenChange={(o) => { if (!o) { setEditMode(false); setOpenScript(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Script</DialogTitle>
          </DialogHeader>
          <FormPanel />
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => { setEditMode(false); setOpenScript(null); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Criar Script */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) setShowCreate(false); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Script</DialogTitle>
          </DialogHeader>
          <FormPanel />
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar Script
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

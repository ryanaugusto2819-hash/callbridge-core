import { useEffect, useState, useRef } from "react";
import { Upload, Trash2, Play, Volume2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AudioClip = {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  storage_path: string | null;
  shortcut_key: string | null;
  display_order: number;
  is_active: boolean;
};

export default function AudioClipsPage() {
  const [clips, setClips] = useState<AudioClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audio_clips")
      .select("*")
      .order("display_order")
      .order("created_at");
    if (error) toast.error(error.message);
    setClips((data as AudioClip[]) || []);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!title.trim() || !file) {
      toast.error("Preencha o título e selecione um arquivo");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "mp3";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("call-audios").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("call-audios").getPublicUrl(path);

      const { error: insErr } = await supabase.from("audio_clips").insert({
        title: title.trim(),
        description: description.trim() || null,
        audio_url: pub.publicUrl,
        storage_path: path,
        shortcut_key: shortcut.trim().slice(0, 3) || null,
        display_order: clips.length,
      });
      if (insErr) throw insErr;

      toast.success("Áudio adicionado");
      setTitle(""); setDescription(""); setShortcut(""); setFile(null);
      setOpen(false);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (clip: AudioClip) => {
    if (!confirm(`Remover "${clip.title}"?`)) return;
    if (clip.storage_path) {
      await supabase.storage.from("call-audios").remove([clip.storage_path]);
    }
    const { error } = await supabase.from("audio_clips").delete().eq("id", clip.id);
    if (error) toast.error(error.message);
    else { toast.success("Removido"); load(); }
  };

  const handlePreview = (url: string) => {
    // Para o áudio anterior (se houver) e libera referência ANTES de criar o novo
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = "";
      } catch {}
      audioRef.current = null;
    }
    const a = new Audio();
    a.crossOrigin = "anonymous";
    a.preload = "auto";
    audioRef.current = a;

    const onReady = () => {
      a.play().catch((e: DOMException) => {
        if (e.name === "AbortError") return; // ignorado: usuário trocou de áudio
        toast.error(`Não foi possível reproduzir: ${e.message}`);
      });
    };
    a.addEventListener("canplay", onReady, { once: true });
    a.addEventListener("error", () => {
      toast.error("Falha ao carregar o áudio. Verifique se o arquivo está acessível (bucket público).");
    }, { once: true });
    a.src = url;
    a.load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Áudios Pré-gravados</h1>
          <p className="text-sm text-muted-foreground">
            Envie arquivos MP3/WAV para tocar durante as chamadas com um clique
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Áudio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Áudio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Saudação inicial" />
              </div>
              <div>
                <Label htmlFor="desc">Descrição</Label>
                <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
              </div>
              <div>
                <Label htmlFor="sc">Tecla de atalho (1-9)</Label>
                <Input id="sc" value={shortcut} onChange={(e) => setShortcut(e.target.value)} maxLength={3} placeholder="Ex: 1" />
              </div>
              <div>
                <Label htmlFor="file">Arquivo de áudio (MP3, WAV) *</Label>
                <Input id="file" type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={uploading}>Cancelar</Button>
              <Button onClick={handleUpload} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Enviando..." : "Enviar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Volume2 className="h-4 w-4" /> Biblioteca de áudios ({clips.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : clips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Volume2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nenhum áudio cadastrado</p>
              <p className="text-xs">Clique em "Novo Áudio" para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {clips.map((clip) => (
                <div key={clip.id} className="border rounded-lg p-3 bg-secondary/30 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{clip.title}</p>
                      {clip.description && <p className="text-xs text-muted-foreground truncate">{clip.description}</p>}
                    </div>
                    {clip.shortcut_key && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-mono shrink-0">
                        {clip.shortcut_key}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1 gap-1" onClick={() => handlePreview(clip.audio_url)} aria-label={`Pré-ouvir ${clip.title}`}>
                      <Play className="h-3 w-3" /> Ouvir
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(clip)} aria-label={`Remover ${clip.title}`}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
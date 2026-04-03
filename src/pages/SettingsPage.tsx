import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type SettingsMap = Record<string, string>;

const SETTING_KEYS = [
  "twilio_account_sid",
  "twilio_auth_token",
  "twilio_phone_number",
  "ringtone_enabled",
  "notification_sounds_enabled",
  "browser_notifications_enabled",
  "email_alerts_enabled",
  "account_name",
  "account_email",
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", SETTING_KEYS);

    if (error) {
      toast.error("Erro ao carregar configurações");
      console.error(error);
    } else {
      const map: SettingsMap = {};
      data?.forEach((row: { key: string; value: string | null }) => {
        if (row.value !== null) map[row.key] = row.value;
      });
      setSettings(map);
    }
    setLoading(false);
  };

  const saveSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from("settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) {
      toast.error("Erro ao salvar configuração");
      console.error(error);
      return false;
    }
    return true;
  };

  const saveMultiple = async (keys: string[], section: string) => {
    setSaving(section);
    let allOk = true;
    for (const key of keys) {
      const ok = await saveSetting(key, settings[key] || "");
      if (!ok) allOk = false;
    }
    if (allOk) toast.success("Configurações salvas com sucesso!");
    setSaving(null);
  };

  const updateLocal = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSetting = async (key: string, current: boolean) => {
    const newValue = (!current).toString();
    updateLocal(key, newValue);
    await saveSetting(key, newValue);
    toast.success("Configuração atualizada");
  };

  const webhookUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Configure sua plataforma de call center</p>
      </div>

      <Tabs defaultValue="twilio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="twilio">Twilio</TabsTrigger>
          <TabsTrigger value="audio">Áudio</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="business">Horário Comercial</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="twilio">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuração do Twilio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account SID</Label>
                <Input
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  type="password"
                  value={settings.twilio_account_sid || ""}
                  onChange={(e) => updateLocal("twilio_account_sid", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Auth Token</Label>
                <Input
                  placeholder="Seu token de autenticação Twilio"
                  type="password"
                  value={settings.twilio_auth_token || ""}
                  onChange={(e) => updateLocal("twilio_auth_token", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Número de Telefone</Label>
                <Input
                  placeholder="+55 (11) 0000-0000"
                  value={settings.twilio_phone_number || ""}
                  onChange={(e) => updateLocal("twilio_phone_number", e.target.value)}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>URL Base do Webhook</Label>
                <Input value={webhookUrl} readOnly />
                <p className="text-xs text-muted-foreground">Configure essas URLs no console do Twilio</p>
              </div>
              <Button
                disabled={saving === "twilio"}
                onClick={() =>
                  saveMultiple(
                    ["twilio_account_sid", "twilio_auth_token", "twilio_phone_number"],
                    "twilio"
                  )
                }
              >
                {saving === "twilio" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Configuração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio">
          <Card>
            <CardHeader><CardTitle className="text-base">Configurações de Áudio</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Toque</Label>
                  <p className="text-xs text-muted-foreground">Tocar som em chamadas recebidas</p>
                </div>
                <Switch
                  checked={settings.ringtone_enabled !== "false"}
                  onCheckedChange={() =>
                    toggleSetting("ringtone_enabled", settings.ringtone_enabled !== "false")
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sons de Notificação</Label>
                  <p className="text-xs text-muted-foreground">Tocar som para alertas de fila e sistema</p>
                </div>
                <Switch
                  checked={settings.notification_sounds_enabled !== "false"}
                  onCheckedChange={() =>
                    toggleSetting(
                      "notification_sounds_enabled",
                      settings.notification_sounds_enabled !== "false"
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle className="text-base">Preferências de Notificação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificações do Navegador</Label>
                  <p className="text-xs text-muted-foreground">Mostrar notificações na área de trabalho para chamadas recebidas</p>
                </div>
                <Switch
                  checked={settings.browser_notifications_enabled !== "false"}
                  onCheckedChange={() =>
                    toggleSetting(
                      "browser_notifications_enabled",
                      settings.browser_notifications_enabled !== "false"
                    )
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Alertas por Email</Label>
                  <p className="text-xs text-muted-foreground">Receber email para chamadas perdidas</p>
                </div>
                <Switch
                  checked={settings.email_alerts_enabled === "true"}
                  onCheckedChange={() =>
                    toggleSetting("email_alerts_enabled", settings.email_alerts_enabled === "true")
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card>
            <CardHeader><CardTitle className="text-base">Horário Comercial</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">A configuração de horário comercial estará disponível em breve. Isso permitirá definir horários de funcionamento por dia da semana.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader><CardTitle className="text-base">Perfil da Conta</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Seu nome"
                  value={settings.account_name || ""}
                  onChange={(e) => updateLocal("account_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  placeholder="seu@email.com"
                  type="email"
                  value={settings.account_email || ""}
                  onChange={(e) => updateLocal("account_email", e.target.value)}
                />
              </div>
              <Button
                disabled={saving === "account"}
                onClick={() => saveMultiple(["account_name", "account_email"], "account")}
              >
                {saving === "account" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Atualizar Perfil
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

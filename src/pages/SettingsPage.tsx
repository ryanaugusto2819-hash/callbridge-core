import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
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
                <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" type="password" />
              </div>
              <div className="space-y-2">
                <Label>Auth Token</Label>
                <Input placeholder="Seu token de autenticação Twilio" type="password" />
              </div>
              <div className="space-y-2">
                <Label>Número de Telefone</Label>
                <Input placeholder="+55 (11) 0000-0000" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>URL Base do Webhook</Label>
                <Input value="https://your-project.supabase.co/functions/v1" readOnly />
                <p className="text-xs text-muted-foreground">Configure essas URLs no console do Twilio</p>
              </div>
              <Button>Salvar Configuração</Button>
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
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sons de Notificação</Label>
                  <p className="text-xs text-muted-foreground">Tocar som para alertas de fila e sistema</p>
                </div>
                <Switch defaultChecked />
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
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Alertas por Email</Label>
                  <p className="text-xs text-muted-foreground">Receber email para chamadas perdidas</p>
                </div>
                <Switch />
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
                <Input placeholder="Seu nome" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="seu@email.com" type="email" />
              </div>
              <Button>Atualizar Perfil</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

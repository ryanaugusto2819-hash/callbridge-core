import { Plus, FileText, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const scripts = [
  { id: "1", title: "Script de Boas-vindas - Entrada", category: "Entrada", updatedAt: "14/01/2024", content: "Olá {{contact_name}}, obrigado por ligar..." },
  { id: "2", title: "Introdução Chamada Fria", category: "Saída", updatedAt: "12/01/2024", content: "Oi {{contact_name}}, meu nome é {{agent_name}}..." },
  { id: "3", title: "Consulta de Faturamento", category: "Suporte", updatedAt: "10/01/2024", content: "Entendo que você tem uma dúvida sobre sua fatura..." },
  { id: "4", title: "Upsell - Plano Premium", category: "Vendas", updatedAt: "08/01/2024", content: "Com base no seu uso, eu recomendaria nosso plano premium..." },
];

export default function ScriptsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scripts de Chamada</h1>
          <p className="text-sm text-muted-foreground">Gerencie e organize os scripts de chamada da sua equipe</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Script
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scripts.map((script) => (
          <Card key={script.id} className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">{script.category}</Badge>
                <span className="text-xs text-muted-foreground">{script.updatedAt}</span>
              </div>
              <CardTitle className="text-base mt-2">{script.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{script.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

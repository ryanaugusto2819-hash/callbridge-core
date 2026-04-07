import { Phone, Ear, MessageSquare, PhoneForwarded, PhoneOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

const statusBadgeMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ringing: { label: "Tocando", variant: "outline" },
  "in-call": { label: "Em Chamada", variant: "default" },
  hold: { label: "Em Espera", variant: "secondary" },
  "wrap-up": { label: "Pós-atendimento", variant: "secondary" },
};

const activeCalls: never[] = [];

export default function ActiveCallsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chamadas Ativas</h1>
          <p className="text-sm text-muted-foreground">Monitore e gerencie todas as chamadas em andamento em tempo real</p>
        </div>
        <Badge variant="secondary" className="text-sm gap-1.5">
          <span className="h-2 w-2 rounded-full status-on-call animate-pulse" />
          {activeCalls.length > 0 ? `${activeCalls.length} Ativas` : "Nenhuma ativa"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Chamadas ao Vivo</CardTitle>
        </CardHeader>
        <CardContent>
          {activeCalls.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Direção</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações do Supervisor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCalls.map((call) => {
                  const statusInfo = statusBadgeMap[call.status] || statusBadgeMap["in-call"];
                  return (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.agent}</TableCell>
                      <TableCell>{call.contact}</TableCell>
                      <TableCell className="font-mono text-sm">{call.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {call.direction}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{call.duration}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Escutar">
                                <Ear className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Monitoramento Silencioso</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Sussurrar">
                                <MessageSquare className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Sussurrar ao Agente</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Intervir">
                                <Phone className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Intervir na Chamada</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Transferir">
                                <PhoneForwarded className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Transferir</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Encerrar chamada">
                                <PhoneOff className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Encerrar Chamada</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Phone className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhuma chamada ativa</p>
              <p className="text-sm">Todas as linhas estão livres no momento</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

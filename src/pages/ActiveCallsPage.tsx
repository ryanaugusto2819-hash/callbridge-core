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
  ringing: { label: "Ringing", variant: "outline" },
  "in-call": { label: "In Call", variant: "default" },
  hold: { label: "On Hold", variant: "secondary" },
  "wrap-up": { label: "Wrap-up", variant: "secondary" },
};

// This would come from Supabase Realtime
const activeCalls = [
  { id: "1", agent: "Sarah Chen", contact: "John Smith", phone: "+1 (555) 123-4567", duration: "5:23", status: "in-call", direction: "inbound" },
  { id: "2", agent: "Mike Johnson", contact: "Jane Doe", phone: "+1 (555) 987-6543", duration: "2:11", status: "ringing", direction: "outbound" },
  { id: "3", agent: "Emily Davis", contact: "Robert Wilson", phone: "+1 (555) 456-7890", duration: "8:45", status: "hold", direction: "inbound" },
  { id: "4", agent: "James Wilson", contact: "Unknown", phone: "+1 (555) 321-0987", duration: "0:45", status: "in-call", direction: "inbound" },
];

export default function ActiveCallsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Active Calls</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage all ongoing calls in real-time</p>
        </div>
        <Badge variant="secondary" className="text-sm gap-1.5">
          <span className="h-2 w-2 rounded-full status-on-call animate-pulse" />
          {activeCalls.length} Active
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Live Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {activeCalls.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Supervisor Actions</TableHead>
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
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Listen">
                                <Ear className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Silent Monitor</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Whisper">
                                <MessageSquare className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Whisper to Agent</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Barge">
                                <Phone className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Barge In</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Transfer">
                                <PhoneForwarded className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Transfer</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="End call">
                                <PhoneOff className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>End Call</TooltipContent>
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
              <p className="text-lg font-medium">No active calls</p>
              <p className="text-sm">All lines are currently clear</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

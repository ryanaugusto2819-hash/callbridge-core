import { ListOrdered, Clock, User, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const queueItems = [
  { id: "1", caller: "+1 (555) 111-2233", wait: "2:34", priority: "vip", skill: "Sales" },
  { id: "2", caller: "+1 (555) 444-5566", wait: "1:12", priority: "normal", skill: "Support" },
  { id: "3", caller: "+1 (555) 777-8899", wait: "0:45", priority: "urgent", skill: "Billing" },
];

const priorityBadge: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  normal: { label: "Normal", variant: "secondary" },
  urgent: { label: "Urgent", variant: "destructive" },
  vip: { label: "VIP", variant: "default" },
};

export default function QueuePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Call Queue</h1>
          <p className="text-sm text-muted-foreground">Manage waiting callers and queue distribution</p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <ListOrdered className="h-3.5 w-3.5" />
          {queueItems.length} waiting
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">1:30</p>
            <p className="text-xs text-muted-foreground">Avg Wait Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">8</p>
            <p className="text-xs text-muted-foreground">Agents Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-status-break" />
            <p className="text-2xl font-bold">2</p>
            <p className="text-xs text-muted-foreground">Over Max Wait</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Queue Board</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {queueItems.map((item, i) => {
            const pBadge = priorityBadge[item.priority] || priorityBadge.normal;
            return (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                  <div>
                    <p className="font-mono text-sm">{item.caller}</p>
                    <p className="text-xs text-muted-foreground">{item.skill}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={pBadge.variant}>{pBadge.label}</Badge>
                  <span className="font-mono text-sm">{item.wait}</span>
                  <Button size="sm" variant="outline">Assign</Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

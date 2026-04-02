import { Plus, Play, Pause, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const campaigns = [
  { id: "1", name: "Q1 Product Launch", status: "active", total: 500, called: 320, converted: 45, script: "Cold Call Intro" },
  { id: "2", name: "Customer Retention", status: "paused", total: 200, called: 80, converted: 22, script: "Upsell - Premium" },
  { id: "3", name: "Survey Followup", status: "draft", total: 350, called: 0, converted: 0, script: "Welcome Script" },
  { id: "4", name: "Holiday Promo", status: "completed", total: 400, called: 400, converted: 68, script: "Upsell - Premium" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "secondary" },
  draft: { label: "Draft", variant: "outline" },
  completed: { label: "Completed", variant: "secondary" },
};

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Manage outbound calling campaigns</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {campaigns.map((c) => {
          const sConf = statusConfig[c.status] || statusConfig.draft;
          const progress = c.total > 0 ? (c.called / c.total) * 100 : 0;
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <Badge variant={sConf.variant}>{sConf.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Progress: {c.called}/{c.total}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Converted: {c.converted}</span>
                  <span className="text-muted-foreground">Script: {c.script}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  {c.status === "active" && (
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Pause className="h-3 w-3" /> Pause
                    </Button>
                  )}
                  {(c.status === "paused" || c.status === "draft") && (
                    <Button size="sm" className="gap-1.5">
                      <Play className="h-3 w-3" /> {c.status === "draft" ? "Start" : "Resume"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <BarChart3 className="h-3 w-3" /> Stats
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

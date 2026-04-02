import { useState } from "react";
import { Plus, FileText, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const scripts = [
  { id: "1", title: "Welcome Script - Inbound", category: "Inbound", updatedAt: "2024-01-14", content: "Hello {{contact_name}}, thank you for calling..." },
  { id: "2", title: "Cold Call Intro", category: "Outbound", updatedAt: "2024-01-12", content: "Hi {{contact_name}}, my name is {{agent_name}}..." },
  { id: "3", title: "Billing Inquiry", category: "Support", updatedAt: "2024-01-10", content: "I understand you have a question about your bill..." },
  { id: "4", title: "Upsell - Premium Plan", category: "Sales", updatedAt: "2024-01-08", content: "Based on your usage, I'd recommend our premium plan..." },
];

export default function ScriptsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Call Scripts</h1>
          <p className="text-sm text-muted-foreground">Manage and organize call scripts for your team</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Script
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

import { useState } from "react";
import { Search, Download, Play, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const callLogs = [
  { id: "1", agent: "Sarah Chen", contact: "John Smith", phone: "+1 (555) 123-4567", direction: "inbound", status: "answered", duration: "5:23", date: "2024-01-15 10:30", hasRecording: true },
  { id: "2", agent: "Mike Johnson", contact: "Jane Doe", phone: "+1 (555) 987-6543", direction: "outbound", status: "answered", duration: "3:11", date: "2024-01-15 10:15", hasRecording: true },
  { id: "3", agent: "Emily Davis", contact: "Unknown", phone: "+1 (555) 456-7890", direction: "inbound", status: "missed", duration: "0:00", date: "2024-01-15 09:45", hasRecording: false },
  { id: "4", agent: "James Wilson", contact: "Robert Wilson", phone: "+1 (555) 321-0987", direction: "outbound", status: "voicemail", duration: "0:32", date: "2024-01-15 09:30", hasRecording: true },
  { id: "5", agent: "Lisa Park", contact: "Maria Garcia", phone: "+1 (555) 654-3210", direction: "inbound", status: "answered", duration: "8:45", date: "2024-01-15 09:00", hasRecording: true },
];

const directionIcon: Record<string, React.ReactNode> = {
  inbound: <PhoneIncoming className="h-3.5 w-3.5 text-status-available" />,
  outbound: <PhoneOutgoing className="h-3.5 w-3.5 text-primary" />,
};

const statusBadge: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  answered: { label: "Answered", variant: "default" },
  missed: { label: "Missed", variant: "destructive" },
  voicemail: { label: "Voicemail", variant: "secondary" },
};

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState("all");

  const filtered = callLogs.filter((log) => {
    const matchesSearch = log.contact.toLowerCase().includes(search.toLowerCase()) || log.phone.includes(search);
    const matchesDirection = directionFilter === "all" || log.direction === directionFilter;
    return matchesSearch && matchesDirection;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Call History</h1>
          <p className="text-sm text-muted-foreground">Review past calls and recordings</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search calls..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Direction</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => {
                const sBadge = statusBadge[log.status] || statusBadge.answered;
                return (
                  <TableRow key={log.id}>
                    <TableCell>{directionIcon[log.direction]}</TableCell>
                    <TableCell className="text-sm">{log.agent}</TableCell>
                    <TableCell className="font-medium">{log.contact}</TableCell>
                    <TableCell className="font-mono text-sm">{log.phone}</TableCell>
                    <TableCell>
                      <Badge variant={sBadge.variant}>{sBadge.label}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.duration}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.date}</TableCell>
                    <TableCell>
                      {log.hasRecording && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Play recording">
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

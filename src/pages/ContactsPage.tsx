import { useState } from "react";
import { Search, Plus, Phone, Tag, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const contacts = [
  { id: "1", name: "John Smith", phone: "+1 (555) 123-4567", email: "john@acme.com", company: "Acme Corp", tags: ["VIP", "Sales"], calls: 12 },
  { id: "2", name: "Jane Doe", phone: "+1 (555) 987-6543", email: "jane@globex.com", company: "Globex Inc", tags: ["Support"], calls: 5 },
  { id: "3", name: "Robert Wilson", phone: "+1 (555) 456-7890", email: "rwilson@initech.com", company: "Initech", tags: ["Billing"], calls: 8 },
  { id: "4", name: "Maria Garcia", phone: "+1 (555) 321-0987", email: "maria@wayne.com", company: "Wayne Enterprises", tags: ["VIP", "Billing"], calls: 15 },
  { id: "5", name: "David Brown", phone: "+1 (555) 654-3210", email: "david@stark.com", company: "Stark Industries", tags: ["Sales"], calls: 3 },
];

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground">Manage your contact database</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search contacts..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Calls</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-sm">{c.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-sm">{c.company}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {c.tags.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.calls}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Call">
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

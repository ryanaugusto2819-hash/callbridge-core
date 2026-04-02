import { useState } from "react";
import { Bell, ChevronDown, PhoneCall, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

const statuses = [
  { label: "Available", key: "available", class: "status-available" },
  { label: "Busy", key: "busy", class: "status-on-call" },
  { label: "Break", key: "break", class: "status-break" },
  { label: "Offline", key: "offline", class: "status-offline" },
] as const;

export function AppHeader() {
  const [agentStatus, setAgentStatus] = useState<string>("available");
  const [darkMode, setDarkMode] = useState(true);
  const currentStatus = statuses.find((s) => s.key === agentStatus) || statuses[0];

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <PhoneCall className="h-4 w-4 text-status-on-call" />
          <Badge variant="secondary" className="text-xs font-mono">
            0 live
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="Toggle dark mode">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-3">
              <span className={`h-2.5 w-2.5 rounded-full ${currentStatus.class}`} />
              <span className="text-sm">{currentStatus.label}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statuses.map((s) => (
              <DropdownMenuItem key={s.key} onClick={() => setAgentStatus(s.key)}>
                <span className={`h-2 w-2 rounded-full mr-2 ${s.class}`} />
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                AD
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

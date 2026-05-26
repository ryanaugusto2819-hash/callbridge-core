import {
  LayoutDashboard, Phone, PhoneCall, ListOrdered, Users, History,
  FileText, Megaphone, BarChart3, UserCog, Settings, Headphones, Music,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Painel", url: "/", icon: LayoutDashboard },
  { title: "Discador", url: "/dialer", icon: Phone },
  { title: "Chamadas Ativas", url: "/active-calls", icon: PhoneCall },
  { title: "Fila", url: "/queue", icon: ListOrdered },
  { title: "Contatos", url: "/contacts", icon: Users },
  { title: "Histórico", url: "/history", icon: History },
];

const operationsNav = [
  { title: "Scripts", url: "/scripts", icon: FileText },
  { title: "Áudios", url: "/audios", icon: Music },
  { title: "Campanhas", url: "/campaigns", icon: Megaphone },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Agentes", url: "/agents", icon: UserCog },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const renderItems = (items: typeof mainNav) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive(item.url)}>
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
            activeClassName="bg-sidebar-accent text-sidebar-primary"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-sm">{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <Headphones className="h-6 w-6 text-sidebar-primary shrink-0" />
          {!collapsed && (
            <span className="font-bold text-base text-sidebar-accent-foreground tracking-tight">
              CallCenter Pro
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
            {!collapsed ? "Principal" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
            {!collapsed ? "Operações" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(operationsNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

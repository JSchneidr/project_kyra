"use client"; // Obrigatório para usar usePathname

import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { CalendarDays, LayoutDashboard, Package, ExternalLink, Users } from "lucide-react";

export function SidebarNav() {
  const pathname = usePathname();

  // Array de configuração dos links para evitar repetição de código
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/packages", label: "Packages", icon: Package },
    { href: "/share", label: "Share", icon: ExternalLink },
    { href: "/students", label: "Students", icon: Users },
  ];

  return (
    <SidebarMenu className="gap-1">
      {navItems.map((item) => {
        // Verifica se a rota atual começa com o href do item (evita bugs com sub-rotas)
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isActive}>
              <a href={item.href}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

import { 
  SidebarProvider, 
  Sidebar, 
  SidebarInset, 
  SidebarTrigger, 
  SidebarHeader, 
  SidebarContent, 
  SidebarGroup, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "@/components/ui/sidebar"
import Image from "next/image";
import kyraLogo from "@/img/kyra-light-green.svg";
import { CalendarDays, LayoutDashboard, Package, ExternalLink, Users } from "lucide-react";
import { SidebarNav } from "@/components/SidebarNav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* 1. Barra Lateral */}
      <Sidebar>
        {/* Cabeçalho com o seu logo oficial */}
        <SidebarHeader className="p-4 flex items-center justify-start">
          <Image src={kyraLogo} alt="Kyra Logo" className="h-10 w-auto object-contain" />
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarNav/>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* 2. Área do Painel Principal */}
      <SidebarInset>
        {/* Topo do Painel / Navbar */}
        <header className="flex h-16 items-center gap-2 border-b border-border/40 bg-card px-4">
          <SidebarTrigger />
        </header>
        
        {/* Conteúdo Dinâmico das Páginas */}
        <main className="flex flex-1 flex-col gap-4 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

function getPageTitle(path: string): string {
  if (path.endsWith("/connections")) return "Conexões de Dados";
  if (path.endsWith("/widgets")) return "Editor de Widgets";
  if (path.endsWith("/folders")) return "Pastas & Sub-Relatórios";
  if (path.endsWith("/themes")) return "Temas de BI & Estilo";
  if (path.endsWith("/stats")) return "Estatísticas de Acesso";
  if (path.endsWith("/billing")) return "Plano & Cobrança";
  if (path.endsWith("/upload")) return "Importar Dados";
  return "Visão Geral do Workspace";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Sidebar username="vitor" />
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header title={getPageTitle(pathname)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8" style={{ background: "hsl(var(--muted)/0.08)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

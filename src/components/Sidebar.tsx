"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  BarChart3, 
  Database, 
  Grid, 
  FolderOpen, 
  Palette, 
  LineChart, 
  CreditCard, 
  Globe, 
  LogOut,
  Sparkles,
  Activity,
  Wifi,
  Settings,
  AlertTriangle
} from "lucide-react";
import clsx from "clsx";

interface SidebarProps {
  username?: string;
}

export function Sidebar({ username = "vitor" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Visão Geral", href: "/dashboard", icon: BarChart3 },
    { name: "Importar Dados (IA)", href: "/dashboard/upload", icon: Sparkles },
    { name: "Conexões", href: "/dashboard/connections", icon: Database },
    { name: "Editor de Widgets", href: "/dashboard/widgets", icon: Grid },
    { name: "Pastas / Seções", href: "/dashboard/folders", icon: FolderOpen },
    { name: "Temas de BI", href: "/dashboard/themes", icon: Palette },
    { name: "Estatísticas", href: "/dashboard/stats", icon: LineChart },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings },
    { name: "Plano & Cobrança", href: "/dashboard/billing", icon: CreditCard },
    { name: "Issues do Sistema", href: "/dashboard/issues", icon: AlertTriangle },
  ];

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
      }
    } catch (e) {
      console.error("Logout falhou:", e);
    }
  }

  return (
    <aside className="w-64 border-r border-border bg-card text-card-foreground flex flex-col h-full shrink-0 transition-colors duration-400 relative overflow-hidden">
      
      {/* Gradiente de luz no topo da sidebar */}
      <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(var(--glow-rgb, 34,211,238), 0.08) 0%, transparent 70%)"
        }}
      />

      {/* Logo */}
      <div className="h-16 px-5 border-b border-border flex items-center gap-3 relative z-10">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.2), hsl(var(--accent)/0.1))" }}
        >
          <div className="absolute inset-0 rounded-xl border border-primary/30" 
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }} 
          />
          <BarChart3 className="w-4.5 h-4.5 text-primary relative z-10" />
          {/* Brilho rotativo no logo */}
          <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"
            style={{ background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)" }}
          />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tighter text-primary leading-none">Metrika</span>
          <span className="text-foreground/40 font-light text-base leading-none">.io</span>
        </div>
        {/* Dot de status online */}
        <div className="ml-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-500"
            style={{ boxShadow: "0 0 6px rgba(34, 197, 94, 0.7)", animation: "live-ping 1.4s ease-in-out infinite" }}
          />
        </div>
      </div>

      {/* Navegação principal */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto custom-scrollbar relative z-10">
        <div className="px-3 mb-3 flex items-center gap-2 text-[10px] font-bold text-foreground/50 uppercase tracking-widest">
          <Wifi className="w-3 h-3" />
          Workspace Privado
        </div>

        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden",
                isActive
                  ? "text-primary"
                  : "text-foreground/70 hover:text-foreground"
              )}
              style={isActive ? {
                background: "linear-gradient(90deg, hsl(var(--primary)/0.12) 0%, hsl(var(--primary)/0.04) 100%)",
                boxShadow: "inset 0 0 0 1px hsl(var(--primary)/0.18)"
              } : undefined}
            >
              {/* Indicador lateral animado no item ativo */}
              {isActive && (
                <span className="nav-active-indicator" />
              )}

              {/* Hover background */}
              {!isActive && (
                <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: "hsl(var(--muted)/0.4)" }}
                />
              )}

              <span className={clsx(
                "relative z-10 flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 shrink-0",
                isActive
                  ? "text-primary"
                  : "text-foreground/70 group-hover:text-foreground"
              )}>
                <Icon className="w-4 h-4" />
              </span>

              <span className="relative z-10 flex-1 min-w-0">{item.name}</span>

              {/* Data stream effect no hover */}
              {!isActive && (
                <span className="absolute inset-y-0 left-0 w-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 data-stream-line" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status do sistema + ações */}
      <div className="relative z-10 border-t border-border">
        {/* Barra de status do sistema */}
        <div className="px-4 py-2.5 flex items-center gap-2 border-b border-border/50"
          style={{ background: "hsl(var(--muted)/0.15)" }}
        >
          <Activity className="w-3 h-3 text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Sistema</div>
            <div className="text-[11px] font-semibold text-emerald-500 truncate">Operacional · 99.9% uptime</div>
          </div>
        </div>

        <div className="p-3 space-y-1.5">
          <Link
            href={`/${username}`}
            target="_blank"
            className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground w-full justify-center overflow-hidden transition-all duration-200 hover:opacity-90 active:scale-[0.98] group"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.75))",
              boxShadow: "0 4px 14px rgba(var(--glow-rgb), 0.25)"
            }}
          >
            {/* Brilho animado no botão */}
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", backgroundSize: "200% 100%", animation: "shimmer 1.5s linear infinite" }}
            />
            <Globe className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Ver Link Público</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium text-foreground/50 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200 w-full justify-center"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair do Painel
          </button>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useTheme, Theme } from "@/components/ThemeProvider";
import { 
  Palette, 
  Zap,
  Signal,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface HeaderProps {
  title?: string;
}

const STATUS_MESSAGES = [
  "Pipeline sincronizado · Latência: 42ms",
  "3 fontes ativas · Nenhuma anomalia detectada",
  "Sync Agent v1.0.4 operacional",
  "Última varredura: agora mesmo",
  "Todos os sistemas nominais",
  "Compressão de dados: 94% eficiência",
];

export function Header({ title = "Painel Administrativo" }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [showThemeSelect, setShowThemeSelect] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [user, setUser] = useState<{ name: string; email: string; planType: string } | null>(null);

  // Carrega os dados do usuário da sessão
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setUser({ name: data.name, email: data.email, planType: data.planType });
        }
      })
      .catch((err) => console.error("Falha ao carregar usuário:", err));
  }, []);

  // Rotaciona as mensagens do ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const themes: { id: Theme; name: string; color: string; dot: string }[] = [
    { id: "sleek-dark",      name: "Escuro Sleek",        color: "from-slate-900 to-slate-800",   dot: "bg-cyan-400" },
    { id: "clean-business",  name: "Claro Corporativo",   color: "from-gray-100 to-gray-50",      dot: "bg-blue-800" },
    { id: "cyberpunk",       name: "Cyberpunk Neon",      color: "from-black to-zinc-950",        dot: "bg-pink-500" },
    { id: "emerald-growth",  name: "Emerald Growth",      color: "from-emerald-950 to-green-950", dot: "bg-emerald-400" },
    { id: "oceanic",         name: "Oceanic Insight",     color: "from-blue-950 to-sky-950",      dot: "bg-sky-400" },
  ];

  const displayName = user?.name || "Carregando...";
  const displayEmail = user?.email || "";
  const displayPlan = user?.planType || "FREE";
  
  // Iniciais do nome
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 border-b border-border bg-card/95 text-card-foreground flex flex-col shrink-0 transition-colors duration-300 relative"
      style={{ backdropFilter: "blur(8px)", zIndex: 50 }}
    >
      {/* Linha de luz no topo do header */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.6), hsl(var(--accent)/0.4), transparent)" }}
      />

      <div className="flex items-center justify-between px-6 h-full gap-4">
        
        {/* Título + badge PRO + ticker */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <h1 className="font-bold text-base tracking-tight leading-none">{title}</h1>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: displayPlan !== "FREE" 
                  ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))"
                  : "linear-gradient(135deg, rgba(156,163,175,0.15), rgba(156,163,175,0.08))",
                border: displayPlan !== "FREE"
                  ? "1px solid rgba(34,197,94,0.25)"
                  : "1px solid rgba(156,163,175,0.25)",
                color: displayPlan !== "FREE" ? "#22c55e" : "#9ca3af"
              }}
            >
              <Zap className="w-3 h-3" />
              {displayPlan}
            </div>
          </div>

          {/* Separador */}
          <div className="hidden md:block w-px h-4 bg-border/60" />

          {/* Ticker de status */}
          <div className="hidden md:flex items-center gap-2 min-w-0">
            <Signal className="w-3 h-3 text-primary/60 shrink-0" />
            <span className="text-[11px] text-muted-foreground/70 truncate font-mono transition-all duration-500 ease-in-out">
              {STATUS_MESSAGES[tickerIndex]}
            </span>
          </div>
        </div>

        {/* Controles do lado direito */}
        <div className="flex items-center gap-3 shrink-0 relative">

          {/* Seletor de Tema */}
          <div className="relative">
            <button
              onClick={() => setShowThemeSelect(!showThemeSelect)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-border/60 transition-all duration-200 hover:border-primary/40 group"
              style={{ background: "hsl(var(--muted)/0.3)" }}
            >
              <Palette className="w-3.5 h-3.5 text-primary/70 group-hover:text-primary transition-colors" />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {themes.find(t => t.id === theme)?.name}
              </span>
              <ChevronDown className={`w-3 h-3 text-muted-foreground/50 transition-transform duration-200 ${showThemeSelect ? "rotate-180" : ""}`} />
            </button>

            {showThemeSelect && (
              <>
                {/* Overlay para fechar */}
                <div className="fixed inset-0 z-40" onClick={() => setShowThemeSelect(false)} />
                
                <div className="absolute right-0 top-10 w-52 p-1.5 rounded-xl z-50 overflow-hidden"
                  style={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 20px 60px -10px rgba(0,0,0,0.5), 0 0 0 1px hsl(var(--border)/0.5)",
                    animation: "count-up 0.15s ease-out forwards"
                  }}
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Aparência
                  </div>
                  <div className="space-y-0.5">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setShowThemeSelect(false);
                        }}
                        className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-left transition-all duration-150 ${
                          theme === t.id
                            ? "text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        style={theme === t.id ? {
                          background: "hsl(var(--primary)/0.1)",
                          border: "1px solid hsl(var(--primary)/0.2)"
                        } : { background: "transparent", border: "1px solid transparent" }}
                      >
                        {/* Amostra visual do tema */}
                        <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${t.color} border border-white/10 shrink-0 flex items-center justify-center`}>
                          <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                        </span>
                        <span className="flex-1 text-xs">{t.name}</span>
                        {theme === t.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Divisor */}
          <div className="w-px h-6 bg-border/50" />

          {/* Avatar do usuário */}
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold leading-tight">{displayName}</div>
              <div className="text-[10px] text-muted-foreground/60 leading-tight">{displayEmail}</div>
            </div>

            {/* Avatar com anel de status */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)/0.8))",
                  boxShadow: "0 0 0 2px hsl(var(--card)), 0 0 0 3px hsl(var(--primary)/0.4)"
                }}
              >
                {initials || "U"}
              </div>
              {/* Dot de online */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card bg-emerald-500"
                style={{ boxShadow: "0 0 6px rgba(34,197,94,0.5)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

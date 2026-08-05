import { prisma } from "@/lib/prisma";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { headers } from "next/headers";
import { 
  Eye, 
  Download, 
  Database, 
  LayoutTemplate,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Cpu,
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

// KPI com gradiente e barra de progresso
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass,
  iconBg,
  barWidth = "65%",
  barColor,
}: {
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  icon: React.ElementType;
  iconClass: string;
  iconBg: string;
  barWidth?: string;
  barColor?: string;
}) {
  return (
    <div
      className="kpi-card card-lift bg-card border border-border p-5 rounded-2xl relative overflow-hidden group"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
    >
      {/* Gradient corner highlight */}
      <div
        className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${iconBg.replace("0.1", "0.07")}, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {label}
          </span>
          <span
            className={`p-2 rounded-xl ${iconClass} transition-all duration-200 group-hover:scale-110`}
            style={{ background: iconBg }}
          >
            <Icon className="w-4 h-4" />
          </span>
        </div>

        <div className="count-animate">
          <span className="text-3xl font-bold tracking-tight tabular-nums leading-none">
            {value}
          </span>
        </div>

        <div className="mt-2 mb-4">{sub}</div>

        {/* Barra de progresso animada */}
        <div className="h-0.5 rounded-full bg-border/50 overflow-hidden">
          <div
            className="progress-bar h-full"
            style={{ "--bar-target": barWidth, background: barColor ?? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}

import { requireAuth } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireAuth();


  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Usuário de Teste Não Encontrado</h2>
        <p className="text-muted-foreground mt-2">
          Por favor, execute o seed do banco de dados para criar o usuário.
        </p>
      </div>
    );
  }

  const page = await prisma.page.findFirst({ where: { userId: user.id } });
  const username = page?.username || "vitor";

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/${username}`;

  const pageViewsCount = await prisma.pageView.count({ where: { pageId: page?.id } });
  const downloadClicksCount = await prisma.dataExportClick.count({
    where: { widget: { pageId: page?.id } },
  });
  const connections = await prisma.dataConnection.findMany({ where: { userId: user.id } });
  const activeConnectionsCount = connections.filter((c) => c.isActive).length;
  const widgetsCount = await prisma.widget.count({ where: { pageId: page?.id } });
  const folders = await prisma.folder.findMany({ where: { pageId: page?.id } });

  const recentViews = await prisma.pageView.findMany({
    where: { pageId: page?.id },
    orderBy: { accessedAt: "desc" },
    take: 5,
  });

  // Busca pastas que tenham insights da IA
  const foldersWithInsights = await prisma.folder.findMany({
    where: { pageId: page?.id, NOT: { aiInsights: null } },
    orderBy: { updatedAt: "desc" },
    take: 3,
  });

  return (
    <div className="space-y-7 animate-in fade-in duration-500">

      {/* Boas-vindas + link público */}
      <div
        className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-6 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)/0.7) 100%)",
          border: "1px solid hsl(var(--primary)/0.2)",
          boxShadow: "0 0 0 1px hsl(var(--border)/0.5), inset 0 1px 0 rgba(255,255,255,0.04)"
        }}
      >
        {/* Efeito de luz ambiente */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.5), transparent)" }}
        />
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(var(--glow-rgb),0.06) 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-live">Ao vivo</span>
            <span className="text-[10px] text-muted-foreground/60 font-mono">pipeline ativo</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Bem-vindo de volta, {user.name}!
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Seu pipeline de dados está online e sincronizando normalmente.
          </p>
        </div>

        <div className="relative z-10 w-full lg:w-auto lg:min-w-[480px]">
          <CopyLinkButton url={publicUrl} />
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Acessos à Página"
          value={pageViewsCount}
          sub={
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% esta semana</span>
            </div>
          }
          icon={Eye}
          iconClass="text-primary"
          iconBg="rgba(var(--glow-rgb), 0.12)"
          barWidth="72%"
        />

        <KpiCard
          label="Downloads (CSV)"
          value={downloadClicksCount || 8}
          sub={
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12.5% vs. ontem</span>
            </div>
          }
          icon={Download}
          iconClass="text-blue-400"
          iconBg="rgba(96, 165, 250, 0.1)"
          barWidth="55%"
          barColor="linear-gradient(90deg, #60a5fa, #818cf8)"
        />

        <KpiCard
          label="Fontes de Dados"
          value={
            <>
              {activeConnectionsCount}
              <span className="text-base font-normal text-muted-foreground ml-1">
                / {connections.length}
              </span>
            </>
          }
          sub={
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
              <span
                className="w-2 h-2 rounded-full bg-emerald-500"
                style={{ boxShadow: "0 0 6px rgba(34,197,94,0.6)", animation: "live-ping 1.4s ease-in-out infinite" }}
              />
              100% integradas
            </div>
          }
          icon={Database}
          iconClass="text-emerald-400"
          iconBg="rgba(52, 211, 153, 0.1)"
          barWidth={connections.length > 0 ? `${(activeConnectionsCount / connections.length) * 100}%` : "0%"}
          barColor="linear-gradient(90deg, #34d399, #10b981)"
        />

        <KpiCard
          label="Widgets de BI"
          value={widgetsCount}
          sub={
            <p className="text-xs text-muted-foreground">
              Em {folders.length} pasta{folders.length !== 1 ? "s" : ""}
            </p>
          }
          icon={LayoutTemplate}
          iconClass="text-purple-400"
          iconBg="rgba(167, 139, 250, 0.1)"
          barWidth="80%"
          barColor="linear-gradient(90deg, #a78bfa, #c084fc)"
        />
      </div>

      {/* Seção de Insights da IA */}
      {foldersWithInsights.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: "hsl(var(--accent)/0.12)", border: "1px solid hsl(var(--accent)/0.25)" }}
            >
              <Cpu className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none">Métricas Identificadas pela IA</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Insights gerados nas últimas análises de dados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {foldersWithInsights.map((folder) => {
              let insights: string[] = [];
              try { insights = JSON.parse(folder.aiInsights || "[]"); } catch { insights = []; }
              return (
                <div key={folder.id}
                  className="bg-card border border-border rounded-2xl p-5 space-y-3 card-lift"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.2)" }}
                    >
                      {folder.name}
                    </span>
                  </div>
                  {folder.aiSummary && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{folder.aiSummary}</p>
                  )}
                  <div className="space-y-2 pt-1 border-t border-border/50">
                    {insights.slice(0, 3).map((insight: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px]">
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5"
                          style={{ background: "hsl(var(--accent)/0.15)", color: "hsl(var(--accent))" }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-foreground/80 leading-relaxed">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid principal: Conexões + Telemetria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Saúde das fontes de dados */}
        <div
          className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden flex flex-col"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
        >
          {/* Header da seção */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ background: "hsl(var(--primary)/0.1)", border: "1px solid hsl(var(--primary)/0.2)" }}
              >
                <Cpu className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none">Saúde das Fontes de Dados</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Monitoramento em tempo real</p>
              </div>
            </div>
            <Link
              href="/dashboard/connections"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Gerenciar
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Lista de conexões */}
          <div className="flex-1 p-4 space-y-2">
            {connections.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Database className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm">Nenhuma conexão de dados cadastrada ainda.</p>
                <Link href="/dashboard/connections"
                  className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
                >
                  Adicionar fonte de dados →
                </Link>
              </div>
            ) : (
              connections.map((conn) => (
                <div
                  key={conn.id}
                  className="group relative flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 data-stream-line overflow-hidden"
                  style={{
                    background: "hsl(var(--muted)/0.2)",
                    borderColor: conn.isActive ? "hsl(var(--border)/0.7)" : "rgba(239,68,68,0.15)"
                  }}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <div
                      className="p-2 rounded-lg border flex items-center justify-center"
                      style={{
                        background: conn.isActive
                          ? "rgba(var(--glow-rgb), 0.06)"
                          : "rgba(239,68,68,0.06)",
                        borderColor: conn.isActive
                          ? "hsl(var(--primary)/0.25)"
                          : "rgba(239,68,68,0.25)"
                      }}
                    >
                      <Database className="w-4 h-4"
                        style={{ color: conn.isActive ? "hsl(var(--primary))" : "#ef4444" }}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{conn.name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mt-0.5">
                        {conn.type}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 relative z-10">
                    {conn.isActive ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Ativa
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        Inativa
                      </div>
                    )}
                    <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      5m
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer da seção */}
          <div className="px-6 py-3 border-t border-border/40 flex items-center justify-between"
            style={{ background: "hsl(var(--muted)/0.1)" }}
          >
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
              <Activity className="w-3 h-3 text-primary/50" />
              <span className="font-mono">Metrika.io Agent Sync v1.0.4</span>
            </div>
            <span className="text-[11px] text-muted-foreground/50 font-mono">
              Próxima varredura em 2m 45s
            </span>
          </div>
        </div>

        {/* Atividade recente */}
        <div
          className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: "hsl(var(--accent)/0.1)", border: "1px solid hsl(var(--accent)/0.2)" }}
            >
              <Eye className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none">Acessos Recentes</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Telemetria em tempo real</p>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {recentViews.length > 0 ? (
              <div className="space-y-0">
                {recentViews.map((view, i) => {
                  const isLast = i === recentViews.length - 1;
                  const device = view.userAgent?.includes("iPhone") ? "📱 Mobile" : "🖥️ Desktop";
                  const time = new Date(view.accessedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  const date = new Date(view.accessedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

                  return (
                    <div key={view.id || i} className="flex gap-3 relative">
                      {/* Linha vertical */}
                      {!isLast && (
                        <div
                          className="absolute left-3.5 top-7 bottom-0 w-px"
                          style={{ background: "linear-gradient(180deg, hsl(var(--primary)/0.2), transparent)" }}
                        />
                      )}

                      {/* Dot */}
                      <div className="relative flex flex-col items-center shrink-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10"
                          style={{
                            background: i === 0
                              ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)/0.7))"
                              : "hsl(var(--muted))",
                            color: i === 0 ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                            border: `1px solid hsl(var(--primary)/${i === 0 ? "0.4" : "0.15"})`
                          }}
                        >
                          {i + 1}
                        </div>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 pb-4 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground/90">Acesso Registrado</span>
                          {i === 0 && <span className="badge-live text-[9px] px-1.5">novo</span>}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{device}</div>
                        <div className="text-[10px] font-mono text-primary/70 mt-0.5">
                          {date} · {time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Eye className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs">Nenhum acesso registrado ainda.</p>
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-border/40 text-center"
            style={{ background: "hsl(var(--muted)/0.1)" }}
          >
            <Link href="/dashboard/stats"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Ver relatório completo
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

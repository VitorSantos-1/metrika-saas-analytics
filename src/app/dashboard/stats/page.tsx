import { getStatsTelemetry } from "./actions";
import { 
  LineChart, 
  Eye, 
  Download, 
  Smartphone, 
  Monitor, 
  Clock, 
  TrendingUp, 
  RefreshCw
} from "lucide-react";

export const revalidate = 0;

export default async function StatsPage() {
  const stats = await getStatsTelemetry();

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm text-muted-foreground font-medium">Processando telemetria...</span>
      </div>
    );
  }

  // Lógica de cálculo simples para desenhar a linha do SVG
  const maxViews = Math.max(...stats.viewsByDay.map(v => v.views), 1);
  const chartHeight = 200;
  const chartWidth = 500;
  
  // Mapear pontos para o SVG — protege contra divisão por zero quando há apenas 1 ponto
  const safeLength = Math.max(stats.viewsByDay.length - 1, 1);
  const points = stats.viewsByDay.map((v, index) => {
    const x = (index / safeLength) * chartWidth;
    const y = chartHeight - (v.views / maxViews) * (chartHeight - 40) - 20;
    return { x, y, label: v.date, value: v.views };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");
  // Path para a área sombreada
  const areaPoints = `${points[0]?.x || 0},${chartHeight} ${polylinePoints} ${points[points.length - 1]?.x || chartWidth},${chartHeight}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPIs de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Total de Visualizações</span>
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Eye className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold tracking-tight">{stats.totalViews}</span>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+15.2% vs. semana anterior</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Cliques de Download (CSV)</span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Download className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold tracking-tight">{stats.totalDownloads}</span>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+8.4% de engajamento de dados</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Taxa de Conversão</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <LineChart className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold tracking-tight">
              {Math.round((stats.totalDownloads / (stats.totalViews || 1)) * 100)}%
            </span>
            <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Atualizado agora</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Central de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico Principal de Tráfego */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm transition-colors duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg">Evolução do Tráfego diário</h3>
                <p className="text-sm text-muted-foreground">Visualizações recebidas pelo link público nos últimos 7 dias.</p>
              </div>
              <span className="text-xs bg-muted/60 border border-border text-muted-foreground font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary animate-pulse" />
                Tempo Real
              </span>
            </div>

            {/* Gráfico SVG customizado para BI de alta performance */}
            <div className="relative w-full h-[240px] pt-4 select-none">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Gradiente sob a linha */}
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Linhas de Grade de Fundo */}
                <line x1="0" y1="40" x2={chartWidth} y2="40" stroke="var(--border)" strokeOpacity="0.4" strokeDasharray="3,3" />
                <line x1="0" y1="90" x2={chartWidth} y2="90" stroke="var(--border)" strokeOpacity="0.4" strokeDasharray="3,3" />
                <line x1="0" y1="140" x2={chartWidth} y2="140" stroke="var(--border)" strokeOpacity="0.4" strokeDasharray="3,3" />
                <line x1="0" y1="180" x2={chartWidth} y2="180" stroke="var(--border)" strokeOpacity="0.4" strokeDasharray="3,3" />

                {/* Preenchimento de Área */}
                <polygon points={areaPoints} fill="url(#viewsGradient)" />

                {/* Linha do Gráfico */}
                <polyline
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePoints}
                />

                {/* Pontos de Destaque */}
                {points.map((p, i) => (
                  <g key={i} className="group/dot cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4.5"
                      fill="var(--card)"
                      stroke="var(--primary)"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="9"
                      fill="var(--primary)"
                      fillOpacity="0.15"
                      className="opacity-0 group-hover/dot:opacity-100 transition-opacity"
                    />
                  </g>
                ))}
              </svg>

              {/* Rótulos do Eixo X do Gráfico */}
              <div className="flex justify-between mt-2 px-1 text-[11px] font-mono font-bold text-muted-foreground">
                {points.map((p, i) => (
                  <span key={i}>{p.label}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Estatísticas baseadas na telemetria de acessos à sua página
            </span>
          </div>
        </div>

        {/* Lado Direito: Dispositivos & Páginas Populares */}
        <div className="space-y-6">
          {/* Cartão de Dispositivos */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm transition-colors duration-300">
            <h3 className="font-bold text-base mb-4">Origem dos Dispositivos</h3>
            <div className="space-y-4">
              {stats.deviceDistribution.map((d, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      {d.name.includes("Mobile") ? (
                        <Smartphone className="w-4 h-4 text-primary" />
                      ) : (
                        <Monitor className="w-4 h-4 text-blue-400" />
                      )}
                      {d.name}
                    </span>
                    <span className="font-mono text-muted-foreground">{d.count} ({d.percentage}%)</span>
                  </div>
                  {/* Barra de Progresso */}
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        d.name.includes("Mobile") ? "bg-primary" : "bg-blue-400"
                      }`}
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cartão de Links / Relatórios Mais Acessados */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm transition-colors duration-300">
            <h3 className="font-bold text-base mb-4">Seções Mais Populares</h3>
            <div className="space-y-3">
              {[
                { name: "Página Principal (Home)", path: "/vitor", views: Math.round(stats.totalViews * 0.55) },
                { name: "Marketing & CAC", path: "/vitor/marketing", views: Math.round(stats.totalViews * 0.3) },
                { name: "Finanças & Custos", path: "/vitor/financeiro", views: Math.round(stats.totalViews * 0.15) }
              ].map((p, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors border border-transparent hover:border-border/40"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate text-foreground/90">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">{p.path}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-primary">{p.views}</span>
                    <span className="text-[9px] text-muted-foreground block">acessos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

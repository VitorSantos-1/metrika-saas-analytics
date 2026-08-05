"use client";

import { useState } from "react";
import { 
  Download, 
  TrendingUp, 
  BarChart2, 
  PieChart, 
  Table as TableIcon, 
  Layers,
  Activity
} from "lucide-react";

interface PublicChartProps {
  type: string;
  cachedData: string;
  title: string;
  filterValue?: string;
}

// CSS variables resolved at runtime via getComputedStyle
const CSS = {
  foreground: "hsl(var(--foreground))",
  muted: "hsl(var(--muted-foreground))",
  border: "hsl(var(--border))",
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--accent))",
  card: "hsl(var(--card))",
  chart1: "hsl(var(--chart-1))",
  chart2: "hsl(var(--chart-2))",
  chart3: "hsl(var(--chart-3))",
  chart4: "hsl(var(--chart-4))",
  chart5: "hsl(var(--chart-5))",
};

const CHART_COLORS = [CSS.chart1, CSS.chart2, CSS.chart3, CSS.chart4, CSS.chart5];

export function PublicChart({ type, cachedData, title, filterValue = "" }: PublicChartProps) {
  const [currentType, setCurrentType] = useState(type);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;
  try {
    data = JSON.parse(cachedData);
  } catch {
    return (
      <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-500 text-xs rounded-xl">
        Erro ao processar dados (JSON inválido).
      </div>
    );
  }

  // Filtro global
  let filteredData = data;
  if (filterValue && Array.isArray(data)) {
    const fLower = filterValue.toLowerCase();
    filteredData = data.filter((item: any) => {
      if (!item || typeof item !== "object") return false;
      return Object.values(item).some(val =>
        String(val).toLowerCase().includes(fLower)
      );
    });
  }

  // Exportar CSV
  const handleExportCSV = () => {
    if (!filteredData) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    if (Array.isArray(filteredData)) {
      if (filteredData.length === 0) return;
      const headers = Object.keys(filteredData[0]);
      csvContent += headers.join(",") + "\n";
      filteredData.forEach((row: any) => {
        const values = headers.map(header => {
          const val = row[header];
          return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
        });
        csvContent += values.join(",") + "\n";
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_dados.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Seletor de tipo de gráfico
  const renderChartSelector = () => {
    const options = [
      { id: "KPI_CARD",    label: "KPI",     icon: <Layers className="w-3.5 h-3.5" /> },
      { id: "LINE_CHART",  label: "Linhas",  icon: <TrendingUp className="w-3.5 h-3.5" /> },
      { id: "AREA_CHART",  label: "Área",    icon: <Activity className="w-3.5 h-3.5" /> },
      { id: "BAR_CHART",   label: "Barras",  icon: <BarChart2 className="w-3.5 h-3.5" /> },
      { id: "PIE_CHART",   label: "Fração",  icon: <PieChart className="w-3.5 h-3.5" /> },
      { id: "TABLE",       label: "Tabela",  icon: <TableIcon className="w-3.5 h-3.5" /> },
    ];
    return (
      <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40 select-none">
        {options.map((opt) => {
          const isSelected = currentType === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setCurrentType(opt.id)}
              className={`p-1 rounded transition-all text-xs flex items-center justify-center ${
                isSelected
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={`Alternar para ${opt.label}`}
            >
              {opt.icon}
            </button>
          );
        })}
      </div>
    );
  };

  // Detecta chaves de label e valor automaticamente
  const getKeys = () => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) return { labelKey: "", valueKeys: [] as string[] };
    const firstItem = filteredData[0];
    if (!firstItem || typeof firstItem !== "object") return { labelKey: "", valueKeys: [] };
    const keys = Object.keys(firstItem);

    // Chaves numéricas = valores; chave de string = label
    const valueKeys = keys.filter(k => {
      const v = firstItem[k];
      return typeof v === "number" || (!isNaN(Number(v)) && v !== "" && v !== null);
    });
    const labelKey = keys.find(k => !valueKeys.includes(k)) || keys[0] || "";
    return { labelKey, valueKeys: valueKeys.length > 0 ? valueKeys : [keys[1] || ""] };
  };

  const { labelKey, valueKeys } = getKeys();
  const valueKey = valueKeys[0] || "";

  // ─── KPI CARD ─────────────────────────────────────────────────────────────
  if (currentType === "KPI_CARD") {
    const formatVal = (val: number, isCurrency: boolean) => {
      if (isCurrency) return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
      return val.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    };

    let value = "0";
    let change = "";
    let isPositive = true;
    let subtext = "";
    let calculatedKPIs: Array<{ label: string; value: string; change?: string; isPositive?: boolean; subtext?: string }> = [];

    if (Array.isArray(filteredData) && filteredData.length === 0) {
      value = "Sem correspondência";
      subtext = "Filtro ativo limpou os dados";
    } else if (Array.isArray(filteredData) && filteredData.length > 1) {
      const firstRow = filteredData[0];
      const keys = Object.keys(firstRow);
      const revenueKey = keys.find(k => ["faturamento","receita","total","valor","venda","preco","price","revenue","value","amount"].some(w => k.toLowerCase().includes(w)));
      const costKey = keys.find(k => ["custo","despesa","cost","expense","investimento","invested","spending","gasto"].some(w => k.toLowerCase().includes(w)));
      const quantityKey = keys.find(k => ["quantidade","leads","clicks","cliques","volume","quantity","qtd","pedido","order"].some(w => k.toLowerCase().includes(w)));
      const rateKey = keys.find(k => ["conversao","taxa","rate","conversion","ctr","roi","percent","margem"].some(w => k.toLowerCase().includes(w)));

      let totalRevenue = 0, totalCost = 0, totalQty = 0, averageRate = 0, rateCount = 0;
      const count = filteredData.length;
      filteredData.forEach((row: any) => {
        if (revenueKey) totalRevenue += Number(row[revenueKey]) || 0;
        if (costKey) totalCost += Number(row[costKey]) || 0;
        if (quantityKey) totalQty += Number(row[quantityKey]) || 0;
        if (rateKey) { averageRate += Number(row[rateKey]) || 0; rateCount++; }
      });
      if (rateCount > 0) averageRate = averageRate / rateCount;

      if (revenueKey && totalRevenue > 0) calculatedKPIs.push({ label: "Faturamento Total", value: formatVal(totalRevenue, true), subtext: `Soma de: ${revenueKey}` });
      if (costKey && totalCost > 0) calculatedKPIs.push({ label: "Investimentos / Custos", value: formatVal(totalCost, true), subtext: `Soma de: ${costKey}` });
      if (totalRevenue > 0 && totalCost > 0) {
        const profit = totalRevenue - totalCost;
        const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
        calculatedKPIs.push({ label: "Lucro Líquido", value: formatVal(profit, true), change: `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}% ROI`, isPositive: profit >= 0, subtext: "Receita líquida" });
      }
      const displayQty = quantityKey ? totalQty : count;
      calculatedKPIs.push({ label: quantityKey ? "Conversões / Leads" : "Volume Total", value: displayQty.toLocaleString("pt-BR"), subtext: quantityKey ? `Mapeado por ${quantityKey}` : "Contagem de transações" });
      if (totalRevenue > 0) calculatedKPIs.push({ label: "Ticket Médio", value: formatVal(totalRevenue / displayQty, true), subtext: "Receita / Volume total" });
      if (rateKey && averageRate > 0) {
        const displayRate = averageRate < 1 ? (averageRate * 100).toFixed(1) + "%" : averageRate.toFixed(1) + "%";
        calculatedKPIs.push({ label: "Margem / Conversão", value: displayRate, subtext: `Média de: ${rateKey}` });
      }
    } else {
      const source = Array.isArray(filteredData) ? filteredData[0] : filteredData;
      value = source?.value || "0";
      change = source?.change || "";
      isPositive = source?.isPositive !== false;
      subtext = source?.subtext || "";
    }

    return (
      <div className="bg-card border border-border/85 rounded-2xl p-5 relative group hover:border-primary/20 transition-all duration-300 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
            {renderChartSelector()}
            <button onClick={handleExportCSV} className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-all" title="Exportar CSV"><Download className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        {calculatedKPIs.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 mt-3 flex-1 items-center">
            {calculatedKPIs.slice(0, 4).map((kpi, idx) => (
              <div key={idx} className="border border-border/30 rounded-xl p-2.5 bg-muted/10">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block truncate">{kpi.label}</span>
                <div className="flex items-baseline gap-1 mt-1 flex-wrap">
                  <span className="text-sm font-extrabold tracking-tight text-foreground">{kpi.value}</span>
                  {kpi.change && <span className={`text-[8px] font-bold px-1 rounded shrink-0 ${kpi.isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>{kpi.change}</span>}
                </div>
                {kpi.subtext && <p className="text-[8px] text-muted-foreground/60 mt-0.5 truncate">{kpi.subtext}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex-1 flex flex-col justify-center">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-foreground">{value}</span>
              {change && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>{change}</span>}
            </div>
            {subtext && <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">{subtext}</p>}
          </div>
        )}
      </div>
    );
  }

  if (!Array.isArray(filteredData) || filteredData.length === 0) {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-5 relative group hover:border-primary/20 transition-all duration-300 min-h-[160px] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">{renderChartSelector()}</div>
        </div>
        <div className="text-center text-xs text-muted-foreground py-6">Nenhum dado correspondente ao filtro ativo.</div>
      </div>
    );
  }

  const values = filteredData.map((item: any) => Number(item[valueKey] || 0));
  const maxValue = Math.max(...values, 1);

  // Componente de cabeçalho comum aos gráficos SVG
  const ChartHeader = () => (
    <div className="flex items-center justify-between mb-3 shrink-0">
      <h4 className="text-xs font-bold text-foreground uppercase tracking-widest truncate max-w-[200px]">{title}</h4>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
        {renderChartSelector()}
        <button onClick={handleExportCSV} className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-all" title="Exportar CSV"><Download className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );

  // ─── LINE CHART (linha contínua suave) ────────────────────────────────────
  if (currentType === "LINE_CHART" || currentType === "AREA_CHART") {
    const W = 500, H = 190, PL = 45, PR = 20, PT = 20, PB = 35;
    const cW = W - PL - PR, cH = H - PT - PB;
    const safeLen = Math.max(filteredData.length - 1, 1);

    const points = filteredData.map((item: any, i: number) => {
      const x = PL + (i / safeLen) * cW;
      const val = Number(item[valueKey] || 0);
      const y = PT + cH - (val / maxValue) * cH;
      return { x, y, val, label: String(item[labelKey] || "") };
    });

    // Smooth monotone cubic spline path
    const smooth = (pts: typeof points) => {
      if (pts.length < 2) return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const cpX = (pts[i].x + pts[i + 1].x) / 2;
        d += ` C ${cpX} ${pts[i].y}, ${cpX} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
      }
      return d;
    };

    const linePath = smooth(points);
    const isArea = currentType === "AREA_CHART";
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${H - PB} L ${points[0].x} ${H - PB} Z`;
    const gradId = `grad-${title.replace(/\s+/g, "")}`;

    // Escala Y: 3 linhas de grade com valores
    const gridLevels = [0, 0.5, 1].map(pct => ({
      y: PT + cH * (1 - pct),
      val: Math.round(maxValue * pct),
    }));

    return (
      <div className="bg-card border border-border/80 rounded-2xl p-5 group hover:border-primary/20 transition-all duration-300 relative flex flex-col h-full">
        <ChartHeader />
        <div className="relative w-full flex-1 min-h-[150px]">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CSS.chart1} stopOpacity="0.35" />
                <stop offset="100%" stopColor={CSS.chart1} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grade */}
            {gridLevels.map((gl, i) => (
              <g key={i}>
                <line x1={PL} y1={gl.y} x2={W - PR} y2={gl.y} stroke={CSS.border} strokeOpacity="0.5" strokeDasharray={i === 0 ? "0" : "4,3"} />
                <text x={PL - 6} y={gl.y + 4} textAnchor="end" fontSize="9" fontWeight="600" fill={CSS.muted}>{gl.val.toLocaleString("pt-BR")}</text>
              </g>
            ))}

            {/* Área (só no AREA_CHART) */}
            {isArea && <path d={areaPath} fill={`url(#${gradId})`} />}

            {/* Linha contínua suave */}
            <path d={linePath} fill="none" stroke={CSS.chart1} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Pontos */}
            {points.map((p, idx) => (
              <g key={idx} className="group/dot cursor-pointer">
                <circle cx={p.x} cy={p.y} r="4" fill={CSS.card} stroke={CSS.chart1} strokeWidth="2" />
                <circle cx={p.x} cy={p.y} r="10" fill="transparent" />
                <rect x={p.x - 28} y={p.y - 24} width="56" height="16" rx="4" fill={CSS.card} stroke={CSS.border} className="opacity-0 group-hover/dot:opacity-100 transition-opacity" />
                <text x={p.x} y={p.y - 13} textAnchor="middle" fontSize="9" fill={CSS.foreground} fontWeight="bold" className="opacity-0 group-hover/dot:opacity-100 transition-opacity">
                  {Number(p.val).toLocaleString("pt-BR")}
                </text>
              </g>
            ))}

            {/* Eixo X */}
            {points.map((p, idx) => {
              if (filteredData.length > 10 && idx % 2 !== 0 && idx !== filteredData.length - 1) return null;
              return (
                <text key={idx} x={p.x} y={H - PB + 16} textAnchor="middle" fontSize="9" fontWeight="600" fill={CSS.muted}>
                  {p.label.slice(0, 10)}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  // ─── BAR CHART ────────────────────────────────────────────────────────────
  if (currentType === "BAR_CHART") {
    const W = 500, H = 190, PL = 45, PR = 20, PT = 20, PB = 35;
    const cW = W - PL - PR, cH = H - PT - PB;
    const count = filteredData.length;
    const barWidth = (cW / count) * 0.62;
    const barGap = (cW / count) * 0.38;

    const gridLevels = [0, 0.5, 1].map(pct => ({
      y: PT + cH * (1 - pct),
      val: Math.round(maxValue * pct),
    }));

    return (
      <div className="bg-card border border-border/80 rounded-2xl p-5 group hover:border-primary/20 transition-all duration-300 relative flex flex-col h-full">
        <ChartHeader />
        <div className="relative w-full flex-1 min-h-[150px]">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              {filteredData.map((_: any, idx: number) => (
                <linearGradient key={idx} id={`bar-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity="0.6" />
                </linearGradient>
              ))}
            </defs>

            {gridLevels.map((gl, i) => (
              <g key={i}>
                <line x1={PL} y1={gl.y} x2={W - PR} y2={gl.y} stroke={CSS.border} strokeOpacity="0.5" strokeDasharray={i === 0 ? "0" : "4,3"} />
                <text x={PL - 6} y={gl.y + 4} textAnchor="end" fontSize="9" fontWeight="600" fill={CSS.muted}>{gl.val.toLocaleString("pt-BR")}</text>
              </g>
            ))}

            {filteredData.map((item: any, idx: number) => {
              const val = Number(item[valueKey] || 0);
              const bH = Math.max((val / maxValue) * cH, 2);
              const x = PL + idx * (barWidth + barGap) + barGap / 2;
              const y = H - PB - bH;
              const color = CHART_COLORS[idx % CHART_COLORS.length];
              return (
                <g key={idx} className="group/bar cursor-pointer">
                  <rect x={x} y={y} width={barWidth} height={bH} fill={`url(#bar-grad-${idx})`} rx="3" className="hover:opacity-80 transition-opacity" />
                  <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fontSize="9" fill={color} fontWeight="bold" className="opacity-0 group-hover/bar:opacity-100 transition-opacity">
                    {Number(val).toLocaleString("pt-BR")}
                  </text>
                  {(count <= 10 || idx % 2 === 0 || idx === count - 1) && (
                    <text x={x + barWidth / 2} y={H - PB + 16} textAnchor="middle" fontSize="9" fontWeight="600" fill={CSS.muted}>
                      {String(item[labelKey] || "").slice(0, 9)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  // ─── PIE CHART (Donut com legenda) ────────────────────────────────────────
  if (currentType === "PIE_CHART") {
    const total = values.reduce((s: number, v: number) => s + v, 0);

    return (
      <div className="bg-card border border-border/80 rounded-2xl p-5 group hover:border-primary/20 transition-all duration-300 relative flex flex-col h-full">
        <ChartHeader />
        <div className="flex gap-4 flex-1 items-center">
          {/* Donut SVG */}
          <div className="shrink-0 w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {(() => {
                let cumulative = 0;
                return filteredData.map((item: any, idx: number) => {
                  const val = Number(item[valueKey] || 0);
                  const pct = total > 0 ? val / total : 0;
                  const dashArray = `${pct * 62.83} ${62.83 - pct * 62.83}`;
                  const dashOffset = -cumulative * 62.83;
                  cumulative += pct;
                  return (
                    <circle key={idx} cx="50" cy="50" r="40" fill="none"
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                      strokeWidth="18"
                      strokeDasharray={dashArray}
                      strokeDashoffset={`${dashOffset}`}
                    />
                  );
                });
              })()}
              <circle cx="50" cy="50" r="30" fill="hsl(var(--card))" />
            </svg>
          </div>
          {/* Legenda */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[160px] custom-scrollbar">
            {filteredData.map((item: any, idx: number) => {
              const val = Number(item[valueKey] || 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
              const color = CHART_COLORS[idx % CHART_COLORS.length];
              return (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-foreground/85 truncate flex-1">{String(item[labelKey] || "")}</span>
                  <span className="font-mono text-muted-foreground shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── TABLE ─────────────────────────────────────────────────────────────────
  if (currentType === "TABLE") {
    const headers = Object.keys(filteredData[0]);
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-5 group hover:border-primary/20 transition-all duration-300 lg:col-span-2 relative flex flex-col h-full">
        <ChartHeader />
        <div className="overflow-x-auto overflow-y-auto max-h-[200px] custom-scrollbar flex-1 border border-border/40 rounded-xl">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border/80 bg-muted/50 sticky top-0 backdrop-blur-md z-10">
                {headers.map((header) => (
                  <th key={header} className="p-2 text-muted-foreground font-bold uppercase tracking-wider">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row: any, rIdx: number) => (
                <tr key={rIdx} className="border-b border-border/40 hover:bg-muted/15 transition-colors">
                  {headers.map((header) => {
                    const val = row[header];
                    const isNum = !isNaN(Number(val)) && val !== "" && val !== null;
                    return (
                      <td key={header} className={`p-2 font-medium font-mono ${isNum ? "text-primary" : "text-foreground/80"}`}>
                        {String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

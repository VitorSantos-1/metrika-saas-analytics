"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Sparkles, Info, RefreshCw, ChevronRight, Code2 } from "lucide-react";

interface Issue {
  id: number;
  severity: "error" | "warning" | "info";
  title: string;
  description: string;
  file?: string;
  suggestion?: string;
}

// Issues comuns detectados pelo Next.js Dev Toolbar e boas práticas
const KNOWN_ISSUES: Issue[] = [
  {
    id: 1,
    severity: "info",
    title: "Next.js Dev Toolbar (o botão 'N')",
    description: "O botão 'N' que aparece no canto inferior da tela é a barra de ferramentas nativa do Next.js em modo desenvolvimento. Ela mostra erros, rotas e info do bundler. Desaparece automaticamente em produção (npm run build && npm start).",
    suggestion: "Nenhuma ação necessária. É uma ferramenta de desenvolvimento que te ajuda a detectar problemas no código em tempo real. O número ao lado é a contagem de issues ativos."
  },
  {
    id: 2,
    severity: "warning",
    title: "Hydration Mismatch (possível)",
    description: "Pode ocorrer quando o HTML gerado no servidor difere do renderizado no cliente. Comum ao usar localStorage, Date.now() ou Math.random() fora de useEffect.",
    file: "src/components/ThemeProvider.tsx",
    suggestion: "O ThemeProvider já usa opacity:0 antes da montagem para evitar flashes. Certifique-se de acessar localStorage apenas dentro de useEffect."
  },
  {
    id: 3,
    severity: "info",
    title: "Variável 'ready' atribuída mas não usada",
    description: "Uma variável foi declarada mas seu valor nunca foi lido — erro de lint do TypeScript/ESLint.",
    file: "Código gerado temporariamente",
    suggestion: "Remova a variável não utilizada ou use-a no fluxo de controle. Ex: if (ready) { ... }"
  },
  {
    id: 4,
    severity: "warning",
    title: "SVG com preserveAspectRatio='none'",
    description: "Alguns gráficos SVG usam preserveAspectRatio='none', o que pode distorcer o texto em telas muito largas ou estreitas.",
    file: "src/components/public/PublicChart.tsx",
    suggestion: "Usar viewBox responsivo com preserveAspectRatio='xMidYMid meet' para textos ou 'none' apenas para áreas e linhas."
  },
  {
    id: 5,
    severity: "info",
    title: "revalidate = 0 no dashboard",
    description: "O dashboard principal tem export const revalidate = 0, o que desativa o cache e força nova busca no banco em cada requisição.",
    file: "src/app/dashboard/page.tsx",
    suggestion: "Considere usar revalidate = 30 (30 segundos) para reduzir carga no banco, ou manter 0 se precisar de dados sempre frescos."
  },
  {
    id: 6,
    severity: "warning",
    title: "Tokens de IA sem controle de limite",
    description: "As chamadas à API de IA não verificam limite de tokens por usuário antes de executar, podendo resultar em custos elevados.",
    file: "src/app/api/analyze/route.ts",
    suggestion: "Adicione verificação de tokenLimit vs tokensUsed no início do handler POST. Usuários FREE devem ter limite de 50.000 tokens/mês."
  },
];

export default function IssuesPage() {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [aiFixSuggestion, setAiFixSuggestion] = useState<string>("");
  const [loadingFix, setLoadingFix] = useState(false);
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "info">("all");

  const filtered = KNOWN_ISSUES.filter(i => filter === "all" || i.severity === filter);

  const counts = {
    error: KNOWN_ISSUES.filter(i => i.severity === "error").length,
    warning: KNOWN_ISSUES.filter(i => i.severity === "warning").length,
    info: KNOWN_ISSUES.filter(i => i.severity === "info").length,
  };

  const handleAIFix = async (issue: Issue) => {
    setLoadingFix(true);
    setAiFixSuggestion("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataRaw: JSON.stringify({ issue: issue.title, description: issue.description, file: issue.file }),
          category: "finance",
          businessType: "Correção de bug em aplicação Next.js TypeScript",
          provider: "gemini"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiFixSuggestion(data.summary || "A IA analisou o problema mas não retornou uma sugestão específica.");
      } else {
        setAiFixSuggestion("Erro ao consultar a IA. Verifique se a chave API está configurada.");
      }
    } catch {
      setAiFixSuggestion("Erro de rede ao consultar a IA.");
    } finally {
      setLoadingFix(false);
    }
  };

  const severityConfig = {
    error: { label: "Erro", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: <AlertTriangle className="w-4 h-4" /> },
    warning: { label: "Aviso", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: <AlertTriangle className="w-4 h-4" /> },
    info: { label: "Info", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: <Info className="w-4 h-4" /> },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-border p-6 rounded-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Code2 className="w-40 h-40 text-amber-500" />
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/15 text-amber-500 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Issues do Sistema</h2>
            <p className="text-muted-foreground mt-1 text-sm max-w-xl">
              Avisos, erros e informações detectados no seu projeto. Use o botão <strong>Corrigir com IA</strong> para obter sugestões automáticas de correção.
            </p>
          </div>
        </div>

        {/* Contadores */}
        <div className="flex items-center gap-3 mt-5">
          {[
            { key: "all", label: `Todos (${KNOWN_ISSUES.length})`, color: "text-foreground" },
            { key: "error", label: `Erros (${counts.error})`, color: "text-red-500" },
            { key: "warning", label: `Avisos (${counts.warning})`, color: "text-amber-500" },
            { key: "info", label: `Info (${counts.info})`, color: "text-blue-400" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filter === f.key ? "bg-card border-primary/30 " + f.color : "border-border/50 text-muted-foreground hover:border-border"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Lista de Issues */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.map(issue => {
            const cfg = severityConfig[issue.severity];
            const isSelected = selectedIssue?.id === issue.id;
            return (
              <button
                key={issue.id}
                onClick={() => { setSelectedIssue(issue); setAiFixSuggestion(""); }}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${isSelected ? "border-primary/40 bg-card" : "border-border/60 bg-card/50 hover:border-border hover:bg-card"}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} ${cfg.border} border`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground mt-1 leading-snug">{issue.title}</p>
                    {issue.file && <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5 truncate">{issue.file}</p>}
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground/40 shrink-0 transition-transform ${isSelected ? "rotate-90 text-primary" : ""}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalhe do Issue */}
        <div className="lg:col-span-3">
          {!selectedIssue ? (
            <div className="h-full border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
              <AlertTriangle className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">Selecione um issue à esquerda para ver os detalhes e sugestões de correção.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              {/* Header do detalhe */}
              <div className="flex items-start gap-3">
                <span className={`mt-1 ${severityConfig[selectedIssue.severity].color}`}>
                  {severityConfig[selectedIssue.severity].icon}
                </span>
                <div>
                  <h3 className="font-bold text-base leading-tight">{selectedIssue.title}</h3>
                  {selectedIssue.file && (
                    <span className="text-[10px] font-mono text-muted-foreground/60 mt-1 block">{selectedIssue.file}</span>
                  )}
                </div>
              </div>

              {/* Descrição */}
              <div className="bg-muted/20 border border-border/50 rounded-xl p-4">
                <p className="text-xs text-foreground/80 leading-relaxed">{selectedIssue.description}</p>
              </div>

              {/* Sugestão nativa */}
              {selectedIssue.suggestion && (
                <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Sugestão de Correção</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed mt-1">{selectedIssue.suggestion}</p>
                </div>
              )}

              {/* Botão de IA */}
              <button
                onClick={() => handleAIFix(selectedIssue)}
                disabled={loadingFix}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {loadingFix ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Consultando IA...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Analisar com IA e obter sugestão avançada</>
                )}
              </button>

              {/* Resposta da IA */}
              {aiFixSuggestion && (
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Análise da IA</span>
                  </div>
                  <p className="text-xs text-foreground/85 leading-relaxed">{aiFixSuggestion}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

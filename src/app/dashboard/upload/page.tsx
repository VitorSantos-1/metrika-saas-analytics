"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Link2, 
  Copy, 
  Keyboard, 
  CheckCircle2, 
  AlertCircle,
  Database,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Eye,
  Trash2,
  ListRestart
} from "lucide-react";
import { saveAIWidgets } from "./actions";
import { PublicChart } from "@/components/public/PublicChart";

type Category = "retail" | "marketing" | "finance";
type InputMethod = "csv" | "sheets" | "paste" | "manual";

interface GeneratedWidget {
  title: string;
  type: string;
  cachedData: string;
}

interface AIAnalysisResult {
  summary: string;
  insights: string[];
  widgets: GeneratedWidget[];
}

export default function UploadPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estados principais
  const [category, setCategory] = useState<Category>("retail");
  const [method, setMethod] = useState<InputMethod>("csv");
  const [businessType, setBusinessType] = useState("");
  const [provider, setProvider] = useState<string>("gemini");
  const [addToHome, setAddToHome] = useState(false);
  
  // Estado dos inputs dos métodos
  const [file, setFile] = useState<File | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [pastedData, setPastedData] = useState("");
  
  // Formulário Manual Dinâmico
  const [manualData, setManualData] = useState({
    // Varejo / Atacado
    retail_sales: "",
    retail_orders: "",
    retail_avg_ticket: "",
    retail_stock: "",
    // Marketing
    marketing_spend: "",
    marketing_leads: "",
    marketing_conversions: "",
    marketing_cac: "",
    // Finanças
    finance_revenue: "",
    finance_cloud: "",
    finance_team: "",
    finance_tools: ""
  });

  // Estados de processamento
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  const handleManualChange = (key: string, value: string) => {
    setManualData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // ── Persistência: carrega do localStorage na montagem ──────────────────────
  const STORAGE_KEY = "metrika-upload-state";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.category) setCategory(parsed.category as Category);
        if (parsed.method) setMethod(parsed.method as InputMethod);
        if (parsed.businessType !== undefined) setBusinessType(parsed.businessType);
        if (parsed.provider) setProvider(parsed.provider);
        if (parsed.sheetUrl !== undefined) setSheetUrl(parsed.sheetUrl);
        if (parsed.pastedData !== undefined) setPastedData(parsed.pastedData);
        if (parsed.manualData) setManualData(parsed.manualData);
        if (parsed.aiResult) setAiResult(parsed.aiResult);
      }
    } catch { /* ignora erros */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persistência: salva no localStorage sempre que algo muda ──────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        category, method, businessType, provider, sheetUrl, pastedData, manualData, aiResult
      }));
    } catch { /* ignora */ }
  }, [category, method, businessType, provider, sheetUrl, pastedData, manualData, aiResult]);

  // ── Limpar tudo ────────────────────────────────────────────────────────────
  const handleClearAll = () => {
    if (!confirm("Tem certeza que deseja apagar todos os dados salvos nesta aba?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setCategory("retail");
    setMethod("csv");
    setBusinessType("");
    setProvider("gemini");
    setSheetUrl("");
    setPastedData("");
    setManualData({ retail_sales: "", retail_orders: "", retail_avg_ticket: "", retail_stock: "", marketing_spend: "", marketing_leads: "", marketing_conversions: "", marketing_cac: "", finance_revenue: "", finance_cloud: "", finance_team: "", finance_tools: "" });
    setFile(null);
    setAiResult(null);
    setErrorMsg("");
  };

  // Helper para simular mensagens da IA durante o processamento
  const startLoadingAnimation = () => {
    setIsLoadingAI(true);
    setErrorMsg("");
    setAiResult(null);
    
    const providerNames: Record<string, string> = {
      gemini: "Google Gemini",
      groq: "Groq (Llama 3)",
      openai: "OpenAI GPT",
      claude: "Anthropic Claude",
      huggingface: "Hugging Face",
      openrouter: "OpenRouter"
    };

    const targetProvider = providerNames[provider] || "Inteligência Artificial";

    const messages = [
      "Lendo e estruturando dados brutos...",
      `Conectando com a API do ${targetProvider}...`,
      "Identificando padrões e anomalias de dados...",
      "Calculando KPIs analíticos e ticket médio...",
      "Formatando coleções de gráficos para o dashboard...",
      "Quase pronto, gerando insights estratégicos..."
    ];
    
    let step = 0;
    setAiStatusMessage(messages[0]);
    
    const interval = setInterval(() => {
      step++;
      if (step < messages.length) {
        setAiStatusMessage(messages[step]);
      } else {
        clearInterval(interval);
      }
    }, 2200);

    return interval;
  };

  const parseAndAnalyze = async () => {
    const loadingInterval = startLoadingAnimation();
    
    try {
      let rawText = "";

      // 1. Extrair os dados baseado no método escolhido
      if (method === "csv") {
        if (!file) {
          throw new Error("Selecione um arquivo CSV para importar.");
        }
        rawText = await new Promise<string>((resolve, reject) => {
          Papa.parse(file, {
            complete: (results) => {
              resolve(JSON.stringify(results.data));
            },
            error: (err) => {
              reject(err);
            }
          });
        });
      } else if (method === "sheets") {
        if (!sheetUrl) {
          throw new Error("Informe o link da planilha do Google Sheets.");
        }
        
        // Faz a requisição para a nossa rota de API para evitar problemas de CORS no navegador
        const sheetResponse = await fetch("/api/fetch-sheet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sheetUrl })
        });

        if (!sheetResponse.ok) {
          const errData = await sheetResponse.json();
          throw new Error(errData.error || "Não foi possível carregar a planilha.");
        }

        const { csvText } = await sheetResponse.json();
        const parsed = Papa.parse(csvText);
        rawText = JSON.stringify(parsed.data);
      } else if (method === "paste") {
        if (!pastedData.trim()) {
          throw new Error("Cole os dados na caixa de texto.");
        }
        const parsed = Papa.parse(pastedData.trim());
        rawText = JSON.stringify(parsed.data);
      } else if (method === "manual") {
        // Constrói um objeto estruturado baseado nos inputs manuais
        const dataObj: Record<string, string> = {};
        Object.entries(manualData).forEach(([key, val]) => {
          if (key.startsWith(category) && val) {
            dataObj[key.replace(`${category}_`, "")] = val;
          }
        });
        if (Object.keys(dataObj).length === 0) {
          throw new Error("Preencha pelo menos um campo do formulário.");
        }
        rawText = JSON.stringify(dataObj);
      }

      // 2. Chamar nossa API Route de IA
      const aiResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataRaw: rawText,
          category,
          businessType,
          provider
        })
      });

      clearInterval(loadingInterval);

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || "Falha na análise dos dados.");
      }

      const result: AIAnalysisResult = await aiResponse.json();
      setAiResult(result);
    } catch (err: any) {
      clearInterval(loadingInterval);
      setErrorMsg(err.message || "Erro desconhecido durante a análise.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handlePublish = () => {
    if (!aiResult) return;

    startTransition(async () => {
      try {
        const res = await saveAIWidgets(aiResult.widgets, category, addToHome, aiResult.insights, aiResult.summary);
        if (res.success) {
          alert("Dashboard publicado com sucesso!");
          router.push(`/vitor/${res.folderSlug}`);
        } else {
          setErrorMsg(res.error || "Ocorreu um erro ao salvar o dashboard.");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Erro de rede ao salvar dashboard.");
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Banner de IA Premium */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-purple-500/5 to-cyan-500/5 border border-border p-6 rounded-2xl shadow-sm transition-colors duration-300">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BrainCircuit className="w-40 h-40 text-primary" />
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-md shadow-primary/20 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">Importação de Dados Analítica &amp; IA</h2>
            <p className="text-muted-foreground mt-1 max-w-xl text-sm">
              Carregue seus dados brutos de varejo, marketing ou finanças. A Inteligência Artificial analisará de forma inteligente, extrairá KPIs de BI e criará gráficos automáticos para o seu dashboard público.
            </p>
          </div>
          <button
            onClick={handleClearAll}
            title="Limpar todos os dados salvos desta aba"
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/15 text-xs font-semibold transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar tudo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Upload e Opções (Lado Esquerdo) */}
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          {/* Categoria */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">1. Categoria dos Dados</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "retail", name: "Varejo", desc: "Vendas e Estoque" },
                { id: "marketing", name: "Marketing", desc: "CAC e Leads" },
                { id: "finance", name: "Finanças", desc: "Lucro e Custos" }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id as Category)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    category === c.id 
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20" 
                      : "border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className="font-bold text-xs">{c.name}</span>
                  <span className="text-[9px] mt-0.5 opacity-80">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contexto do Negócio */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">2. Tipo de Negócio / Contexto (Opcional)</label>
            <input 
              type="text"
              placeholder="Ex: E-commerce de moda, SaaS B2B, Clínicas de Estética"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          {/* Método de Importação */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">3. Método de Entrada</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "csv", name: "Arquivo CSV / Excel", icon: <Upload className="w-3.5 h-3.5" /> },
                { id: "sheets", name: "Google Sheets", icon: <Link2 className="w-3.5 h-3.5" /> },
                { id: "paste", name: "Copiar e Colar", icon: <Copy className="w-3.5 h-3.5" /> },
                { id: "manual", name: "Formulário Manual", icon: <Keyboard className="w-3.5 h-3.5" /> }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id as InputMethod)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    method === m.id 
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20" 
                      : "border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {m.icon}
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Áreas de entrada dinâmica por método */}
          <div className="pt-4 border-t border-border/80 min-h-[160px] flex flex-col justify-center">
            {/* Método CSV */}
            {method === "csv" && (
              <div className="space-y-4">
                <div className="border border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/10 transition-colors cursor-pointer relative group">
                  <input 
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2 group-hover:text-primary transition-colors" />
                  <div className="text-xs font-semibold">Arraste ou escolha um arquivo CSV</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Limite: 5MB (.csv formatado)</div>
                </div>
                {file && (
                  <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-xl border border-border">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Método Google Sheets */}
            {method === "sheets" && (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/40">
                  <span className="font-bold text-foreground">Como importar:</span> Compartilhe sua planilha do Google Sheets como &quot;Qualquer pessoa com o link&quot; antes de colar o link abaixo.
                </div>
                <input 
                  type="text"
                  placeholder="Cole aqui o link da Planilha Google"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            )}

            {/* Método Copiar & Colar */}
            {method === "paste" && (
              <div className="space-y-2">
                <textarea 
                  placeholder="Cole aqui as linhas copiadas do seu Excel ou Sheets (valores tabulados ou separados por vírgula)"
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  rows={6}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none font-mono"
                />
              </div>
            )}

            {/* Método Formulário Manual */}
            {method === "manual" && (
              <div className="space-y-4">
                {/* Varejo */}
                {category === "retail" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Faturamento (R$)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 142500" 
                        value={manualData.retail_sales}
                        onChange={(e) => handleManualChange("retail_sales", e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Qtd de Pedidos</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 850" 
                        value={manualData.retail_orders}
                        onChange={(e) => handleManualChange("retail_orders", e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Ticket Médio (R$)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 167" 
                        value={manualData.retail_avg_ticket}
                        onChange={(e) => handleManualChange("retail_avg_ticket", e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Itens em Estoque</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 4500" 
                        value={manualData.retail_stock}
                        onChange={(e) => handleManualChange("retail_stock", e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Marketing */}
                {category === "marketing" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Investimento Ads (R$)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 15400" 
                        value={manualData.marketing_spend}
                        onChange={(e) => handleManualChange("marketing_spend", e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Total de Leads</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 3200" 
                        value={manualData.marketing_leads}
                        onChange={(e) => handleManualChange("marketing_leads", e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Taxa Conversão (%)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 2.85" 
                        value={manualData.marketing_conversions}
                        onChange={(e) => handleManualChange("marketing_conversions", e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">CAC Médio (R$)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 42.30" 
                        value={manualData.marketing_cac}
                        onChange={(e) => handleManualChange("marketing_cac", e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Finanças */}
                {category === "finance" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Receita Líquida (R$)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 142500" 
                        value={manualData.finance_revenue}
                        onChange={(e) => handleManualChange("finance_revenue", e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Custo Nuvem (R$)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 12400" 
                        value={manualData.finance_cloud}
                        onChange={(e) => handleManualChange("finance_cloud", e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Folha de Equipe (R$)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 48000" 
                        value={manualData.finance_team}
                        onChange={(e) => handleManualChange("finance_team", e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Ferramentas/APIs (R$)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 4500" 
                        value={manualData.finance_tools}
                        onChange={(e) => handleManualChange("finance_tools", e.target.value)}
                        className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Provedor de IA */}
          <div className="space-y-2 pb-4 border-b border-border/60">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">4. Provedor de Inteligência Artificial</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "gemini", name: "Gemini", desc: "Fallback grátis" },
                { id: "groq", name: "Groq Llama 3", desc: "Camada grátis rápida" },
                { id: "openai", name: "OpenAI GPT", desc: "Requer chave no env" },
                { id: "claude", name: "Claude Sonnet", desc: "Requer chave no env" },
                { id: "huggingface", name: "Hugging Face", desc: "Llama 3 inference" },
                { id: "openrouter", name: "OpenRouter", desc: "Llama 3 / Mistral" }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                    provider === p.id 
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20" 
                      : "border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className="font-bold text-[11px] leading-none">{p.name}</span>
                  <span className="text-[8px] mt-1 opacity-70 leading-none">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={parseAndAnalyze}
            disabled={isLoadingAI}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingAI ? (
              <>
                <Database className="w-4 h-4 animate-spin" />
                Analisando dados...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analisar dados com IA
              </>
            )}
          </button>
        </div>

        {/* Exibição dos KPIs/Insights Gerados pela IA (Lado Direito) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estado de Carregamento da IA */}
          {isLoadingAI && (
            <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 transition-all duration-300 min-h-[400px]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="w-6 h-6 text-primary absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Gemini está analisando seus dados</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{aiStatusMessage}</p>
              </div>
            </div>
          )}

          {/* Estado de Erro */}
          {errorMsg && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex items-start gap-3 text-red-500">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Falha no processamento</h4>
                <p className="text-xs mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Estado Inicial sem dados */}
          {!aiResult && !isLoadingAI && !errorMsg && (
            <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[400px]">
              <Database className="w-12 h-12 text-muted-foreground/30" />
              <div>
                <h3 className="font-bold text-sm text-foreground">Nenhum dado importado ainda</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Use o formulário ao lado para inserir os dados do seu negócio e a IA fará o resto.</p>
              </div>
            </div>
          )}

          {/* Resultado da Análise da IA */}
          {aiResult && !isLoadingAI && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Resumo e Insights */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-lg">Métricas Identificadas pela IA</h3>
                  <p className="text-xs text-muted-foreground mt-1">{aiResult.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/60">
                  {aiResult.insights.map((insight, idx) => (
                    <div key={idx} className="p-3 bg-muted/20 border border-border/80 rounded-xl space-y-1">
                      <div className="text-[10px] font-bold text-primary uppercase">Insight {idx + 1}</div>
                      <p className="text-[11px] text-foreground/80 leading-relaxed font-medium">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prévia dos Widgets Criados */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Eye className="w-4.5 h-4.5 text-primary" />
                    Prévia dos Widgets Gerados
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-semibold">Os widgets abaixo serão publicados na seção de relatórios</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {aiResult.widgets.map((widget, idx) => (
                    <div key={idx} className="relative">
                      <PublicChart 
                        type={widget.type}
                        cachedData={widget.cachedData}
                        title={widget.title}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ação de Confirmação */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-border/80">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addToHome}
                    onChange={(e) => setAddToHome(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer animate-none"
                  />
                  <span className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                    Adicionar também na Página Inicial (Visão Geral)
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setAiResult(null);
                      setAddToHome(false); // Reseta checkbox ao descartar
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-all active:scale-95"
                  >
                    <ListRestart className="w-4 h-4" />
                    Descartar e Recomeçar
                  </button>
                  
                  <button
                    onClick={handlePublish}
                    disabled={isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/10 disabled:opacity-50"
                  >
                    {isPending ? (
                      "Publicando..."
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Publicar no Dashboard
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

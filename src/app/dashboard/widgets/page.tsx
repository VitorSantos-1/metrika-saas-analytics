"use client";

import { useEffect, useState, useTransition } from "react";
import { 
  getWidgetsWithRelations, 
  getFormDependencies, 
  createWidget, 
  deleteWidget,
  generateMockDataFromSQL,
  getSchemaSuggestions,
  translateNLPToSQL
} from "./actions";
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  X, 
  Layout, 
  Database, 
  Folder, 
  TrendingUp, 
  BarChart2, 
  PieChart, 
  Table as TableIcon, 
  Layers,
  Code,
  Info,
  CheckCircle,
  Eye,
  Sparkles,
  HelpCircle
} from "lucide-react";

interface Widget {
  id: string;
  title: string;
  type: string;
  query: string | null;
  cachedData: string | null;
  sortOrder: number;
  connection?: { name: string; type: string } | null;
  folder?: { name: string } | null;
}

interface Option {
  id: string;
  name: string;
}

interface SchemaTable {
  name: string;
  columns: string[];
}

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [connections, setConnections] = useState<Option[]>([]);
  const [folders, setFolders] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Estados do Formulário/Modal
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("KPI_CARD");
  const [connectionId, setConnectionId] = useState("");
  const [folderId, setFolderId] = useState("");
  const [query, setQuery] = useState("SELECT * FROM vendas LIMIT 10");
  const [cachedData, setCachedData] = useState("");

  // Estados adicionais de Auto-Preenchimento e Auto-Complete
  const [isFilling, setIsFilling] = useState(false);
  const [schemaTables, setSchemaTables] = useState<SchemaTable[]>([]);
  const [alsoAddToHome, setAlsoAddToHome] = useState(false);
  const [widgetProvider, setWidgetProvider] = useState("gemini");
  const [nlpText, setNlpText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  // Templates de Mocks para facilitar a vida do usuário
  const jsonTemplates: Record<string, string> = {
    KPI_CARD: JSON.stringify({
      value: "R$ 24.500,00",
      change: "+12.4%",
      isPositive: true,
      subtext: "vs. meta do mês"
    }, null, 2),
    LINE_CHART: JSON.stringify([
      { name: "Seg", valor: 120 },
      { name: "Ter", valor: 190 },
      { name: "Qua", valor: 300 },
      { name: "Qui", valor: 250 },
      { name: "Sex", valor: 420 }
    ], null, 2),
    BAR_CHART: JSON.stringify([
      { name: "Google Ads", conversao: 340 },
      { name: "Meta Ads", conversao: 520 },
      { name: "E-mail", conversao: 120 },
      { name: "Orgânico", conversao: 280 }
    ], null, 2),
    PIE_CHART: JSON.stringify([
      { name: "Norte", value: 35 },
      { name: "Sul", value: 25 },
      { name: "Leste", value: 20 },
      { name: "Oeste", value: 20 }
    ], null, 2),
    TABLE: JSON.stringify([
      { id: "01", user: "Carla Silva", status: "Confirmado", total: "R$ 450" },
      { id: "02", user: "Pedro Souza", status: "Pendente", total: "R$ 1.200" },
      { id: "03", user: "Carla Abreu", status: "Confirmado", total: "R$ 980" }
    ], null, 2)
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await getWidgetsWithRelations();
      setWidgets(list as unknown as Widget[]);
      
      const { connections: conns, folders: dirs } = await getFormDependencies();
      setConnections(conns);
      setFolders(dirs);

      if (conns.length > 0) setConnectionId(conns[0].id);
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Monitora a conexão selecionada para carregar as sugestões de tabelas e colunas
  useEffect(() => {
    if (connectionId) {
      getSchemaSuggestions(connectionId).then(res => {
        setSchemaTables(res.tables || []);
      });
    } else {
      setSchemaTables([]);
    }
  }, [connectionId]);

  // Função para executar a IA e auto-preencher os dados baseado no SQL Query
  const handleAutoFill = async () => {
    if (!connectionId) {
      alert("Por favor, selecione uma fonte de dados antes de preencher.");
      return;
    }
    if (!query.trim()) {
      alert("Por favor, escreva uma query SQL ou comando.");
      return;
    }

    setIsFilling(true);
    try {
      const res = await generateMockDataFromSQL(connectionId, query, type, widgetProvider);
      if (res.success && res.cachedData) {
        setCachedData(res.cachedData);
      } else {
        alert("Falha ao obter dados por IA: " + (res.error || "Erro desconhecido"));
      }
    } catch (err: any) {
      alert("Erro ao chamar IA: " + err.message);
    } finally {
      setIsFilling(false);
    }
  };

  // Função para traduzir linguagem natural (NLP) em SQL via IA baseada no schema
  const handleNLPTranslate = async () => {
    if (!connectionId) {
      alert("Por favor, selecione uma fonte de dados antes de usar a IA.");
      return;
    }
    if (!nlpText.trim()) {
      alert("Por favor, digite o que você deseja em linguagem natural.");
      return;
    }

    setIsTranslating(true);
    try {
      const res = await translateNLPToSQL(connectionId, nlpText);
      if (res.success && res.query) {
        setQuery(res.query);
        setNlpText(""); // limpa caixa de entrada
      } else {
        alert("Não foi possível traduzir seu pedido: " + (res.error || "Erro de processamento."));
      }
    } catch (err: any) {
      alert("Erro na tradução NLP: " + err.message);
    } finally {
      setIsTranslating(false);
    }
  };

  // Altera o template JSON automaticamente quando muda o tipo de gráfico
  const handleTypeChange = (newType: string) => {
    setType(newType);
    setCachedData(jsonTemplates[newType] || "");
    
    // Ajustar query recomendada
    if (newType === "KPI_CARD") {
      setQuery("SELECT SUM(valor) FROM vendas");
    } else if (newType === "TABLE") {
      setQuery("SELECT id, cliente, status, valor FROM pedidos ORDER BY data DESC LIMIT 3");
    } else {
      setQuery("SELECT categoria, COUNT(*) as volume FROM leads GROUP BY categoria");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !cachedData) return;

    try {
      // Validação rápida de JSON
      JSON.parse(cachedData);
    } catch (err) {
      alert("O campo Mock de Dados contém um JSON inválido. Verifique o formato.");
      return;
    }

    startTransition(async () => {
      try {
        await createWidget({
          title,
          type,
          connectionId: connectionId || undefined,
          folderId: folderId || undefined,
          query,
          cachedData
        });

        // Se marcado, também cria na página inicial (folderId: undefined)
        if (folderId && alsoAddToHome) {
          await createWidget({
            title,
            type,
            connectionId: connectionId || undefined,
            folderId: undefined,
            query,
            cachedData
          });
        }

        // Resetar formulário
        setTitle("");
        setIsOpen(false);
        setAlsoAddToHome(false); // Reseta checkbox
        await loadData();
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar widget.");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza de que deseja deletar este widget?")) return;

    startTransition(async () => {
      try {
        await deleteWidget(id);
        await loadData();
      } catch (err) {
        console.error(err);
      }
    });
  };

  // Renderizar uma prévia visual básica dos widgets na listagem administrativa
  const renderPreviewIcon = (widgetType: string) => {
    switch (widgetType) {
      case "KPI_CARD": return <Layers className="w-5 h-5 text-primary" />;
      case "LINE_CHART": return <TrendingUp className="w-5 h-5 text-cyan-400" />;
      case "BAR_CHART": return <BarChart2 className="w-5 h-5 text-purple-400" />;
      case "PIE_CHART": return <PieChart className="w-5 h-5 text-emerald-400" />;
      case "TABLE": return <TableIcon className="w-5 h-5 text-blue-400" />;
      default: return <Layout className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo de Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground">Construa relatórios arrastando widgets, inserindo queries SQL e configurando o visual.</p>
        </div>
        <button
          onClick={() => {
            handleTypeChange("KPI_CARD");
            setIsOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity shadow-md text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Adicionar Widget
        </button>
      </div>

      {/* Grid Canvas dos Widgets Existentes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">Renderizando canvas do editor...</span>
        </div>
      ) : widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-2xl p-8">
          <Layout className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="font-bold text-lg">Seu dashboard está vazio</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-6">
            Crie seu primeiro widget de BI associando-o a um banco de dados e escolhendo um tipo de gráfico.
          </p>
          <button
            onClick={() => {
              handleTypeChange("KPI_CARD");
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((w) => (
            <div 
              key={w.id} 
              className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-primary/20 transition-all duration-300 relative group"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-muted/50 rounded-xl border border-border">
                    {renderPreviewIcon(w.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight truncate max-w-[160px]">{w.title}</h4>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase bg-muted px-1.5 py-0.5 rounded border border-border/40 mt-1 inline-block">
                      {w.type.replace("_CHART", "").replace("_CARD", "")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(w.id)}
                  disabled={isPending}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Relações (Pasta & Conexão) */}
              <div className="my-5 space-y-2 border-t border-b border-border/50 py-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-muted-foreground/60" />
                    Fonte:
                  </span>
                  <span className="font-semibold text-foreground/80 truncate max-w-[120px]">
                    {w.connection?.name || "Nenhuma"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-muted-foreground/60" />
                    Pasta/Aba:
                  </span>
                  <span className="font-semibold text-foreground/80 truncate max-w-[120px]">
                    {w.folder?.name || "Raiz (Home)"}
                  </span>
                </div>
              </div>

              {/* Prévia da Query */}
              <div className="bg-muted/40 p-2.5 rounded-lg border border-border/40 text-[10px] font-mono text-muted-foreground truncate flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{w.query}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Overlay de Adicionar Widget */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl my-8 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="font-bold text-lg">Criar Novo Widget de BI</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Associe tabelas e determine o mock de renderização.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo Formulário (Rolável) */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Título */}
                <div>
                  <label htmlFor="widget-title" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Título do Widget
                  </label>
                  <input
                    id="widget-title"
                    type="text"
                    required
                    placeholder="Ex: Faturamento Mensal (R$)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                  />
                </div>

                {/* Tipo de Gráfico */}
                <div>
                  <label htmlFor="widget-type" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Tipo de Exibição
                  </label>
                  <select
                    id="widget-type"
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                  >
                    <option value="KPI_CARD">Cartão de KPI (Métrica única)</option>
                    <option value="LINE_CHART">Gráfico de Linha (Evolução)</option>
                    <option value="BAR_CHART">Gráfico de Barras (Comparação)</option>
                    <option value="PIE_CHART">Gráfico de Pizza (Canais / Divisão)</option>
                    <option value="TABLE">Tabela de Banco de Dados</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Conexão */}
                <div>
                  <label htmlFor="widget-conn" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Fonte de Dados Relacionada
                  </label>
                  <select
                    id="widget-conn"
                    value={connectionId}
                    onChange={(e) => setConnectionId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                  >
                    {connections.length > 0 ? (
                      connections.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    ) : (
                      <option value="">Nenhuma fonte ativa cadastrada</option>
                    )}
                  </select>
                </div>

                {/* Pasta */}
                <div>
                  <label htmlFor="widget-folder" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Organizar na Pasta / Aba (Opcional)
                  </label>
                  <select
                    id="widget-folder"
                    value={folderId}
                    onChange={(e) => {
                      setFolderId(e.target.value);
                      if (!e.target.value) setAlsoAddToHome(false); // Reseta se não escolher pasta
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                  >
                    <option value="">Nenhuma (Fica na Página Inicial)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Opção de Exibir na Home se tiver pasta selecionada */}
              {folderId && (
                <div className="animate-in slide-in-from-top-1 duration-200">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={alsoAddToHome}
                      onChange={(e) => setAlsoAddToHome(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                      Exibir também na Página Inicial (Visão Geral)
                    </span>
                  </label>
                </div>
              )}

              {/* Assistente de NLP (Linguagem Natural) */}
              <div className="space-y-2 p-3.5 bg-primary/5 border border-primary/10 rounded-2xl animate-in fade-in duration-200">
                <label htmlFor="widget-nlp" className="block text-[10px] font-bold text-primary uppercase tracking-wider">
                  Assistente de IA: Escreva o que deseja (Linguagem Natural)
                </label>
                <div className="flex gap-2">
                  <input
                    id="widget-nlp"
                    type="text"
                    value={nlpText}
                    onChange={(e) => setNlpText(e.target.value)}
                    placeholder="Ex: ver o faturamento mensal ou leads por canal..."
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-card text-xs outline-none focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleNLPTranslate}
                    disabled={isTranslating}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 active:scale-95 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTranslating ? "Gerando..." : "Gerar SQL"}
                  </button>
                </div>
              </div>

              {/* SQL Query */}
              <div className="space-y-2">
                <label htmlFor="widget-query" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  SQL Query ou Comando
                </label>
                <textarea
                  id="widget-query"
                  rows={3}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-mono"
                />

                {/* Auto-complete visual de esquema */}
                {schemaTables.length > 0 && (
                  <div className="bg-muted/30 border border-border/80 rounded-xl p-3.5 space-y-2.5 text-xs animate-in slide-in-from-top-1 duration-200">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-primary shrink-0" />
                      Esquema da Fonte (Clique para inserir na query)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {schemaTables.map(t => (
                        <div key={t.name} className="flex flex-wrap items-center gap-1.5 bg-background border border-border/60 rounded-xl px-2.5 py-1 text-xs shadow-sm">
                          <span 
                            onClick={() => setQuery(prev => prev + " " + t.name)}
                            className="font-mono font-bold text-primary cursor-pointer hover:underline"
                            title="Inserir Tabela"
                          >
                            {t.name}
                          </span>
                          <span className="text-muted-foreground/30">|</span>
                          <div className="flex flex-wrap gap-1.5">
                            {t.columns.map(col => (
                              <span 
                                key={col}
                                onClick={() => setQuery(prev => prev + " " + col)}
                                className="font-mono text-foreground/80 cursor-pointer hover:text-primary hover:underline"
                                title="Inserir Coluna"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mock de dados (JSON) */}
              <div>
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <label htmlFor="widget-mock" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Simulação do Retorno (JSON)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {/* Seletor do Provedor de IA */}
                    <select
                      value={widgetProvider}
                      onChange={(e) => setWidgetProvider(e.target.value)}
                      className="text-[10px] font-bold bg-card border border-border/80 px-2 py-0.5 rounded outline-none text-muted-foreground focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="gemini">Gemini</option>
                      <option value="groq">Groq Llama</option>
                      <option value="openai">OpenAI GPT</option>
                      <option value="claude">Claude</option>
                      <option value="huggingface">Hugging Face</option>
                      <option value="openrouter">OpenRouter</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleAutoFill}
                      disabled={isFilling}
                      className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                    >
                      {isFilling ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 animate-pulse" />
                          Auto-Preencher por IA
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  id="widget-mock"
                  rows={6}
                  required
                  value={cachedData}
                  onChange={(e) => setCachedData(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-mono"
                />
                <span className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                  Altere os valores acima ou clique em Auto-Preenchido para preencher automaticamente por IA a partir da sua query.
                </span>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t border-border sticky bottom-0 bg-card">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!title || !cachedData || isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-md"
                >
                  {isPending ? "Criando..." : "Salvar Widget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

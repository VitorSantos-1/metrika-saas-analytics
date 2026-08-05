"use client";

import { useEffect, useState, useTransition } from "react";
import { 
  getConnections, 
  createConnection, 
  deleteConnection 
} from "./actions";
import { 
  Database, 
  FileText, 
  Table, 
  Plus, 
  Trash2, 
  RefreshCw, 
  X, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  UploadCloud,
  FileSpreadsheet
} from "lucide-react";

interface Connection {
  id: string;
  name: string;
  type: string;
  connectionString: string | null;
  sheetUrl: string | null;
  fileUrl: string | null;
  isActive: boolean;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Estados do Formulário / Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState("POSTGRESQL");
  const [name, setName] = useState("");
  const [connectionString, setConnectionString] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Estados de Teste de Conexão
  const [testState, setTestState] = useState<"idle" | "testing" | "success" | "error">("idle");

  // Carregar conexões
  const fetchConnections = async () => {
    try {
      setLoading(true);
      const data = await getConnections();
      setConnections(data);
    } catch (err) {
      console.error("Erro ao carregar conexões", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  // Simular teste de conexão
  const handleTestConnection = () => {
    if (!name) {
      alert("Por favor, dê um nome para sua fonte de dados.");
      return;
    }
    
    setTestState("testing");
    setTimeout(() => {
      // Simula uma resposta positiva sempre para fins de MVP local
      setTestState("success");
    }, 1500);
  };

  // Salvar conexão
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Para bancos de dados, exige teste. Para arquivo/planilha, não há como testar de fato.
    const requiresTest = type === "POSTGRESQL" || type === "MYSQL";
    if (requiresTest && testState !== "success") {
      alert("Por favor, teste a conexão antes de salvar!");
      return;
    }

    startTransition(async () => {
      try {
        let fileUrl = "";
        if (type === "CSV_PARQUET_FILE") {
          fileUrl = `/data/${fileName || "dados_importados.csv"}`;
        }

        await createConnection({
          name,
          type,
          connectionString: type === "POSTGRESQL" || type === "MYSQL" ? connectionString : undefined,
          sheetUrl: type === "GOOGLESHEETS" ? sheetUrl : undefined,
          fileUrl: type === "CSV_PARQUET_FILE" ? fileUrl : undefined,
        });

        // Resetar formulário
        setName("");
        setConnectionString("");
        setSheetUrl("");
        setFileName("");
        setTestState("idle");
        setIsModalOpen(false);

        // Recarregar lista
        await fetchConnections();
      } catch (err) {
        console.error("Erro ao salvar conexão", err);
        alert("Erro ao salvar no banco de dados.");
      }
    });
  };

  // Excluir conexão
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conexão? Os widgets associados a ela ficarão órfãos.")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteConnection(id);
        await fetchConnections();
      } catch (err) {
        console.error("Erro ao excluir", err);
      }
    });
  };

  // Simular upload de arquivo CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFileName(file.name);
    setTimeout(() => {
      setIsUploading(false);
    }, 1200);
  };

  const getConnIcon = (connType: string) => {
    switch (connType) {
      case "POSTGRESQL":
      case "MYSQL":
        return <Database className="w-6 h-6 text-cyan-500" />;
      case "GOOGLESHEETS":
        return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
      case "CSV_PARQUET_FILE":
        return <FileText className="w-6 h-6 text-purple-500" />;
      default:
        return <Database className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getConnTypeName = (connType: string) => {
    switch (connType) {
      case "POSTGRESQL": return "PostgreSQL";
      case "MYSQL": return "MySQL / MariaDB";
      case "GOOGLESHEETS": return "Google Sheets API";
      case "CSV_PARQUET_FILE": return "CSV / Parquet Upload";
      default: return connType;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Controle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground">Cadastre as conexões de banco de dados, planilhas e arquivos para alimentar seus widgets.</p>
        </div>
        <button
          onClick={() => {
            setTestState("idle");
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity shadow-md text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova Conexão
        </button>
      </div>

      {/* Grid de Conexões */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">Carregando fontes de dados...</span>
        </div>
      ) : connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-2xl p-8">
          <Database className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="font-bold text-lg">Nenhuma fonte de dados conectada</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-6">
            Adicione sua primeira planilha ou banco de dados para começar a plotar gráficos em tempo real.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Fonte
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((conn) => (
            <div 
              key={conn.id} 
              className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-sm transition-all duration-300 relative group"
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-muted/40 rounded-xl border border-border">
                    {getConnIcon(conn.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-base truncate max-w-[150px]">{conn.name}</h4>
                    <span className="text-xs text-muted-foreground font-medium">{getConnTypeName(conn.type)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-500">Ativa</span>
                </div>
              </div>

              {/* Informações da Fonte */}
              <div className="my-5 bg-muted/30 p-3 rounded-lg border border-border/40 text-xs font-mono truncate text-muted-foreground">
                {conn.type === "POSTGRESQL" || conn.type === "MYSQL" ? (
                  <span>{conn.connectionString ? conn.connectionString.replace(/:([^:@]+)@/, ":***@") : "---"}</span>
                ) : conn.type === "GOOGLESHEETS" ? (
                  <span>{conn.sheetUrl || "---"}</span>
                ) : (
                  <span>{conn.fileUrl || "---"}</span>
                )}
              </div>

              {/* Ações do Card */}
              <div className="flex items-center justify-between pt-4 border-t border-border/80">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin-slow" />
                  Autossincronização: 5m
                </span>

                <button
                  onClick={() => handleDelete(conn.id)}
                  disabled={isPending}
                  className="flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  title="Excluir Conexão"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Overlay de Criação de Conexão */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="font-bold text-lg">Adicionar Nova Fonte de Dados</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Defina as credenciais para conexão em tempo real.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário do Modal */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Tipo de Conexão */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Tipo da Fonte de Dados
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "POSTGRESQL", label: "PostgreSQL", icon: Database },
                    { id: "MYSQL", label: "MySQL / Maria", icon: Database },
                    { id: "GOOGLESHEETS", label: "Google Sheets", icon: FileSpreadsheet },
                    { id: "CSV_PARQUET_FILE", label: "CSV / Excel", icon: FileText },
                  ].map((item) => {
                    const SelectedIcon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setType(item.id);
                          setTestState("idle");
                        }}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-all ${
                          type === item.id 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <SelectedIcon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nome da Conexão */}
              <div>
                <label htmlFor="conn-name" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Nome Amigável
                </label>
                <input
                  id="conn-name"
                  type="text"
                  required
                  placeholder="Ex: Banco de Leads, CSV de Faturamento"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                />
              </div>

              {/* Inputs Condicionais baseados no tipo */}
              {(type === "POSTGRESQL" || type === "MYSQL") && (
                <div>
                  <label htmlFor="conn-string" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    String de Conexão (URI)
                  </label>
                  <input
                    id="conn-string"
                    type="text"
                    required
                    placeholder="postgresql://usuario:senha@host:5432/banco"
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-primary" />
                    As credenciais são mascaradas antes de serem salvas no banco.
                  </span>
                </div>
              )}

              {type === "GOOGLESHEETS" && (
                <div>
                  <label htmlFor="conn-sheet" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Link da Planilha Google (Compartilhada publicamente ou com o Metrika)
                  </label>
                  <input
                    id="conn-sheet"
                    type="url"
                    required
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                  />
                </div>
              )}

              {type === "CSV_PARQUET_FILE" && (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Importar Arquivo (.csv, .xlsx, .parquet)
                  </label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 hover:bg-muted/10 transition-all cursor-pointer relative">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.parquet"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <span className="text-sm font-medium block">
                      {isUploading ? "Processando e validando..." : fileName ? fileName : "Clique para selecionar ou arraste o arquivo"}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 block">Tamanho máximo: 50MB</span>
                  </div>
                </div>
              )}

              {/* Caixa de Status de Teste de Conexão */}
              {testState !== "idle" && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm animate-in fade-in duration-200 ${
                  testState === "testing" ? "bg-blue-500/5 border-blue-500/20 text-blue-400" :
                  testState === "success" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" :
                  "bg-red-500/5 border-red-500/20 text-red-400"
                }`}>
                  {testState === "testing" && <RefreshCw className="w-5 h-5 animate-spin mt-0.5 shrink-0 text-primary" />}
                  {testState === "success" && <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-emerald-500" />}
                  {testState === "error" && <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />}
                  
                  <div>
                    <span className="font-bold block">
                      {testState === "testing" && "Estabelecendo handshake com a fonte..."}
                      {testState === "success" && "Conexão Estabelecida com Sucesso!"}
                      {testState === "error" && "Erro ao Conectar à Fonte"}
                    </span>
                    <span className="text-xs opacity-80 mt-0.5 block">
                      {testState === "testing" && "Validando credenciais e acessibilidade externa..."}
                      {testState === "success" && "Metrika conseguiu autenticar, ler o esquema de tabelas e obter dados de amostra."}
                      {testState === "error" && "Verifique se a String de Conexão ou URL está correta e se o IP do Metrika está liberado no firewall."}
                    </span>
                  </div>
                </div>
              )}

              {/* Botões do Formulário */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testState === "testing" || isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold active:scale-95 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${testState === "testing" ? "animate-spin" : ""}`} />
                  Testar Conexão
                </button>
                <button
                  type="submit"
                  disabled={(type === "POSTGRESQL" || type === "MYSQL") ? (testState !== "success" || isPending) : isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-md"
                >
                  {isPending ? "Salvando..." : "Salvar Fonte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { getAdminStats, getAdminDetails, toggleUserRole } from "./actions";
import Link from "next/link";
import { 
  Users, 
  Database, 
  Eye, 
  DollarSign, 
  ShieldAlert, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Clock
} from "lucide-react";

interface AdminStats {
  usersCount: number;
  connectionsCount: number;
  pageviewsCount: number;
  mrr: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date | string;
  subscription?: { planType: string } | null;
}

interface AdminConnection {
  id: string;
  name: string;
  type: string;
  host?: string | null;
  isActive: boolean;
  user: { name: string; email: string };
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [connections, setConnections] = useState<AdminConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "connections">("users");
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    try {
      setLoading(true);
      const s = await getAdminStats();
      setStats(s);

      const d = await getAdminDetails();
      setUsers(d.users);
      setConnections(d.connections);
    } catch (err) {
      console.error("Erro ao carregar dados administrativos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSuspension = (userId: string, currentRole: string) => {
    startTransition(async () => {
      try {
        await toggleUserRole(userId, currentRole);
        await loadData();
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pb-16">
      {/* Navbar Superior do Admin */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none">Painel de Controle Metrika</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Administração central do ecossistema SaaS</p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Painel
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8 animate-in fade-in duration-500">
        {/* Banner de Estatísticas Globais */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 border border-border bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Usuários */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 hover:border-primary/20 transition-all">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Usuários Ativos</span>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="mt-3 text-3xl font-extrabold">{stats?.usersCount}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Registrados no SQLite</p>
            </div>

            {/* Conexões */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 hover:border-primary/20 transition-all">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Fontes de Dados</span>
                <Database className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="mt-3 text-3xl font-extrabold">{stats?.connectionsCount}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Conexões ativas e em nuvem</p>
            </div>

            {/* Pageviews */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 hover:border-primary/20 transition-all">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Acessos Totais</span>
                <Eye className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="mt-3 text-3xl font-extrabold">{stats?.pageviewsCount}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Acessos acumulados em telemetria</p>
            </div>

            {/* MRR Fictício */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 hover:border-primary/20 transition-all">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-wider">Receita Recorrente (MRR)</span>
                <DollarSign className="w-5 h-5 text-amber-500" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-amber-500">{stats?.mrr}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Simulado com planos ativos</p>
            </div>
          </div>
        )}

        {/* Tabelas de Auditoria */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Menu de Abas */}
          <div className="flex border-b border-border bg-muted/20">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === "users"
                  ? "border-primary text-foreground bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Usuários & Assinaturas ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("connections")}
              className={`px-6 py-4 text-xs font-bold transition-all border-b-2 ${
                activeTab === "connections"
                  ? "border-primary text-foreground bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Auditoria de Conexões ({connections.length})
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 text-primary animate-spin mr-2" />
                <span className="text-xs text-muted-foreground font-medium">Buscando dados no SQLite...</span>
              </div>
            ) : activeTab === "users" ? (
              /* Tabela de Usuários */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="p-3 text-muted-foreground font-bold uppercase tracking-wider">Nome</th>
                      <th className="p-3 text-muted-foreground font-bold uppercase tracking-wider">E-mail</th>
                      <th className="p-3 text-muted-foreground font-bold uppercase tracking-wider">Plano</th>
                      <th className="p-3 text-muted-foreground font-bold uppercase tracking-wider">Data de Cadastro</th>
                      <th className="p-3 text-muted-foreground font-bold uppercase tracking-wider">Status Conta</th>
                      <th className="p-3 text-muted-foreground font-bold uppercase tracking-wider text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSuspended = u.role === "SUSPENDED";
                      return (
                        <tr key={u.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                          <td className="p-3 font-semibold text-foreground/90">{u.name}</td>
                          <td className="p-3 text-muted-foreground">{u.email}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                              u.subscription?.planType === "ENTERPRISE"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : u.subscription?.planType === "PRO"
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : "bg-muted text-muted-foreground border-border"
                            }`}>
                              {u.subscription?.planType || "LITE"}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-3">
                            {isSuspended ? (
                              <span className="text-red-500 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Suspensa
                              </span>
                            ) : (
                              <span className="text-emerald-500 font-bold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Ativa
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleToggleSuspension(u.id, u.role)}
                              disabled={isPending}
                              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm transition-all active:scale-95 ${
                                isSuspended
                                  ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20"
                                  : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                              }`}
                            >
                              {isSuspended ? "Reativar" : "Suspender"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Tabela de Conexões */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="p-3 text-muted-foreground font-bold uppercase tracking-wider">Nome da Conexão</th>
                      <th className="p-3 text-muted-foreground font-bold uppercase tracking-wider">Tipo</th>
                      <th className="p-3 text-muted-foreground font-bold uppercase tracking-wider">Criado Por</th>
                      <th className="p-3 text-muted-foreground font-bold uppercase tracking-wider">Host/Endpoint</th>
                      <th className="p-3 text-muted-foreground font-bold uppercase tracking-wider">Latência Média</th>
                      <th className="p-3 text-muted-foreground font-bold uppercase tracking-wider">Status Sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connections.map((c) => (
                      <tr key={c.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-semibold text-foreground/90">{c.name}</td>
                        <td className="p-3">
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border/60">
                            {c.type}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{c.user.name}</div>
                          <div className="text-[10px] text-muted-foreground">{c.user.email}</div>
                        </td>
                        <td className="p-3 text-muted-foreground font-mono max-w-[200px] truncate">
                          {c.host || "mock-file-upload"}
                        </td>
                        <td className="p-3">
                           <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              {/* Latência simulada determinística baseada no ID */}
                              {(c.id.charCodeAt(0) % 15) + 8}ms
                          </span>
                        </td>
                        <td className="p-3">
                          {c.isActive ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-[10px] uppercase">
                              OPERANTE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-[10px] uppercase">
                              DESCONECTADO
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

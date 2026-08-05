"use client";

import { useState, FormEvent } from "react";
import { User, AtSign, AlignLeft, ShieldCheck, Mail, Save, AlertCircle, CheckCircle } from "lucide-react";

interface SettingsFormProps {
  initialUser: { name: string; email: string };
  initialPage: { publicName: string; bio: string; username: string; avatarUrl: string };
}

export function SettingsForm({ initialUser, initialPage }: SettingsFormProps) {
  const [name, setName] = useState(initialUser.name);
  const [publicName, setPublicName] = useState(initialPage.publicName);
  const [bio, setBio] = useState(initialPage.bio);
  const [username, setUsername] = useState(initialPage.username);
  const [avatarUrl, setAvatarUrl] = useState(initialPage.avatarUrl);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          publicName,
          bio,
          username: username.toLowerCase().trim(),
          avatarUrl,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined
        })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Ocorreu um erro ao salvar as alterações.");
        return;
      }

      setSuccess("Configurações atualizadas com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setLoading(false);
      setError("Erro de rede. Tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl text-sm text-red-400"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl text-sm text-emerald-400"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <CheckCircle className="w-4.5 h-4.5 shrink-0" />
          {success}
        </div>
      )}

      {/* Seção da Página Pública */}
      <div className="bg-card border border-border p-6 rounded-2xl space-y-4 relative overflow-hidden"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.3), transparent)" }}
        />
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <AtSign className="w-4 h-4 text-primary" /> Visualização Pública
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username único</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground/50">metrika.io/</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-24 pr-4 py-2 text-sm rounded-xl outline-none"
                style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome de Exibição</label>
            <input
              type="text"
              value={publicName}
              onChange={(e) => setPublicName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL do Avatar</label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://sua-foto-url.com"
            className="w-full px-3 py-2 text-sm rounded-xl outline-none"
            style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bio Curta</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={160}
            className="w-full px-3 py-2 text-sm rounded-xl outline-none resize-none"
            style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
          />
        </div>
      </div>

      {/* Seção dos Dados da Conta */}
      <div className="bg-card border border-border p-6 rounded-2xl space-y-4 relative overflow-hidden"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
      >
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Conta de Usuário
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email (somente visualização)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
              <input
                type="email"
                value={initialUser.email}
                disabled
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl outline-none opacity-50 cursor-not-allowed"
                style={{ background: "hsl(var(--muted)/0.1)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Segurança */}
      <div className="bg-card border border-border p-6 rounded-2xl space-y-4 relative overflow-hidden"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
      >
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Segurança & Senha
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Senha Atual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite a senha atual"
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nova Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3 py-2 text-sm rounded-xl outline-none"
              style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
          </div>
        </div>
      </div>

      {/* Botão de Enviar */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7))",
          color: "hsl(var(--primary-foreground))",
          boxShadow: "0 4px 14px rgba(var(--glow-rgb), 0.25)"
        }}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {loading ? "Salvando Alterações..." : "Salvar Configurações"}
      </button>
    </form>
  );
}

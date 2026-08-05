"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, User, AtSign, Database, Sparkles, ChevronRight, Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Seu Perfil", icon: User },
  { id: 2, label: "Username", icon: AtSign },
  { id: 3, label: "Pronto!", icon: Sparkles },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [publicName, setPublicName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [saving, setSaving] = useState(false);

  async function checkUsername(val: string) {
    setUsername(val);
    setUsernameError("");
    if (val.length < 3) return;
    if (!/^[a-z0-9_-]+$/.test(val)) {
      setUsernameError("Apenas letras minúsculas, números, - e _");
      return;
    }
    setCheckingUsername(true);
    const res = await fetch(`/api/onboarding/check-username?username=${val}`);
    const data = await res.json();
    setCheckingUsername(false);
    if (!data.available) setUsernameError("Este username já está em uso.");
  }

  async function finish() {
    setSaving(true);
    const res = await fetch("/api/onboarding/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicName, bio, username }),
    });
    setSaving(false);
    if (res.ok) {
      setStep(3);
      setTimeout(() => router.push("/dashboard"), 2500);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "hsl(var(--background))",
        backgroundImage: "radial-gradient(circle, var(--dot-color) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 rounded-xl" style={{ background: "hsl(var(--primary)/0.15)", border: "1px solid hsl(var(--primary)/0.3)" }}>
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-primary">Metrika<span className="text-foreground/40 font-normal">.io</span></span>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                step > s.id ? "bg-emerald-500 text-white" : step === s.id ? "text-primary-foreground" : "text-muted-foreground"
              }`}
                style={step === s.id ? { background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7))" } :
                  step > s.id ? {} : { background: "hsl(var(--muted))" }}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-12 h-px transition-colors duration-300"
                  style={{ background: step > s.id ? "#22c55e" : "hsl(var(--border))" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="p-6 rounded-2xl relative overflow-hidden"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 20px 60px -10px rgba(0,0,0,0.4)" }}
        >
          <div className="absolute top-0 left-6 right-6 h-px"
            style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.5), transparent)" }}
          />

          {/* Step 1 — Perfil */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-bold">Configure seu perfil</h2>
                <p className="text-sm text-muted-foreground mt-1">Como seus visitantes vão te ver</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome público</label>
                <input
                  type="text"
                  value={publicName}
                  onChange={(e) => setPublicName(e.target.value)}
                  placeholder="Ex: Vitor Santos | Analista de Dados"
                  className="w-full px-4 py-2.5 text-sm rounded-xl outline-none"
                  style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary)/0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary)/0.1)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bio curta <span className="normal-case text-muted-foreground/50 font-normal">(opcional)</span></label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ex: Dashboard de vendas e marketing da empresa X"
                  rows={3}
                  maxLength={160}
                  className="w-full px-4 py-2.5 text-sm rounded-xl outline-none resize-none"
                  style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary)/0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary)/0.1)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <div className="text-right text-[10px] text-muted-foreground/50">{bio.length}/160</div>
              </div>
              <button
                onClick={() => publicName.trim() && setStep(2)}
                disabled={!publicName.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7))", color: "hsl(var(--primary-foreground))", boxShadow: "0 4px 14px rgba(var(--glow-rgb), 0.25)" }}
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2 — Username */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-bold">Escolha seu username</h2>
                <p className="text-sm text-muted-foreground mt-1">Essa será a URL do seu dashboard público</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground/50">metrika.io/</div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => checkUsername(e.target.value.toLowerCase())}
                    placeholder="seu-username"
                    className="w-full pl-24 pr-10 py-2.5 text-sm rounded-xl outline-none font-mono"
                    style={{
                      background: "hsl(var(--muted)/0.3)",
                      border: `1px solid ${usernameError ? "rgba(239,68,68,0.5)" : username && !usernameError && !checkingUsername ? "rgba(34,197,94,0.5)" : "hsl(var(--border))"}`,
                      color: "hsl(var(--foreground))"
                    }}
                    onFocus={e => { e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary)/0.1)"; }}
                    onBlur={e => { e.currentTarget.style.boxShadow = "none"; }}
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  {!checkingUsername && username && !usernameError && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                </div>
                {usernameError && <p className="text-xs text-red-400">{usernameError}</p>}
                {username && !usernameError && !checkingUsername && (
                  <p className="text-xs text-emerald-500">✓ Username disponível</p>
                )}
              </div>

              {/* Preview URL */}
              {username && !usernameError && (
                <div className="p-3 rounded-xl text-xs font-mono text-primary/70"
                  style={{ background: "hsl(var(--primary)/0.06)", border: "1px solid hsl(var(--primary)/0.15)" }}
                >
                  🔗 metrika.io/{username}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "hsl(var(--muted)/0.3)", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                >
                  Voltar
                </button>
                <button
                  onClick={finish}
                  disabled={!username || !!usernameError || checkingUsername || saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7))", color: "hsl(var(--primary-foreground))", boxShadow: "0 4px 14px rgba(var(--glow-rgb), 0.25)" }}
                >
                  {saving && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                  {saving ? "Criando..." : "Finalizar →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Sucesso */}
          {step === 3 && (
            <div className="text-center py-6 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.3)" }}
              >
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Workspace criado! 🎉</h2>
              <p className="text-sm text-muted-foreground mb-1">Redirecionando para o seu dashboard...</p>
              <p className="text-xs font-mono text-primary/60">metrika.io/{username}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

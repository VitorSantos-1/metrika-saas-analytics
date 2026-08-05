"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, BarChart3, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Erro ao fazer login.");
      return;
    }

    router.push(data.redirect || redirect);
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
      {/* Gradientes de fundo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(var(--glow-rgb),0.08) 0%, transparent 70%)" }}
        />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(var(--glow-rgb),0.05) 0%, transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-2.5 rounded-xl"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.2), hsl(var(--accent)/0.1))", border: "1px solid hsl(var(--primary)/0.3)" }}
            >
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-primary">Metrika<span className="text-foreground/40 font-normal">.io</span></span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
          <p className="text-sm text-muted-foreground mt-1">Entre para acessar seu workspace de dados</p>
        </div>

        {/* Card */}
        <div
          className="p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "0 20px 60px -10px rgba(0,0,0,0.4)"
          }}
        >
          {/* Linha de luz */}
          <div className="absolute top-0 left-6 right-6 h-px"
            style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.5), transparent)" }}
          />

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm text-red-400"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none transition-all duration-200 focus:ring-1"
                  style={{
                    background: "hsl(var(--muted)/0.3)",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary)/0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary)/0.1)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl outline-none transition-all duration-200"
                  style={{
                    background: "hsl(var(--muted)/0.3)",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary)/0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--primary)/0.1)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-2"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7))",
                color: "hsl(var(--primary-foreground))",
                boxShadow: "0 4px 14px rgba(var(--glow-rgb), 0.3)"
              }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Entrando..." : "Entrar no Workspace"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Criar conta grátis
            </Link>
          </div>
        </div>

        {/* Dev hint */}
        <div className="mt-4 p-3 rounded-xl text-center text-[11px] text-muted-foreground/50 font-mono"
          style={{ border: "1px dashed hsl(var(--border)/0.4)" }}
        >
          Dev: vitor@metrika.io · metrika123
        </div>
      </div>
    </div>
  );
}

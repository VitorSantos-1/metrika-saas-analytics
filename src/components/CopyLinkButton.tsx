"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Link2 } from "lucide-react";

interface CopyLinkButtonProps {
  url: string;
}

export function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Falha ao copiar: ", err);
    }
  };

  return (
    <div
      className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--muted)/0.25)",
        border: "1px solid hsl(var(--primary)/0.18)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)"
      }}
    >
      {/* Linha de luz superior */}
      <div className="absolute top-0 left-4 right-4 h-px"
        style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.4), transparent)" }}
      />

      {/* Ícone + URL */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="shrink-0 p-1.5 rounded-lg"
          style={{ background: "hsl(var(--primary)/0.1)", border: "1px solid hsl(var(--primary)/0.2)" }}
        >
          <Link2 className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-0.5">
            Link Público
          </div>
          <div
            className="text-xs font-medium truncate font-mono text-foreground/80 terminal-cursor"
            style={{ maxWidth: "100%" }}
          >
            {url}
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleCopy}
          className="relative flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg overflow-hidden transition-all duration-200 active:scale-95"
          style={{
            background: copied ? "rgba(34,197,94,0.1)" : "hsl(var(--card))",
            border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "hsl(var(--border))"}`,
            color: copied ? "#22c55e" : "hsl(var(--foreground))"
          }}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Copiar</span>
            </>
          )}
        </button>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg overflow-hidden transition-all duration-200 hover:opacity-90 active:scale-95 group"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.75))",
            color: "hsl(var(--primary-foreground))",
            boxShadow: "0 4px 12px rgba(var(--glow-rgb), 0.2)"
          }}
        >
          {/* Shimmer no hover */}
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.2s linear infinite"
            }}
          />
          <ExternalLink className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">Acessar</span>
        </a>
      </div>
    </div>
  );
}

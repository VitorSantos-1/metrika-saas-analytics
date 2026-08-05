"use client";

import { useEffect, useState, useTransition } from "react";
import { getActiveTheme, updateActiveTheme } from "./actions";
import { useTheme, Theme } from "@/components/ThemeProvider";
import { 
  Palette, 
  Check, 
  Sparkles,
  Eye,
  Info,
  Layers,
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface ThemeMeta {
  id: Theme;
  name: string;
  desc: string;
  colors: {
    bg: string;
    card: string;
    primary: string;
    accent: string;
  };
  purpose: string;
}

export default function ThemesPage() {
  const { theme: currentLocalTheme, setTheme: setLocalTheme } = useTheme();
  const [dbTheme, setDbTheme] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const themes: ThemeMeta[] = [
    {
      id: "sleek-dark",
      name: "Escuro Sleek",
      desc: "Interface moderna e de alto contraste em tons escuros de cinza e ciano neon.",
      purpose: "Excelente para visualização de logs, telemetria em tempo real e infraestrutura de dados.",
      colors: {
        bg: "bg-[#0B0F19]",
        card: "bg-[#111827]",
        primary: "bg-[#06B6D4]",
        accent: "bg-[#8B5CF6]",
      }
    },
    {
      id: "clean-business",
      name: "Claro Corporativo",
      desc: "Minimalista, focado em legibilidade e contraste sob luz do dia.",
      purpose: "Perfeito para relatórios executivos, reuniões de diretoria e apresentações formais.",
      colors: {
        bg: "bg-[#F3F4F6]",
        card: "bg-[#FFFFFF]",
        primary: "bg-[#1E3A8A]",
        accent: "bg-[#2563EB]",
      }
    },
    {
      id: "cyberpunk",
      name: "Cyberpunk Neon",
      desc: "Fundo preto profundo com neon vibrante rosa e azul.",
      purpose: "Ideal para painéis de Growth Hacking, marketing digital e startups modernas.",
      colors: {
        bg: "bg-[#030303]",
        card: "bg-[#0A0A0A]",
        primary: "bg-[#EC4899]",
        accent: "bg-[#06B6D4]",
      }
    },
    {
      id: "emerald-growth",
      name: "Emerald Growth",
      desc: "Fundo escuro e profundo contrastado com verde esmeralda suave.",
      purpose: "Excelente para e-commerce, metas de vendas, faturamento e BI financeiro.",
      colors: {
        bg: "bg-[#06100E]",
        card: "bg-[#0A1A17]",
        primary: "bg-[#10B981]",
        accent: "bg-[#059669]",
      }
    },
    {
      id: "oceanic",
      name: "Oceanic Insight",
      desc: "Tons de azul marinho profundo e turquesa que emulam calma e profundidade.",
      purpose: "Recomendado para análises estatísticas complexas, ciências e pesquisas acadêmicas.",
      colors: {
        bg: "bg-[#070F2B]",
        card: "bg-[#1B1A55]",
        primary: "bg-[#00F0FF]",
        accent: "bg-[#535C91]",
      }
    }
  ];

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const active = await getActiveTheme();
        setDbTheme(active);
        // Sincroniza o tema local com o tema do banco ao carregar
        setLocalTheme(active as Theme);
      } catch (err) {
        console.error("Erro ao carregar tema", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyTheme = (themeId: Theme) => {
    // Muda localmente na hora para o usuário ver a experiência
    setLocalTheme(themeId);
  };

  const handleSaveTheme = () => {
    startTransition(async () => {
      try {
        await updateActiveTheme(currentLocalTheme);
        setDbTheme(currentLocalTheme);
        alert("Tema salvo e aplicado com sucesso no link público!");
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar tema.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Resumo e Botão de Salvar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-card border border-border p-6 rounded-2xl shadow-sm transition-colors duration-300">
        <div>
          <h3 className="font-bold text-lg">Seletor de Identidade Visual</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize os temas analíticos e aplique o design ideal para os seus painéis.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground hidden lg:block">
            Tema salvo em nuvem: <span className="font-bold text-foreground font-mono">{dbTheme}</span>
          </span>
          <button
            onClick={handleSaveTheme}
            disabled={currentLocalTheme === dbTheme || isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-md"
          >
            {isPending ? "Salvando..." : "Salvar no Link Público"}
          </button>
        </div>
      </div>

      {/* Grid de Temas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">Carregando temas analíticos...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((t) => {
            const isSelected = currentLocalTheme === t.id;
            const isSaved = dbTheme === t.id;

            return (
              <button
                key={t.id}
                onClick={() => handleApplyTheme(t.id)}
                className={`bg-card border text-left rounded-2xl p-6 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all duration-300 relative group border-2 ${
                  isSelected ? "border-primary ring-2 ring-primary/10" : "border-border/60"
                }`}
              >
                {/* Indicadores */}
                <div className="flex items-start justify-between w-full mb-4">
                  <span className="text-base font-bold tracking-tight text-foreground">{t.name}</span>
                  <div className="flex items-center gap-1.5">
                    {isSaved && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                        Ativo em Produção
                      </span>
                    )}
                    {isSelected && (
                      <span className="p-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Prévia de Cores do Tema */}
                <div className="w-full h-24 rounded-xl overflow-hidden border border-border/80 flex p-3 bg-muted/30 mb-4 gap-2 relative">
                  <div className={`w-1/2 h-full rounded-lg ${t.colors.bg} border border-border flex flex-col justify-between p-2`}>
                    <span className="text-[8px] opacity-40 font-semibold font-mono">Fundo</span>
                    <div className="flex gap-1.5">
                      <div className={`w-3 h-3 rounded-full ${t.colors.primary}`} />
                      <div className={`w-3 h-3 rounded-full ${t.colors.accent}`} />
                    </div>
                  </div>
                  <div className={`w-1/2 h-full rounded-lg ${t.colors.card} border border-border/40 p-2 flex flex-col justify-between`}>
                    <span className="text-[8px] opacity-40 font-semibold font-mono">Cartão / Widget</span>
                    <div className="w-full h-1.5 rounded-full bg-muted" />
                    <div className="w-2/3 h-1.5 rounded-full bg-muted" />
                  </div>
                </div>

                {/* Detalhes */}
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t.desc}
                  </p>
                  
                  <div className="bg-muted/40 p-3 rounded-xl border border-border/40 text-[11px] text-muted-foreground flex gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <span>{t.purpose}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Dica Adicional */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3 text-xs text-primary/80">
        <Info className="w-5 h-5 shrink-0 text-primary mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Dica de Experiência</span>
          Clique sobre os cartões dos temas acima para ver as cores de todo o painel de controle administrativo mudarem dinamicamente na hora. Isso permite que você teste o tema escuro, claro ou neon antes de salvá-lo no banco de dados e publicá-lo para seus clientes.
        </div>
      </div>
    </div>
  );
}

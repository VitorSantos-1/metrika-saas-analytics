"use client";

import { useEffect, useState, useTransition } from "react";
import { getSubscription, upgradeSubscription } from "./actions";
import { 
  CreditCard, 
  Check, 
  Zap, 
  Crown, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Lock,
  Loader2,
  X
} from "lucide-react";

interface Subscription {
  id: string;
  planType: string;
  status: string;
  currentPeriodEnd: Date | null;
}

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Estados do Modal de Checkout
  const [isOpenCheckout, setIsOpenCheckout] = useState(false);
  const [targetPlan, setTargetPlan] = useState<"PRO" | "ENTERPRISE">("ENTERPRISE");
  const [checkoutStep, setCheckoutStep] = useState<"idle" | "processing" | "success">("idle");

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const data = await getSubscription();
      if (data) {
        setSub({
          ...data,
          currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null
        });
      }
    } catch (err) {
      console.error("Erro ao carregar assinatura", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleOpenCheckout = (plan: "PRO" | "ENTERPRISE") => {
    setTargetPlan(plan);
    setCheckoutStep("idle");
    setIsOpenCheckout(true);
  };

  const handleSimulatePayment = () => {
    setCheckoutStep("processing");

    setTimeout(() => {
      startTransition(async () => {
        try {
          await upgradeSubscription(targetPlan);
          setCheckoutStep("success");
          setTimeout(() => {
            setIsOpenCheckout(false);
            fetchSubscription();
          }, 1500);
        } catch (err) {
          console.error("Erro no upgrade de plano", err);
          setCheckoutStep("idle");
          alert("Ocorreu um erro no processamento do checkout simulado.");
        }
      });
    }, 2000);
  };

  const getPlanName = (type: string) => {
    if (type === "PRO") return "Metrika PRO";
    if (type === "ENTERPRISE") return "Metrika Enterprise";
    return "Metrika Lite (Gratuito)";
  };

  const getPlanIcon = (type: string) => {
    if (type === "ENTERPRISE") return <Crown className="w-5 h-5 text-amber-500" />;
    return <Zap className="w-5 h-5 text-primary" />;
  };

  const plans = [
    {
      id: "LITE",
      name: "Lite",
      price: "R$ 0",
      period: "para sempre",
      desc: "Ideal para analistas iniciantes testando a ferramenta.",
      features: [
        "1 Conexão de dados ativa",
        "Até 3 widgets de BI",
        "Visualização móvel básica",
        "Link público metrika.io/username",
        "Suporte por e-mail (48h)"
      ],
      isPopular: false,
      cta: "Plano Inicial",
      disabled: true
    },
    {
      id: "PRO",
      name: "PRO",
      price: "R$ 49,90",
      period: "mês",
      desc: "Perfeito para profissionais que precisam de múltiplos relatórios.",
      features: [
        "Conexões de dados ILIMITADAS",
        "Até 10 widgets por dashboard",
        "Navegação por subpastas/seções",
        "Remoção de marca d'água",
        "Exportação ilimitada em CSV",
        "Suporte prioritário (12h)"
      ],
      isPopular: true,
      cta: "Fazer Upgrade para PRO",
      disabled: sub?.planType === "PRO" || sub?.planType === "ENTERPRISE"
    },
    {
      id: "ENTERPRISE",
      name: "Enterprise",
      price: "R$ 149,90",
      period: "mês",
      desc: "Para grandes volumes de dados e times de engenharia exigentes.",
      features: [
        "Widgets e Gráficos ILIMITADOS",
        "Acesso aos 5 temas analíticos premium",
        "Handshake SSL em banco de dados",
        "Atualização e sync em tempo real (1 min)",
        "Backup automatizado dos dados",
        "Gerente de conta exclusivo"
      ],
      isPopular: false,
      cta: "Assinar Enterprise",
      disabled: sub?.planType === "ENTERPRISE"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Detalhes da Assinatura Atual */}
      {loading ? (
        <div className="flex items-center justify-center p-6 border border-border bg-card rounded-2xl animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span>Carregando dados de faturamento...</span>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card border border-border p-6 rounded-2xl shadow-sm transition-colors duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-primary/10 text-primary rounded-xl border border-primary/20 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{getPlanName(sub?.planType || "LITE")}</h3>
                {sub?.planType && getPlanIcon(sub.planType)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Status: <span className="text-emerald-500 font-semibold uppercase">{sub?.status || "ATIVO"}</span> 
                {sub?.currentPeriodEnd && ` • Renovação automática em ${sub.currentPeriodEnd.toLocaleDateString("pt-BR")}`}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground bg-muted/40 p-4 rounded-xl border border-border/40 max-w-md">
            <div className="font-bold text-foreground mb-1">Processamento de Pagamento Seguro</div>
            Metrika usa criptografia de ponta a ponta e integração com gateways certificados (Stripe & AppMax) para gerenciar sua assinatura de forma segura.
          </div>
        </div>
      )}

      {/* Consumo de Tokens da IA */}
      {!loading && sub && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Consumo de Tokens de IA
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tokens utilizados nas análises da Inteligência Artificial este mês
              </p>
            </div>
            {sub.planType === "ENTERPRISE" || (sub as any).tokenLimit === 0 ? (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                ∞ Ilimitado (Admin)
              </span>
            ) : (
              <span className="text-xs font-mono text-muted-foreground">
                {((sub as any).tokensUsed || 0).toLocaleString("pt-BR")} / {((sub as any).tokenLimit || 50000).toLocaleString("pt-BR")}
              </span>
            )}
          </div>

          {sub.planType !== "ENTERPRISE" && (sub as any).tokenLimit !== 0 && (
            <>
              <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((((sub as any).tokensUsed || 0) / ((sub as any).tokenLimit || 50000)) * 100, 100)}%`,
                    background: ((sub as any).tokensUsed || 0) / ((sub as any).tokenLimit || 50000) > 0.8
                      ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                      : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))"
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0</span>
                <span>
                  {Math.round((((sub as any).tokensUsed || 0) / ((sub as any).tokenLimit || 50000)) * 100)}% utilizado
                </span>
                <span>{((sub as any).tokenLimit || 50000).toLocaleString("pt-BR")}</span>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/20 rounded-xl p-3 border border-border/40">
                <strong className="text-foreground">Planos e limites:</strong> FREE = 50.000 tokens/mês · PRO = 500.000 tokens/mês · Enterprise = Ilimitado (admin sem limite).
                O limite é resetado automaticamente no início de cada mês.
              </div>
            </>
          )}
        </div>
      )}

      {/* Grid de Planos Comparativos */}
      <div>
        <h3 className="font-bold text-xl text-center mb-2">Selecione o plano ideal para suas metas de dados</h3>
        <p className="text-sm text-muted-foreground text-center mb-8">Faça o upgrade a qualquer momento. Cancele quando quiser com apenas um clique.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => (
            <div 
              key={p.id}
              className={`bg-card border rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative ${
                p.isPopular ? "border-primary ring-2 ring-primary/10 lg:-translate-y-2" : "border-border/80"
              }`}
            >
              {p.isPopular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Mais Escolhido
                </span>
              )}

              <div>
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{p.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">{p.price}</span>
                  <span className="text-xs text-muted-foreground font-medium">/ {p.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{p.desc}</p>

                {/* Lista de Features */}
                <ul className="mt-6 space-y-3.5 border-t border-border/60 pt-6">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs">
                      <span className="p-0.5 bg-primary/10 text-primary rounded-full shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                      <span className="text-foreground/80 leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                {sub?.planType === p.id ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Plano Ativo
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenCheckout(p.id as "PRO" | "ENTERPRISE")}
                    disabled={p.disabled}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                      p.disabled
                        ? "bg-muted border border-border text-muted-foreground cursor-not-allowed"
                        : p.isPopular
                          ? "bg-primary text-primary-foreground hover:opacity-90"
                          : "border border-border bg-card hover:bg-muted text-foreground"
                    }`}
                  >
                    {p.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Checkout Simulado (AppMax / Stripe Integration) */}
      {isOpenCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Lock className="w-4.5 h-4.5 text-primary" />
                <h3 className="font-bold text-base">Checkout Seguro Metrika</h3>
              </div>
              <button 
                onClick={() => setIsOpenCheckout(false)}
                disabled={checkoutStep === "processing"}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-6">
              {checkoutStep === "idle" && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 border border-border/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-muted-foreground">Plano Selecionado:</span>
                      <span className="font-bold text-foreground">{getPlanName(targetPlan)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-muted-foreground">Valor Mensal:</span>
                      <span className="font-bold text-primary">{targetPlan === "ENTERPRISE" ? "R$ 149,90" : "R$ 49,90"}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Simulação de Pagamento</div>
                    <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg text-[11px] text-primary/80">
                      Este é um fluxo simulado de checkout. Nenhum valor real será cobrado de você. Clicar no botão abaixo ativará os recursos premium no seu banco de dados local.
                    </div>
                  </div>

                  <button
                    onClick={handleSimulatePayment}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md text-sm"
                  >
                    Confirmar Upgrade Fictício
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {checkoutStep === "processing" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div>
                    <h4 className="font-bold text-base">Processando Transação...</h4>
                    <p className="text-xs text-muted-foreground mt-1">Conectando-se ao gateway de pagamentos da AppMax/Stripe...</p>
                  </div>
                </div>
              )}

              {checkoutStep === "success" && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-emerald-500">Upgrade Aprovado!</h4>
                    <p className="text-xs text-muted-foreground mt-1">Seu workspace foi atualizado com sucesso.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

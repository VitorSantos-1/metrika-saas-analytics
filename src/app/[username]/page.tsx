import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicDashboardView } from "@/components/public/PublicDashboardView";
import { 
  BarChart2, 
  Lock, 
  TrendingUp,
  Wifi
} from "lucide-react";

interface PublicPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { username } = await params;

  const pageData = await prisma.page.findUnique({
    where: { username },
    include: {
      user: {
        include: {
          subscription: true
        }
      }
    }
  });

  if (!pageData) {
    notFound();
  }

  const folders = await prisma.folder.findMany({
    where: { pageId: pageData.id },
    orderBy: { sortOrder: "asc" }
  });

  const widgets = await prisma.widget.findMany({
    where: { pageId: pageData.id, folderId: null },
    orderBy: { sortOrder: "asc" }
  });

  try {
    const devices = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)"
    ];
    const randomDevice = devices[Math.floor(Math.random() * devices.length)];
    await prisma.pageView.create({
      data: {
        pageId: pageData.id,
        folderId: null,
        userAgent: randomDevice
      }
    });
  } catch (err) {
    console.error("Erro ao registrar telemetria", err);
  }

  const isProOrEnterprise =
    pageData.user.subscription?.planType === "PRO" ||
    pageData.user.subscription?.planType === "ENTERPRISE";

  const themeId = pageData.themeId || "sleek-dark";

  return (
    <div
      className="min-h-screen bg-background text-foreground transition-colors duration-300 pb-20"
      data-theme={themeId}
    >
      {/* Header público — sticky com blur */}
      <header
        className="sticky top-0 z-40 border-b border-border/60 transition-colors duration-300"
        style={{
          background: "hsl(var(--card)/0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)"
        }}
      >
        {/* Linha de glow no topo */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.5), hsl(var(--accent)/0.3), transparent)" }}
        />

        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Identidade da página */}
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.6))",
                boxShadow: "0 4px 12px rgba(var(--glow-rgb), 0.25)"
              }}
            >
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none">
                {pageData.publicName || `Dashboard de ${username}`}
              </h1>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5" />
                Metrika.io · dados em tempo real
              </p>
            </div>
          </div>

          {/* Direita: status + link admin */}
          <div className="flex items-center gap-3">
            <span className="badge-live hidden sm:inline-flex">
              Ao vivo
            </span>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 hover:border-primary/40"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--muted-foreground))"
              }}
            >
              <Lock className="w-3 h-3" />
              Painel
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">

        {/* Navegação de Pastas */}
        {folders.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <Link
              href={`/${username}`}
              className="px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7))",
                color: "hsl(var(--primary-foreground))",
                boxShadow: "0 4px 12px rgba(var(--glow-rgb), 0.2)"
              }}
            >
              Visão Geral
            </Link>

            {folders.map((f) => (
              <Link
                key={f.id}
                href={`/${username}/${f.slug}`}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground transition-all duration-200 hover:text-foreground shrink-0"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border)/0.6)"
                }}
              >
                {f.name}
              </Link>
            ))}
          </div>
        )}

        {/* Biografia / descrição */}
        {pageData.bio && (
          <div
            className="p-4 rounded-2xl max-w-3xl relative overflow-hidden"
            style={{
              background: "hsl(var(--muted)/0.2)",
              border: "1px solid hsl(var(--border)/0.7)"
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.3), transparent)" }}
            />
            <p className="text-xs text-muted-foreground leading-relaxed">{pageData.bio}</p>
          </div>
        )}

        {/* Widgets */}
        <PublicDashboardView widgets={widgets} />
      </main>

      {/* Footer "Powered by" */}
      {!isProOrEnterprise && (
        <footer className="mt-16 text-center">
          <a
            href="https://metrika.io"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold transition-all duration-200 hover:border-primary/30 group"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--muted-foreground))",
              boxShadow: "0 4px 14px rgba(0,0,0,0.1)"
            }}
          >
            Powered by
            <span className="font-bold text-foreground flex items-center gap-1 group-hover:text-primary transition-colors duration-200">
              Metrika.io
              <BarChart2 className="w-3 h-3 text-primary" />
            </span>
          </a>
        </footer>
      )}
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicDashboardView } from "@/components/public/PublicDashboardView";
import { 
  BarChart, 
  Lock, 
  TrendingUp
} from "lucide-react";

interface PublicFolderPageProps {
  params: Promise<{
    username: string;
    folder: string;
  }>;
}

export default async function PublicFolderPage({ params }: PublicFolderPageProps) {
  const { username, folder } = await params;

  // Busca a página pública
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

  // Busca a pasta pelo slug
  const currentFolder = await prisma.folder.findFirst({
    where: { 
      pageId: pageData.id,
      slug: folder
    }
  });

  if (!currentFolder) {
    notFound();
  }

  // Carrega todas as abas/pastas do dashboard para o menu
  const folders = await prisma.folder.findMany({
    where: { pageId: pageData.id },
    orderBy: { sortOrder: "asc" }
  });

  // Carrega os widgets associados a esta pasta específica
  const widgets = await prisma.widget.findMany({
    where: { 
      pageId: pageData.id, 
      folderId: currentFolder.id 
    },
    orderBy: { sortOrder: "asc" }
  });

  // Registra Telemetria do Acesso com ID da pasta
  try {
    const devices = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", // Desktop
      "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)" // Mobile
    ];
    const randomDevice = devices[Math.floor(Math.random() * devices.length)];
    await prisma.pageView.create({
      data: {
        pageId: pageData.id,
        folderId: currentFolder.id,
        userAgent: randomDevice
      }
    });
  } catch (err) {
    console.error("Erro ao registrar telemetria da pasta", err);
  }

  const isProOrEnterprise = pageData.user.subscription?.planType === "PRO" || pageData.user.subscription?.planType === "ENTERPRISE";

  return (
    <div 
      className="min-h-screen bg-background text-foreground transition-colors duration-300 pb-16" 
      data-theme={pageData.themeId || "sleek-dark"}
    >
      {/* Header Público do Dashboard */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none">{pageData.publicName || `Dashboard de ${username}`}</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Analíticas públicas Metrika.io</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline-block text-muted-foreground">
              Tema ativo: <span className="font-semibold text-foreground capitalize">{pageData.themeId?.replaceAll("-", " ")}</span>
            </span>
            <Link 
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-semibold transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Painel
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        {/* Menu Superior de Pastas / Abas */}
        {folders.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/60 scrollbar-thin">
            <Link
              href={`/${username}`}
              className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
            >
              Visão Geral
            </Link>
            
            {folders.map((f) => {
              const isActive = f.id === currentFolder.id;
              return (
                <Link
                  key={f.id}
                  href={`/${username}/${f.slug}`}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground font-bold"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Visualizador de Widgets com Filtros Dinâmicos */}
        <PublicDashboardView widgets={widgets} />
      </main>

      {/* Marca d'água / Rodapé Metrika */}
      {!isProOrEnterprise && (
        <footer className="mt-16 text-center">
          <a 
            href="https://metrika.io" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-[10px] text-muted-foreground transition-all shadow-sm"
          >
            Powered by 
            <span className="font-bold text-foreground flex items-center gap-0.5">
              Metrika.io 
              <BarChart className="w-3 h-3 text-primary" />
            </span>
          </a>
        </footer>
      )}
    </div>
  );
}

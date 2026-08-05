"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface GeneratedWidget {
  title: string;
  type: string;
  cachedData: string;
}

import { requireAuth } from "@/lib/auth";
import { canAdd } from "@/lib/plan-limits";

export async function saveAIWidgets(
  widgets: GeneratedWidget[], 
  category: "retail" | "marketing" | "finance",
  addToHome: boolean = false,
  aiInsights: string[] = [],
  aiSummary: string = ""
) {
  try {
    const user = await requireAuth();

    // 2. Buscar Página Pública
    const page = await prisma.page.findFirst({
      where: { userId: user.id }
    });

    if (!page) {
      throw new Error("Página pública não encontrada.");
    }

    // 3. Mapeamento de slugs e nomes das pastas/seções
    const folderMapping = {
      retail: { name: "Varejo & Atacado", slug: "varejo" },
      marketing: { name: "Marketing & CAC", slug: "marketing" },
      finance: { name: "Finanças & Custos", slug: "financeiro" }
    };

    const targetFolderInfo = folderMapping[category];

    // 4. Buscar ou criar a pasta correspondente
    let folder = await prisma.folder.findFirst({
      where: { 
        pageId: page.id,
        slug: targetFolderInfo.slug
      }
    });

    if (!folder) {
      const currentFolderCount = await prisma.folder.count({
        where: { pageId: page.id }
      });
      const planType = user.subscription?.planType || "FREE";
      const checkFolder = canAdd("folders", currentFolderCount, planType);
      if (!checkFolder.allowed) {
        throw new Error(`Limite de seções/pastas atingido para o plano ${planType}.`);
      }

      // Obter o sortOrder máximo existente
      const maxSortOrder = await prisma.folder.aggregate({
        where: { pageId: page.id },
        _max: { sortOrder: true }
      });
      const nextSortOrder = (maxSortOrder._max.sortOrder || 0) + 1;

      folder = await prisma.folder.create({
        data: {
          pageId: page.id,
          name: targetFolderInfo.name,
          slug: targetFolderInfo.slug,
          sortOrder: nextSortOrder,
          aiSummary: aiSummary || undefined,
          aiInsights: aiInsights.length > 0 ? JSON.stringify(aiInsights) : undefined,
        }
      });
    } else {
      // Atualiza os insights na pasta existente
      if (aiSummary || aiInsights.length > 0) {
        await prisma.folder.update({
          where: { id: folder.id },
          data: {
            aiSummary: aiSummary || undefined,
            aiInsights: aiInsights.length > 0 ? JSON.stringify(aiInsights) : undefined,
          }
        });
      }
    }

    // 5. Deletar widgets antigos da mesma pasta para não poluir
    await prisma.widget.deleteMany({
      where: {
        pageId: page.id,
        folderId: folder.id
      }
    });

    // Validar limites de widgets
    const currentWidgetCount = await prisma.widget.count({
      where: { pageId: page.id }
    });
    const planType = user.subscription?.planType || "FREE";
    const checkWidget = canAdd("widgets", currentWidgetCount, planType);
    if (currentWidgetCount + widgets.length > checkWidget.limit) {
      throw new Error(`Limite de widgets excedido. Seu limite no plano ${planType} é ${checkWidget.limit} e você já possui ${currentWidgetCount} widgets.`);
    }

    // 6. Inserir os novos widgets na pasta específica
    const creationPromises = widgets.map((w, index) => {
      return prisma.widget.create({
        data: {
          pageId: page.id,
          folderId: folder.id,
          title: w.title,
          type: w.type,
          cachedData: w.cachedData,
          sortOrder: index + 1,
          lastRefreshed: new Date()
        }
      });
    });

    await Promise.all(creationPromises);

    // 7. Se selecionado, criar também na Página Inicial (Visão Geral)
    if (addToHome) {
      // Deletar widgets com os mesmos títulos que estão na home (folderId: null) para evitar duplicados
      const titles = widgets.map(w => w.title);
      await prisma.widget.deleteMany({
        where: {
          pageId: page.id,
          folderId: null,
          title: { in: titles }
        }
      });

      // Obter o sortOrder máximo existente na home
      const maxHomeSort = await prisma.widget.aggregate({
        where: { pageId: page.id, folderId: null },
        _max: { sortOrder: true }
      });
      const startHomeSort = (maxHomeSort._max.sortOrder || 0) + 1;

      const homePromises = widgets.map((w, index) => {
        return prisma.widget.create({
          data: {
            pageId: page.id,
            folderId: null, // null representa a Home/Página Inicial
            title: w.title,
            type: w.type,
            cachedData: w.cachedData,
            sortOrder: startHomeSort + index,
            lastRefreshed: new Date()
          }
        });
      });

      await Promise.all(homePromises);
    }

    // Revalidar caminhos para garantir atualização imediata nos dashboards
    revalidatePath("/dashboard");
    revalidatePath(`/${page.username}`);
    revalidatePath(`/${page.username}/${folder.slug}`);

    return { success: true, folderSlug: folder.slug };
  } catch (error: any) {
    console.error("Erro ao salvar widgets da IA:", error);
    return { success: false, error: error.message };
  }
}

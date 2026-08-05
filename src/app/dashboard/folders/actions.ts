"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";
import { canAdd } from "@/lib/plan-limits";

export async function getFolders() {
  const user = await requireAuth();

  const page = await prisma.page.findFirst({
    where: { userId: user.id },
  });

  if (!page) return [];

  return prisma.folder.findMany({
    where: { pageId: page.id },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { widgets: true },
      },
    },
  });
}

export async function createFolder(data: { name: string; slug: string }) {
  const user = await requireAuth();

  const page = await prisma.page.findFirst({
    where: { userId: user.id },
  });

  if (!page) throw new Error("Página pública não encontrada");

  // Verificar limites do plano
  const currentCount = await prisma.folder.count({
    where: { pageId: page.id }
  });

  const planType = user.subscription?.planType || "FREE";
  const check = canAdd("folders", currentCount, planType);

  if (!check.allowed) {
    throw new Error(`Limite de pastas do plano ${planType} atingido (${check.limit}). Faça upgrade para adicionar mais.`);
  }

  // Achar o maior sortOrder atual para incrementar
  const lastFolder = await prisma.folder.findFirst({
    where: { pageId: page.id },
    orderBy: { sortOrder: "desc" },
  });

  const nextOrder = (lastFolder?.sortOrder || 0) + 1;

  const newFolder = await prisma.folder.create({
    data: {
      pageId: page.id,
      name: data.name,
      slug: data.slug.toLowerCase().trim().replace(/\s+/g, "-"),
      sortOrder: nextOrder,
    },
  });


  revalidatePath("/dashboard");
  revalidatePath("/dashboard/folders");
  return newFolder;
}

export async function deleteFolder(id: string) {
  // Desvincular todos os widgets associados a esta pasta definindo folderId para null
  await prisma.widget.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  });

  const deletedFolder = await prisma.folder.delete({
    where: { id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/folders");
  return deletedFolder;
}

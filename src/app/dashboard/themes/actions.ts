"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";

export async function getActiveTheme() {
  const user = await requireAuth();

  const page = await prisma.page.findFirst({
    where: { userId: user.id },
  });

  return page?.themeId || "sleek-dark";
}

export async function updateActiveTheme(themeId: string) {
  const user = await requireAuth();

  const page = await prisma.page.findFirst({
    where: { userId: user.id },
  });

  if (!page) throw new Error("Página pública não encontrada");

  const updatedPage = await prisma.page.update({
    where: { id: page.id },
    data: { themeId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/themes");
  revalidatePath(`/${page.username}`);
  return updatedPage;
}

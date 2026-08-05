"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAdminStats() {
  const usersCount = await prisma.user.count();
  const connectionsCount = await prisma.dataConnection.count();
  const pageviewsCount = await prisma.pageView.count();

  // Calcula MRR fictício com base nas assinaturas
  const subscriptions = await prisma.subscription.findMany();
  let mrr = 0;
  subscriptions.forEach(sub => {
    if (sub.planType === "PRO") mrr += 49.90;
    if (sub.planType === "ENTERPRISE") mrr += 149.90;
  });

  return {
    usersCount,
    connectionsCount,
    pageviewsCount,
    mrr: mrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  };
}

export async function getAdminDetails() {
  const users = await prisma.user.findMany({
    include: {
      subscription: true,
      page: {
        select: { username: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const connections = await prisma.dataConnection.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return { users, connections };
}

export async function toggleUserRole(userId: string, currentRole: string) {
  const nextRole = currentRole === "SUSPENDED" ? "USER" : "SUSPENDED";
  
  await prisma.user.update({
    where: { id: userId },
    data: { role: nextRole }
  });

  revalidatePath("/admin");
}

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";
import { canAdd } from "@/lib/plan-limits";

export async function getConnections() {
  const user = await requireAuth();
  return prisma.dataConnection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createConnection(data: {
  name: string;
  type: string;
  connectionString?: string;
  sheetUrl?: string;
  fileUrl?: string;
}) {
  const user = await requireAuth();

  // Buscar total de conexões atuais para verificar limite do plano
  const currentCount = await prisma.dataConnection.count({
    where: { userId: user.id }
  });

  const planType = user.subscription?.planType || "FREE";
  const check = canAdd("connections", currentCount, planType);

  if (!check.allowed) {
    throw new Error(`Limite de conexões do plano ${planType} atingido (${check.limit}). Faça upgrade para adicionar mais.`);
  }

  const newConn = await prisma.dataConnection.create({
    data: {
      userId: user.id,
      name: data.name,
      type: data.type,
      connectionString: data.connectionString || null,
      sheetUrl: data.sheetUrl || null,
      fileUrl: data.fileUrl || null,
      isActive: true,
    },
  });


  revalidatePath("/dashboard");
  revalidatePath("/dashboard/connections");
  return newConn;
}

export async function deleteConnection(id: string) {
  // Primeiro, desvincular ou deletar widgets associados a esta conexão
  // No schema, widgets têm relação opcional com connectionId
  await prisma.widget.updateMany({
    where: { connectionId: id },
    data: { connectionId: null },
  });

  const deletedConn = await prisma.dataConnection.delete({
    where: { id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/connections");
  return deletedConn;
}

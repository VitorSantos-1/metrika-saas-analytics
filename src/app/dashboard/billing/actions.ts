"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";

export async function getSubscription() {
  const user = await requireAuth();

  return prisma.subscription.findFirst({
    where: { userId: user.id },
  });
}

export async function upgradeSubscription(planType: "PRO" | "ENTERPRISE") {
  const user = await requireAuth();

  const sub = await prisma.subscription.findFirst({
    where: { userId: user.id },
  });

  let updatedSub;

  if (sub) {
    updatedSub = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        planType,
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // renova +30 dias
      },
    });
  } else {
    updatedSub = await prisma.subscription.create({
      data: {
        userId: user.id,
        planType,
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  return updatedSub;
}

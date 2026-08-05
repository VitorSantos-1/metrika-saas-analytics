/**
 * lib/plan-limits.ts
 * Limites de plano aplicados no código.
 */

export const PLAN_LIMITS = {
  FREE: {
    connections: 2,
    widgets: 5,
    folders: 1,
  },
  PRO: {
    connections: 20,
    widgets: 100,
    folders: 20,
  },
  ENTERPRISE: {
    connections: Infinity,
    widgets: Infinity,
    folders: Infinity,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getPlanLimits(planType?: string | null) {
  const plan = (planType ?? "FREE") as PlanType;
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

export function canAdd(
  resource: "connections" | "widgets" | "folders",
  currentCount: number,
  planType?: string | null
): { allowed: boolean; limit: number; current: number } {
  const limits = getPlanLimits(planType);
  const limit = limits[resource];
  return {
    allowed: currentCount < limit,
    limit,
    current: currentCount,
  };
}

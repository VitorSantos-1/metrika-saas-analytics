/**
 * lib/auth.ts
 * Sistema de autenticação próprio usando crypto nativo do Node.
 * Sem dependências externas — usa scrypt para hash e token aleatório para sessão.
 */
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import crypto from "crypto";

const SESSION_COOKIE = "metrika_session";
const SESSION_DURATION_DAYS = 30;

// ─── Hash de Senha ────────────────────────────────────────────────────────────

/** Gera hash seguro da senha usando scrypt */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Compara senha com o hash armazenado */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
  } catch {
    return false;
  }
}

// ─── Sessão ───────────────────────────────────────────────────────────────────

/** Cria sessão e seta o cookie */
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  // Salva token no banco (tabela Session)
  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

/** Lê sessão do cookie e retorna usuário logado, ou null */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          page: true,
          subscription: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

/** Destrói sessão (logout) */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE);
  }
}

/** Retorna usuário logado ou redireciona para /login */
export async function requireAuth() {
  const user = await getSession();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return user!;
}

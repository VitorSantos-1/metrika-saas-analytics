import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    await createSession(user.id);

    // Redireciona para onboarding se a página ainda não foi criada
    const page = await prisma.page.findFirst({ where: { userId: user.id } });
    const redirect = page ? "/dashboard" : "/onboarding";

    return NextResponse.json({ success: true, redirect });
  } catch (err) {
    console.error("[LOGIN]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}

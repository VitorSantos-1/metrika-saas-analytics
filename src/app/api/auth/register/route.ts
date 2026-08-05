import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 8 caracteres." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        subscription: {
          create: { planType: "FREE", status: "ACTIVE" },
        },
      },
    });

    await createSession(user.id);

    return NextResponse.json({ success: true, redirect: "/onboarding" });
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}

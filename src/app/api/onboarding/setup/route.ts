import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { publicName, bio, username } = await request.json();
    const cleanUsername = username?.trim().toLowerCase();

    if (!publicName || !cleanUsername) {
      return NextResponse.json({ error: "Nome público e username são obrigatórios" }, { status: 400 });
    }

    if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
      return NextResponse.json({ error: "Formato de username inválido" }, { status: 400 });
    }

    // Double check availability
    const existingPage = await prisma.page.findUnique({
      where: { username: cleanUsername }
    });

    if (existingPage) {
      return NextResponse.json({ error: "Username já em uso" }, { status: 409 });
    }

    // Criar a página associada ao usuário
    const page = await prisma.page.create({
      data: {
        userId: user.id,
        username: cleanUsername,
        publicName,
        bio,
        themeId: "sleek-dark",
        isPublished: true,
      }
    });

    return NextResponse.json({ success: true, page });
  } catch (err) {
    console.error("[ONBOARDING-SETUP]", err);
    return NextResponse.json({ error: "Erro interno ao configurar perfil" }, { status: 500 });
  }
}

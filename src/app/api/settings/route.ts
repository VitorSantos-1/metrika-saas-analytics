import { NextResponse } from "next/server";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const {
      name,
      publicName,
      bio,
      username,
      avatarUrl,
      currentPassword,
      newPassword,
    } = await request.json();

    const cleanUsername = username?.trim().toLowerCase();

    if (!name || !publicName || !cleanUsername) {
      return NextResponse.json({ error: "Nome, nome público e username são obrigatórios." }, { status: 400 });
    }

    if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
      return NextResponse.json({ error: "Formato de username inválido" }, { status: 400 });
    }

    // Check username availability if it changed
    const page = await prisma.page.findUnique({ where: { userId: user.id } });
    if (page && page.username !== cleanUsername) {
      const existing = await prisma.page.findUnique({ where: { username: cleanUsername } });
      if (existing) {
        return NextResponse.json({ error: "Este username já está em uso por outra conta." }, { status: 409 });
      }
    }

    // Handle password change if requested
    let passwordHashUpdate = undefined;
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Você precisa informar a senha atual para alterá-la." }, { status: 400 });
      }

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser || !dbUser.passwordHash || !verifyPassword(currentPassword, dbUser.passwordHash)) {
        return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: "A nova senha precisa ter no mínimo 8 caracteres." }, { status: 400 });
      }

      passwordHashUpdate = hashPassword(newPassword);
    }

    // Update User
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        ...(passwordHashUpdate ? { passwordHash: passwordHashUpdate } : {}),
      },
    });

    // Update or create Page
    if (page) {
      await prisma.page.update({
        where: { id: page.id },
        data: {
          username: cleanUsername,
          publicName,
          bio,
          avatarUrl,
        },
      });
    } else {
      await prisma.page.create({
        data: {
          userId: user.id,
          username: cleanUsername,
          publicName,
          bio,
          avatarUrl,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[SETTINGS-PATCH]", err);
    return NextResponse.json({ error: "Erro interno ao atualizar configurações." }, { status: 500 });
  }
}

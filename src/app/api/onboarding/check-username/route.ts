import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.trim().toLowerCase();

    if (!username || username.length < 3) {
      return NextResponse.json({ available: false, error: "Username muito curto" });
    }

    if (!/^[a-z0-9_-]+$/.test(username)) {
      return NextResponse.json({ available: false, error: "Formato inválido" });
    }

    const existingPage = await prisma.page.findUnique({
      where: { username }
    });

    return NextResponse.json({ available: !existingPage });
  } catch (err) {
    console.error("[CHECK-USERNAME]", err);
    return NextResponse.json({ available: false, error: "Erro interno" }, { status: 500 });
  }
}

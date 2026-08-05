import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      username: user.page?.username || "vitor",
      planType: user.subscription?.planType || "FREE",
    });
  } catch (err) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { sheetUrl } = await req.json();

    if (!sheetUrl) {
      return NextResponse.json(
        { error: "A URL da planilha é obrigatória." },
        { status: 400 }
      );
    }

    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      return NextResponse.json(
        { error: "Link do Google Sheets inválido. Certifique-se de copiar a URL completa." },
        { status: 400 }
      );
    }

    const sheetId = sheetIdMatch[1];
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

    // A requisição HTTP feita a partir do servidor evita restrições de CORS do navegador.
    const response = await fetch(exportUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Não foi possível acessar a planilha. Verifique se o compartilhamento está definido como 'Qualquer pessoa com o link'." },
        { status: 400 }
      );
    }

    const csvText = await response.text();
    
    // Protege contra páginas de login do Google retornadas como HTML quando o documento não está público
    if (csvText.trim().startsWith("<!DOCTYPE html>")) {
      return NextResponse.json(
        { error: "A planilha parece privada. Por favor, mude o compartilhamento para 'Qualquer pessoa com o link' (Leitor)." },
        { status: 400 }
      );
    }

    return NextResponse.json({ csvText });
  } catch (error: any) {
    console.error("Erro ao obter planilha:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao obter dados da planilha: " + error.message },
      { status: 500 }
    );
  }
}

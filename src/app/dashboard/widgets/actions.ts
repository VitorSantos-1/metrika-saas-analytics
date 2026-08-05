"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { requireAuth } from "@/lib/auth";
import { canAdd } from "@/lib/plan-limits";

export async function getWidgetsWithRelations() {
  const user = await requireAuth();

  const page = await prisma.page.findFirst({
    where: { userId: user.id },
  });

  if (!page) return [];

  return prisma.widget.findMany({
    where: { pageId: page.id },
    include: {
      connection: {
        select: { name: true, type: true }
      },
      folder: {
        select: { name: true }
      }
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getFormDependencies() {
  const user = await requireAuth();

  const page = await prisma.page.findFirst({
    where: { userId: user.id },
  });

  const connections = await prisma.dataConnection.findMany({
    where: { userId: user.id, isActive: true },
    select: { id: true, name: true, type: true }
  });

  const folders = page ? await prisma.folder.findMany({
    where: { pageId: page.id },
    select: { id: true, name: true }
  }) : [];

  return { connections, folders };
}

export async function createWidget(data: {
  connectionId?: string;
  folderId?: string;
  title: string;
  type: string;
  query: string;
  cachedData: string;
}) {
  const user = await requireAuth();

  const page = await prisma.page.findFirst({
    where: { userId: user.id },
  });

  if (!page) throw new Error("Página pública não encontrada");

  // Verificar limite do plano
  const currentCount = await prisma.widget.count({
    where: { pageId: page.id }
  });

  const planType = user.subscription?.planType || "FREE";
  const check = canAdd("widgets", currentCount, planType);

  if (!check.allowed) {
    throw new Error(`Limite de widgets do plano ${planType} atingido (${check.limit}). Faça upgrade para adicionar mais.`);
  }

  // Maior sortOrder atual
  const lastWidget = await prisma.widget.findFirst({
    where: { pageId: page.id },
    orderBy: { sortOrder: "desc" },
  });

  const nextOrder = (lastWidget?.sortOrder || 0) + 1;

  const newWidget = await prisma.widget.create({
    data: {
      pageId: page.id,
      connectionId: data.connectionId || null,
      folderId: data.folderId || null,
      title: data.title,
      type: data.type,
      query: data.query,
      cachedData: data.cachedData,
      sortOrder: nextOrder,
      lastRefreshed: new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/widgets");
  revalidatePath(`/${page.username}`);
  return newWidget;
}

export async function deleteWidget(id: string) {
  const deletedWidget = await prisma.widget.delete({
    where: { id },
  });

  const page = await prisma.page.findFirst({
    where: { id: deletedWidget.pageId }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/widgets");
  if (page) {
    revalidatePath(`/${page.username}`);
  }
  return deletedWidget;
}

import { callUnifiedAI } from "@/lib/ai";

export async function generateMockDataFromSQL(
  connectionId: string, 
  query: string, 
  type: string, 
  provider: string = "gemini"
) {
  try {
    const connection = await prisma.dataConnection.findUnique({
      where: { id: connectionId }
    });

    const connName = (connection?.name || "").toLowerCase();
    let dataFilePath = "";
    let tablesToRegister: string[] = [];

    // Mapeia o arquivo de dados concreto de BI real
    if (connName.includes("leads") || connName.includes("marketing") || connection?.type === "GOOGLESHEETS") {
      dataFilePath = path.join(process.cwd(), "public", "data", "leads_marketing.json");
      tablesToRegister = ["leads", "marketing_data", "ads_perf"];
    } else if (connName.includes("faturamento") || connName.includes("vendas") || connection?.type === "CSV_PARQUET_FILE") {
      dataFilePath = path.join(process.cwd(), "public", "data", "faturamento_vendas.json");
      tablesToRegister = ["faturamento", "vendas"];
    } else {
      dataFilePath = path.join(process.cwd(), "public", "data", "pedidos_clientes.json");
      tablesToRegister = ["pedidos", "funnel_daily", "despesas"];
    }

    let rawData: any[] = [];
    if (fs.existsSync(dataFilePath)) {
      const fileContent = fs.readFileSync(dataFilePath, "utf-8");
      rawData = JSON.parse(fileContent);
    } else {
      throw new Error(`Fonte de dados física não encontrada em: ${dataFilePath}`);
    }

    // Usamos a IA como motor de execução SQL determinística de alto desempenho
    // Nós fornecemos a ela a query e as linhas reais dos dados para ela computar
    const systemInstruction = `Você é um motor de execução de consultas SQL (Dialeto SQLite compatível) de alta precisão matemática.
Você receberá uma query SQL e uma base de dados concreta em JSON (representando as tabelas: ${tablesToRegister.join(", ")}).
Sua tarefa é executar a query SQL de forma EXATA e DETERMINÍSTICA em cima dos dados JSON fornecidos.
Não aproxime, não simule e não invente valores. Faça a soma (SUM), média (AVG), agrupamento (GROUP BY) ou seleção exata com base nas linhas.

Retorne APENAS o JSON de resposta formatado exatamente de acordo com o tipo de widget: "${type}".
Não adicione markdown (\`\`\`), comentários ou explicações. Retorne o texto limpo do JSON resultante.

Formatos de resposta obrigatórios por tipo de widget:
1. Se type for 'KPI_CARD', retorne um único objeto contendo o valor agregado formatado (como moeda R$ ou inteiro) e subtext informando a coluna agregada:
   {"value": "R$ X.XXX,XX" ou "X.XX%", "change": "+0.0%", "isPositive": true, "subtext": "Soma de faturamento real" }
2. Se type for 'LINE_CHART', 'BAR_CHART' ou 'PIE_CHART', retorne uma array JSON de objetos contendo obrigatoriamente as chaves 'name' e 'value' (com os valores numéricos reais agregados):
   [{"name": "Google Ads", "value": 450.0}, {"name": "Orgânico", "value": 230.0}]
3. Se type for 'TABLE', retorne a array JSON das linhas resultantes exatas da consulta SQL.`;

    const userPrompt = `Consulta SQL do usuário: "${query}"
Dados reais em JSON (tabela ativa):
${JSON.stringify(rawData, null, 2)}

Por favor, execute o SQL e retorne o resultado no formato do widget "${type}".`;

    const resultText = await callUnifiedAI({
      systemInstruction,
      userPrompt,
      provider
    });

    let cleanResult = resultText.trim();
    if (cleanResult.startsWith("```")) {
      cleanResult = cleanResult.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    // Valida se o retorno é um JSON válido
    JSON.parse(cleanResult);

    return { success: true, cachedData: cleanResult };
  } catch (error: any) {
    console.error("Erro ao executar SQL por IA:", error);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// AUTO-COMPLETE DE TABELAS E COLUNAS BASEADO NA CONEXÃO
// ----------------------------------------------------
export async function getSchemaSuggestions(connectionId: string) {
  try {
    const connection = await prisma.dataConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      return { tables: [] };
    }

    const connName = connection.name.toLowerCase();

    // Dicionário de esquemas de dados baseado no seed do metrika
    if (connName.includes("leads") || connName.includes("marketing") || connection.type === "GOOGLESHEETS") {
      return {
        tables: [
          { name: "leads", columns: ["id", "nome", "email", "canal", "data", "status"] },
          { name: "marketing_data", columns: ["spend", "leads", "canal", "data"] },
          { name: "ads_perf", columns: ["plataforma", "clicks", "leads", "ctr", "cpc"] }
        ]
      };
    }

    if (connName.includes("faturamento") || connName.includes("csv") || connection.type === "CSV_PARQUET_FILE") {
      return {
        tables: [
          { name: "faturamento", columns: ["mes", "valor", "meta", "pedidos", "ticket_medio"] },
          { name: "vendas", columns: ["id", "produto", "categoria", "valor", "data"] }
        ]
      };
    }

    // Default (Bancos de dados gerais / PostgreSQL)
    return {
      tables: [
        { name: "pedidos", columns: ["id", "cliente", "valor", "status", "data", "itens"] },
        { name: "funnel_daily", columns: ["data", "acessos", "leads", "compras", "conversao"] },
        { name: "despesas", columns: ["id", "categoria", "valor", "vencimento", "pago"] }
      ]
    };
  } catch (error) {
    console.error("Erro ao obter sugestões de esquema:", error);
    return { tables: [] };
  }
}

// ----------------------------------------------------
// NLP: TRADUZ INSTRUÇÃO DE TEXTO DO USUÁRIO EM QUERY SQL CONCRETA
// ----------------------------------------------------
export async function translateNLPToSQL(connectionId: string, nlpText: string) {
  try {
    const connection = await prisma.dataConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      throw new Error("Conexão de dados não encontrada.");
    }

    // Obtém o esquema de tabelas/colunas associado para ensinar a IA
    const schemaSuggestions = await getSchemaSuggestions(connectionId);
    const schemaDesc = JSON.stringify(schemaSuggestions.tables);

    const systemInstruction = `Você é um tradutor especialista de Linguagem Natural para consultas SQL (Dialeto SQLite compatível).
Sua tarefa é receber a pergunta/pedido do usuário em português e o esquema de tabelas/colunas disponíveis.
Você deve gerar APENAS a query SQL correspondente. Não adicione markdown, blocos de código (\`\`\`), comentários ou explicações. Retorne a string limpa da query.

Esquema de tabelas e colunas disponíveis:
${schemaDesc}

Regras:
1. Retorne APENAS a consulta SQL limpa, sem formatadores markdown.
2. Use EXATAMENTE os nomes de tabelas e colunas informados no esquema.
3. Se o usuário quiser totalizadores ou agregados, use funções como SUM(), COUNT(), AVG().
4. Mantenha a query compatível com SQL padrão.`;

    const userPrompt = `Pedido do Usuário: "${nlpText}"
Gere o código SQL correspondente para buscar estes dados.`;

    const sqlResult = await callUnifiedAI({
      systemInstruction,
      userPrompt,
      provider: "gemini" // Usa o Gemini 2.5 Flash de alta performance por padrão
    });

    // Remove eventuais blocos de código formatados pela IA
    let cleanSql = sqlResult.trim();
    if (cleanSql.startsWith("```")) {
      cleanSql = cleanSql.replace(/^```sql\s*/i, "").replace(/```$/, "").trim();
    }

    return { success: true, query: cleanSql };
  } catch (error: any) {
    console.error("Erro no tradutor NLP:", error);
    return { success: false, error: error.message };
  }
}

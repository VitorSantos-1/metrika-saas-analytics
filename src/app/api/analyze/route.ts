import { NextRequest, NextResponse } from "next/server";
import { callUnifiedAI } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60; // 60 segundos de timeout

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Você precisa estar autenticado para realizar análises de IA." },
        { status: 401 }
      );
    }

    const subscription = user.subscription;
    const isExempt = user.role === "ADMIN" || (subscription && subscription.tokenLimit === 0);

    if (!isExempt) {
      const limit = subscription ? subscription.tokenLimit : 50000;
      const used = subscription ? subscription.tokensUsed : 0;
      if (used >= limit) {
        return NextResponse.json(
          { error: "Limite de tokens de IA excedido para o seu plano atual. Por favor, faça o upgrade na aba de faturamento." },
          { status: 403 }
        );
      }
    }

    const { dataRaw, category, businessType, provider = "gemini" } = await req.json();

    if (!dataRaw || !category) {
      return NextResponse.json(
        { error: "Campos 'dataRaw' e 'category' são obrigatórios." },
        { status: 400 }
      );
    }

    const categoryNames = {
      retail: "Varejo & Atacado (Vendas, Clientes, Ticket Médio, Estoque)",
      marketing: "Marketing & Growth (CAC, LTV, Leads, Conversão, Cliques, Canais)",
      finance: "Finanças & Custos (Faturamento, Custos Fixos/Variáveis, Margem, EBITDA)"
    };

    const systemInstruction = `Você é um analista de BI e cientista de dados sênior especialista em dashboards.
Sua tarefa é analisar os dados brutos enviados pelo usuário na categoria especificada e criar os melhores KPIs e gráficos possíveis.
Retorne um JSON estrito no formato abaixo, sem formatações de markdown adicionais.

O JSON deve seguir exatamente a seguinte estrutura:
{
  "summary": "Um resumo de 1 ou 2 frases da análise dos dados fornecidos.",
  "insights": [
    "Insight importante 1 em português do Brasil",
    "Insight importante 2 em português do Brasil",
    "Insight importante 3 em português do Brasil"
  ],
  "widgets": [
    {
      "title": "Nome do Widget (ex: Faturamento Total, CAC Médio)",
      "type": "KPI_CARD | LINE_CHART | BAR_CHART | PIE_CHART | TABLE",
      "cachedData": "String JSON que representa os dados desse widget"
    }
  ]
}

Regras para preenchimento de cachedData baseado em 'type':
1. Se type for 'KPI_CARD', cachedData deve ser a string JSON de um objeto:
   {"value": "R$ X.XXX,XX" ou "X.XX%", "change": "+X.X%" ou "-X.X%", "isPositive": true ou false, "subtext": "texto explicativo"}
2. Se type for 'LINE_CHART', 'BAR_CHART' ou 'PIE_CHART', cachedData deve ser a string JSON de um array de objetos onde cada objeto possui um rótulo de texto (ex: "name") e um valor numérico (ex: "value").
   Exemplo: "[{\\"name\\":\\"Jan\\",\\"value\\":1200},{\\"name\\":\\"Fev\\",\\"value\\":1500}]"
3. Se type for 'TABLE', cachedData deve ser a string JSON de um array of objetos (linhas da tabela).
   Exemplo: "[{\\"id\\":\\"PED-01\\",\\"cliente\\":\\"Empresa A\\",\\"valor\\":\\"R$ 420,00\\",\\"status\\":\\"Pago\\"}]"

Dicas de Design:
- Para cada categoria de dados, tente criar pelo menos 2 a 3 KPI_CARDs (métricas principais) e 2 gráficos/tabelas relevantes de visualização.
- Use valores agregados reais a partir dos dados do usuário para preencher os valores.
- Certifique-se de que todas as strings internas do cachedData estão devidamente escapadas como JSON válido.`;

    const userPrompt = `Categoria de Dados: ${categoryNames[category as keyof typeof categoryNames] || category}
Tipo de Negócio / Contexto Adicional: ${businessType || "Não informado"}

Dados brutos a serem analisados:
---
${dataRaw}
---

Por favor, faça a análise quantitativa e qualitativa e gere a estrutura de dashboard em JSON.`;

    // Utiliza o módulo centralizado de IA
    const responseText = await callUnifiedAI({
      systemInstruction,
      userPrompt,
      provider
    });

    // Calcula tokens aproximados usados
    const estimatedTokens = Math.ceil((userPrompt.length + systemInstruction.length + responseText.length) / 4);

    // Salva ou incrementa o uso na tabela Subscription
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        planType: "FREE",
        status: "ACTIVE",
        tokensUsed: estimatedTokens,
        tokenLimit: 50000,
      },
      update: {
        tokensUsed: {
          increment: estimatedTokens
        }
      }
    });

    const parsedResult = JSON.parse(responseText);
    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Erro na análise da IA:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar análise da IA: " + error.message },
      { status: 500 }
    );
  }
}

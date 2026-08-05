/**
 * lib/ai.ts
 * Provedor Unificado de IA com suporte a Fallbacks Automáticos e Multi-Modelos.
 * Se o provedor escolhido falhar (limite de cota, erro de rede ou chave inválida), 
 * o sistema tenta automaticamente os outros provedores configurados.
 */

interface UnifiedAIParams {
  systemInstruction: string;
  userPrompt: string;
  provider?: string;
}

// Provedores suportados em ordem de confiabilidade
const PROVIDER_CHAIN = ["gemini", "groq", "openrouter", "deepseek", "huggingface", "openai", "claude"];


export async function callUnifiedAI({ systemInstruction, userPrompt, provider = "gemini" }: UnifiedAIParams): Promise<string> {
  // Ordena a lista para tentar o provedor solicitado primeiro, depois os fallbacks
  const attemptOrder = [
    provider,
    ...PROVIDER_CHAIN.filter(p => p !== provider)
  ];

  let lastError: Error | null = null;

  for (const currentProvider of attemptOrder) {
    try {
      console.log(`[AI-AGENT] Tentando provedor: ${currentProvider}...`);
      const response = await executeAIRequest(currentProvider, systemInstruction, userPrompt);
      if (response && response.trim().length > 0) {
        console.log(`[AI-AGENT] Sucesso com o provedor: ${currentProvider}`);
        return response;
      }
    } catch (err: any) {
      console.warn(`[AI-AGENT] Falha no provedor ${currentProvider}: ${err.message || err}`);
      lastError = err;
    }
  }

  throw lastError || new Error("Todos os provedores de IA falharam.");
}

async function executeAIRequest(provider: string, systemInstruction: string, userPrompt: string): Promise<string> {
  let responseText = "";

  // 1. OPENAI
  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Chave OPENAI_API_KEY ausente");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro na OpenAI");
    }

    const resJson = await response.json();
    responseText = resJson.choices[0].message.content;
  } 

  // 2. GROQ
  else if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Chave GROQ_API_KEY ausente");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro na Groq");
    }

    const resJson = await response.json();
    responseText = resJson.choices[0].message.content;
  }

  // 3. CLAUDE (ANTHROPIC)
  else if (provider === "claude") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Chave ANTHROPIC_API_KEY ausente");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        system: systemInstruction,
        messages: [
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro na Anthropic");
    }

    const resJson = await response.json();
    responseText = resJson.content[0].text;
  }

  // 4. HUGGING FACE
  else if (provider === "huggingface") {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) throw new Error("Chave HUGGINGFACE_API_KEY ausente");

    const response = await fetch("https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: `${systemInstruction}\n\nUser: ${userPrompt}\nAssistant:`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Erro no Hugging Face Inference");
    }

    const resJson = await response.json();
    responseText = Array.isArray(resJson) ? resJson[0].generated_text : resJson.generated_text || "";
    
    if (responseText.includes("Assistant:")) {
      responseText = responseText.split("Assistant:").pop() || responseText;
    }
  }

  // 5. OPENROUTER
  else if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("Chave OPENROUTER_API_KEY ausente");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Metrika Dashboard Builder"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro no OpenRouter");
    }

    const resJson = await response.json();
    responseText = resJson.choices[0].message.content;
  }

  // 5.5. DEEPSEEK (via OpenRouter para máxima velocidade e confiabilidade de cota)
  else if (provider === "deepseek") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("Chave OPENROUTER_API_KEY ausente para DeepSeek");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Metrika DeepSeek Integration"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-distill-llama-8b",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro no DeepSeek OpenRouter");
    }

    const resJson = await response.json();
    responseText = resJson.choices[0].message.content;
  }

  // 6. GEMINI (GOOGLE)
  else {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Chave GEMINI_API_KEY ausente");

    const geminiModels = [
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro"
    ];

    let lastError = null;

    for (const modelName of geminiModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: `${systemInstruction}\n\n${userPrompt}` }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          }
        );

        if (response.ok) {
          const resJson = await response.json();
          responseText = resJson.candidates[0].content.parts[0].text;
          break;
        } else {
          const errData = await response.json();
          lastError = new Error(errData.error?.message || `Erro no modelo ${modelName}`);
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!responseText && lastError) {
      throw lastError;
    }
  }

  return responseText;
}

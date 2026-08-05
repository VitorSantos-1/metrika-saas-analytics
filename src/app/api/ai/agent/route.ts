import { NextResponse } from "next/server";
import { exec, spawn } from "child_process";
import { getSession } from "@/lib/auth";
import path from "path";

// Caminho absoluto para o executável do Python e o script
const PYTHON_PATH = "python";
const SCRIPT_PATH = path.join(process.cwd(), "scripts", "data_agent.py");

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { action, payload, query } = await request.json();

    if (!action) {
      return NextResponse.json({ error: "Ação não informada." }, { status: 400 });
    }

    // Executa scraping ou busca simples via argumentos de linha de comando
    if (action === "scrape" || action === "search" || action === "hf") {
      const arg = query || payload || "";
      const cmd = `"${PYTHON_PATH}" "${SCRIPT_PATH}" ${action} "${arg.replace(/"/g, '\\"')}"`;
      
      const result = await new Promise<string>((resolve, reject) => {
        exec(cmd, { env: process.env }, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });

      return NextResponse.json(JSON.parse(result));
    }

    // Executa análise de dados pesados usando Pandas/NumPy via STDIN pipe
    if (action === "analyze") {
      const result = await new Promise<string>((resolve, reject) => {
        const pyProcess = spawn(PYTHON_PATH, [SCRIPT_PATH, "analyze"], { env: process.env });
        let stdoutData = "";
        let stderrData = "";

        pyProcess.stdout.on("data", (data) => {
          stdoutData += data.toString();
        });

        pyProcess.stderr.on("data", (data) => {
          stderrData += data.toString();
        });

        pyProcess.on("close", (code) => {
          if (code !== 0) {
            reject(new Error(stderrData || `Processo finalizou com código ${code}`));
          } else {
            resolve(stdoutData);
          }
        });

        // Envia payload JSON via stdin
        pyProcess.stdin.write(JSON.stringify(payload));
        pyProcess.stdin.end();
      });

      return NextResponse.json(JSON.parse(result));
    }

    // Executa inferência GGUF local via llama-cpp-python
    if (action === "local_gguf") {
      const { modelPath, prompt, systemPrompt } = payload || {};
      if (!modelPath || !prompt) {
        return NextResponse.json({ error: "Caminho do modelo e prompt são obrigatórios para execução local." }, { status: 400 });
      }

      const cmd = `"${PYTHON_PATH}" "${SCRIPT_PATH}" local_gguf "${modelPath.replace(/"/g, '\\"')}" "${prompt.replace(/"/g, '\\"')}" "${(systemPrompt || "Você é um assistente útil").replace(/"/g, '\\"')}"`;
      
      const result = await new Promise<string>((resolve, reject) => {
        exec(cmd, { env: process.env }, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });

      return NextResponse.json(JSON.parse(result));
    }

    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (err: any) {
    console.error("[AI-AGENT-API-ERROR]", err);
    return NextResponse.json({ error: "Erro na execução do agente de IA.", details: err.message }, { status: 500 });
  }
}

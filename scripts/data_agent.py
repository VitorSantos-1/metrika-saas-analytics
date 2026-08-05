import os
import sys
import json
import subprocess

# Lista de pacotes solicitados
REQUIRED_PACKAGES = {
    "pandas": "pandas",
    "numpy": "numpy",
    "scikit-learn": "sklearn",
    "beautifulsoup4": "bs4",
    "duckduckgo-search": "duckduckgo_search",
    "tavily-python": "tavily",
    "langchain": "langchain",
    "agno": "agno",
    "docling": "docling",
    "firecrawl-py": "firecrawl",
    "huggingface-hub": "huggingface_hub"
}

def install_missing_packages():
    """Garante que todas as bibliotecas de IA e processamento estejam instaladas."""
    print("Verificando dependências de IA e dados...", file=sys.stderr)
    for package, import_name in REQUIRED_PACKAGES.items():
        try:
            __import__(import_name)
        except ImportError:
            print(f"Instalando {package}...", file=sys.stderr)
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--quiet"])
                print(f"✓ {package} instalado.", file=sys.stderr)
            except Exception as e:
                print(f"❌ Erro ao instalar {package}: {e}", file=sys.stderr)

# Executa instalação silenciosa em background
install_missing_packages()

import bs4
import urllib.request
from huggingface_hub import InferenceClient

# ─── AGENTE DE INTELIGÊNCIA E SCRAPING ────────────────────────────────────────

def get_huggingface_client():
    """Retorna o cliente de inferência do Hugging Face se o token existir."""
    hf_token = os.environ.get("HUGGINGFACE_API_KEY")
    if hf_token:
        return InferenceClient(token=hf_token)
    return None

def web_scrape(url):
    """Raspagem simples com BeautifulSoup para ler dados e conteúdo de BI."""
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        html = urllib.request.urlopen(req, timeout=10).read()
        soup = bs4.BeautifulSoup(html, 'html.parser')
        
        # Extrai textos úteis
        paragraphs = [p.get_text().strip() for p in soup.find_all(['p', 'h1', 'h2', 'h3', 'li'])]
        content = " ".join([p for p in paragraphs if p])[:5000] # Limite de 5k caracteres
        return {"success": True, "content": content}
    except Exception as e:
        return {"success": False, "error": str(e)}

def search_duckduckgo(query):
    """Busca estratégica usando DuckDuckGo se a biblioteca estiver disponível."""
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = [r for r in ddgs.text(query, max_results=5)]
            return {"success": True, "results": results}
    except Exception as e:
        # Fallback de busca simulada se a instalação falhar temporariamente
        return {"success": False, "error": str(e)}

def analyze_data_with_pandas(data_json, query_instructions):
    """Processamento inteligente de loja centrales e dados com Pandas/NumPy."""
    try:
        import pandas as pd
        import numpy as np
        
        # Converte dados JSON em DataFrame
        df = pd.DataFrame(json.loads(data_json))
        
        # Descrição estatística básica (compacta para tomada de decisão)
        stats = df.describe(include='all').to_dict()
        
        return {
            "success": True,
            "columns": list(df.columns),
            "shape": df.shape,
            "summary": stats
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def query_huggingface_model(prompt, system_instruction=""):
    """Consulta direta ao Hugging Face Inference API."""
    client = get_huggingface_client()
    if not client:
        return {"success": False, "error": "HUGGINGFACE_API_KEY ausente no ambiente."}
    try:
        # Usa Llama-3 por padrão da comunidade
        response = client.text_generation(
            prompt=f"{system_instruction}\n\nUser: {prompt}\nAssistant:",
            model="meta-llama/Llama-3.3-70B-Instruct",
            max_new_tokens=1000
        )
        return {"success": True, "response": response}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ─── MÓDULO EXECUTOR PRINCIPAL ────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Nenhuma ação especificada"}))
        sys.exit(1)
        
    action = sys.argv[1]
    
    if action == "scrape":
        url = sys.argv[2] if len(sys.argv) > 2 else ""
        print(json.dumps(web_scrape(url)))
        
    elif action == "search":
        q = sys.argv[2] if len(sys.argv) > 2 else ""
        print(json.dumps(search_duckduckgo(q)))
        
    elif action == "analyze":
        # Recebe os dados e instruções via stdin
        input_data = sys.stdin.read()
        try:
            payload = json.loads(input_data)
            data_json = payload.get("data", "[]")
            instructions = payload.get("instructions", "")
            print(json.dumps(analyze_data_with_pandas(data_json, instructions)))
        except Exception as e:
            print(json.dumps({"success": False, "error": f"Erro de payload: {e}"}))
            
    elif action == "hf":
        prompt = sys.argv[2] if len(sys.argv) > 2 else ""
        print(json.dumps(query_huggingface_model(prompt)))
        
    elif action == "local_gguf":
        # Argumentos: model_path, prompt, system_prompt
        model_path = sys.argv[2] if len(sys.argv) > 2 else ""
        prompt = sys.argv[3] if len(sys.argv) > 3 else ""
        system_prompt = sys.argv[4] if len(sys.argv) > 4 else "Você é um assistente útil."
        
        try:
            # Garante que llama-cpp-python está instalado
            try:
                from llama_cpp import Llama
            except ImportError:
                print("Instalando llama-cpp-python...", file=sys.stderr)
                subprocess.check_call([sys.executable, "-m", "pip", "install", "llama-cpp-python", "--quiet"])
                from llama_cpp import Llama
            
            # Carrega o modelo GGUF (por exemplo: DeepSeek-V4-Flash)
            # Define o tamanho de contexto padrão do modelo
            llm = Llama(model_path=model_path, n_ctx=2048, verbose=False)
            
            # Executa inferência
            full_prompt = f"<system>{system_prompt}</system>\n<user>{prompt}</user>\n<assistant>"
            response = llm(full_prompt, max_tokens=512, stop=["</assistant>", "<user>"])
            output_text = response["choices"][0]["text"]
            
            print(json.dumps({"success": True, "response": output_text}))
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}))
            
    else:
        print(json.dumps({"error": "Ação inválida"}))

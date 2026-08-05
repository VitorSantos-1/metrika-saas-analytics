"use client";

import { useEffect, useState, useTransition } from "react";
import { getFolders, createFolder, deleteFolder } from "./actions";
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  RefreshCw, 
  FolderPlus, 
  ChevronRight,
  Info,
  Layers
} from "lucide-react";

interface Folder {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count?: {
    widgets: number;
  };
}

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Estados do formulário
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const data = await getFolders();
      setFolders(data);
    } catch (err) {
      console.error("Erro ao buscar pastas", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // Gerar slug automaticamente baseado no nome
  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^a-z0-9\s-]/g, "")    // remove caracteres especiais
      .trim()
      .replace(/\s+/g, "-");           // substitui espaços por -
    setSlug(generatedSlug);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    startTransition(async () => {
      try {
        await createFolder({ name, slug });
        setName("");
        setSlug("");
        await fetchFolders();
      } catch (err) {
        console.error("Erro ao criar pasta", err);
        alert("Erro ao criar pasta no banco. Verifique se o slug já existe.");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza de que deseja excluir esta pasta? Os widgets nela serão movidos para a página principal (sem pasta).")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteFolder(id);
        await fetchFolders();
      } catch (err) {
        console.error("Erro ao excluir pasta", err);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Coluna da Esquerda: Lista de Pastas (2/3 no desktop) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm transition-colors duration-300">
          <h3 className="font-bold text-lg mb-2">Suas Pastas & Seções</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Organize seus gráficos em abas setorizadas no dashboard compartilhado.
          </p>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Buscando pastas de BI...</span>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium text-sm">Nenhuma pasta criada</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                Todos os seus widgets estão listados na página raiz do seu dashboard.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {folders.map((folder) => (
                <div 
                  key={folder.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-muted/10 hover:bg-muted/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        {folder.name}
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                          /{folder.slug}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-muted-foreground/60" />
                        {folder._count?.widgets || 0} {(folder._count?.widgets || 0) === 1 ? "widget vinculado" : "widgets vinculados"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Ordem: {folder.sortOrder}
                    </span>
                    <button
                      onClick={() => handleDelete(folder.id)}
                      disabled={isPending}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      title="Excluir Pasta"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Caixa Informativa */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3 text-xs text-primary/80">
          <Info className="w-5 h-5 shrink-0 text-primary mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Como funcionam as pastas?</span>
            Na página pública do seu dashboard (`metrika.io/seu-usuario`), cada pasta criada aparece como uma aba no topo da página. Os visitantes podem clicar nelas para alternar os relatórios setoriais de forma instantânea.
          </div>
        </div>
      </div>

      {/* Coluna da Direita: Painel de Criação (1/3 no desktop) */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm h-fit transition-colors duration-300">
        <div className="flex items-center gap-2 mb-4 text-primary">
          <FolderPlus className="w-5 h-5" />
          <h3 className="font-bold text-lg text-foreground">Nova Pasta / Seção</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="folder-name" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Nome da Pasta
            </label>
            <input
              id="folder-name"
              type="text"
              required
              placeholder="Ex: Growth Marketing, Financeiro"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label htmlFor="folder-slug" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Caminho da URL (Slug)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-xs text-muted-foreground font-mono">
                /
              </span>
              <input
                id="folder-slug"
                type="text"
                required
                placeholder="marketing-cac"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-mono"
              />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1.5 block">
              Gera automaticamente um link limpo: `metrika.io/vitor/{slug || "slug"}`
            </span>
          </div>

          <button
            type="submit"
            disabled={!name || !slug || isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-md text-sm mt-2"
          >
            {isPending ? "Criando..." : "Criar Pasta"}
          </button>
        </form>
      </div>
    </div>
  );
}

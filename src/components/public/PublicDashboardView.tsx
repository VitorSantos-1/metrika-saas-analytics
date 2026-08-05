"use client";

import { useState, useMemo, useEffect } from "react";
import { PublicChart } from "./PublicChart";
import { SlidersHorizontal, X, Layers, Search, Filter, Move, Maximize2 } from "lucide-react";

interface Widget {
  id: string;
  title: string;
  type: string;
  cachedData: string | null;
}

interface PublicDashboardViewProps {
  widgets: Widget[];
  dashboardId?: string; // Usado para chave exclusiva do localStorage
}

interface LayoutItem {
  id: string;
  cols: number; // 1, 2 ou 3 colunas
  height: number; // Altura em pixels
}

export function PublicDashboardView({ widgets, dashboardId = "default" }: PublicDashboardViewProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [orderedWidgets, setOrderedWidgets] = useState<Widget[]>([]);
  const [layouts, setLayouts] = useState<Record<string, LayoutItem>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Inicializa a ordem e layouts a partir dos widgets e localStorage
  useEffect(() => {
    if (widgets.length === 0) return;

    const storageKeyOrder = `metrika_order_${dashboardId}`;
    const storageKeyLayout = `metrika_layout_${dashboardId}`;

    const savedOrder = localStorage.getItem(storageKeyOrder);
    const savedLayout = localStorage.getItem(storageKeyLayout);

    // Carrega Ordem
    let currentWidgets = [...widgets];
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder) as string[];
        currentWidgets.sort((a, b) => {
          const idxA = orderIds.indexOf(a.id);
          const idxB = orderIds.indexOf(b.id);
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
      } catch (e) {
        console.error("Erro ao carregar ordem do localStorage", e);
      }
    }
    setOrderedWidgets(currentWidgets);

    // Carrega Layouts
    let currentLayouts: Record<string, LayoutItem> = {};
    if (savedLayout) {
      try {
        currentLayouts = JSON.parse(savedLayout);
      } catch (e) {
        console.error("Erro ao carregar layouts do localStorage", e);
      }
    }

    // Garante que todos os widgets tenham layout inicial padrão
    widgets.forEach((w) => {
      if (!currentLayouts[w.id]) {
        currentLayouts[w.id] = {
          id: w.id,
          cols: 1, // Ocupa 1 coluna por padrão
          height: 300 // 300px por padrão
        };
      }
    });

    setLayouts(currentLayouts);
  }, [widgets, dashboardId]);

  // Salva ordem no localStorage
  const saveOrder = (newWidgets: Widget[]) => {
    setOrderedWidgets(newWidgets);
    localStorage.setItem(`metrika_order_${dashboardId}`, JSON.stringify(newWidgets.map(w => w.id)));
  };

  // Salva layout no localStorage
  const saveLayouts = (newLayouts: Record<string, LayoutItem>) => {
    setLayouts(newLayouts);
    localStorage.setItem(`metrika_layout_${dashboardId}`, JSON.stringify(newLayouts));
  };

  // Categorias estratégicas identificadas dinamicamente
  const dimensionalData = useMemo(() => {
    const dimensions: Record<string, Set<string>> = {
      "Canais / Mídia": new Set(),
      "Status": new Set(),
      "Categorias / Segmento": new Set(),
      "Outros Filtros": new Set()
    };

    widgets.forEach((w) => {
      if (!w.cachedData) return;
      try {
        const data = JSON.parse(w.cachedData);
        
        const processItem = (item: any) => {
          if (!item || typeof item !== "object") return;
          
          Object.entries(item).forEach(([key, val]) => {
            if (typeof val === "string" && val.trim().length > 0) {
              const cleaned = val.trim();
              const keyLower = key.toLowerCase();
              
              if (cleaned.match(/^R\$\s?\d+/) || cleaned.match(/^\d+$/) || cleaned.length > 20) return;

              if (keyLower.includes("canal") || keyLower.includes("midia") || keyLower.includes("plataforma") || keyLower.includes("origem")) {
                dimensions["Canais / Mídia"].add(cleaned);
              } else if (keyLower.includes("status") || keyLower.includes("situacao") || keyLower.includes("fase")) {
                dimensions["Status"].add(cleaned);
              } else if (keyLower.includes("categoria") || keyLower.includes("segmento") || keyLower.includes("produto") || keyLower.includes("tipo")) {
                dimensions["Categorias / Segmento"].add(cleaned);
              } else if (["cliente", "mes", "ano", "regiao", "cidade"].some(k => keyLower.includes(k))) {
                dimensions["Outros Filtros"].add(cleaned);
              }
            }
          });
        };

        if (Array.isArray(data)) {
          data.forEach(processItem);
        } else {
          processItem(data);
        }
      } catch (_e) {
        // Ignora erros
      }
    });

    return Object.fromEntries(
      Object.entries(dimensions).map(([key, set]) => [key, Array.from(set).sort()])
    ) as Record<string, string[]>;
  }, [widgets]);

  // Filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Object.values(selectedFilters).some(arr => arr.length > 0) || searchQuery.trim().length > 0;
  }, [selectedFilters, searchQuery]);

  const toggleFilter = (category: string, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    setSearchQuery("");
  };

  const consolidatedFilterString = useMemo(() => {
    const selections = Object.values(selectedFilters).flat();
    if (searchQuery.trim()) {
      selections.push(searchQuery.trim());
    }
    return selections.join(" ");
  }, [selectedFilters, searchQuery]);

  // Funções de Drag & Drop (Reordenamento)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === id) return;

    const dragIndex = orderedWidgets.findIndex(w => w.id === draggedId);
    const hoverIndex = orderedWidgets.findIndex(w => w.id === id);

    if (dragIndex === -1 || hoverIndex === -1) return;

    const updatedWidgets = [...orderedWidgets];
    const [draggedWidget] = updatedWidgets.splice(dragIndex, 1);
    updatedWidgets.splice(hoverIndex, 0, draggedWidget);

    setOrderedWidgets(updatedWidgets);
  };

  const handleDragEnd = () => {
    saveOrder(orderedWidgets);
    setDraggedId(null);
  };

  // Funções de Redimensionamento Interativo
  const handleWidthChange = (id: string, cols: number) => {
    const updatedLayouts = { ...layouts };
    if (!updatedLayouts[id]) return;
    updatedLayouts[id].cols = Math.max(1, Math.min(3, cols));
    saveLayouts(updatedLayouts);
  };

  const handleHeightResize = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = layouts[id]?.height || 300;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(200, Math.min(800, startHeight + deltaY));
      
      setLayouts((prev) => ({
        ...prev,
        [id]: { ...prev[id], height: newHeight }
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      // Salva valor final
      setLayouts((current) => {
        saveLayouts(current);
        return current;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="space-y-6">
      {/* Painel de Filtros Estratégicos */}
      <div
        className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border)/0.85)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)"
        }}
      >
        <div className="absolute top-0 left-6 right-6 h-px"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.3), transparent)" }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground/75 uppercase tracking-widest">
            <Filter className="w-4 h-4 text-primary" />
            Central de Inteligência & Filtros
          </span>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/45" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar dados..."
                className="pl-8 pr-4 py-1.5 text-xs rounded-xl outline-none w-52 font-medium"
                style={{
                  background: "hsl(var(--muted)/0.3)",
                  border: "1px solid hsl(var(--border)/0.7)",
                  color: "hsl(var(--foreground))"
                }}
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors border border-red-500/20 hover:border-red-500/40 px-2.5 py-1.5 rounded-xl bg-red-500/5 cursor-pointer"
              >
                <X className="w-3 h-3" />
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {Object.entries(dimensionalData).map(([category, options]) => {
            if (options.length === 0) return null;
            const activeOptions = selectedFilters[category] || [];

            return (
              <div key={category} className="space-y-2 p-3 rounded-xl" style={{ background: "hsl(var(--muted)/0.12)" }}>
                <span className="text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-widest block mb-1">
                  {category}
                </span>
                
                <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto custom-scrollbar pr-1">
                  {options.map((opt) => {
                    const isActive = activeOptions.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleFilter(category, opt)}
                        className="px-2.5 py-1 text-[10px] rounded-lg font-bold transition-all duration-150 active:scale-95 border cursor-pointer"
                        style={isActive
                          ? {
                              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.75))",
                              color: "hsl(var(--primary-foreground))",
                              borderColor: "transparent",
                              boxShadow: "0 2px 6px rgba(var(--glow-rgb), 0.25)"
                            }
                          : {
                              background: "hsl(var(--card))",
                              color: "hsl(var(--muted-foreground))",
                              borderColor: "hsl(var(--border)/0.5)"
                            }
                        }
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid de Widgets Movíveis e Redimensionáveis */}
      {orderedWidgets.length === 0 ? (
        <div
          className="relative text-center py-20 rounded-2xl overflow-hidden"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))"
          }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(var(--glow-rgb),0.04), transparent)" }}
          />
          <Layers className="w-10 h-10 text-muted-foreground/25 mx-auto mb-3 relative z-10" />
          <h3 className="font-bold text-sm relative z-10">Nenhum widget nesta seção</h3>
          <p className="text-xs text-muted-foreground mt-1 relative z-10">
            Insira e organize novos widgets no painel de administração.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {orderedWidgets.map((w) => {
            const layout = layouts[w.id] || { id: w.id, cols: 1, height: 300 };
            
            // Define classes de largura baseadas nas colunas (1, 2 ou 3)
            let colSpanClass = "col-span-1";
            if (layout.cols === 2) colSpanClass = "col-span-1 md:col-span-2";
            if (layout.cols === 3) colSpanClass = "col-span-1 md:col-span-2 lg:col-span-3";

            const isDragged = draggedId === w.id;

            return (
              <div
                key={w.id}
                draggable
                onDragStart={(e) => handleDragStart(e, w.id)}
                onDragOver={(e) => handleDragOver(e, w.id)}
                onDragEnd={handleDragEnd}
                className={`relative group rounded-2xl transition-all duration-200 border overflow-hidden flex flex-col ${colSpanClass}`}
                style={{
                  background: isDragged ? "hsl(var(--muted)/0.25)" : "hsl(var(--card))",
                  borderColor: isDragged ? "hsl(var(--primary)/0.65)" : "hsl(var(--border)/0.8)",
                  boxShadow: isDragged ? "0 0 20px rgba(var(--glow-rgb), 0.3)" : "none",
                  opacity: isDragged ? 0.7 : 1,
                  height: `${layout.height}px`
                }}
              >
                {/* Cabeçalho do Card de Controle (Drag Handle) */}
                <div 
                  className="flex items-center justify-between px-4 py-2 border-b border-border/40 select-none"
                  style={{ background: "hsl(var(--muted)/0.15)" }}
                >
                  <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-muted-foreground">
                    <Move className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Ajustar Layout</span>
                  </div>

                  {/* Controles de Coluna (Largura) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleWidthChange(w.id, 1)}
                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer ${layout.cols === 1 ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/65"}`}
                    >
                      1/3
                    </button>
                    <button
                      onClick={() => handleWidthChange(w.id, 2)}
                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer ${layout.cols === 2 ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/65"}`}
                    >
                      2/3
                    </button>
                    <button
                      onClick={() => handleWidthChange(w.id, 3)}
                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer ${layout.cols === 3 ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/65"}`}
                    >
                      3/3
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Gráfico */}
                <div className="flex-1 overflow-hidden p-4">
                  <PublicChart
                    type={w.type}
                    cachedData={w.cachedData || ""}
                    title={w.title}
                    filterValue={consolidatedFilterString}
                  />
                </div>

                {/* Barra de Redimensionamento Vertical de Altura */}
                <div
                  onMouseDown={(e) => handleHeightResize(e, w.id)}
                  className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-primary/45 transition-colors flex items-center justify-center group-hover:bg-muted/10"
                  title="Arraste para ajustar altura"
                >
                  <div className="w-8 h-1 rounded bg-muted-foreground/35 group-hover:bg-muted-foreground/60" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

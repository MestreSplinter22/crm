"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Star, AlertTriangle, BadgeCheck, BadgeDollarSign } from "lucide-react"; // Ícones para categorias

// Interface do FinancialDashboard ou types/index.ts
export interface ProcedureCatalogItemCalculated {
  id: string;
  name: string;
  category: string;
  defaultPrice: number;
  defaultCost: number;
  profit: number;
  margin: number;
  quantity?: number; // Quantidade vendida no período
  totalRevenue?: number; // Receita total no período
  totalCost?: number; // Custo total no período
  totalProfit?: number; // Lucro total no período
}

interface ProfitabilityChartProps {
  procedures: ProcedureCatalogItemCalculated[]; // Recebe já com quantity e totais se disponíveis
}

const categoryIconMapping: Record<string, React.ElementType> = {
    "Estrela": Star,
    "Vaca Leiteira": BadgeDollarSign,
    "Oportunidade": TrendingUp,
    "Questionável": AlertTriangle,
};
const categoryColorMapping: Record<string, string> = {
    "Estrela": "bg-success-muted text-success-foreground border-success-foreground/30",
    "Vaca Leiteira": "bg-info-muted text-info-foreground border-info-foreground/30",
    "Oportunidade": "bg-warning-muted text-warning-foreground border-warning-foreground/30",
    "Questionável": "bg-destructive/20 text-destructive border-destructive/30",
};


export function ProfitabilityChart({ procedures }: ProfitabilityChartProps) {
  if (!procedures || procedures.length === 0) {
    return <div className="text-center py-10 text-muted-foreground">Sem dados de procedimentos para exibir análise de lucratividade.</div>;
  }

  // Certificar que totalProfit e margin estão presentes e são números para ordenação
  const safeProcedures = procedures.map(p => ({
      ...p,
      totalProfit: p.totalProfit || 0, // Default para ordenação
      margin: p.margin || 0,
      quantity: p.quantity || 0,
  }));

  const sortedByTotalProfit = [...safeProcedures].sort((a, b) => b.totalProfit - a.totalProfit);
  const sortedByMargin = [...safeProcedures].sort((a, b) => b.margin - a.margin);

  const maxTotalProfit = Math.max(1, ...sortedByTotalProfit.map((p) => p.totalProfit));
  const maxMargin = Math.max(1, ...sortedByMargin.map((p) => p.margin));


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Ranking por Lucro Total</CardTitle>
          <CardDescription className="text-xs md:text-sm">Procedimentos ordenados por lucro absoluto no período.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {sortedByTotalProfit.map((procedure, index) => {
            const width = (procedure.totalProfit / maxTotalProfit) * 100;
            return (
              <div key={procedure.id} className="space-y-1">
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold w-5 h-5 rounded-full flex items-center justify-center text-primary-foreground text-[10px] md:text-xs ${index < 3 ? 'bg-primary' : 'bg-muted-foreground/50'}`}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground">{procedure.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-success-foreground">
                      R$ {procedure.totalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] md:text-xs text-muted-foreground">{procedure.quantity} realizados</div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 md:h-2.5">
                  <div className={`h-full rounded-full bg-gradient-to-r from-success-foreground/70 to-success-foreground transition-all duration-300 ease-out`}
                       style={{ width: `${Math.max(width, 2)}%` }} /> {/* Min width for visibility */}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Ranking por Margem de Lucro</CardTitle>
          <CardDescription className="text-xs md:text-sm">Procedimentos ordenados por percentual de margem.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {sortedByMargin.map((procedure, index) => {
            const width = (procedure.margin / maxMargin) * 100;
            return (
              <div key={procedure.id} className="space-y-1">
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                     <span className={`font-bold w-5 h-5 rounded-full flex items-center justify-center text-primary-foreground text-[10px] md:text-xs ${index < 3 ? 'bg-primary' : 'bg-muted-foreground/50'}`}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-foreground">{procedure.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-info-foreground">{procedure.margin.toFixed(1)}%</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground">
                      R$ {procedure.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} /unid.
                    </div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 md:h-2.5">
                  <div className={`h-full rounded-full bg-gradient-to-r from-info-foreground/70 to-info-foreground transition-all duration-300 ease-out`}
                       style={{ width: `${Math.max(width, 2)}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Matriz de Eficiência</CardTitle>
          <CardDescription className="text-xs md:text-sm">Análise combinada de volume vs. margem de lucro.</CardDescription>
        </CardHeader>
        <CardContent>
          {safeProcedures.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {safeProcedures.map((procedure) => {
                const isHighVolume = (procedure.quantity || 0) >= (safeProcedures.reduce((sum, p) => sum + (p.quantity || 0), 0) / safeProcedures.length); // Acima da média
                const isHighMargin = procedure.margin >= 65; // Limiar arbitrário para alta margem

                let classification = "";
                if (isHighVolume && isHighMargin) classification = "Estrela";
                else if (isHighVolume && !isHighMargin) classification = "Vaca Leiteira";
                else if (!isHighVolume && isHighMargin) classification = "Oportunidade";
                else classification = "Questionável";

                const Icon = categoryIconMapping[classification] || BadgeCheck;
                const bgColorClass = categoryColorMapping[classification] || "bg-muted text-muted-foreground border-border";

                return (
                    <div key={procedure.id} className={`p-3 rounded-lg border ${bgColorClass} space-y-1`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3.5 h-3.5 opacity-80" />
                        <div className="font-semibold text-xs md:text-sm truncate" title={procedure.name}>{procedure.name}</div>
                    </div>
                    <div className="text-[10px] md:text-xs opacity-90">Volume: {procedure.quantity || 0}</div>
                    <div className="text-[10px] md:text-xs opacity-90">Margem: {procedure.margin.toFixed(1)}%</div>
                    <div className="text-[10px] md:text-xs opacity-90 font-medium">Lucro: R$ {procedure.totalProfit?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || '0,00'}</div>
                    </div>
                );
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum procedimento para analisar eficiência.</p>
          )}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-[10px] md:text-xs text-muted-foreground">
                {Object.entries(categoryIconMapping).map(([key, Icon]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <Icon className={`w-3 h-3 ${categoryColorMapping[key]?.split(' text-')[1]?.split(' ')[0] || 'text-muted-foreground'}`} /> {/* Extrai a cor do texto */}
                        <span>{key}</span>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
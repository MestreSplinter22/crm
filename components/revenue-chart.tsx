// components/revenue-chart.tsx
"use client"
import { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";

interface RevenueChartDataPoint {
  time?: string;
  day?: string;
  week?: string;
  revenue: number;
  cost: number;
  profit: number;
}

interface RevenueChartProps {
  period: "today" | "week" | "month";
}

export function RevenueChart({ period }: RevenueChartProps) {
  const [chartData, setChartData] = useState<RevenueChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Esta API precisaria ser criada e retornar dados agregados
      const response = await fetch(`/api/metrics/revenue-evolution?period=${period}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar dados de evolução da receita');
      }
      const data: RevenueChartDataPoint[] = await response.json();
      setChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">Carregando gráfico de receita...</div>;
  if (error) return <div className="text-center py-10 text-destructive flex items-center justify-center gap-2"><AlertTriangle className="w-5 h-5" /> Erro: {error}</div>;
  if (chartData.length === 0 && !isLoading) return <div className="text-center py-10 text-muted-foreground">Sem dados de receita para exibir.</div>;

  const maxValue = Math.max(1, ...chartData.map((d) => d.revenue));
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCost = chartData.reduce((sum, item) => sum + item.cost, 0);
  const totalProfit = chartData.reduce((sum, item) => sum + item.profit, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-success-foreground rounded-sm"></div><span>Receita</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-destructive rounded-sm"></div><span>Custo</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-primary rounded-sm"></div><span>Lucro</span></div>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {chartData.map((item, index) => {
          const revenueWidth = (item.revenue / maxValue) * 100;
          const profitWidth = (item.profit / maxValue) * 100;
          const label = item.time || item.day || item.week;

          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-foreground">{label}</span>
                <span className="text-muted-foreground">
                  R$ {item.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="relative h-5 bg-muted rounded">
                <div
                  className="absolute top-0 left-0 h-full bg-success-foreground rounded transition-all duration-300 ease-out"
                  style={{ width: `${revenueWidth}%` }}
                  title={`Receita: R$ ${item.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                />
                <div
                  className="absolute top-0 left-0 h-full bg-primary rounded transition-all duration-300 ease-out"
                  style={{ width: `${profitWidth}%` }} // Lucro sobrepõe a receita
                  title={`Lucro: R$ ${item.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground/80">
                <span>Custo: R$ {item.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                <span>Margem: {item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-sm md:text-base font-bold text-success-foreground">
              R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Receita Total</div>
          </div>
          <div>
            <div className="text-sm md:text-base font-bold text-destructive">
              R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Custo Total</div>
          </div>
          <div>
            <div className="text-sm md:text-base font-bold text-primary">
              R$ {totalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Lucro Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
// components/metrics-chart.tsx
"use client"
import { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";

interface MetricDataPoint {
  label: string; // hour, day, or week
  value: number;
  // Poderia adicionar outros valores como 'agendamentos', 'comparecimentos' etc.
}

interface MetricsEvolutionData {
  appointmentRate?: number; // Ex: 68.5
  attendanceRate?: number;  // Ex: 85.7
  series: MetricDataPoint[];
}

interface MetricsChartProps {
  period: "today" | "week" | "month";
}

export function MetricsChart({ period }: MetricsChartProps) {
  const [chartData, setChartData] = useState<MetricsEvolutionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Esta API precisaria ser criada.
      // Deveria retornar algo como: { appointmentRate: 68.5, attendanceRate: 85.7, series: [{label: "08:00", value: 2}, ...] }
      const response = await fetch(`/api/metrics/evolution-simple?period=${period}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar dados para o gráfico de métricas');
      }
      const data: MetricsEvolutionData = await response.json();
      setChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setChartData(null);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">Carregando gráfico de métricas...</div>;
  if (error) return <div className="text-center py-10 text-destructive flex items-center justify-center gap-2"><AlertTriangle className="w-5 h-5" /> Erro: {error}</div>;
  if (!chartData || chartData.series.length === 0) return <div className="text-center py-10 text-muted-foreground">Sem dados para exibir no gráfico.</div>;

  const dataPoints = chartData.series;
  const maxValue = Math.max(1, ...dataPoints.map((d) => d.value));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-info-muted p-3 rounded-lg">
          <div className="text-info-foreground font-medium">Taxa de Agendamento</div>
          <div className="text-2xl font-bold text-info-foreground">{chartData.appointmentRate?.toFixed(1) || "N/A"}%</div>
        </div>
        <div className="bg-success-muted p-3 rounded-lg">
          <div className="text-success-foreground font-medium">Taxa de Comparecimento</div>
          <div className="text-2xl font-bold text-success-foreground">{chartData.attendanceRate?.toFixed(1) || "N/A"}%</div>
        </div>
      </div>

      <div className="space-y-2">
        {dataPoints.map((item, index) => {
          const width = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-12 text-xs text-muted-foreground">{item.label}</div>
              <div className="flex-1 bg-muted rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-primary/70 to-primary h-4 rounded-full flex items-center justify-end pr-2 text-primary-foreground text-xs transition-all duration-500"
                  style={{ width: `${Math.max(width, 0)}%` }} // Garante que a largura não seja negativa
                >
                  {width > 15 && item.value}
                </div>
              </div>
              <div className="w-8 text-xs text-muted-foreground">{item.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
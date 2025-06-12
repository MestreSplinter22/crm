// components/dashboard-overview.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Calendar, CheckCircle, DollarSign, TrendingUp, Activity } from "lucide-react"
import { FunnelVisualization } from "@/components/funnel-visualization"
import { QuickStats } from "@/components/quick-stats"
import { RecentActivity } from "@/components/recent-activity"

interface MetricValues {
  atendimentosIniciados: number;
  duvidasSanadas: number;
  procedimentosOferecidos: number;
  agendamentosRealizados: number;
  confirmacoesAgendamento: number;
  comparecimentos: number;
  procedimentosRealizados: number;
  faturamento: number;
  gastos: number;
  lucro: number;
  // Adicionar campos para tendências se a API de métricas os fornecer
  // Ex: atendimentosIniciadosPreviousPeriod?: number;
}

interface DashboardOverviewProps {
  metrics: MetricValues | null;
  period: string;
}

export function DashboardOverview({ metrics, period }: DashboardOverviewProps) {
  if (!metrics) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-4 md:p-6"><div className="h-6 bg-muted rounded w-3/4 mb-2"></div><div className="h-8 bg-muted rounded w-1/2 mb-3"></div></CardContent></Card>
            ))}
        </div>
    );
  }

  const conversionRate = metrics.atendimentosIniciados > 0
    ? ((metrics.procedimentosRealizados / metrics.atendimentosIniciados) * 100)
    : 0;

  // const revenueGrowth = period === "today" ? 12.5 : period === "week" ? 8.3 : 15.2; // Mock removido
  // TODO: Obter dados de crescimento da API de métricas ou calcular se houver dados do período anterior

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="card-hover">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atendimentos</p>
                <p className="text-2xl font-bold text-foreground">{metrics.atendimentosIniciados}</p>
                {/* Exemplo de como exibir tendência se disponível:
                {metrics.atendimentosIniciadosPreviousPeriod !== undefined && (
                  <p className={`text-xs ${metrics.atendimentosIniciados >= metrics.atendimentosIniciadosPreviousPeriod ? 'text-success-foreground' : 'text-destructive'}`}>
                    {((metrics.atendimentosIniciados / metrics.atendimentosIniciadosPreviousPeriod -1) * 100).toFixed(1)}% vs anterior
                  </p>
                )} */}
              </div>
              <div className="p-3 bg-info-muted rounded-full">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-info-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agendamentos</p>
                <p className="text-2xl font-bold text-foreground">{metrics.agendamentosRealizados}</p>
              </div>
              <div className="p-3 bg-success-muted rounded-full">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversão Geral</p>
                <p className="text-2xl font-bold text-foreground">{conversionRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita ({period === "today" ? "Hoje" : period === "week" ? "Semana" : "Mês"})</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {metrics.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits:0 })}
                </p>
              </div>
              <div className="p-3 bg-success-muted rounded-full">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FunnelVisualization metrics={metrics} />
        </div>
        <div>
          <QuickStats metrics={metrics} />
        </div>
      </div>
      <RecentActivity /> {/* Este componente agora faz seu próprio fetch */}
    </div>
  );
}
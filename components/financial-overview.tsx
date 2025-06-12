"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// Badge não é usado diretamente aqui, mas pode ser em subcomponentes
import { DollarSign, TrendingUp, TrendingDown, Target, Download, Edit, PieChart } from "lucide-react"
import { FinancialProceduresHistory } from "@/components/financial-procedures-history"
// Supondo que RevenueChart e ProfitabilityChart também consumam dados da API ou props processadas
// import { RevenueChart } from "@/components/revenue-chart"
// import { ProfitabilityChart } from "@/components/profitability-chart"


// Reutilizar MetricValues de app/page.tsx ou de um types/index.ts
interface MetricValues {
  faturamento: number;
  gastos: number;
  lucro: number;
  procedimentosRealizados: number;
  agendamentosRealizados?: number; // Adicionado para o card de ticket médio
  comparecimentos?: number; // Adicionado para o card de comparecimento
  // ... outros campos de métricas se necessários
}

interface FinancialOverviewProps {
  metrics: MetricValues | null;
  period: string;
}

export function FinancialOverview({ metrics, period }: FinancialOverviewProps) {
  if (!metrics) {
    return <div className="flex justify-center items-center h-64"><p>Carregando visão financeira...</p></div>;
  }

  const profitMargin = metrics.faturamento > 0 ? ((metrics.lucro / metrics.faturamento) * 100).toFixed(1) : "0.0";
  const avgTicket = metrics.procedimentosRealizados > 0 ? (metrics.faturamento / metrics.procedimentosRealizados).toFixed(0) : "0";
  // ROI e outros KPIs podem ser adicionados aqui se a API de métricas os fornecer ou se puderem ser calculados.

  // Para os cards de resumo, precisamos garantir que os campos existam em `metrics`
  const proceduresCount = metrics.procedimentosRealizados || 0;
  const appointmentsCount = metrics.agendamentosRealizados || 0; // Se não vier da API, defina um fallback
  const attendanceRate = appointmentsCount > 0 ? (((metrics.comparecimentos || 0) / appointmentsCount) * 100).toFixed(0) : "0";


  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Visão Financeira</h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Análise de receitas, custos e performance ({period === 'today' ? 'Hoje' : period === 'week' ? 'Esta Semana' : 'Este Mês'}).</p>
        </div>
        <Button variant="outline" size="sm" className="border-input text-foreground hover:bg-accent h-9">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Exportar Relatório
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card className="card-hover">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-foreground">{proceduresCount}</div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Procedimentos</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-foreground">{appointmentsCount}</div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Agendamentos</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-foreground">R$ {avgTicket}</div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Ticket Médio</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-foreground">{profitMargin}%</div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Margem Lucro</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-foreground">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Comparecimento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="card-hover shadow-md">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-2xl md:text-3xl font-bold text-success-foreground">R$ {metrics.faturamento.toLocaleString("pt-BR")}</p>
                 {/* Adicionar comparativo se disponível */}
              </div>
              <div className="p-2.5 md:p-3 bg-success-muted rounded-full">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover shadow-md">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
                <p className="text-2xl md:text-3xl font-bold text-success-foreground">R$ {metrics.lucro.toLocaleString("pt-BR")}</p>
              </div>
              <div className="p-2.5 md:p-3 bg-success-muted rounded-full">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover shadow-md">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margem de Lucro</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{profitMargin}%</p>
              </div>
              <div className="p-2.5 md:p-3 bg-info-muted rounded-full">
                <PieChart className="w-5 h-5 md:w-6 md:h-6 text-info-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover shadow-md">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">R$ {avgTicket}</p>
              </div>
              <div className="p-2.5 md:p-3 bg-primary/10 rounded-full">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FinancialProceduresHistory agora fará seu próprio fetch */}
      <FinancialProceduresHistory period={period} />

    </div>
  );
}
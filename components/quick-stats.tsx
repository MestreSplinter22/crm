"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Clock, Target, AlertTriangle } from "lucide-react" // Adicionado AlertTriangle para casos de divisão por zero

// Interface para as métricas esperadas
interface QuickStatsMetrics {
  faturamento: number;
  gastos: number;
  lucro: number;
  procedimentosRealizados: number;
  atendimentosIniciados: number; // Usado para taxa de conversão
  // Adicionar outros campos de métricas que possam vir da API
  agendamentosHoje?: number; // Exemplo, viria da API
  confirmacoesPendentes?: number; // Exemplo
  followUps?: number; // Exemplo
}

interface QuickStatsProps {
  metrics: QuickStatsMetrics | null; // Pode ser nulo durante o carregamento
}

export function QuickStats({ metrics }: QuickStatsProps) {
  if (!metrics) {
    return ( // Skeleton ou mensagem de carregamento
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2"><div className="h-5 bg-muted rounded w-1/2"></div></CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const profitMargin = metrics.faturamento > 0 ? ((metrics.lucro / metrics.faturamento) * 100).toFixed(1) : "0.0";
  const avgTicket = metrics.procedimentosRealizados > 0 ? (metrics.faturamento / metrics.procedimentosRealizados).toFixed(0) : "0";
  const conversionRate = metrics.atendimentosIniciados > 0 ? ((metrics.procedimentosRealizados / metrics.atendimentosIniciados) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-4">
      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center text-foreground">
            <Target className="w-4 h-4 mr-2 text-primary" /> {/* Ajustada cor */}
            Performance Chave
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Taxa de Conversão</span>
            <Badge variant="secondary" className="font-medium">{conversionRate}%</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Margem de Lucro</span>
            <Badge variant="secondary" className="font-medium">{profitMargin}%</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Ticket Médio</span>
            <Badge variant="secondary" className="font-medium">R$ {avgTicket}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center text-foreground">
            <TrendingUp className="w-4 h-4 mr-2 text-success-foreground" /> {/* Ajustada cor */}
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receita</span>
            <span className="font-medium text-success-foreground">R$ {metrics.faturamento.toLocaleString("pt-BR")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custos</span>
            <span className="font-medium text-destructive">R$ {metrics.gastos.toLocaleString("pt-BR")}</span> {/* Ajustada cor */}
          </div>
          <div className="border-t mt-2 pt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Lucro</span>
              <span className="font-bold text-primary">R$ {metrics.lucro.toLocaleString("pt-BR")}</span> {/* Ajustada cor */}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center text-foreground">
            <Clock className="w-4 h-4 mr-2 text-info-foreground" /> {/* Ajustada cor */}
            Próximas Ações (Exemplo)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Agendamentos hoje</span>
            <Badge variant="outline">{metrics.agendamentosHoje ?? 0}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Confirmações pendentes</span>
            <Badge variant="outline">{metrics.confirmacoesPendentes ?? 0}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Follow-ups</span>
            <Badge variant="outline">{metrics.followUps ?? 0}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
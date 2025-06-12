"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FunnelVisualizationProps {
  metrics: any
}

export function FunnelVisualization({ metrics }: FunnelVisualizationProps) {
  const stages = [
    {
      name: "Atendimentos Iniciados",
      value: metrics.atendimentosIniciados,
      color: "bg-blue-500",
      description: "Primeiro contato",
    },
    {
      name: "Dúvidas Sanadas",
      value: metrics.duvidasSanadas,
      color: "bg-green-500",
      description: "Esclarecimentos",
    },
    {
      name: "Procedimentos Oferecidos",
      value: metrics.procedimentosOferecidos,
      color: "bg-yellow-500",
      description: "Propostas apresentadas",
    },
    {
      name: "Agendamentos",
      value: metrics.agendamentosRealizados,
      color: "bg-purple-500",
      description: "Consultas marcadas",
    },
    {
      name: "Comparecimentos",
      value: metrics.comparecimentos,
      color: "bg-indigo-500",
      description: "Presença confirmada",
    },
    {
      name: "Procedimentos Realizados",
      value: metrics.procedimentosRealizados,
      color: "bg-emerald-500",
      description: "Tratamentos concluídos",
    },
  ]

  const maxValue = Math.max(...stages.map((s) => s.value))

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Funil de Conversão</CardTitle>
        <p className="text-sm text-muted-foreground">Jornada do paciente através das etapas</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((stage, index) => {
          const width = (stage.value / maxValue) * 100
          const conversionRate = index > 0 ? ((stage.value / stages[index - 1].value) * 100).toFixed(1) : "100.0"

          return (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <div>
                    <p className="font-medium text-foreground">{stage.name}</p>
                    <p className="text-xs text-muted-foreground">{stage.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{stage.value}</p>
                  {index > 0 && (
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                      {conversionRate}%
                    </Badge>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-700 ${stage.color}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

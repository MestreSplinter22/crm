"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Users, Eye, MousePointer, CreditCard, CheckCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

// Interfaces (não precisam de alteração)
interface FunnelStage {
  id: string
  name: string
  value: number
  percentage: number
  color: string
  icon?: React.ReactNode
  description?: string
}

interface MetricValues {
  atendimentosIniciados: number
  duvidasSanadas: number
  procedimentosOferecidos: number
  agendamentosRealizados: number
  confirmacoesAgendamento: number
  comparecimentos: number
  procedimentosRealizados: number
}

interface ConversionFunnelProps {
  metrics?: MetricValues | null
}

export default function ConversionFunnel({ metrics }: ConversionFunnelProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [hoveredStage, setHoveredStage] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipContent, setTooltipContent] = useState<FunnelStage | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // ==================================================================
  // === CENTRAL DE CONTROLE DE TAMANHO ===
  // Altere os valores neste objeto para redimensionar o gráfico.
  // ==================================================================
  const sizeConfig = {
    barHeight: 50,         // Altura de cada barra (ex: 40, 50, 60)
    verticalGap: 25,       // Espaço entre as barras
    topPadding: 30,        // Espaço no topo do SVG
    bottomPadding: 20,     // Espaço no final do SVG
    baseWidth: 250,        // Largura da barra menor (a de baixo)
    widthDecrement: 40,    // O quanto a largura aumenta para cada etapa acima
  }
  // Calcula o espaço vertical total que cada etapa ocupa
  const stageVerticalSpace = sizeConfig.barHeight + sizeConfig.verticalGap;

  // Lógica para dados (sem alterações)
  const data = metrics
    ? [
        { id: "atendimentos_iniciados", value: metrics.atendimentosIniciados, label: "Atend. Iniciados" },
        { id: "duvidas_sanadas", value: metrics.duvidasSanadas, label: "Dúvidas Sanadas" },
        { id: "procedimentos_oferecidos", value: metrics.procedimentosOferecidos, label: "Proced. Oferecidos" },
        { id: "agendamentos_realizados", value: metrics.agendamentosRealizados, label: "Agendamentos" },
        { id: "comparecimentos", value: metrics.comparecimentos, label: "Comparecimentos" },
        { id: "procedimentos_realizados", value: metrics.procedimentosRealizados, label: "Proced. Realizados" },
      ]
    : [
        { id: "atendimentos_iniciados", value: 5000, label: "Atend. Iniciados" },
        { id: "duvidas_sanadas", value: 4000, label: "Dúvidas Sanadas" },
        { id: "procedimentos_oferecidos", value: 2800, label: "Proced. Oferecidos" },
        { id: "agendamentos_realizados", value: 1600, label: "Agendamentos" },
        { id: "procedimentos_realizados", value: 1200, label: "Proced. Realizados" },
      ]

  const funnelData = data
    ? {
        currentPeriod: data.map((item, index) => {
          const baseValue = index > 0 ? data[index - 1].value : item.value;
          const percentage = baseValue > 0 ? Math.round((item.value / baseValue) * 100) : 0;
          const colors = ["#a78bfa", "#a78bfa", "#a78bfa", "#22c55e", "#22c55e", "#a78bfa"]
          const icons = [
            <Users className="w-4 h-4" key="user-icon" />,
            <Eye className="w-4 h-4" key="eye-icon" />,
            <MousePointer className="w-4 h-4" key="mouse-icon" />,
            <CreditCard className="w-4 h-4" key="card-icon" />,
            <CheckCircle className="w-4 h-4" key="check-icon" />,
            <CheckCircle className="w-4 h-4" key="check-icon-2" />,
          ]
          return {
            id: item.id,
            name: item.label,
            value: item.value,
            percentage,
            color: colors[index] || "#a78bfa",
            icon: icons[index],
            description: `${item.label}: ${item.value.toLocaleString()} pacientes`,
          }
        }),
      }
    : { currentPeriod: [] }

  const funnelStages = funnelData.currentPeriod;
  const totalSvgHeight = sizeConfig.topPadding + (funnelStages.length * stageVerticalSpace) + sizeConfig.bottomPadding;

  const handleMouseMove = (e: React.MouseEvent<SVGGElement>, stage: FunnelStage) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setTooltipPosition({ x, y })
    setTooltipContent(stage)
    setTooltipVisible(true)
  }

  const handleMouseLeave = () => {
    setTooltipVisible(false)
    setTooltipContent(null)
  }

  return (
    <div>
      <div className="w-full">
        <Card className="bg-[#1a1a1f] border-[#2a2a33]">
          <CardHeader className="bg-[#1a1a1f] border-b border-[#2a2a33]">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#a78bfa]" />
              Funil Visual de Conversão
            </CardTitle>
            <CardDescription className="text-gray-400">Clique em qualquer etapa para ver detalhes</CardDescription>
          </CardHeader>
          <CardContent className="relative p-4">
            <div className="relative">
              <svg ref={svgRef} viewBox={`0 0 800 ${totalSvgHeight}`} className="w-full h-auto">
                <defs>
                  {funnelData.currentPeriod.map((stage, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={stage.color} stopOpacity="0.7" />
                      <stop offset="100%" stopColor={stage.color} stopOpacity="0.9" />
                    </linearGradient>
                  ))}
                </defs>

                {funnelData.currentPeriod.map((_, index) => (
                  <line
                    key={`line-${index}`}
                    x1="100"
                    y1={sizeConfig.topPadding + sizeConfig.barHeight / 2 + index * stageVerticalSpace}
                    x2="700"
                    y2={sizeConfig.topPadding + sizeConfig.barHeight / 2 + index * stageVerticalSpace}
                    stroke="#2a2a33"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                ))}

                {funnelData.currentPeriod.map((stage, index) => {
                  const width = sizeConfig.baseWidth + (funnelData.currentPeriod.length - index - 1) * sizeConfig.widthDecrement;
                  const height = sizeConfig.barHeight;
                  const x = (800 - width) / 2;
                  const y = sizeConfig.topPadding + index * stageVerticalSpace;
                  const isHovered = hoveredStage === stage.id
                  const isSelected = selectedStage === stage.id

                  return (
                    <g key={stage.id} onMouseMove={(e) => handleMouseMove(e, stage)} onMouseLeave={handleMouseLeave}>
                      <motion.rect
                        x={x + 2} y={y + 4} width={width} height={height} rx={8} fill="rgba(0,0,0,0.3)"
                        initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: index * 0.1 }}
                      />
                      <motion.rect
                        x={x} y={y} width={width} height={height} rx={8}
                        className={`cursor-pointer transition-all duration-300 ${
                          isSelected || isHovered ? "opacity-100" : "opacity-90 hover:opacity-100"
                        }`}
                        fill={`url(#gradient-${index})`}
                        stroke={isSelected ? "#a78bfa" : isHovered ? "#a78bfa" : "transparent"}
                        strokeWidth={isSelected ? 2 : isHovered ? 1 : 0}
                        onClick={() => setSelectedStage(stage.id)}
                        onMouseEnter={() => setHoveredStage(stage.id)}
                        onMouseLeave={() => setHoveredStage(null)}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      />
                      <foreignObject x={x + 15} y={y + height / 2 - 10} width="20" height="20">
                        <div className="flex items-center justify-center h-full text-white">{stage.icon}</div>
                      </foreignObject>
                      <text
                        x={x + width / 2} y={y + height / 2 + 6} textAnchor="middle"
                        className="fill-white font-bold text-lg pointer-events-none"
                      >
                        {stage.value.toLocaleString()}
                      </text>
                    </g>
                  )
                })}
              </svg>
              {tooltipVisible && tooltipContent && (
                 <div
                   className="absolute pointer-events-none bg-[#1a1a1f] border border-[#2a2a33] p-3 rounded-lg shadow-xl z-50"
                   style={{
                     left: `${tooltipPosition.x + 10}px`,
                     top: `${tooltipPosition.y + 10}px`,
                     maxWidth: "250px",
                   }}
                 >
                   <div className="flex items-center gap-2 mb-1">
                     {tooltipContent.icon}
                     <span className="font-medium text-white">{tooltipContent.name}</span>
                   </div>
                   <div className="text-sm text-gray-300 mb-2">{tooltipContent.description}</div>
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                       <div className="text-xs text-gray-400">Volume</div>
                       <div className="font-bold text-white">{tooltipContent.value.toLocaleString()}</div>
                     </div>
                     <div>
                       <div className="text-xs text-gray-400">Conversão</div>
                       <div className="font-bold text-white">{tooltipContent.percentage}%</div>
                     </div>
                   </div>
                 </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-[#1a1a1f] border-t border-[#2a2a33] px-6 py-3">
            <div className="flex items-center justify-between w-full text-xs text-gray-400">
              <span>Atualizado em: 09/06/2025 às 23:40</span>
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Atualização automática
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
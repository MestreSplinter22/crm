"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Target, Users, CheckCircle, BarChart3, AlertCircle, Download } from "lucide-react"
import ConversionFunnel from "./funnelComponnet" // Supondo que este componente exista no caminho especificado

// Definição da interface para os valores das métricas
interface MetricValues {
  atendimentosIniciados: number
  duvidasSanadas: number
  procedimentosOferecidos: number
  agendamentosRealizados: number
  confirmacoesAgendamento: number // Note: Esta métrica não está no template do PDF. Será ignorada na exportação.
  comparecimentos: number
  procedimentosRealizados: number
}

// Definição da interface para as props do componente
interface FunnelAnalysisProps {
  metrics: MetricValues | null // Pode ser nulo enquanto os dados estão carregando
  period: string
}

export function FunnelAnalysis({ metrics, period }: FunnelAnalysisProps) {
  // Estado de carregamento
  if (!metrics) {
    return (
      <div className="flex justify-center items-center h-64 bg-[#0f0f11]">
        <p className="text-gray-400">Carregando análise de funil...</p>
      </div>
    )
  }

  // Dados para os estágios do funil, usados para cálculos na UI
  const stagesForRateCalculation = [
    { name: "Atendimentos Iniciados", value: metrics.atendimentosIniciados },
    { name: "Dúvidas Sanadas", value: metrics.duvidasSanadas },
    { name: "Procedimentos Oferecidos", value: metrics.procedimentosOferecidos },
    { name: "Agendamentos Realizados", value: metrics.agendamentosRealizados },
    { name: "Comparecimentos", value: metrics.comparecimentos },
    { name: "Procedimentos Realizados", value: metrics.procedimentosRealizados },
  ]

  // Cálculo da taxa de conversão geral
  const overallConversionRate =
    metrics.atendimentosIniciados > 0
      ? ((metrics.procedimentosRealizados / metrics.atendimentosIniciados) * 100).toFixed(1)
      : "0.0"

  // Função para obter o rótulo do período formatado
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "today":
        return "Hoje"
      case "week":
        return "Esta Semana"
      case "month":
        return "Este Mês"
      case "quarter":
        return "Este Trimestre"
      case "year":
        return "Este Ano"
      default:
        return "Este Mês"
    }
  }

  // Lógica de exportação para PDF
  const handleExportToPdf = () => {
    // 1. O template HTML completo fornecido por você.
    const pdfTemplate = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Análise do Funil de Conversão - ${getPeriodLabel(period)}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #0f0f14; color: #e2e8f0; font-size: 14px; line-height: 1.5; }
          .container { max-width: 100%; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #2a2a33; }
          .header h1 { color: #ffffff; font-size: 24px; font-weight: 600; margin-bottom: 4px; }
          .header .subtitle { color: #94a3b8; font-size: 14px; }
          .header-right { text-align: right; color: #94a3b8; font-size: 12px; }
          .conversion-rate { color: #22c55e; font-weight: 600; font-size: 16px; }
          .section { margin-bottom: 32px; }
          .section-title { color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
          .section-title::before { content: ''; width: 3px; height: 16px; background: #a78bfa; border-radius: 2px; }
          .funnel-container { display: grid; gap: 12px; }
          .funnel-stage { background: #1a1a1f; border: 1px solid #2a2a33; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; }
          .stage-info { display: flex; align-items: center; gap: 12px; }
          .stage-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
          .stage-icon.purple { background: #a78bfa; color: #1a1a1f; }
          .stage-icon.green { background: #22c55e; color: #1a1a1f; }
          .stage-name { color: #ffffff; font-weight: 500; }
          .stage-value { color: #ffffff; font-weight: 600; font-size: 18px; }
          .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .metrics-section { background: #1a1a1f; border: 1px solid #2a2a33; border-radius: 8px; padding: 20px; }
          .metrics-section h3 { color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
          .metric-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #2a2a33; }
          .metric-row:last-child { border-bottom: none; }
          .metric-label { color: #94a3b8; font-size: 13px; }
          .metric-value { color: #ffffff; font-weight: 600; }
          .conversion-value { font-weight: 600; }
          .conversion-value.conversion-high { color: #22c55e; }
          .conversion-low { color: #ef4444; }
          .conversion-medium { color: #f59e0b; }
          .insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .insight-card { background: #1a1a1f; border: 1px solid #2a2a33; border-radius: 8px; padding: 16px; }
          .insight-title { color: #ffffff; font-weight: 600; font-size: 13px; margin-bottom: 4px; }
          .insight-description { color: #94a3b8; font-size: 12px; margin-bottom: 8px; }
          .insight-value { font-weight: 600; font-size: 16px; }
          .insight-positive { color: #22c55e; }
          .insight-negative { color: #ef4444; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #2a2a33; text-align: center; color: #64748b; font-size: 12px; }
          @media print {
            body { background: white; color: #1f2937; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header, .footer { border-color: #e5e7eb; }
            .section-title::before { background: #6366f1; }
            .funnel-stage, .metrics-section, .insight-card { background: #f9fafb; border-color: #e5e7eb; }
            .stage-name, .section-title, .header h1, .metrics-section h3, .insight-title, .metric-value, .stage-value { color: #111827; }
            .subtitle, .header-right, .metric-label, .insight-description { color: #4b5563; }
            .footer { color: #6b7280; }
            .conversion-rate, .insight-positive { color: #16a34a; }
            .insight-negative { color: #dc2626; }
            .conversion-low { color: #dc2626; }
            .conversion-medium { color: #f59e0b; }
            .conversion-high { color: #16a34a; }
            .stage-icon.purple { background: #a78bfa !important; color: #1a1a1f !important; }
            .stage-icon.green { background: #22c55e !important; color: #1a1a1f !important; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1>Análise do Funil de Conversão</h1>
              <div class="subtitle">Visualização completa da jornada do paciente (<span id="periodLabel"></span>)</div>
            </div>
            <div class="header-right">
              <div>Conversão Geral: <span class="conversion-rate" id="overallRate">0.0%</span></div>
              <div style="margin-top: 4px;">Gerado em: <span id="generatedDate"></span></div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Funil Visual de Conversão</div>
            <div class="funnel-container">
              <div class="funnel-stage"><div class="stage-info"><div class="stage-icon purple">👥</div><div class="stage-name">Atendimentos Iniciados</div></div><div class="stage-value" id="stage1">0</div></div>
              <div class="funnel-stage"><div class="stage-info"><div class="stage-icon purple">👁</div><div class="stage-name">Dúvidas Sanadas</div></div><div class="stage-value" id="stage2">0</div></div>
              <div class="funnel-stage"><div class="stage-info"><div class="stage-icon purple">👆</div><div class="stage-name">Procedimentos Oferecidos</div></div><div class="stage-value" id="stage3">0</div></div>
              <div class="funnel-stage"><div class="stage-info"><div class="stage-icon green">📅</div><div class="stage-name">Agendamentos Realizados</div></div><div class="stage-value" id="stage4">0</div></div>
              <div class="funnel-stage"><div class="stage-info"><div class="stage-icon green">✓</div><div class="stage-name">Comparecimentos</div></div><div class="stage-value" id="stage5">0</div></div>
              <div class="funnel-stage"><div class="stage-info"><div class="stage-icon purple">✓</div><div class="stage-name">Procedimentos Realizados</div></div><div class="stage-value" id="stage6">0</div></div>
            </div>
          </div>
          <div class="section">
            <div class="metrics-grid">
              <div class="metrics-section">
                <h3>📈 Taxas de Conversão</h3>
                <div class="metric-row"><div class="metric-label">Atendimentos Iniciados → Dúvidas Sanadas</div><div class="conversion-value" id="conv1">0.0%</div></div>
                <div class="metric-row"><div class="metric-label">Dúvidas Sanadas → Procedimentos Oferecidos</div><div class="conversion-value" id="conv2">0.0%</div></div>
                <div class="metric-row"><div class="metric-label">Procedimentos Oferecidos → Agendamentos Realizados</div><div class="conversion-value" id="conv3">0.0%</div></div>
                <div class="metric-row"><div class="metric-label">Agendamentos Realizados → Comparecimentos</div><div class="conversion-value" id="conv4">0.0%</div></div>
                <div class="metric-row"><div class="metric-label">Comparecimentos → Procedimentos Realizados</div><div class="conversion-value" id="conv5">0.0%</div></div>
              </div>
              <div class="metrics-section">
                <h3>👥 Volume por Etapa</h3>
                <div class="metric-row"><div class="metric-label">Atendimentos Iniciados</div><div class="metric-value" id="vol1">0</div></div>
                <div class="metric-row"><div class="metric-label">Dúvidas Sanadas</div><div class="metric-value" id="vol2">0</div></div>
                <div class="metric-row"><div class="metric-label">Procedimentos Oferecidos</div><div class="metric-value" id="vol3">0</div></div>
                <div class="metric-row"><div class="metric-label">Agendamentos Realizados</div><div class="metric-value" id="vol4">0</div></div>
                <div class="metric-row"><div class="metric-label">Comparecimentos</div><div class="metric-value" id="vol5">0</div></div>
                <div class="metric-row"><div class="metric-label">Procedimentos Realizados</div><div class="metric-value" id="vol6">0</div></div>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Insights de Performance</div>
            <div class="insights-grid">
              <div class="insight-card"><div class="insight-title">Melhor Etapa de Conversão</div><div class="insight-description" id="bestStage">N/A</div><div class="insight-value insight-positive" id="bestRate">0.0%</div></div>
              <div class="insight-card"><div class="insight-title">Ponto de Maior Perda</div><div class="insight-description" id="worstStage">N/A</div><div class="insight-value insight-negative" id="worstRate">0.0% de perda</div></div>
              <div class="insight-card"><div class="insight-title">Taxa de Finalização</div><div class="insight-description">Do início ao procedimento realizado</div><div class="insight-value insight-positive" id="finalizationRate">0.0%</div></div>
              <div class="insight-card"><div class="insight-title">Volume Total Processado</div><div class="insight-description">Soma de todos os atendimentos nas etapas</div><div class="insight-value" id="totalVolume">0</div></div>
            </div>
          </div>
          <div class="footer"><div>📊 Relatório gerado automaticamente</div></div>
        </div>
        <script>
          function updateReportData(metrics) {
            if (!metrics) return;
            const { atendimentosIniciados, duvidasSanadas, procedimentosOferecidos, agendamentosRealizados, comparecimentos, procedimentosRealizados } = metrics;
            
            const stages = [atendimentosIniciados, duvidasSanadas, procedimentosOferecidos, agendamentosRealizados, comparecimentos, procedimentosRealizados];
            stages.forEach((val, i) => {
              document.getElementById('stage' + (i + 1)).textContent = val;
              document.getElementById('vol' + (i + 1)).textContent = val;
            });
            
            const stageNames = ['Atendimentos Iniciados', 'Dúvidas Sanadas', 'Procedimentos Oferecidos', 'Agendamentos Realizados', 'Comparecimentos', 'Procedimentos Realizados'];
            const conversions = [];
            for (let i = 0; i < stages.length - 1; i++) {
                const rate = stages[i] > 0 ? ((stages[i+1] / stages[i]) * 100) : 0;
                const el = document.getElementById('conv' + (i + 1));
                el.textContent = rate.toFixed(1) + '%';
                el.className = 'conversion-value';
                if (rate < 50) el.classList.add('conversion-low');
                else if (rate < 80) el.classList.add('conversion-medium');
                else el.classList.add('conversion-high');
                conversions.push({ name: stageNames[i] + ' → ' + stageNames[i+1], rate: rate });
            }

            const overallConversion = atendimentosIniciados > 0 ? ((procedimentosRealizados / atendimentosIniciados) * 100) : 0;
            document.getElementById('overallRate').textContent = overallConversion.toFixed(1) + '%';
            document.getElementById('finalizationRate').textContent = overallConversion.toFixed(1) + '%';
            
            document.getElementById('totalVolume').textContent = stages.reduce((a, b) => a + b, 0);
            
            const validConversions = conversions.filter(c => !isNaN(c.rate));
            if (validConversions.length > 0) {
              const best = validConversions.reduce((a, b) => a.rate > b.rate ? a : b);
              document.getElementById('bestStage').textContent = best.name;
              document.getElementById('bestRate').textContent = best.rate.toFixed(1) + '%';
              
              const worst = validConversions.reduce((a, b) => a.rate < b.rate ? a : b);
              document.getElementById('worstStage').textContent = worst.name;
              document.getElementById('worstRate').textContent = (100 - worst.rate).toFixed(1) + '% de perda';
            }
          }
          function setGeneratedDate(date, period) {
            document.getElementById('generatedDate').textContent = date;
            document.getElementById('periodLabel').textContent = period;
          }
          function generatePDF() {
            window.print();
          }
        <\/script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfTemplate);
      printWindow.document.close();

      printWindow.onload = () => {
        // Objeto de métricas compatível com a função updateReportData
        const reportData = {
          atendimentosIniciados: metrics.atendimentosIniciados,
          duvidasSanadas: metrics.duvidasSanadas,
          procedimentosOferecidos: metrics.procedimentosOferecidos,
          agendamentosRealizados: metrics.agendamentosRealizados,
          comparecimentos: metrics.comparecimentos,
          procedimentosRealizados: metrics.procedimentosRealizados,
        };

        const generatedDate = new Date().toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        
        // Chama as funções do script usando "as any" para evitar o erro do TypeScript
        (printWindow as any).updateReportData(reportData);
        (printWindow as any).setGeneratedDate(generatedDate, getPeriodLabel(period));

        // 5. Adiciona um pequeno delay antes de imprimir para garantir a renderização completa
        setTimeout(() => {
            (printWindow as any).generatePDF();
        }, 200);
      };
    } else {
        alert("Não foi possível abrir a janela de impressão. Verifique se o seu navegador está bloqueando pop-ups.");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 bg-background min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Análise do Funil de Conversão</h2>
            <p className="text-gray-400 mt-1 text-sm md:text-base">
              Visualização completa da jornada do paciente ({getPeriodLabel(period)}).
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
            <div className="bg-[#1a1a1f] border border-[#2a2a33] rounded-lg p-2 md:px-3 md:py-2 text-xs md:text-sm flex-1 md:flex-initial">
              <span className="text-gray-400">Conversão Geral: </span>
              <span className="font-bold text-[#a78bfa]">{overallConversionRate}%</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#2a2a33] text-white hover:bg-[#2a2a33] h-9 bg-[#1a1a1f]"
              onClick={handleExportToPdf}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-transparent mb-6 border-0 shadow-lg">
            <CardContent className="bg-[#1a1a1f] p-0 rounded-lg">
              <ConversionFunnel metrics={metrics} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-[#1a1a1f] border-[#2a2a33] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#2a2a33]">
                <CardTitle className="text-base md:text-lg font-semibold text-white flex items-center">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 mr-2 text-[#a78bfa]" />
                  Taxas de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-3">
                {stagesForRateCalculation.slice(1).map((stage, index) => {
                  const prevStage = stagesForRateCalculation[index]
                  const conversionRate = prevStage.value > 0 ? ((stage.value / prevStage.value) * 100).toFixed(1) : "0.0"
                  const isGood = Number.parseFloat(conversionRate) >= 70

                  return (
                    <div key={stage.name} className="flex items-center justify-between text-xs md:text-sm">
                      <div>
                        <p className="font-medium text-white">{prevStage.name} →</p>
                        <p className="text-gray-400">{stage.name}</p>
                      </div>
                      <div className={`font-semibold ${isGood ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {conversionRate}%
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1f] border-[#2a2a33] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#2a2a33]">
                <CardTitle className="text-base md:text-lg font-semibold text-white flex items-center">
                  <Users className="w-4 h-4 md:w-5 md:h-5 mr-2 text-[#a78bfa]" />
                  Volume por Etapa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-3">
                {stagesForRateCalculation.map((stage) => (
                  <div key={stage.name} className="flex items-center justify-between text-xs md:text-sm">
                    <p className="font-medium text-white">{stage.name}</p>
                    <p className="font-semibold text-[#a78bfa]">{stage.value.toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="bg-[#1a1a1f] border-[#2a2a33] shadow-sm">
            <CardHeader className="border-b border-[#2a2a33]">
              <CardTitle className="text-base md:text-lg font-semibold text-white flex items-center">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2 text-[#22c55e]" />
                Insights de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-3">
              <div className="p-3 bg-[#22c55e]/10 rounded-lg border border-[#22c55e]/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#22c55e]" />
                  <span className="font-medium text-sm text-[#22c55e]">Melhor Etapa de Conversão</span>
                </div>
                <p className="text-xs text-[#22c55e]/90">
                  {(() => {
                    const rates = stagesForRateCalculation.slice(1).map((s, i) => ({
                      name: `${stagesForRateCalculation[i].name} → ${s.name}`,
                      rate: stagesForRateCalculation[i].value > 0 ? (s.value / stagesForRateCalculation[i].value) * 100 : 0,
                    }))
                    if (rates.length === 0) return "N/A"
                    const best = rates.reduce((prev, current) => (prev.rate > current.rate ? prev : current))
                    return `${best.name}: ${best.rate.toFixed(1)}%`
                  })()}
                </p>
              </div>
              <div className="p-3 bg-[#f59e0b]/10 rounded-lg border border-[#f59e0b]/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-[#f59e0b]" />
                  <span className="font-medium text-sm text-[#f59e0b]">Ponto de Maior Perda</span>
                </div>
                <p className="text-xs text-[#f59e0b]/90">
                  {(() => {
                    const losses = stagesForRateCalculation.slice(1).map((s, i) => ({
                      from: stagesForRateCalculation[i].name,
                      to: s.name,
                      lossPercentage:
                        stagesForRateCalculation[i].value > 0
                          ? ((stagesForRateCalculation[i].value - s.value) / stagesForRateCalculation[i].value) * 100
                          : 0,
                    }))
                    if (losses.length === 0) return "N/A"
                    const biggest = losses.reduce((prev, current) =>
                      prev.lossPercentage > current.lossPercentage ? prev : current,
                    )
                    return `Entre ${biggest.from} e ${biggest.to} (${biggest.lossPercentage.toFixed(1)}% de perda)`
                  })()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1f] border-[#2a2a33] shadow-sm">
            <CardHeader className="border-b border-[#2a2a33]">
              <CardTitle className="text-base md:text-lg font-semibold text-white flex items-center">
                <Target className="w-4 h-4 md:w-5 md:h-5 mr-2 text-[#a78bfa]" />
                Ações Recomendadas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-3">
              {(() => {
                const rates = stagesForRateCalculation.slice(1).map((s, i) => ({
                  from: stagesForRateCalculation[i].name,
                  to: s.name,
                  rate: stagesForRateCalculation[i].value > 0 ? (s.value / stagesForRateCalculation[i].value) * 100 : 100,
                }))
                const lowConversionPoints = rates.filter((r) => r.rate < 60)
                if (lowConversionPoints.length === 0) {
                  return (
                    <div className="p-3 bg-[#22c55e]/10 rounded-lg border border-[#22c55e]/20 text-center text-sm text-[#22c55e]">
                      Funil saudável! 🎉 Todas as etapas têm boa conversão.
                    </div>
                  )
                }
                return lowConversionPoints.map((item) => (
                  <div key={item.to} className="p-3 bg-[#f59e0b]/10 rounded-lg border border-[#f59e0b]/20">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-[#f59e0b]" />
                      <span className="font-medium text-sm text-[#f59e0b]">
                        Otimizar: {item.from} → {item.to}
                      </span>
                    </div>
                    <p className="text-xs text-[#f59e0b]/90">
                      Taxa de conversão atual: {item.rate.toFixed(1)}%. Explorar melhorias nesta etapa.
                    </p>
                  </div>
                ))
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
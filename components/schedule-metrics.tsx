"use client"

// Removi useState e a lógica de modal daqui, pois parece ser gerenciada por ScheduleManagement
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, Users, Clock, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
// ActionModal, DatePicker, TimePicker, etc., não são mais usados diretamente aqui se os modais foram movidos

interface ScheduleMetricsData {
  totalAppointments: number;
  confirmedAppointments: number;
  pendingAppointments?: number; // Se ainda relevante para este componente
  cancelledAppointments?: number; // Se ainda relevante
  completedProcedures?: number;
  agendadoProcedures?: number;
  occupancyRate: number;
  noShowRate?: number; // Adicionado, pode vir da API de métricas
}

interface ScheduleMetricsProps {
  metrics: ScheduleMetricsData | null; // Pode ser nulo durante o carregamento
  viewMode: "day" | "week" | "month";
  // Funções para abrir modais podem ser passadas como props se necessário
  // onOpenNewAppointmentModal: () => void;
  // onOpenPendingModal: () => void;
  // ...etc
}

export function ScheduleMetrics({ metrics, viewMode }: ScheduleMetricsProps) {
  if (!metrics) {
    // Estado de carregamento ou sem dados
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 md:p-6">
              <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const safeMetrics: ScheduleMetricsData = {
    noShowRate: 0,
    ...metrics, // Sobrescreve com os valores reais
  };

  const confirmationRate =
    safeMetrics.totalAppointments > 0
      ? ((safeMetrics.confirmedAppointments / safeMetrics.totalAppointments) * 100).toFixed(1)
      : "0.0";

  // const completionRate = // Se esta métrica for relevante aqui
  //   (safeMetrics.completedProcedures || 0) + (safeMetrics.agendadoProcedures || 0) > 0
  //     ? (
  //         ((safeMetrics.completedProcedures || 0) /
  //           ((safeMetrics.completedProcedures || 0) + (safeMetrics.agendadoProcedures || 0))) * 100
  //       ).toFixed(1)
  //     : "0.0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <Card className="card-hover">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Agendamentos</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{safeMetrics.totalAppointments}</p>
              {/* Adicionar lógica de tendência se disponível na API */}
            </div>
            <div className="p-2.5 md:p-3 bg-info-muted rounded-full">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-info-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Confirmados</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{safeMetrics.confirmedAppointments}</p>
              <Badge className="bg-success-muted text-success-foreground text-xs mt-1">{confirmationRate}%</Badge>
            </div>
            <div className="p-2.5 md:p-3 bg-success-muted rounded-full">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-success-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Ocupação da Agenda</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{safeMetrics.occupancyRate}%</p>
              <div className="flex items-center mt-1">
                {safeMetrics.occupancyRate >= 80 ? (
                  <TrendingUp className="w-3 h-3 text-success-foreground mr-1" />
                ) : safeMetrics.occupancyRate >= 50 ? (
                  <TrendingUp className="w-3 h-3 text-warning-foreground mr-1" /> // Ou Info
                ): (
                  <TrendingDown className="w-3 h-3 text-destructive mr-1" />
                )}
                <span
                  className={`text-xs ${
                    safeMetrics.occupancyRate >= 80 ? "text-success-foreground"
                    : safeMetrics.occupancyRate >= 50 ? "text-warning-foreground" // Ou Info
                    : "text-destructive"
                  }`}
                >
                  {safeMetrics.occupancyRate >= 80 ? "Excelente" : safeMetrics.occupancyRate >= 50 ? "Bom" : "Baixa"}
                </span>
              </div>
            </div>
            <div className="p-2.5 md:p-3 bg-pending-muted rounded-full"> {/* Alterado para pending, pois ocupação é sobre capacidade */}
              <Users className="w-5 h-5 md:w-6 md:h-6 text-pending-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

       <Card className="card-hover">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Taxa de Não Comparecimento</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">
                {safeMetrics.noShowRate !== undefined ? `${safeMetrics.noShowRate}%` : 'N/A'}
              </p>
               {safeMetrics.noShowRate !== undefined && (
                <div className="flex items-center mt-1">
                    {safeMetrics.noShowRate <= 10 ? (
                    <CheckCircle className="w-3 h-3 text-success-foreground mr-1" />
                    ) : (
                    <AlertCircle className="w-3 h-3 text-warning-foreground mr-1" />
                    )}
                    <span
                    className={`text-xs ${
                        safeMetrics.noShowRate <= 10 ? "text-success-foreground" : "text-warning-foreground"
                    }`}
                    >
                    {safeMetrics.noShowRate <= 10 ? "Baixa" : "Atenção"}
                    </span>
                </div>
                )}
            </div>
            <div className="p-2.5 md:p-3 bg-warning-muted rounded-full">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-warning-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
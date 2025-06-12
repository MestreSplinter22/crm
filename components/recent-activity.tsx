// components/recent-activity.tsx
"use client"

import { useState, useEffect, useCallback } from "react"; // Adicionado useCallback
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar as CalendarIcon, CheckCircle, AlertCircle, Info, Activity as ActivityIcon, Settings } from "lucide-react";
import { Button } from "./ui/button";

interface ActivityLogItem {
  id: string;
  type: "appointment" | "procedure" | "patient_interaction" | "system_update" | "webhook_event";
  description: string;
  timestamp: string; // ISO string
  patientName?: string;
  status?: string; // Para agendamentos/procedimentos
  icon?: React.ElementType;
  eventType?: string; // Para webhooks
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 2) return `agora`;
    if (diffSeconds < 60) return `há ${diffSeconds} seg`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `há ${diffHours} h`;
    return date.toLocaleDateString('pt-BR');
}

const getEventDetails = (activity: ActivityLogItem): { icon: React.ElementType, badgeText?: string, badgeVariant?: "success" | "info" | "warning" | "default" | "destructive" } => {
    // Priorizar eventType se for um webhook_event
    const typeToAnalyze = activity.type === 'webhook_event' ? activity.eventType : activity.type;

    switch (typeToAnalyze) {
        case "atendimento_iniciado":
        case "patient_interaction":
            return { icon: User, badgeText: "Interação", badgeVariant: "info" };
        case "duvida_sanada":
            return { icon: CheckCircle, badgeText: "Dúvida Sanada", badgeVariant: "success" };
        case "procedimento_oferecido":
            return { icon: Info, badgeText: "Oferta", badgeVariant: "info" };
        case "agendamento_consulta_realizado":
        case "appointment":
            let badgeAppt: "success" | "info" | "warning" | "default" = "info";
            if (activity.status === "confirmado" || activity.status === "completed" || activity.status === "concluído") badgeAppt = "success";
            else if (activity.status === "pending" || activity.status === "agendado") badgeAppt = "warning";
            else if (activity.status === "cancelled") badgeAppt = "default";
            return { icon: CalendarIcon, badgeText: activity.status ? (activity.status.charAt(0).toUpperCase() + activity.status.slice(1)) : "Agendamento", badgeVariant: badgeAppt };
        case "confirmacao_agendamento":
            return { icon: CheckCircle, badgeText: "Confirmado", badgeVariant: "success" };
        case "presenca_agendamento_confirmada": // Mapear para 'completed' se necessário
            return { icon: CheckCircle, badgeText: "Compareceu", badgeVariant: "success" };
        case "procedimento_realizado":
        case "procedure": // Genérico para procedure
            return { icon: CheckCircle, badgeText: "Procedimento", badgeVariant: "success" };
        case "system_update":
            return { icon: Settings, badgeText: "Sistema", badgeVariant: "default" };
        default:
            return { icon: ActivityIcon, badgeText: activity.eventType || "Evento", badgeVariant: "default" };
    }
};

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActivity = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Esta API precisaria ser criada no backend para buscar de webhook_events ou activity_logs
      const response = await fetch('/api/activity-logs?limit=7');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar atividades recentes');
      }
      const data: ActivityLogItem[] = await response.json(); // API deve retornar dados no formato ActivityLogItem[]
      setActivities(data);
    } catch (err) {
      console.error("Error fetching recent activity:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
      setActivities([]); // Limpa em caso de erro
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  if (isLoading) {
    return (
      <Card className="card-hover">
        <CardHeader><CardTitle className="text-lg font-semibold flex items-center text-foreground"><Clock className="w-5 h-5 mr-2 text-muted-foreground" />Atividade Recente</CardTitle></CardHeader>
        <CardContent><div className="space-y-4">{[...Array(3)].map((_, i) => (<div key={i} className="flex items-center space-x-4 p-3"><div className="p-2 bg-muted rounded-full w-8 h-8 animate-pulse"></div><div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div><div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div></div><div className="h-5 bg-muted rounded-full w-20 animate-pulse"></div></div>))}</div></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-hover">
        <CardHeader><CardTitle className="text-lg font-semibold flex items-center text-foreground"><Clock className="w-5 h-5 mr-2 text-muted-foreground" />Atividade Recente</CardTitle></CardHeader>
        <CardContent className="text-center py-8 text-destructive flex flex-col items-center">
            <AlertCircle className="w-10 h-10 mb-2" />
            <p>Erro ao carregar atividades: {error}</p>
            <Button onClick={fetchRecentActivity} variant="outline" size="sm" className="mt-4">Tentar Novamente</Button>
        </CardContent>
      </Card>
    );
  }
  if (activities.length === 0 && !isLoading) {
      return (
          <Card className="card-hover">
              <CardHeader><CardTitle className="text-lg font-semibold flex items-center text-foreground"><Clock className="w-5 h-5 mr-2 text-muted-foreground" />Atividade Recente</CardTitle></CardHeader>
              <CardContent className="text-center py-8 text-muted-foreground">
                  <ActivityIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  Nenhuma atividade recente registrada.
              </CardContent>
          </Card>
      )
  }

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center text-foreground">
          <Clock className="w-5 h-5 mr-2 text-muted-foreground" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {activities.map((activity) => {
            const { icon: Icon, badgeText, badgeVariant } = getEventDetails(activity);
            return (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-md hover:bg-accent transition-colors"
              >
                <div className={`mt-1 p-1.5 rounded-full flex items-center justify-center ${badgeVariant ? `bg-${badgeVariant}-muted` : 'bg-muted'}`}>
                  <Icon className={`w-4 h-4 ${badgeVariant ? `text-${badgeVariant}-foreground` : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                </div>
                {badgeText && (
                    <Badge variant="default" className={`text-xs whitespace-nowrap self-start ${badgeVariant ? `badge-${badgeVariant}` : ''}`}>
                        {badgeText}
                    </Badge>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
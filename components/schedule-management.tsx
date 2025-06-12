"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { ScheduleMetrics } from "@/components/schedule-metrics"
import { AppointmentItem, AppointmentsList } from "@/components/appointments-list"
import { ProcedureScheduleItem, ProceduresScheduleList } from "@/components/procedures-schedule-list"
import { CalendarView } from "@/components/calendar-view"
import { NewAppointmentModal } from "@/components/new-appointment-modal"; // CORREÇÃO: Importa o novo modal
import { useToast } from "@/hooks/use-toast"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format as formatDateFns } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClinicSettings } from "./settings-modal"

// --- Interfaces ---
interface ScheduleMetricData {
  totalAppointments: number;
  confirmedAppointments: number;
  noShowAppointments: number;
  occupancyRate: number;
  noShowRate: number;
}
interface CreateAppointmentAPIPayload {
    patientId: string | number;
    appointmentDatetime: string;
    durationMinutes?: number;
    appointmentType: string;
    notes?: string;
    status?: string;
    valueCharged?: number;
    userId?: string | number;
}
// --- Fim das Interfaces ---

const calculateOccupancy = (
    appointments: AppointmentItem[],
    workingHours: any,
    viewMode: "day" | "week" | "month",
    selectedDate: Date
): number => {
    if (!workingHours || appointments.length === 0) return 0;
    const getDayName = (date: Date): string => formatDateFns(date, 'eeee', { locale: ptBR }).toLowerCase();
    let totalMinutesAvailable = 0;
    const totalMinutesOccupied = appointments
        .filter(appt => appt.status !== 'cancelled' && appt.status !== 'no_show')
        .reduce((sum, appt) => sum + (appt.duration || 0), 0);
    let daysToConsider: Date[] = [];
    if(viewMode === 'day'){ daysToConsider = [selectedDate]; }
    else if (viewMode === 'week') {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        daysToConsider = eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);
        daysToConsider = eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
    daysToConsider.forEach(day => {
        const dayName = getDayName(day);
        const daySchedule = workingHours[dayName];
        if (daySchedule && daySchedule.enabled) {
            const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
            const [endHour, endMinute] = daySchedule.end.split(':').map(Number);
            const minutes = (endHour - startHour) * 60 + (endMinute - startMinute);
            totalMinutesAvailable += minutes > 0 ? minutes : 0;
        }
    });
    if (totalMinutesAvailable === 0) return 0;
    const occupancy = (totalMinutesOccupied / totalMinutesAvailable) * 100;
    return Math.round(occupancy > 100 ? 100 : occupancy);
};

interface ScheduleManagementProps {
  selectedPeriod: string;
}

export function ScheduleManagement({ selectedPeriod: initialPeriod }: ScheduleManagementProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">(initialPeriod === "today" ? "day" : initialPeriod as "week" | "month");
  const [activeTab, setActiveTab] = useState("overview");
  const [scheduleMetrics, setScheduleMetrics] = useState<ScheduleMetricData | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [procedures, setProcedures] = useState<ProcedureScheduleItem[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const { toast } = useToast();

  const fetchDataForSchedule = useCallback(async () => {
    if (!clinicSettings) return; // Aguarda as configurações serem carregadas.
    setIsLoading(true);
    const dateParam = selectedDate.toISOString().split('T')[0];
    const apiParams = new URLSearchParams({ date: dateParam, viewMode });
    try {
      const [appointmentsRes, proceduresRes] = await Promise.all([
          fetch(`/api/appointments?${apiParams.toString()}`),
          fetch(`/api/procedures/performed?${apiParams.toString()}`)
      ]);
      if (!appointmentsRes.ok) throw new Error('Falha ao buscar agendamentos');
      const appointmentsData = await appointmentsRes.json();
      const safeAppointments = appointmentsData || [];
      setAppointments(safeAppointments);
      if (!proceduresRes.ok) throw new Error('Falha ao buscar procedimentos');
      const proceduresData = await proceduresRes.json();
      setProcedures(proceduresData?.procedures || []);

      const potentialAppointments = safeAppointments.filter((a: AppointmentItem) => a.status !== 'cancelled');
      const noShowAppointments = safeAppointments.filter((a: AppointmentItem) => a.status === 'no_show').length;
      setScheduleMetrics({
        totalAppointments: potentialAppointments.length,
        confirmedAppointments: potentialAppointments.filter((a: AppointmentItem) => a.status === 'confirmed').length,
        noShowAppointments,
        occupancyRate: calculateOccupancy(potentialAppointments, clinicSettings.workingHours, viewMode, selectedDate),
        noShowRate: potentialAppointments.length > 0 ? Math.round((noShowAppointments / potentialAppointments.length) * 100) : 0,
      });
    } catch (error) {
      toast({ title: "Erro ao Carregar Dados da Agenda", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, viewMode, toast, clinicSettings]);
  
  useEffect(() => {
    if (!clinicSettings) {
        (async () => {
            try {
                const settingsRes = await fetch('/api/settings');
                if (settingsRes.ok) setClinicSettings(await settingsRes.json());
                else throw new Error('Falha ao buscar configurações da clínica.');
            } catch (error) {
                toast({ title: "Erro Crítico", description: (error as Error).message, variant: "destructive" });
            }
        })();
    } else {
        fetchDataForSchedule();
    }
  }, [selectedDate, viewMode, clinicSettings, fetchDataForSchedule, toast]);

  const handleSaveNewAppointment = async (appointmentData: CreateAppointmentAPIPayload) => {
    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Falha ao criar agendamento");
        }
        await fetchDataForSchedule();
        setShowNewAppointmentModal(false);
        toast({ title: "Sucesso!", description: "Agendamento criado com sucesso." });
    } catch (error) {
        toast({ title: "Erro ao criar agendamento", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleDateChangeFromCalendar = (date: Date) => { setSelectedDate(date); setViewMode("day"); };
  const handleGoToToday = () => setSelectedDate(new Date());
  const formatDate = (date: Date, mode: "day" | "week" | "month"): string => {
    if (!date) return "";
    if (mode === "day") return formatDateFns(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (mode === "week") {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      return `Semana de ${formatDateFns(start, 'd/MM')} a ${formatDateFns(end, 'd/MM/yyyy')}`;
    }
    return formatDateFns(date, "MMMM 'de' yyyy", { locale: ptBR });
  };
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    const amount = direction === "next" ? 1 : -1;
    if (viewMode === "day") newDate.setDate(newDate.getDate() + amount);
    else if (viewMode === "week") newDate.setDate(newDate.getDate() + (amount * 7));
    else newDate.setMonth(newDate.getMonth() + amount);
    setSelectedDate(newDate);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Gerenciamento de Agenda</h2>
          <p className="text-sm text-muted-foreground">Controle completo de agendamentos e procedimentos</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleGoToToday} disabled={isLoading}>Hoje</Button>
          <Button variant="outline" size="sm" onClick={fetchDataForSchedule} disabled={isLoading}>
            <RefreshCw className={`w-3 h-3 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Atualizando..." : "Atualizar"}
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setShowNewAppointmentModal(true)} disabled={isLoading}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <Card className="card-hover">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center">
              <Button variant="outline" size="icon" onClick={() => navigateDate("prev")} className="h-9 w-9 hover:bg-accent mr-2 md:mr-4"><ChevronLeft className="w-4 h-4" /></Button>
              <div className="text-center min-w-[200px] md:min-w-[280px]"><h3 className="text-base md:text-lg font-semibold text-foreground capitalize truncate">{formatDate(selectedDate, viewMode)}</h3></div>
              <Button variant="outline" size="icon" onClick={() => navigateDate("next")} className="h-9 w-9 hover:bg-accent ml-2 md:ml-4"><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <div className="flex bg-muted rounded-md p-1">
              {(["day", "week", "month"] as const).map((mode) => (
                <Button key={mode} variant={viewMode === mode ? "default" : "ghost"} size="sm" onClick={() => setViewMode(mode)} className={`text-xs px-3 py-1 h-8 ${viewMode === mode ? 'shadow-sm text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>{mode === "day" ? "Dia" : mode === "week" ? "Semana" : "Mês"}</Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {(isLoading && !scheduleMetrics) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (<Card key={i}><CardContent className="p-4 md:p-6"><div className="h-6 bg-muted rounded w-3/4 mb-2"></div><div className="h-8 bg-muted rounded w-1/2 mb-3"></div><div className="h-4 bg-muted rounded w-1/4"></div></CardContent></Card>))}
        </div>) : 
        scheduleMetrics ? <ScheduleMetrics metrics={scheduleMetrics} viewMode={viewMode} /> : 
        <div className="text-center py-8 text-muted-foreground">Não foi possível carregar as métricas.</div>
      }
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          {isLoading ? <div className="text-center py-8">Carregando...</div> : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppointmentsList appointments={appointments} selectedDate={selectedDate} viewMode={viewMode} onUpdate={fetchDataForSchedule} onViewAllClick={() => setActiveTab('appointments')} />
              <ProceduresScheduleList procedures={procedures} selectedDate={selectedDate} viewMode={viewMode} onUpdate={fetchDataForSchedule} onViewAllClick={() => setActiveTab('procedures')} />
            </div>
          )}
        </TabsContent>
        <TabsContent value="appointments">
          {isLoading ? <div className="text-center py-8">Carregando...</div> : <AppointmentsList appointments={appointments} selectedDate={selectedDate} viewMode={viewMode} fullView onUpdate={fetchDataForSchedule}/>}
        </TabsContent>
        <TabsContent value="procedures">
          {isLoading ? <div className="text-center py-8">Carregando...</div> : <ProceduresScheduleList procedures={procedures} selectedDate={selectedDate} viewMode={viewMode} fullView onUpdate={fetchDataForSchedule}/>}
        </TabsContent>
        <TabsContent value="calendar">
            <CalendarView selectedDate={selectedDate} onDateSelect={handleDateChangeFromCalendar} />
        </TabsContent>
      </Tabs>
      
      {showNewAppointmentModal && (
        <NewAppointmentModal
            isOpen={showNewAppointmentModal}
            onClose={() => setShowNewAppointmentModal(false)}
            onSave={handleSaveNewAppointment}
            initialDate={selectedDate}
        />
      )}
    </div>
  );
}
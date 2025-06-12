"use client"

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Settings } from "lucide-react";
import { Sidebar } from "@/components/modern-sidebar";
import { DashboardOverview } from "@/components/dashboard-overview";
import { PatientManagement } from "@/components/patient-management";
import { FunnelAnalysis } from "@/components/funnel-analysis";
import { FinancialOverview } from "@/components/financial-overview";
import { ScheduleManagement } from "@/components/schedule-management";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { NewPatientModal } from "@/components/new-patient-modal";
import { SettingsModal, type ClinicSettings } from "@/components/settings-modal";
import { PatientProfile } from "@/components/patient-profile";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/apiClient";
import router from "next/router";
import ClickSpark from "./ClickSpark";

// --- INÍCIO DAS INTERFACES (Fonte da Verdade) ---
export interface MetricValues {
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
}

export interface PatientAppointment {
  id?: string;
  date: string;
  time?: string;
  type: string;
  status: string;
  value?: number;
}

export interface PatientProcedure {
  id?: string;
  date: string;
  name: string;
  status: string;
  value: number;
  cost: number;
  profit: number;
  category?: string;
  margin?: number;
}

export interface PatientListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastContact: string | null;
  funnelStage: string;
  status: string;
  avatar?: string | null;
  nextAppointment?: string | null;
  totalValue?: number;
  proceduresCount?: number;
}

export interface CreatePatientPayload {
  name: string; email: string; phone: string; birthDate?: string | null; address?: string;
  city?: string; zipCode?: string; emergencyContact?: string; emergencyPhone?: string;
  medicalHistory?: string; allergies?: string; medications?: string;
  insuranceProvider?: string; insuranceNumber?: string; preferredContact?: string; notes?: string;
}

export interface PatientDetail extends PatientListItem {
  birthDate?: string | null;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  medicalHistory?: string | null;
  allergies?: string | null;
  medications?: string | null;
  insuranceProvider?: string | null;
  insuranceNumber?: string | null;
  preferredContact?: string | null;
  notes?: string | null;
  createdAt?: string;
  appointments: PatientAppointment[];
  procedures: PatientProcedure[];
  totalSpent: number;
  totalProfit: number;
}

export interface NotificationItem {
  id: string;
  type: "info" | "warning" | "success" | "error" | "reminder";
  title: string;
  message: string;
  time: string;
  read: boolean;
  createdAt?: string;
}
// --- FIM DAS INTERFACES ---

export default function ModernDentalCRMPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ModernDentalCRM />
      <Toaster />
    </ThemeProvider>
  )
}

function ModernDentalCRM() {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  const [currentMetrics, setCurrentMetrics] = useState<MetricValues | null>(null);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<PatientDetail | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentSettings, setCurrentSettings] = useState<ClinicSettings | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    metrics: true, patients: true, notifications: true, settings: true, selectedPatient: false,
  });

  const setLoading = (key: string, value: boolean) => setIsLoading(prev => ({ ...prev, [key]: value }));

  const fetchMetrics = useCallback(async (period: string) => {
    setLoading("metrics", true);
    try {
      const data = await apiClient<{ metrics: MetricValues }>(`/metrics?period=${period}`);
      setCurrentMetrics(data.metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      setCurrentMetrics(null);
      toast({ title: "Erro ao buscar métricas", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
      if (error instanceof Error && (error.message.includes('Não autorizado') || error.message.includes('Token não fornecido'))) {
        localStorage.removeItem('jwtToken');
        router.push('/login');
      }
    } finally {
      setLoading("metrics", false);
    }
  }, [toast]);

  const fetchPatients = useCallback(async (period: string, searchTerm: string = "") => {
    setLoading("patients", true);
    try {
      const response = await fetch(`/api/patients?period=${period}&search=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || `Patients API error! status: ${response.status}`);}
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setPatients([]);
      toast({ title: "Erro ao buscar pacientes", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
    } finally {
      setLoading("patients", false);
    }
  }, [toast]);

  const fetchNotifications = useCallback(async () => {
    setLoading("notifications", true);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || `Notifications API error! status: ${response.status}`);}
      const data = await response.json();
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoading("notifications", false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading("settings", true);
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || `Settings API error! status: ${response.status}`);}
      const data: ClinicSettings = await response.json();
      setCurrentSettings(data || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
      setCurrentSettings({});
      toast({ title: "Erro ao buscar configurações", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
    } finally {
      setLoading("settings", false);
    }
  }, [toast]);

  useEffect(() => { fetchMetrics(selectedPeriod); }, [selectedPeriod, fetchMetrics]);
  useEffect(() => { if (activeView === "patients" || activeView === "dashboard") fetchPatients(selectedPeriod); }, [activeView, selectedPeriod, fetchPatients]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { if (showSettingsModal && !currentSettings) fetchSettings(); }, [showSettingsModal, currentSettings, fetchSettings]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, { method: 'PUT' });
      if (!response.ok) throw new Error('Falha ao marcar como lida');
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) { console.error("Error marking notification as read:", error); toast({title: "Erro", description: "Não foi possível marcar a notificação como lida.", variant: "destructive"}) }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', { method: 'PUT' });
      if (!response.ok) throw new Error('Falha ao marcar todas como lidas');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) { console.error("Error marking all as read:", error); toast({title: "Erro", description: "Não foi possível marcar todas as notificações como lidas.", variant: "destructive"}) }
  };

  const handleDismissNotification = async (id: string) => {
     try {
      const response = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao dispensar notificação');
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) { console.error("Error dismissing notification:", error); toast({title: "Erro", description: "Não foi possível dispensar a notificação.", variant: "destructive"}) }
  };

  const handleSaveNewPatient = async (patientData: CreatePatientPayload) => {
    setLoading("patients", true);
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Falha ao salvar paciente');
      
      await fetchPatients(selectedPeriod); 
      setShowNewPatientModal(false);
      toast({ title: "Sucesso!", description: "Paciente cadastrado com sucesso!" });
    } catch (error) {
      console.error("Error saving new patient:", error);
      toast({ title: "Erro ao salvar paciente", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
    } finally {
      setLoading("patients", false);
    }
  };

  const handleSaveSettings = async (settingsData: ClinicSettings) => {
    setLoading("settings", true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Falha ao salvar configurações');
      setCurrentSettings(result.settings);
      toast({ title: "Sucesso!", description: "Configurações salvas com sucesso!" });
      setShowSettingsModal(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Erro ao salvar configurações", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
    } finally {
      setLoading("settings", false);
    }
  };

  const handleSelectPatient = async (patientListItem: PatientListItem) => {
    if (!patientListItem?.id) { setSelectedPatientDetail(null); return; }
    setLoading("selectedPatient", true);
    try {
      const response = await fetch(`/api/patients/${patientListItem.id}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Falha ao buscar detalhes do paciente ${patientListItem.name}`);
      }
      const data = await response.json();
      setSelectedPatientDetail({
        ...(data.patient as PatientDetail),
        procedures: data.patient.procedures || [],
        appointments: data.patient.appointments || [],
      });
    } catch (error) {
      console.error(error);
      setSelectedPatientDetail(null);
      toast({ title: "Erro ao carregar paciente", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
    } finally {
      setLoading("selectedPatient", false);
    }
  };

  const renderContent = () => {
    if (isLoading.selectedPatient) return <div className="flex justify-center items-center h-64"><p>Carregando perfil do paciente...</p></div>;
    if (activeView === "patients" && selectedPatientDetail) {
        return <PatientProfile patient={selectedPatientDetail} onBack={() => setSelectedPatientDetail(null)} />;
    }

    switch (activeView) {
      case "dashboard":
        if (isLoading.metrics || !currentMetrics) return <div className="flex justify-center items-center h-64"><p>Carregando dashboard...</p></div>;
        return <DashboardOverview metrics={currentMetrics} period={selectedPeriod} />;
      case "patients":
        if (isLoading.patients) return <div className="flex justify-center items-center h-64"><p>Carregando pacientes...</p></div>;
        return <PatientManagement patients={patients} onSelectPatient={handleSelectPatient} selectedPeriod={selectedPeriod} />;
      case "schedule":
        return <ScheduleManagement selectedPeriod={selectedPeriod} />;
      case "funnel":
        if (isLoading.metrics || !currentMetrics) return <div className="flex justify-center items-center h-64"><p>Carregando análise de funil...</p></div>;
        return <FunnelAnalysis metrics={currentMetrics} period={selectedPeriod} />;
      case "financial":
        if (isLoading.metrics || !currentMetrics) return <div className="flex justify-center items-center h-64"><p>Carregando financeiro...</p></div>;
        return <FinancialOverview metrics={currentMetrics} period={selectedPeriod} />;
      default:
        return <div className="flex justify-center items-center h-64"><p>Selecione uma visualização.</p></div>;
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
        <ClickSpark
          sparkColor='#fff'
          sparkSize={10}
          sparkRadius={15}
          sparkCount={8}
          duration={400}
        >
        <Sidebar
          activeView={activeView}
          onViewChange={(view) => {
            setSelectedPatientDetail(null);
            setActiveView(view);
          }}
          onSettingsClick={() => {
              if (!currentSettings && !isLoading.settings) fetchSettings();
              setShowSettingsModal(true);
          }}
          clinicName={currentSettings?.clinicName}
        />

        <div className="md:ml-64">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {activeView === "dashboard" && "Dashboard Principal"}
                  {activeView === "patients" && (selectedPatientDetail ? selectedPatientDetail.name : "Pacientes")}
                  {activeView === "schedule" && "Agenda e Métricas"}
                  {activeView === "funnel" && "Análise de Funil"}
                  {activeView === "financial" && "Visão Financeira"}
                </h1>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                {activeView !== "schedule" && (
                  <div className="hidden md:flex bg-muted rounded-md p-1">
                    {["today", "week", "month"].map((p) => (
                      <Button
                        key={p}
                        variant={selectedPeriod === p ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedPeriod(p)}
                        className={`text-xs px-3 py-1 h-8 ${selectedPeriod === p ? 'shadow-sm text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                      >
                        {p === "today" && "Hoje"}
                        {p === "week" && "Semana"}
                        {p === "month" && "Mês"}
                      </Button>
                    ))}
                  </div>
                )}

                <Button size="sm" className="hidden md:flex bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setShowNewPatientModal(true)}>
                  <Plus className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Novo Paciente</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                      if (!currentSettings && !isLoading.settings) fetchSettings();
                      setShowSettingsModal(true);
                  }}
                  className="hidden md:flex h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="p-4 md:p-6">
            {renderContent()}
          </main>
        </div>

        {showNotifications && (
          <NotificationsDropdown
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDismiss={handleDismissNotification}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        )}

        <NewPatientModal
          isOpen={showNewPatientModal}
          onClose={() => setShowNewPatientModal(false)}
          onSave={handleSaveNewPatient}
        />

        {showSettingsModal && currentSettings !== null && (
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            onSave={handleSaveSettings}
            initialSettings={currentSettings}
          />
        )}
        {showSettingsModal && isLoading.settings && (
            <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-[60]">
              <p>Carregando configurações...</p>
            </div>
          )}
        </ClickSpark>
    </div>
  );
}
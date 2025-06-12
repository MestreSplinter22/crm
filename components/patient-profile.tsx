"use client"

import { useState } from "react";
import type { PatientDetail, PatientAppointment, PatientProcedure } from "@/app/page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { StyledTabs, StyledTabsList, StyledTabsTrigger, TabsContent } from "@/components/ui/tabs-styled";
import { 
    ArrowLeft, Phone, Mail, Calendar, CheckCircle, DollarSign, TrendingUp,
    HeartPulse, Building, MapPin, Ambulance, StickyNote, ShieldQuestion, User, Pill
} from "lucide-react";

interface PatientProfileProps {
  patient: PatientDetail;
  onBack: () => void;
}

const stageLabels: { [key: string]: { label: string; variant: "success" | "warning" | "info" | "default" } } = {
  atendimento_iniciado: { label: "Atendimento Iniciado", variant: "info" },
  duvida_sanada: { label: "Dúvida Sanada", variant: "info" },
  procedimento_oferecido: { label: "Procedimento Oferecido", variant: "warning" },
  agendamento_realizado: { label: "Agendamento Realizado", variant: "warning" },
  agendamento_confirmado: { label: "Agendamento Confirmado", variant: "success" },
  comparecimento_confirmado: { label: "Compareceu", variant: "success" },
  procedimento_realizado: { label: "Procedimento Realizado", variant: "success" },
  lead_created: { label: "Lead Criado", variant: "default" },
};

export function PatientProfile({ patient, onBack }: PatientProfileProps) {
  const [activeTab, setActiveTab] = useState("appointments");
  const stageInfo = stageLabels[patient.funnelStage] || { label: patient.funnelStage, variant: "default" };

  const getInitials = (name: string) => name?.split(" ").map((part) => part[0]).join("").toUpperCase().substring(0, 2) || "";
  
  const getStatusVariant = (status: string): "success" | "warning" | "info" | "default" | "canceled" => {
    const statusMap: Record<string, "success" | "warning" | "info" | "default" | "canceled"> = {
        realizado: "success", concluído: "success", completed: "success",
        confirmado: "success", confirmed: "success",
        pendente: "warning", pending: "warning", agendado: "warning",
        cancelado: "canceled", cancelled: "canceled"
    };
    return statusMap[status] || "default";
  };

  const safeAppointments = patient.appointments || [];
  const safeProcedures = patient.procedures || [];
  
  const hasAddressInfo = patient.address || patient.city || patient.zipCode;
  const hasEmergencyInfo = patient.emergencyContact || patient.emergencyPhone;
  const hasMedicalInfo = patient.medicalHistory || patient.allergies || patient.medications;
  const hasInsuranceInfo = patient.insuranceProvider || patient.insuranceNumber;

  // Componente para um item de informação, para evitar repetição
  const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="text-sm">
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-muted-foreground">{value}</p>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="h-9 w-9 shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
          <Avatar initials={getInitials(patient.name)} size="lg" className="animate-scale" />
          <div>
            <h2 className="text-xl font-semibold">{patient.name}</h2>
            <div className="flex items-center gap-2 mt-1"><StatusBadge variant={stageInfo.variant as any}>{stageInfo.label}</StatusBadge></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2"><Button size="sm" className="btn-hover"><Calendar className="h-4 w-4 mr-2" /> Agendar</Button><Button variant="outline" size="sm" className="btn-hover"><Phone className="h-4 w-4 mr-2" /> Contatar</Button></div>
      </div>

      {/* INFORMAÇÕES E STATS */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Coluna de Informações Detalhadas */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="card-hover"><CardHeader><CardTitle className="text-base">Contato e Pessoal</CardTitle></CardHeader><CardContent className="space-y-4"><InfoItem icon={Mail} label="Email" value={patient.email} /><InfoItem icon={Phone} label="Telefone" value={patient.phone} /><InfoItem icon={Calendar} label="Nascimento" value={patient.birthDate ? new Date(patient.birthDate + 'T00:00:00Z').toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : null} /></CardContent></Card>
          {hasAddressInfo && <Card className="card-hover animate-slide-up"><CardHeader><CardTitle className="text-base flex items-center"><MapPin className="w-4 h-4 mr-2 text-primary"/> Endereço</CardTitle></CardHeader><CardContent className="space-y-4"><InfoItem icon={MapPin} label="Endereço" value={patient.address} /><InfoItem icon={MapPin} label="Cidade/CEP" value={[patient.city, patient.zipCode].filter(Boolean).join(' - ')} /></CardContent></Card>}
          {hasEmergencyInfo && <Card className="card-hover animate-slide-up"><CardHeader><CardTitle className="text-base flex items-center"><Ambulance className="w-4 h-4 mr-2 text-canceled"/> Contato de Emergência</CardTitle></CardHeader><CardContent className="space-y-4"><InfoItem icon={User} label="Nome" value={patient.emergencyContact} /><InfoItem icon={Phone} label="Telefone" value={patient.emergencyPhone} /></CardContent></Card>}
          {hasInsuranceInfo && <Card className="card-hover animate-slide-up"><CardHeader><CardTitle className="text-base flex items-center"><Building className="w-4 h-4 mr-2 text-primary"/> Convênio</CardTitle></CardHeader><CardContent className="space-y-4"><InfoItem icon={Building} label="Operadora" value={patient.insuranceProvider} /><InfoItem icon={CheckCircle} label="Nº da Carteirinha" value={patient.insuranceNumber} /></CardContent></Card>}
          {hasMedicalInfo && <Card className="card-hover animate-slide-up"><CardHeader><CardTitle className="text-base flex items-center"><HeartPulse className="w-4 h-4 mr-2 text-canceled"/> Informações Médicas</CardTitle></CardHeader><CardContent className="space-y-4"><InfoItem icon={ShieldQuestion} label="Alergias" value={patient.allergies} /><InfoItem icon={Pill} label="Medicamentos em Uso" value={patient.medications} /><InfoItem icon={HeartPulse} label="Histórico Relevante" value={patient.medicalHistory} /></CardContent></Card>}
          {patient.notes && <Card className="card-hover animate-slide-up"><CardHeader><CardTitle className="text-base flex items-center"><StickyNote className="w-4 h-4 mr-2 text-muted-foreground"/> Observações</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{patient.notes}</p></CardContent></Card>}
        </div>

        {/* Coluna de Stats */}
        <div className="xl:col-span-1 space-y-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <StatCard value={`R$ ${(patient.totalSpent || 0).toLocaleString("pt-BR")}`} label="Total Gasto" icon={<DollarSign className="h-4 w-4 text-primary" />} variant="primary"/>
          <StatCard value={`R$ ${(patient.totalProfit || 0).toLocaleString("pt-BR")}`} label="Lucro Gerado" icon={<TrendingUp className="h-4 w-4 text-success-foreground" />} variant="success"/>
          <StatCard value={`${patient.totalSpent > 0 ? (((patient.totalProfit || 0) / patient.totalSpent) * 100).toFixed(1) : "0.0"}%`} label="Margem Média" icon={<DollarSign className="h-4 w-4 text-info-foreground" />} variant="info"/>
        </div>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <Card className="card-hover animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <CardContent className="p-0">
          <StyledTabs defaultValue="appointments" onValueChange={setActiveTab} value={activeTab}>
            <StyledTabsList className="px-6 pt-6" tabStyle="underline">
              <StyledTabsTrigger value="appointments" tabStyle="underline" icon={<Calendar className="h-4 w-4" />} count={safeAppointments.length}>Agendamentos</StyledTabsTrigger>
              <StyledTabsTrigger value="procedures" tabStyle="underline" icon={<CheckCircle className="h-4 w-4" />} count={safeProcedures.length}>Procedimentos</StyledTabsTrigger>
              <StyledTabsTrigger value="financial" tabStyle="underline" icon={<DollarSign className="h-4 w-4" />}>Financeiro</StyledTabsTrigger>
            </StyledTabsList>

            <TabsContent value="appointments" className="p-6 pt-4 animate-fade-in">
              {safeAppointments.length > 0 ? (
                <div className="space-y-3">
                  {safeAppointments.map((appointment, index) => (
                    <div key={appointment.id || index} className="flex items-center justify-between p-4 bg-background border rounded-lg hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-4"><div className="p-2 rounded-full bg-info-muted"><Calendar className="h-4 w-4 text-info-foreground" /></div><div><p className="font-medium">{appointment.type}</p><p className="text-sm text-muted-foreground">{new Date(appointment.date).toLocaleDateString("pt-BR", {timeZone: 'UTC'})}{appointment.time ? ` às ${appointment.time}`: ''}</p></div></div>
                      <div className="flex items-center gap-3">{appointment.value && (<span className="text-sm font-medium">R$ {appointment.value.toLocaleString("pt-BR")}</span>)}<StatusBadge variant={getStatusVariant(appointment.status)}>{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</StatusBadge></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12"><Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" /><p className="text-muted-foreground">Nenhum agendamento encontrado</p></div>
              )}
            </TabsContent>

            <TabsContent value="procedures" className="p-6 pt-4 animate-fade-in">
              {safeProcedures.length > 0 ? (
                <div className="space-y-3">
                  {safeProcedures.map((procedure, index) => (
                    <div key={procedure.id || index} className="flex items-center justify-between p-4 bg-background border rounded-lg hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-4"><div className="p-2 rounded-full bg-success-muted"><CheckCircle className="h-4 w-4 text-success-foreground" /></div><div><p className="font-medium">{procedure.name}</p><p className="text-sm text-muted-foreground">{new Date(procedure.date + "T00:00:00Z").toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</p></div></div>
                      <div className="text-right"><p className="font-medium">R$ {procedure.value.toLocaleString("pt-BR")}</p><p className="text-sm text-success-foreground">Lucro: R$ {procedure.profit.toLocaleString("pt-BR")}</p></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12"><CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" /><p className="text-muted-foreground">Nenhum procedimento realizado</p></div>
              )}
            </TabsContent>

            <TabsContent value="financial" className="p-6 pt-4 animate-fade-in">
              <div className="space-y-6">
                <Card><CardContent className="p-6"><h3 className="text-lg font-medium mb-4">Histórico Financeiro de Procedimentos</h3><div className="space-y-4">
                  {safeProcedures.length > 0 ? (
                    safeProcedures.map((procedure, index) => (
                      <div key={index} className="flex justify-between items-center pb-4 border-b last:border-0">
                        <div><p className="font-medium">{procedure.name}</p><p className="text-sm text-muted-foreground">{new Date(procedure.date + "T00:00:00Z").toLocaleDateString("pt-BR", {timeZone: 'UTC'})}</p></div>
                        <div className="text-right"><p className="font-medium">R$ {procedure.value.toLocaleString("pt-BR")}</p><div className="flex items-center gap-1 text-sm text-success-foreground"><TrendingUp className="h-3 w-3" /><span>R$ {procedure.profit.toLocaleString("pt-BR")}</span></div></div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8"><DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" /><p className="text-muted-foreground">Nenhum histórico financeiro disponível</p></div>
                  )}
                </div></CardContent></Card>
              </div>
            </TabsContent>
          </StyledTabs>
        </CardContent>
      </Card>
    </div>
  )
}
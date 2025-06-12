// components/patient-management.tsx
"use client"

import { useState } from "react"
// Importando os tipos corretos de app/page.tsx
import type { PatientListItem } from "@/app/page";
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar } from "@/components/ui/avatar"
import {
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Calendar,
  MoreHorizontal,
  User,
  CheckCircle,
  DollarSign,
} from "lucide-react"
// PatientProfile não é mais renderizado diretamente aqui, pode ser removido se não houver outro uso.
// import { PatientProfile } from "@/components/patient-profile" 

// A interface local 'Patient' foi removida. Usaremos PatientListItem importado.

interface PatientManagementProps {
  patients: PatientListItem[]; // CORRIGIDO: Agora espera o tipo correto para uma lista.
  onSelectPatient: (patient: PatientListItem) => void;
  selectedPeriod: string;
}

export function PatientManagement({ patients, onSelectPatient, selectedPeriod }: PatientManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "pending_confirmation": return "warning";
      case "inactive": return "default";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Ativo";
      case "pending_confirmation": return "Pendente";
      case "inactive": return "Inativo";
      default: return status;
    }
  };
  
  // A filtragem client-side pode ser mantida para interatividade rápida
  const filteredPatients = patients.filter((patient) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = patient.name.toLowerCase().includes(term) ||
                            patient.email.toLowerCase().includes(term) ||
                            patient.phone.includes(term);

      const matchesFilter = selectedFilter === "all" || patient.status === selectedFilter;

      return matchesSearch && matchesFilter;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // A lógica de renderizar PatientProfile foi movida para o componente pai (app/page.tsx)
  // que é o correto, pois ele gerencia o estado 'selectedPatientDetail'.

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pacientes</h1>
          <p className="text-muted-foreground">
            {patients.length} pacientes encontrados
          </p>
        </div>
      </div>

      <Card className="card-hover">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                 <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="pending_confirmation">Pendente</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient, index) => (
          <Card
            key={patient.id}
            className="card-hover cursor-pointer animate-slide-up group"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => onSelectPatient(patient)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <Avatar initials={getInitials(patient.name)} size="md" />
                  <div className="overflow-hidden">
                    <h3 className="font-medium truncate" title={patient.name}>{patient.name}</h3>
                    <StatusBadge variant={getStatusVariant(patient.status) as any}>
                      {getStatusLabel(patient.status)}
                    </StatusBadge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{patient.email}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{patient.phone}</span>
                </div>
                {patient.nextAppointment && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Próximo: {new Date(patient.nextAppointment).toLocaleDateString("pt-BR", {timeZone: "UTC"})}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                        <DollarSign className="h-3 w-3 text-primary" />
                        <p className="text-sm font-medium">{(patient.totalValue || 0).toLocaleString("pt-BR")}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Total Gasto</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3 text-success-foreground" />
                        {/* CORRIGIDO: Usa proceduresCount da PatientListItem */}
                        <p className="text-sm font-medium">{patient.proceduresCount || 0}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Proced.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <Card className="py-12 text-center animate-fade-in">
          <CardContent>
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium">Nenhum paciente encontrado</p>
            <p className="text-muted-foreground mb-6">Tente ajustar os filtros de busca ou cadastre um novo paciente.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Phone, Mail, Calendar, Plus } from "lucide-react"

interface Patient {
  id: string
  name: string
  email: string
  phone: string
  lastContact: string
  funnelStage: string
  appointments: Array<{
    date: string
    type: string
    status: string
  }>
  procedures: Array<{
    date: string
    name: string
    status: string
  }>
}

interface PatientsListProps {
  patients: Patient[]
  onSelectPatient: (patient: Patient) => void
}

const stageLabels = {
  atendimento_iniciado: { label: "Atendimento Iniciado", color: "bg-blue-100 text-blue-800" },
  duvida_sanada: { label: "Dúvida Sanada", color: "bg-green-100 text-green-800" },
  procedimento_oferecido: { label: "Procedimento Oferecido", color: "bg-yellow-100 text-yellow-800" },
  agendamento_realizado: { label: "Agendamento Realizado", color: "bg-purple-100 text-purple-800" },
  agendamento_confirmado: { label: "Agendamento Confirmado", color: "bg-indigo-100 text-indigo-800" },
  comparecimento_confirmado: { label: "Compareceu", color: "bg-cyan-100 text-cyan-800" },
  procedimento_realizado: { label: "Procedimento Realizado", color: "bg-emerald-100 text-emerald-800" },
}

export function PatientsList({ patients, onSelectPatient }: PatientsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStage, setFilterStage] = useState("all")

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)

    const matchesFilter = filterStage === "all" || patient.funnelStage === filterStage

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Pacientes</h2>
          <p className="text-gray-600">Total de {patients.length} pacientes cadastrados</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as Etapas</option>
              {Object.entries(stageLabels).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => {
          const stageInfo = stageLabels[patient.funnelStage as keyof typeof stageLabels] || stageLabels.atendimento_iniciado

          return (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{patient.name}</CardTitle>
                  <Badge className={stageInfo.color}>{stageInfo.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Último contato: {new Date(patient.lastContact).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Agendamentos:</span>
                    <span className="font-medium">{patient.appointments.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Procedimentos:</span>
                    <span className="font-medium">{patient.procedures.length}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4" onClick={() => onSelectPatient(patient)}>
                  Ver Perfil Completo
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredPatients.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum paciente encontrado</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle, Clock, DollarSign, User, Search, MoreHorizontal, XCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ProcedureScheduleItem {
  id: string;
  time: string;
  dateFull: string;
  patient: string;
  procedure: string;
  status: "completed" | "pending" | "cancelled" | "in_progress" | "aborted" | "agendado";
  duration: number;
  value?: number;
  profit?: number;
  notes?: string;
}

interface ProceduresScheduleListProps {
  procedures: ProcedureScheduleItem[];
  viewMode: "day" | "week" | "month";
  selectedDate: Date;
  fullView?: boolean;
  onUpdate: () => void;
  onViewAllClick?: () => void;
}

const groupProceduresByDate = (procedures: ProcedureScheduleItem[]) => {
  return procedures.reduce((acc, procedure) => {
    const date = new Date(procedure.dateFull).toLocaleDateString('pt-BR', { timeZone: 'UTC', year: 'numeric', month: 'long', day: '2-digit', weekday: 'long' });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(procedure);
    return acc;
  }, {} as Record<string, ProcedureScheduleItem[]>);
};

export function ProceduresScheduleList({ procedures: initialProcedures, viewMode, selectedDate, fullView = false, onUpdate, onViewAllClick }: ProceduresScheduleListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const handleAction = async (action: 'start' | 'complete' | 'cancel', procedureId: string) => {
    let newStatus = "";
    if (action === 'start') newStatus = 'in_progress';
    if (action === 'complete') newStatus = 'completed';
    if (action === 'cancel') {
      if (!confirm(`Tem certeza que deseja cancelar o procedimento ${procedureId}?`)) return;
      newStatus = 'cancelled';
    }
    try {
      const response = await fetch(`/api/procedures/performed/${procedureId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error(`Falha ao atualizar status`);
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusColorClass = (status: string): string => {
    switch (status) {
      case "completed": return "bg-success-muted text-success-foreground border-success-foreground/30";
      case "in_progress": return "bg-info-muted text-info-foreground border-info-foreground/30";
      case "agendado": case "pending": return "bg-warning-muted text-warning-foreground border-warning-foreground/30";
      case "cancelled": case "aborted": return "bg-destructive text-destructive-foreground border-destructive/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        completed: 'Concluído', in_progress: 'Em Andamento', agendado: 'Agendado',
        cancelled: 'Cancelado', aborted: 'Abortado', pending: 'Pendente'
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-3.5 h-3.5 text-success-foreground" />;
      case "in_progress": return <Clock className="w-3.5 h-3.5 text-info-foreground" />;
      case "agendado": case "pending": return <Clock className="w-3.5 h-3.5 text-warning-foreground" />;
      case "cancelled": case "aborted": return <XCircle className="w-3.5 h-3.5 text-destructive" />;
      default: return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const filteredProcedures = initialProcedures.filter((procedure) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (procedure.patient || '').toLowerCase().includes(searchTermLower) ||
      (procedure.procedure || '').toLowerCase().includes(searchTermLower);
    
    const matchesFilter = filterStatus === "all" || procedure.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const groupedProcedures = groupProceduresByDate(filteredProcedures);
  const sortedDates = Object.keys(groupedProcedures).sort((a, b) => {
    const dateA = new Date(groupedProcedures[a][0].dateFull).getTime();
    const dateB = new Date(groupedProcedures[b][0].dateFull).getTime();
    return dateA - dateB;
  });

  const renderProcedureItem = (item: ProcedureScheduleItem) => (
    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="text-center w-16 shrink-0">
          <div className="text-sm md:text-base font-bold text-foreground">{item.time}</div>
          {item.duration > 0 && <div className="text-xs text-muted-foreground">{item.duration}min</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5"><User className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="font-medium text-sm text-foreground truncate" title={item.patient}>{item.patient}</span></div>
          <div className="flex items-center space-x-1.5 mt-0.5">{getStatusIcon(item.status)}<span className="text-xs text-muted-foreground truncate" title={item.procedure}>{item.procedure}</span></div>
          {item.value !== undefined && (<div className="flex items-center space-x-1.5 mt-0.5"><DollarSign className="w-3.5 h-3.5 text-success-foreground shrink-0" /><span className="text-xs text-muted-foreground">Valor: R$ {item.value.toLocaleString('pt-BR')}{item.profit !== undefined && ` (Lucro: R$ ${item.profit.toLocaleString('pt-BR')})`}</span></div>)}
          {item.notes && <p className="text-xs text-muted-foreground/80 mt-1 truncate" title={item.notes}>{item.notes}</p>}
        </div>
      </div>
      <div className="flex items-center space-x-2 mt-2 sm:mt-0 sm:pl-3">
        <Badge className={`${getStatusColorClass(item.status)} text-xs`}>{getStatusLabel(item.status)}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações do Procedimento</DropdownMenuLabel>
            {item.status === 'agendado' && (<DropdownMenuItem onClick={() => handleAction('start', item.id)}>Iniciar</DropdownMenuItem>)}
            {item.status === 'in_progress' && (<DropdownMenuItem onClick={() => handleAction('complete', item.id)}>Concluir</DropdownMenuItem>)}
            {(item.status === 'agendado' || item.status === 'in_progress') && (<DropdownMenuItem onClick={() => handleAction('cancel', item.id)} className="text-destructive focus:text-destructive">Cancelar</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <Card className="card-hover">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-semibold text-foreground flex items-center">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2 text-success-foreground" />
            Procedimentos Agendados
          </CardTitle>
        </div>
        {fullView && (
          <div className="flex flex-col md:flex-row items-center gap-2 md:space-x-4 mt-3 md:mt-4">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar procedimentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 py-2 w-full md:w-auto bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Todos Status</option>
              <option value="completed">Concluídos</option>
              <option value="in_progress">Em Andamento</option>
              <option value="agendado">Agendados</option>
              <option value="pending">Pendentes</option>
              <option value="cancelled">Cancelados</option>
              <option value="aborted">Abortados</option>
            </select>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {filteredProcedures.length > 0 ? (
            // CORREÇÃO DA LÓGICA DE RENDERIZAÇÃO
            (viewMode === 'week' || viewMode === 'month') && fullView ? (
              sortedDates.map(date => (
                <div key={date} className="space-y-3 pt-3 first:pt-0">
                  <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2 capitalize">{date}</h4>
                  {groupedProcedures[date].map(renderProcedureItem)}
                </div>
              ))
            ) : (
              filteredProcedures
                .slice(0, !fullView ? 5 : undefined)
                .map(renderProcedureItem)
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum procedimento agendado para o período.</p>
            </div>
          )}
          {!fullView && initialProcedures.length > 5 && (
            <div className="text-center pt-3">
              <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10" onClick={onViewAllClick}>
                Ver todos os procedimentos
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
// components/financial-procedures-history.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, TrendingUp, DollarSign, FilterX, TrendingDown } from "lucide-react"

// --- CORREÇÃO 1: Interface atualizada para corresponder à API ---
interface ProcedureRecord {
  id: string;
  dateFull: string;       // Alterado de 'date' para 'dateFull'
  patient: string;        // Alterado de 'patientName' para 'patient'
  procedure: string;      // Alterado de 'procedureName' para 'procedure'
  category: string;
  status: "completed" | "pending" | "cancelled" | "in_progress" | "aborted" | "agendado";
  value: number;
  cost: number;
  profit: number;
  margin: number;
  paymentMethod?: string;
  paymentStatus?: "paid" | "pending" | "overdue" | "waived";
  notes?: string;
}

interface FinancialProceduresHistoryProps {
  period: string;
}

export function FinancialProceduresHistory({ period }: FinancialProceduresHistoryProps) {
  const [records, setRecords] = useState<ProcedureRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        period,
        search: searchTerm,
        category: filterCategory,
        status: filterStatus,
      });
      // A API chamada aqui agora está correta.
      const response = await fetch(`/api/procedures/performed?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar histórico de procedimentos');
      }
      const data = await response.json();
      // O frontend espera `data.procedures` conforme a API que você criou.
      setRecords(data.procedures || []);

      if (data.procedures) {
        const categories = Array.from(new Set(data.procedures.map((r: ProcedureRecord) => r.category)));
        setUniqueCategories(categories as string[]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao buscar histórico.");
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [period, searchTerm, filterCategory, filterStatus]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getStatusBadge = (status: ProcedureRecord['status']) => {
    switch (status) {
      case "completed": return <Badge className="bg-success-muted text-success-foreground border-success-foreground/30">Concluído</Badge>;
      case "pending": return <Badge className="bg-warning-muted text-warning-foreground border-warning-foreground/30">Pendente</Badge>;
      case "cancelled": return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Cancelado</Badge>;
      case "in_progress": return <Badge className="bg-info-muted text-info-foreground border-info-foreground/30">Em Progresso</Badge>;
      case "aborted": return <Badge className="bg-destructive text-destructive-foreground">Abortado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status?: ProcedureRecord['paymentStatus']) => {
    if (!status) return null;
    switch (status) {
      case "paid": return <Badge className="bg-success-muted text-success-foreground border-success-foreground/30">Pago</Badge>;
      case "pending": return <Badge className="bg-warning-muted text-warning-foreground border-warning-foreground/30">Pendente</Badge>;
      case "overdue": return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Vencido</Badge>;
      case "waived": return <Badge variant="outline" className="text-muted-foreground">Isento</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="card-hover col-span-1 lg:col-span-2">
      <CardHeader className="pb-4 pt-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <CardTitle className="text-base md:text-lg font-semibold text-foreground flex items-center">
            <DollarSign className="w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
            Histórico Financeiro de Procedimentos
          </CardTitle>
          <Button variant="outline" size="sm" className="h-9 border-input text-foreground hover:bg-accent">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Exportar CSV
          </Button>
        </div>
        <div className="mt-3 md:mt-4 flex flex-col md:flex-row gap-2 md:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por paciente ou procedimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 text-sm w-full md:w-[180px]">
              <SelectValue placeholder="Status do Proc." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
               <SelectItem value="aborted">Abortado</SelectItem>
            </SelectContent>
          </Select>
           <Button variant="ghost" size="icon" onClick={() => {setSearchTerm(''); setFilterCategory('all'); setFilterStatus('all');}} className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Limpar filtros">
            <FilterX className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Carregando histórico...</div>
        ) : error ? (
          <div className="text-center py-10 text-destructive">{error}</div>
        ) : records.length === 0 ? (
           <div className="text-center py-10 text-muted-foreground">Nenhum registro encontrado para os filtros aplicados.</div>
        ) : (
          <div className="overflow-x-auto max-h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor (R$)</TableHead>
                  <TableHead className="text-right">Custo (R$)</TableHead>
                  <TableHead className="text-right">Lucro (R$)</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* --- CORREÇÃO 2: Renderização atualizada para usar os nomes corretos --- */}
                {records.map((record, index) => (
                  <TableRow key={record.id || index} className="hover:bg-accent/50">
                    <TableCell className="whitespace-nowrap">{new Date(record.dateFull).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                    <TableCell>{record.patient}</TableCell>
                    <TableCell>{record.procedure}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-right font-medium">{record.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right text-destructive/80">{record.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-semibold text-success-foreground">{record.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">
                        <div className={`flex items-center justify-end gap-1 ${record.margin >= 50 ? "text-success-foreground" : record.margin >= 25 ? "text-warning-foreground" : "text-destructive"}`}>
                            {record.margin >= 50 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                            {record.margin.toFixed(1)}%
                        </div>
                    </TableCell>
                    <TableCell>{getPaymentStatusBadge(record.paymentStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
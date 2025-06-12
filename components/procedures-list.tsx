"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

// Interface do catálogo vinda do FinancialDashboard ou types/index.ts
export interface ProcedureCatalogItemCalculated {
  id: string;
  name: string;
  category: string;
  defaultPrice: number;
  defaultCost: number;
  profit: number; // Calculado
  margin: number; // Calculado
  // Os campos abaixo seriam para dados agregados de procedures_performed
  // Se não disponíveis do catalog API, precisarão ser buscados separadamente ou mockados para esta lista
  quantity?: number;
  totalRevenue?: number;
  totalCost?: number;
  totalProfit?: number;
}

interface ProceduresListProps {
  procedures: ProcedureCatalogItemCalculated[]; // Recebe os itens do catálogo já processados
}

const categoryColors: Record<string, string> = {
  Preventivo: "bg-success-muted text-success-foreground border-success-foreground/30",
  Restaurador: "bg-info-muted text-info-foreground border-info-foreground/30",
  Endodontia: "bg-pending-muted text-pending-foreground border-pending-foreground/30", // Usando 'pending' como exemplo
  Cirurgia: "bg-destructive/20 text-destructive border-destructive/30",
  Estético: "bg-warning-muted text-warning-foreground border-warning-foreground/30",
  Diagnóstico: "bg-muted text-muted-foreground border-border",
  Protético: "bg-primary/10 text-primary border-primary/30",
};

export function ProceduresList({ procedures }: ProceduresListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof ProcedureCatalogItemCalculated | 'totalProfit' | 'quantity'>("totalProfit"); // Adicionado totalProfit e quantity
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredAndSortedProcedures = procedures
    .filter(
      (procedure) =>
        procedure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        procedure.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy as keyof ProcedureCatalogItemCalculated];
      let bValue = b[sortBy as keyof ProcedureCatalogItemCalculated];

      // Tratar casos onde o valor pode ser undefined ou não numérico para o sort
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else {
        aValue = typeof aValue === 'number' ? aValue : -Infinity; // Default para ordenação
        bValue = typeof bValue === 'number' ? bValue : -Infinity;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (column: keyof ProcedureCatalogItemCalculated | 'totalProfit' | 'quantity') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="card-hover">
        <CardHeader className="pb-3 pt-4 px-4 md:px-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <CardTitle className="text-base md:text-lg">Catálogo e Performance de Procedimentos</CardTitle>
             {/* O botão de gerenciar preços pode abrir um modal específico */}
            {/* <Button size="sm" variant="outline" className="h-9 border-input text-foreground hover:bg-accent">
              <Edit className="w-3.5 h-3.5 mr-1.5" /> Gerenciar Preços
            </Button> */}
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 md:px-5">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar procedimentos ou categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-accent/50" onClick={() => handleSort("name")}>
                    Procedimento {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-accent/50" onClick={() => handleSort("defaultPrice")}>
                    Preço Padrão {sortBy === "defaultPrice" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-accent/50" onClick={() => handleSort("defaultCost")}>
                    Custo Padrão {sortBy === "defaultCost" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-accent/50" onClick={() => handleSort("profit")}>
                    Lucro Unit. {sortBy === "profit" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-accent/50" onClick={() => handleSort("margin")}>
                    Margem {sortBy === "margin" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  {/* As colunas abaixo dependem de dados agregados de procedures_performed */}
                  {/* Se não vierem na prop `procedures`, esconda ou mostre N/A */}
                  {procedures.some(p => p.quantity !== undefined) && (
                    <TableHead className="text-right cursor-pointer hover:bg-accent/50" onClick={() => handleSort("quantity")}>
                      Qtd (Período) {sortBy === "quantity" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                  )}
                   {procedures.some(p => p.totalProfit !== undefined) && (
                    <TableHead className="text-right cursor-pointer hover:bg-accent/50" onClick={() => handleSort("totalProfit")}>
                      Lucro Total (Per.) {sortBy === "totalProfit" && (sortOrder === "asc" ? "↑" : "↓")}
                    </TableHead>
                  )}
                  {/* <TableHead>Ações</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedProcedures.map((procedure) => (
                  <TableRow key={procedure.id} className="hover:bg-accent/30">
                    <TableCell className="font-medium text-foreground">{procedure.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${categoryColors[procedure.category] || "bg-muted text-muted-foreground border-border"} text-xs`}>
                        {procedure.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {procedure.defaultPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-destructive/80">
                      R$ {(procedure.defaultCost || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-medium text-success-foreground">
                      R$ {procedure.profit?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {procedure.margin === undefined ? 'N/A' : (
                            <>
                            {procedure.margin >= 70 ? <TrendingUp className="w-3.5 h-3.5 text-success-foreground" /> :
                             procedure.margin >= 50 ? <TrendingUp className="w-3.5 h-3.5 text-warning-foreground" /> :
                                                      <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                            <span className={procedure.margin >= 70 ? "text-success-foreground" : procedure.margin >= 50 ? "text-warning-foreground" : "text-destructive"}>
                                {procedure.margin.toFixed(1)}%
                            </span>
                            </>
                        )}
                      </div>
                    </TableCell>
                     {procedures.some(p => p.quantity !== undefined) && (
                        <TableCell className="text-right">{procedure.quantity !== undefined ? procedure.quantity : 'N/A'}</TableCell>
                     )}
                     {procedures.some(p => p.totalProfit !== undefined) && (
                        <TableCell className="text-right font-medium text-primary">
                            {procedure.totalProfit !== undefined ? `R$ ${procedure.totalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : 'N/A'}
                        </TableCell>
                     )}
                    {/* <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredAndSortedProcedures.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">Nenhum procedimento encontrado.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
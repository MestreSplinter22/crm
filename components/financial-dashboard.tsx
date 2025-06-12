// components/financial-dashboard.tsx
"use client"

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, DollarSign, Calculator, Download, BarChart3, PieChart } from "lucide-react" // Adicionado PieChart
import { ProceduresList } from "@/components/procedures-list"
import { RevenueChart } from "@/components/revenue-chart"
import { ProfitabilityChart, ProcedureCatalogItemCalculated } from "@/components/profitability-chart" // Importa a interface

interface MetricValues {
  faturamento: number;
  gastos: number;
  lucro: number;
  procedimentosRealizados: number;
}

interface FinancialDashboardProps {
  period: string;
  metrics: MetricValues | null;
}

// Interface para o que a API /api/procedures/catalog retorna
interface ProcedureCatalogAPIBase {
  id: string;
  name: string;
  category: string;
  defaultPrice: number;
  defaultCost?: number;
  defaultDurationMinutes?: number;
  isActive: boolean;
}


export function FinancialDashboard({ period, metrics: initialMetrics }: FinancialDashboardProps) {
  const [activeTab, setActiveTab] = useState("procedures");
  const [procedureCatalog, setProcedureCatalog] = useState<ProcedureCatalogItemCalculated[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const fetchProcedureData = useCallback(async () => {
    setIsLoadingCatalog(true);
    setCatalogError(null);
    try {
      // 1. Buscar o catálogo base
      const catalogResponse = await fetch('/api/procedures/catalog');
      if (!catalogResponse.ok) {
        const err = await catalogResponse.json();
        throw new Error(err.error || 'Falha ao buscar catálogo de procedimentos');
      }
      const catalogData: ProcedureCatalogAPIBase[] = await catalogResponse.json();

      // 2. (Opcional, mas ideal para ProfitabilityChart) Buscar dados agregados de performance por procedimento
      // Esta API precisaria ser criada: /api/procedures/performed/aggregated-by-catalog?period=${period}
      // Ela retornaria algo como: [{ procedure_catalog_id: "1", quantity: 20, totalRevenue: 3000, totalCost: 900, totalProfit: 2100 }, ...]
      // Por agora, vamos simular essa agregação no frontend se a API não existir, ou passar apenas dados do catálogo.

      // Calcular profit e margin para cada item do catálogo e adicionar mocks para dados agregados
      const catalogWithCalculations = catalogData.map(item => {
        const profit = item.defaultPrice - (item.defaultCost || 0);
        const margin = item.defaultPrice > 0 ? (profit / item.defaultPrice) * 100 : 0;
        // Mock de dados agregados para ProfitabilityChart se API específica não for chamada
        const mockQuantity = Math.floor(Math.random() * 25) + 5;
        return {
          ...item,
          profit,
          margin,
          quantity: mockQuantity, // Dado que viria da API de agregação
          totalRevenue: item.defaultPrice * mockQuantity,
          totalCost: (item.defaultCost || 0) * mockQuantity,
          totalProfit: profit * mockQuantity,
        };
      });
      setProcedureCatalog(catalogWithCalculations as ProcedureCatalogItemCalculated[]);

    } catch (error) {
      console.error("Error fetching procedure data:", error);
      setCatalogError(error instanceof Error ? error.message : "Erro desconhecido.");
      setProcedureCatalog([]);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, [period]); // Adicionado period como dependência se a API de agregação o usar

  useEffect(() => {
    // Fetch data quando a aba relevante estiver ativa ou quando o período mudar
    // if (activeTab === 'procedures' || activeTab === 'profitability') {
    fetchProcedureData();
    // }
  }, [activeTab, period, fetchProcedureData]);


  if (!initialMetrics) {
    return <div className="flex justify-center items-center h-64"><p>Carregando dados financeiros...</p></div>;
  }

  const marginPercentage = initialMetrics.faturamento > 0 ? ((initialMetrics.lucro / initialMetrics.faturamento) * 100).toFixed(1) : "0.0";
  const averageTicket = initialMetrics.procedimentosRealizados > 0 ? (initialMetrics.faturamento / initialMetrics.procedimentosRealizados) : 0;
  const averageCost = initialMetrics.procedimentosRealizados > 0 ? (initialMetrics.gastos / initialMetrics.procedimentosRealizados) : 0;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard Financeiro</h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Análise de faturamento, custos e lucratividade ({period === 'today' ? 'Hoje' : period === 'week' ? 'Esta Semana' : 'Este Mês'}).</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 border-input text-foreground hover:bg-accent">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="card-hover bg-gradient-to-br from-success-muted via-card to-card border-success-foreground/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-foreground">
              R$ {initialMetrics.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">{initialMetrics.procedimentosRealizados} procedimentos</p>
          </CardContent>
        </Card>
         <Card className="card-hover bg-gradient-to-br from-destructive/10 via-card to-card border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Custos Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {initialMetrics.gastos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {initialMetrics.faturamento > 0 ? ((initialMetrics.gastos / initialMetrics.faturamento) * 100).toFixed(1) : 0}% do faturamento
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {initialMetrics.lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Margem de {marginPercentage}%</p>
          </CardContent>
        </Card>
        <Card className="card-hover bg-gradient-to-br from-info-muted via-card to-card border-info-foreground/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Ticket Médio</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info-foreground">
              R$ {averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Custo médio: R$ {averageCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="procedures" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="procedures" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">Procedimentos</TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">Receita</TabsTrigger>
          <TabsTrigger value="profitability" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">Lucratividade</TabsTrigger>
        </TabsList>

        <TabsContent value="procedures">
          {isLoadingCatalog ? <div className="text-center py-10">Carregando catálogo de procedimentos...</div> : catalogError ? <div className="text-center py-10 text-destructive">{catalogError}</div> : <ProceduresList procedures={procedureCatalog} />}
        </TabsContent>
        <TabsContent value="revenue">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><BarChart3 className="w-5 h-5 mr-2"/>Evolução da Receita</CardTitle>
                    <CardDescription>Faturamento, custos e lucro ao longo do período de {period === "today" ? "hoje" : period === "week" ? "esta semana" : "este mês"}.</CardDescription>
                </CardHeader>
                <CardContent className="h-[450px]"> {/* Aumentada altura para melhor visualização */}
                    <RevenueChart period={period as "month" | "week" | "today"} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="profitability">
            {isLoadingCatalog ? <div className="text-center py-10">Carregando dados de lucratividade...</div> : catalogError ? <div className="text-center py-10 text-destructive">{catalogError}</div> : <ProfitabilityChart procedures={procedureCatalog} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { NextRequest, NextResponse } from "next/server"; // <--- CORREÇÃO AQUI
import { query } from '@/lib/db';

// Helper para aplicar filtros de data em diferentes colunas
function getDateFilter(
    baseColumnName: string,
    period: string,
    startDateParam?: string | null,
    endDateParam?: string | null
): { sql: string, params: any[] } {
    let dateFilterSql = "";
    let dateParams: any[] = [];
    const now = new Date();

    if (startDateParam && endDateParam) {
        dateFilterSql = ` AND DATE(${baseColumnName}) BETWEEN ? AND ?`;
        dateParams = [startDateParam, endDateParam];
    } else {
        switch (period) {
            case "today":
                dateFilterSql = ` AND DATE(${baseColumnName}) = CURDATE()`;
                break;
            case "week":
                const dayOfWeek = now.getDay();
                const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
                const weekStart = new Date(now.setDate(now.getDate() + diffToMonday)).toISOString().slice(0, 10);
                const currentNow = new Date(); // Reset now as setDate modifies it
                const weekEnd = new Date(currentNow.setDate(currentNow.getDate() + diffToMonday + 6)).toISOString().slice(0, 10); // Sunday of that week
                dateFilterSql = ` AND DATE(${baseColumnName}) BETWEEN ? AND ?`;
                dateParams = [weekStart, weekEnd];
                break;
            case "month":
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
                dateFilterSql = ` AND DATE(${baseColumnName}) BETWEEN ? AND ?`;
                dateParams = [monthStart, monthEnd];
                break;
        }
    }
    return { sql: dateFilterSql, params: dateParams };
}


async function getFunnelCount(stage: string, dateFilter: {sql: string, params: any[]}): Promise<number> {
    const sql = `SELECT COUNT(DISTINCT id) as count FROM patients WHERE funnel_stage = ? ${dateFilter.sql.replace('last_contact_at', 'created_at')}`; // Use patient creation for funnel start
    const result = await query(sql, [stage, ...dateFilter.params]);
    return result[0]?.count || 0;
}

async function getFinancialSum(column: 'price_charged' | 'cost_incurred', dateFilter: {sql: string, params: any[]}): Promise<number> {
    const sql = `SELECT SUM(${column}) as total FROM procedures_performed WHERE status = 'completed' ${dateFilter.sql}`;
    const result = await query(sql, dateFilter.params);
    return parseFloat(result[0]?.total || 0);
}

async function getProceduresCount(dateFilter: {sql: string, params: any[]}): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM procedures_performed WHERE status = 'completed' ${dateFilter.sql}`;
    const result = await query(sql, dateFilter.params);
    return result[0]?.count || 0;
}

async function getAppointmentCount(status: string | null, dateFilter: {sql: string, params: any[]}): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM appointments WHERE 1=1 ${dateFilter.sql}`;
    const queryParams = [...dateFilter.params];
    if (status) {
        sql += " AND status = ?";
        queryParams.push(status);
    }
    const result = await query(sql, queryParams);
    return result[0]?.count || 0;
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Usar uma coluna base para o período do funil (ex: data de criação do paciente para 'atendimento_iniciado')
    const funnelDateFilter = getDateFilter('created_at', period, startDateParam, endDateParam);
    // Usar outra coluna para métricas financeiras e de procedimento (ex: data do procedimento)
    const financialDateFilter = getDateFilter('procedure_date', period, startDateParam, endDateParam);
    // E outra para agendamentos
    const appointmentDateFilter = getDateFilter('DATE(appointment_datetime)', period, startDateParam, endDateParam);


    const metrics = {
      atendimentosIniciados: await getFunnelCount('atendimento_iniciado', funnelDateFilter),
      duvidasSanadas: await getFunnelCount('duvida_sanada', funnelDateFilter),
      procedimentosOferecidos: await getFunnelCount('procedimento_oferecido', funnelDateFilter),
      agendamentosRealizados: await getAppointmentCount(null, appointmentDateFilter),
      confirmacoesAgendamento: await getAppointmentCount('confirmed', appointmentDateFilter),
      comparecimentos: await getAppointmentCount('completed', appointmentDateFilter), // Assumindo 'completed' significa compareceu
      procedimentosRealizados: await getProceduresCount(financialDateFilter),
      faturamento: await getFinancialSum('price_charged', financialDateFilter),
      gastos: await getFinancialSum('cost_incurred', financialDateFilter),
      get lucro() { return this.faturamento - this.gastos; },
    };

    const safeDiv = (numerator: number, denominator: number): number => (denominator > 0 ? (numerator / denominator) * 100 : 0);

    const conversionRates = {
      duvidasSanadas: safeDiv(metrics.duvidasSanadas, metrics.atendimentosIniciados).toFixed(1),
      procedimentosOferecidos: safeDiv(metrics.procedimentosOferecidos, metrics.duvidasSanadas).toFixed(1),
      agendamentos: safeDiv(metrics.agendamentosRealizados, metrics.procedimentosOferecidos).toFixed(1),
      confirmacoes: safeDiv(metrics.confirmacoesAgendamento, metrics.agendamentosRealizados).toFixed(1),
      comparecimentos: safeDiv(metrics.comparecimentos, metrics.confirmacoesAgendamento).toFixed(1),
      procedimentos: safeDiv(metrics.procedimentosRealizados, metrics.comparecimentos).toFixed(1),
    };

    const financialData = {
      roi: safeDiv(metrics.lucro, metrics.gastos).toFixed(1),
      ticketMedio: (metrics.procedimentosRealizados > 0 ? metrics.faturamento / metrics.procedimentosRealizados : 0).toFixed(2),
      custoMedio: (metrics.procedimentosRealizados > 0 ? metrics.gastos / metrics.procedimentosRealizados : 0).toFixed(2),
      margemLucro: safeDiv(metrics.lucro, metrics.faturamento).toFixed(1),
    };

    return NextResponse.json({
      period: startDateParam && endDateParam ? `${startDateParam} - ${endDateParam}` : period,
      metrics,
      conversionRates,
      financialMetrics: {
        ...financialData,
        ticketMedio: parseFloat(financialData.ticketMedio),
        custoMedio: parseFloat(financialData.custoMedio),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("API GET /api/metrics Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao buscar métricas.", details: errorMessage }, { status: 500 });
  }
}
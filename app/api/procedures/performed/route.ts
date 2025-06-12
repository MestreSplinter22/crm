import { NextRequest, NextResponse } from "next/server";
import { query } from '@/lib/db';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// Interface para o que o frontend espera (ProcedureScheduleItem)
interface ProcedureRecord {
  id: string;
  time: string;
  dateFull: string;
  patient: string;
  procedure: string;
  status: "completed" | "pending" | "cancelled" | "in_progress" | "aborted" | "agendado";
  duration: number;
  cost?:number;
  value?: number;
  profit?: number;
  margin?: number;
  paymentMethod: any | undefined;
  paymentStatus: any | undefined;
  notes?: string;
}

// Mapeia o resultado do banco de dados para o formato da API
function mapDbToProcedureRecord(dbRow: any): ProcedureRecord {
    const price = parseFloat(dbRow.price_charged || 0);
    const cost = parseFloat(dbRow.cost_incurred || 0);
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    
    const appointmentTime = dbRow.appointment_time ? dbRow.appointment_time.substring(0, 5) : 'N/A';

    return {
        id: dbRow.id.toString(),
        time: appointmentTime,
        dateFull: new Date(dbRow.procedure_date).toISOString(),
        patient: dbRow.patient_name,         // CORREÇÃO: Mapeado de patient_name
        procedure: dbRow.procedure_name,   // CORREÇÃO: Mapeado de procedure_name
        status: dbRow.status,
        duration: dbRow.appointment_duration || 0,
        value: price,
        cost: cost,
        profit: profit,
        margin: parseFloat(margin.toFixed(1)),
        paymentMethod: dbRow.payment_method || undefined,
        paymentStatus: dbRow.payment_status || undefined,
        notes: dbRow.notes || undefined,
    };
}

// Função auxiliar para filtros de data
function buildDateFilter(columnName: string, viewMode: string, dateParam: string): { sql: string, params: any[] } {
    let dateFilterSql = "";
    const params: any[] = [];
    const targetDate = new Date(dateParam + 'T00:00:00Z');

    if (viewMode === 'day') {
        dateFilterSql = ` AND DATE(${columnName}) = ?`;
        params.push(dateParam);
    } else if (viewMode === 'week') {
        const startOfWeekDate = startOfWeek(targetDate, { weekStartsOn: 1 });
        const endOfWeekDate = endOfWeek(targetDate, { weekStartsOn: 1 });
        dateFilterSql = ` AND DATE(${columnName}) BETWEEN ? AND ?`;
        params.push(startOfWeekDate.toISOString().slice(0, 10), endOfWeekDate.toISOString().slice(0, 10));
    } else if (viewMode === 'month') {
        const startOfMonthDate = startOfMonth(targetDate);
        const endOfMonthDate = endOfMonth(targetDate);
        dateFilterSql = ` AND DATE(${columnName}) BETWEEN ? AND ?`;
        params.push(startOfMonthDate.toISOString().slice(0, 10), endOfMonthDate.toISOString().slice(0, 10));
    }
    return { sql: dateFilterSql, params };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const categoryFilter = searchParams.get("category");
    const statusFilter = searchParams.get("status");
    const dateParam = searchParams.get("date");
    const viewMode = searchParams.get("viewMode");

    let sql = `
      SELECT
        pp.id, pp.procedure_date, pat.full_name as patient_name,
        pc.name as procedure_name, pc.category, pp.status,
        pp.price_charged, pp.cost_incurred, pp.notes,
        pp.payment_method, pp.payment_status,
        TIME(apt.appointment_datetime) as appointment_time,
        apt.duration_minutes as appointment_duration
      FROM procedures_performed pp
      JOIN patients pat ON pp.patient_id = pat.id
      JOIN procedure_catalog pc ON pp.procedure_catalog_id = pc.id
      LEFT JOIN appointments apt ON pp.appointment_id = apt.id
      WHERE 1=1
    `;
    let queryParams: any[] = [];
    
    if (dateParam && viewMode) {
      const { sql: dateFilterSql, params: dateParams } = buildDateFilter('pp.procedure_date', viewMode, dateParam);
      sql += dateFilterSql;
      queryParams.push(...dateParams);
    }

    if (searchTerm) {
      sql += " AND (pat.full_name LIKE ? OR pc.name LIKE ?)";
      queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }
    if (categoryFilter && categoryFilter !== "all") {
      sql += " AND pc.category = ?";
      queryParams.push(categoryFilter);
    }
    if (statusFilter && statusFilter !== "all") {
      sql += " AND pp.status = ?";
      queryParams.push(statusFilter);
    }

    sql += " ORDER BY pp.procedure_date ASC, apt.appointment_datetime ASC, pat.full_name ASC LIMIT 100";

    const dbResults = await query(sql, queryParams);
    const procedures: ProcedureRecord[] = dbResults.map(mapDbToProcedureRecord);

    return NextResponse.json({ procedures });
  } catch (error) {
    console.error("API GET /api/procedures/performed Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: "Erro ao buscar histórico de procedimentos.", details: errorMessage }, { status: 500 });
  }
}
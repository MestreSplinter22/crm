// app/api/activity-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Garante que o limite é um número inteiro e seguro.
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));

    // TODO: Adicionar filtro por user_id quando a autenticação estiver implementada

    // CORREÇÃO: O 'LIMIT' não usa um placeholder '?'. O valor é inserido diretamente na string.
    // A validação com parseInt acima garante que não há risco de SQL Injection.
    const logsSql = `
      SELECT
        we.id, we.event_type, we.event_timestamp, we.patient_id, we.email_at_event,
        p.full_name as patient_name
      FROM webhook_events we
      LEFT JOIN patients p ON we.patient_id = p.id
      ORDER BY we.event_timestamp DESC
      LIMIT ${limit} 
    `;

    const logsFromDb = await query(logsSql); // Não há mais parâmetros aqui

    const activities = logsFromDb.map((log: any) => ({
      id: log.id.toString(),
      type: "webhook_event",
      description: `Evento '${log.event_type}' para ${log.patient_name || log.email_at_event || 'paciente desconhecido'}.`,
      timestamp: new Date(log.event_timestamp).toISOString(),
      patientName: log.patient_name,
      eventType: log.event_type,
    }));

    return NextResponse.json(activities);
  } catch (error) {
    console.error("API GET /api/activity-logs Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: "Erro ao buscar logs de atividade.", details: errorMessage }, { status: 500 });
  }
}
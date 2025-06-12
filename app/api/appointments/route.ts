import { NextRequest, NextResponse } from "next/server"; // <--- CORREÇÃO AQUI
import { query, execute } from '@/lib/db';

interface AppointmentListItem {
  id: string;
  time: string; // HH:mm
  dateFull: string; // ISO YYYY-MM-DDTHH:mm:ssZ
  patient: string;
  phone: string;
  type: string;
  status: string;
  duration: number;
  notes?: string;
}

interface CreateAppointmentPayload {
  patientId: string | number;
  appointmentDatetime: string; // ISO string YYYY-MM-DDTHH:mm:ssZ
  durationMinutes?: number;
  appointmentType: string;
  notes?: string;
  status?: string;
  valueCharged?: number;
  userId?: string | number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const viewMode = searchParams.get("viewMode") || "day";
    const patientIdFilter = searchParams.get("patientId");
    const statusFilter = searchParams.get("status");

    let sql = `
      SELECT
        a.id, a.appointment_datetime, a.duration_minutes, a.appointment_type,
        a.status, a.notes, p.full_name as patient_name, p.phone_number as patient_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (dateParam) {
      const targetDate = new Date(dateParam); // Assume dateParam é YYYY-MM-DD
      if (viewMode === 'day') {
        sql += " AND DATE(a.appointment_datetime) = ?";
        params.push(dateParam);
      } else if (viewMode === 'week') {
        const dayOfWeek = targetDate.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(targetDate);
        weekStart.setDate(targetDate.getDate() + diffToMonday);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        sql += " AND DATE(a.appointment_datetime) BETWEEN ? AND ?";
        params.push(weekStart.toISOString().slice(0,10), weekEnd.toISOString().slice(0,10));
      } else if (viewMode === 'month') {
        sql += " AND YEAR(a.appointment_datetime) = ? AND MONTH(a.appointment_datetime) = ?";
        params.push(targetDate.getFullYear(), targetDate.getMonth() + 1);
      }
    }

    if (patientIdFilter) {
      sql += " AND a.patient_id = ?";
      params.push(patientIdFilter);
    }
    if (statusFilter && statusFilter !== "all") {
      sql += " AND a.status = ?";
      params.push(statusFilter);
    }

    sql += " ORDER BY a.appointment_datetime ASC";

    const dbResults: any[] = await query(sql, params);

    const appointments: AppointmentListItem[] = dbResults.map(row => ({
      id: row.id.toString(),
      time: new Date(row.appointment_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }), // Ajuste timezone conforme sua DB
      dateFull: new Date(row.appointment_datetime).toISOString(),
      patient: row.patient_name,
      phone: row.patient_phone,
      type: row.appointment_type,
      status: row.status,
      duration: row.duration_minutes,
      notes: row.notes,
    }));

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("API GET /api/appointments Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao buscar agendamentos.", details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAppointmentPayload = await request.json();
    const {
        patientId, appointmentDatetime, durationMinutes = 30,
        appointmentType, notes, status = 'agendado', valueCharged, userId
    } = body;

    if (!patientId || !appointmentDatetime || !appointmentType) {
      return NextResponse.json({ error: "Dados insuficientes (paciente, data/hora, tipo)." }, { status: 400 });
    }

    const appointmentDate = new Date(appointmentDatetime); // Assume ISO string
    const mysqlDatetime = appointmentDate.toISOString().slice(0, 19).replace('T', ' ');


    const sql = `
      INSERT INTO appointments
        (patient_id, user_id, appointment_datetime, duration_minutes, appointment_type, status, notes, value_charged)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const paramsToDb = [
        patientId, userId || null, mysqlDatetime, durationMinutes,
        appointmentType, status, notes, valueCharged || null
    ];

    const result = await execute(sql, paramsToDb);

    if (!result.insertId) {
      throw new Error("Falha ao criar agendamento.");
    }

    const newAppointmentResult = await query(
       `SELECT a.id, a.appointment_datetime, a.duration_minutes, a.appointment_type, a.status, a.notes, p.full_name as patient_name, p.phone_number as patient_phone
        FROM appointments a JOIN patients p ON a.patient_id = p.id
        WHERE a.id = ?`,
       [result.insertId]
    );
    const newDbApp = newAppointmentResult[0];

    const responseAppointment: AppointmentListItem = {
        id: newDbApp.id.toString(),
        time: new Date(newDbApp.appointment_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
        dateFull: new Date(newDbApp.appointment_datetime).toISOString(),
        patient: newDbApp.patient_name,
        phone: newDbApp.patient_phone,
        type: newDbApp.appointment_type,
        status: newDbApp.status,
        duration: newDbApp.duration_minutes,
        notes: newDbApp.notes,
    };

    return NextResponse.json({ success: true, appointment: responseAppointment }, { status: 201 });
  } catch (error) {
    console.error("API POST /api/appointments Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao criar agendamento.", details: errorMessage }, { status: 500 });
  }
}
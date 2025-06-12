import { NextRequest, NextResponse } from "next/server"; // <--- CORREÇÃO AQUI
import { query, execute } from '@/lib/db';

interface AppointmentListItem {
  id: string;
  time: string;
  dateFull: string;
  patient: string;
  phone: string;
  type: string;
  status: string;
  duration: number;
  notes?: string;
  valueCharged?: number;
}
interface AppointmentDetail extends AppointmentListItem {}

interface UpdateAppointmentPayload {
    appointmentDatetime?: string;
    durationMinutes?: number;
    appointmentType?: string;
    status?: string;
    notes?: string;
    valueCharged?: number;
    userId?: string | number;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const appointmentId = params.id;
        const result: any[] = await query(
           `SELECT a.id, a.appointment_datetime, a.duration_minutes, a.appointment_type, a.status, a.notes, a.value_charged,
                   p.full_name as patient_name, p.phone_number as patient_phone
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            WHERE a.id = ?`,
            [appointmentId]
        );

        if (!result || result.length === 0) {
            return NextResponse.json({ error: "Agendamento não encontrado"}, { status: 404 });
        }
        const dbAppointment = result[0];
        const appointmentResponse: AppointmentDetail = {
            id: dbAppointment.id.toString(),
            time: new Date(dbAppointment.appointment_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
            dateFull: new Date(dbAppointment.appointment_datetime).toISOString(),
            patient: dbAppointment.patient_name,
            phone: dbAppointment.patient_phone,
            type: dbAppointment.appointment_type,
            status: dbAppointment.status,
            duration: dbAppointment.duration_minutes,
            notes: dbAppointment.notes,
            valueCharged: parseFloat(dbAppointment.value_charged || 0),
        };
        return NextResponse.json(appointmentResponse);
    } catch (error) {
        console.error(`API GET /api/appointments/${params.id} Error:`, error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
        return NextResponse.json({ error: "Erro ao buscar agendamento.", details: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const appointmentId = params.id;
    const body: UpdateAppointmentPayload = await request.json();

    const allowedUpdates: Record<string, string> = {
        appointmentDatetime: "appointment_datetime", durationMinutes: "duration_minutes",
        appointmentType: "appointment_type", status: "status", notes: "notes",
        valueCharged: "value_charged", userId: "user_id"
    };

    const updates: string[] = [];
    const values: any[] = [];

    for (const key in body) {
      if (allowedUpdates[key as keyof UpdateAppointmentPayload] && body[key as keyof UpdateAppointmentPayload] !== undefined && body[key as keyof UpdateAppointmentPayload] !== null) {
        updates.push(`${allowedUpdates[key]} = ?`);
        let value = body[key as keyof UpdateAppointmentPayload];
        if (key === 'appointmentDatetime' && value) {
            // MySQL DATETIME format: 'YYYY-MM-DD HH:MM:SS'
            value = new Date(value).toISOString().slice(0, 19).replace('T', ' ');
        }
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualização fornecido." }, { status: 400 });
    }

    const sql = `UPDATE appointments SET ${updates.join(", ")} WHERE id = ?`;
    values.push(appointmentId);

    const result = await execute(sql, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Agendamento não encontrado ou nenhum dado alterado." }, { status: 404 });
    }

    const getRequest = new NextRequest(request.url, { headers: request.headers });
    return GET(getRequest, { params });

  } catch (error) {
    console.error(`API PUT /api/appointments/${params.id} Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao atualizar agendamento.", details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const appointmentId = params.id;
    const result = await execute("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [appointmentId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Agendamento cancelado com sucesso." });
  } catch (error) {
    console.error(`API DELETE /api/appointments/${params.id} Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao cancelar agendamento.", details: errorMessage }, { status: 500 });
  }
}
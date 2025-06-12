import { NextRequest, NextResponse } from "next/server"; // <--- CORREÇÃO AQUI
import { query, execute } from '@/lib/db';

// Interfaces (copiadas da resposta anterior para completude)
interface PatientAppointmentFE {
  date: string;
  time?: string;
  type: string;
  status: string;
  value?: number;
}

interface PatientProcedureFE {
  date: string;
  name: string;
  status: string;
  value: number;
  cost: number;
  profit: number;
}

interface PatientProfileResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastContact: string | null;
  funnelStage: string;
  status: string;
  avatar?: string | null;
  birthDate?: string | null;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  medicalHistory?: string | null;
  allergies?: string | null;
  medications?: string | null;
  insuranceProvider?: string | null;
  insuranceNumber?: string | null;
  preferredContact?: string | null;
  notes?: string | null;
  createdAt?: string;
  appointments: PatientAppointmentFE[];
  procedures: PatientProcedureFE[];
  totalSpent: number;
  totalProfit: number;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patientId = params.id;

    const patientDetailsResult: any[] = await query(
      `SELECT
         id, full_name, email, phone_number, birth_date,
         address_line1, city, zip_code,
         emergency_contact_name, emergency_contact_phone, medical_history, allergies, current_medications,
         insurance_provider, insurance_policy_number, preferred_contact_method, funnel_stage, status,
         avatar_url, notes, last_contact_at, created_at
       FROM patients WHERE id = ?`,
      [patientId]
    );

    if (!patientDetailsResult || patientDetailsResult.length === 0) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }
    const dbPatient = patientDetailsResult[0];

    const appointmentsResult: any[] = await query(
      `SELECT
         id, appointment_datetime, appointment_type, status, value_charged
       FROM appointments
       WHERE patient_id = ? ORDER BY appointment_datetime DESC`,
      [patientId]
    );

    const appointments: PatientAppointmentFE[] = appointmentsResult.map(app => ({
      date: new Date(app.appointment_datetime).toISOString(),
      time: new Date(app.appointment_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'}),
      type: app.appointment_type,
      status: app.status,
      value: parseFloat(app.value_charged || 0)
    }));

    const proceduresPerformedResult: any[] = await query(
      `SELECT
         pp.id, pp.procedure_date, pc.name as procedure_name, pp.status,
         pp.price_charged, pp.cost_incurred
       FROM procedures_performed pp
       JOIN procedure_catalog pc ON pp.procedure_catalog_id = pc.id
       WHERE pp.patient_id = ? ORDER BY pp.procedure_date DESC`,
      [patientId]
    );

    const procedures: PatientProcedureFE[] = proceduresPerformedResult.map(proc => ({
      date: new Date(proc.procedure_date).toISOString().split('T')[0],
      name: proc.procedure_name,
      status: proc.status,
      value: parseFloat(proc.price_charged || 0),
      cost: parseFloat(proc.cost_incurred || 0),
      profit: parseFloat(proc.price_charged || 0) - parseFloat(proc.cost_incurred || 0),
    }));

    const totalSpent = procedures.reduce((sum, p) => sum + (p.status === 'completed' || p.status === 'concluído' ? p.value : 0), 0);
    const totalProfit = procedures.reduce((sum, p) => sum + (p.status === 'completed' || p.status === 'concluído' ? p.profit : 0), 0);

    const patientResponse: PatientProfileResponse = {
      id: dbPatient.id.toString(),
      name: dbPatient.full_name,
      email: dbPatient.email,
      phone: dbPatient.phone_number,
      lastContact: dbPatient.last_contact_at ? new Date(dbPatient.last_contact_at).toISOString().split('T')[0] : null,
      funnelStage: dbPatient.funnel_stage,
      status: dbPatient.status,
      avatar: dbPatient.avatar_url,
      birthDate: dbPatient.birth_date ? new Date(dbPatient.birth_date).toISOString().split('T')[0] : null,
      address: dbPatient.address_line1,
      city: dbPatient.city,
      zipCode: dbPatient.zip_code,
      emergencyContact: dbPatient.emergency_contact_name,
      emergencyPhone: dbPatient.emergency_contact_phone,
      medicalHistory: dbPatient.medical_history,
      allergies: dbPatient.allergies,
      medications: dbPatient.current_medications,
      insuranceProvider: dbPatient.insurance_provider,
      insuranceNumber: dbPatient.insurance_policy_number,
      preferredContact: dbPatient.preferred_contact_method,
      notes: dbPatient.notes,
      createdAt: dbPatient.created_at ? new Date(dbPatient.created_at).toISOString() : undefined,
      appointments,
      procedures,
      totalSpent,
      totalProfit,
    };

    return NextResponse.json({ patient: patientResponse });
  } catch (error) {
    console.error(`API GET /api/patients/${params.id} Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao buscar detalhes do paciente.", details: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patientId = params.id;
    const body = await request.json();

    const allowedUpdates: Record<string, string> = {
      name: "full_name", email: "email", phone: "phone_number", birthDate: "birth_date",
      address: "address_line1", city: "city", zipCode: "zip_code",
      emergencyContact: "emergency_contact_name", emergencyPhone: "emergency_contact_phone",
      medicalHistory: "medical_history", allergies: "allergies", medications: "current_medications",
      insuranceProvider: "insurance_provider", insuranceNumber: "insurance_policy_number",
      preferredContact: "preferred_contact_method", funnelStage: "funnel_stage",
      status: "status", avatar: "avatar_url", notes: "notes", lastContact: "last_contact_at" // frontend usa 'avatar' e 'lastContact'
    };

    const updates: string[] = [];
    const values: any[] = [];

    for (const key in body) {
      if (allowedUpdates[key] && body[key] !== undefined) { // Verifica se a chave é permitida e tem valor
        updates.push(`${allowedUpdates[key]} = ?`);
        let value = body[key];
        if ((key === 'birthDate' || key === 'lastContact') && value) {
            value = new Date(value).toISOString().slice(0,10); // Formato YYYY-MM-DD
        }
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Nenhum campo válido para atualização fornecido." }, { status: 400 });
    }

    const sql = `UPDATE patients SET ${updates.join(", ")} WHERE id = ?`;
    values.push(patientId);

    const result = await execute(sql, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Paciente não encontrado ou nenhum dado alterado." }, { status: 404 });
    }

    const getRequest = new NextRequest(request.url, { headers: request.headers });
    return GET(getRequest, { params });

  } catch (error) {
    console.error(`API PUT /api/patients/${params.id} Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao atualizar paciente.", details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patientId = params.id;
    const result = await execute("DELETE FROM patients WHERE id = ?", [patientId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Paciente excluído com sucesso." });
  } catch (error) {
    console.error(`API DELETE /api/patients/${params.id} Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao excluir paciente.", details: errorMessage }, { status: 500 });
  }
}
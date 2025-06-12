import { NextRequest, NextResponse } from "next/server"; // <--- CORREÇÃO AQUI
import { query, execute } from '@/lib/db';

// Interfaces (copiadas da resposta anterior para completude)
interface PatientAppointment {
  date: string;
  time?: string;
  type: string;
  status: string;
  value?: number;
}

interface PatientProcedure {
  date: string;
  name: string;
  status: string;
  value?: number;
  cost?: number;
  profit?: number;
}

interface PatientListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastContact: string | null;
  funnelStage: string;
  status: string;
  avatar?: string;
  nextAppointment?: string | null;
  totalValue?: number;
  procedures?: number; // contagem
  appointments: PatientAppointment[];
  procedureHistory: PatientProcedure[];
  totalSpent?: number;
  totalProfit?: number;
}

interface CreatePatientPayload {
  name: string;
  email: string;
  phone: string;
  birthDate?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  preferredContact?: string;
  notes?: string;
}

function mapDbRowToPatientListItem(dbRow: any): PatientListItem {
    return {
        id: dbRow.id.toString(),
        name: dbRow.full_name,
        email: dbRow.email,
        phone: dbRow.phone_number,
        lastContact: dbRow.last_contact_at ? new Date(dbRow.last_contact_at).toISOString().split('T')[0] : null,
        funnelStage: dbRow.funnel_stage,
        status: dbRow.status,
        avatar: dbRow.avatar_url,
        nextAppointment: dbRow.next_appointment_raw ? new Date(dbRow.next_appointment_raw).toISOString().split('T')[0] : null,
        totalValue: parseFloat(dbRow.total_value || 0),
        procedures: parseInt(dbRow.procedures_count || 0, 10),
        appointments: [], // A lista principal não carrega isso, o perfil individual sim.
        procedureHistory: [], // Similarmente
        totalSpent: parseFloat(dbRow.total_spent || 0),
        totalProfit: parseFloat(dbRow.total_profit || 0),
    };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const stage = searchParams.get("stage");
    const period = searchParams.get("period") || "all";

    let sql = `
      SELECT
        p.id, p.full_name, p.email, p.phone_number,
        p.last_contact_at, p.funnel_stage, p.status, p.avatar_url, p.created_at,
        (SELECT SUM(pp.price_charged) FROM procedures_performed pp WHERE pp.patient_id = p.id AND pp.status = 'completed') as total_value,
        (SELECT COUNT(*) FROM procedures_performed pp WHERE pp.patient_id = p.id) as procedures_count,
        (SELECT MIN(ap.appointment_datetime) FROM appointments ap WHERE ap.patient_id = p.id AND ap.appointment_datetime > NOW() AND ap.status NOT IN ('cancelled', 'completed', 'no_show')) as next_appointment_raw,
        (SELECT SUM(pp.price_charged) FROM procedures_performed pp WHERE pp.patient_id = p.id AND pp.status = 'completed') as total_spent,
        (SELECT SUM(pp.price_charged - pp.cost_incurred) FROM procedures_performed pp WHERE pp.patient_id = p.id AND pp.status = 'completed') as total_profit
      FROM patients p
      WHERE 1=1
    `;
    const params: any[] = [];

    if (searchTerm) {
      sql += " AND (p.full_name LIKE ? OR p.email LIKE ? OR p.phone_number LIKE ?)";
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }
    if (stage && stage !== "all") {
      sql += " AND p.funnel_stage = ?";
      params.push(stage);
    }

    const now = new Date();
    let baseDateColumnForPeriod = 'p.last_contact_at';

    if (period === "today") {
      sql += ` AND DATE(${baseDateColumnForPeriod}) = CURDATE()`;
    } else if (period === "week") {
      const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to get Monday
      const weekStart = new Date(now.setDate(now.getDate() + diffToMonday)).toISOString().slice(0, 10);
      const weekEnd = new Date(now.setDate(now.getDate() + 6)).toISOString().slice(0, 10); // Sunday of that week
      sql += ` AND DATE(${baseDateColumnForPeriod}) BETWEEN ? AND ?`;
      params.push(weekStart, weekEnd);
    } else if (period === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      sql += ` AND DATE(${baseDateColumnForPeriod}) BETWEEN ? AND ?`;
      params.push(monthStart, monthEnd);
    }

    sql += " ORDER BY p.last_contact_at DESC, p.full_name ASC";

    const dbResults: any[] = await query(sql, params);
    const patients: PatientListItem[] = dbResults.map(mapDbRowToPatientListItem);

    return NextResponse.json({
      patients: patients,
      total: patients.length,
    });
  } catch (error) {
    console.error("API GET /api/patients Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao buscar pacientes.", details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePatientPayload = await request.json();
    const {
      name, email, phone, birthDate, address, city, zipCode,
      emergencyContact, emergencyPhone, medicalHistory, allergies,
      medications, insuranceProvider, insuranceNumber, preferredContact, notes
    } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Nome, email e telefone são obrigatórios." }, { status: 400 });
    }

    const existingPatient = await query(
      "SELECT id FROM patients WHERE email = ? OR phone_number = ?",
      [email, phone]
    );

    if (existingPatient.length > 0) {
      return NextResponse.json({ error: "Paciente já cadastrado com este email ou telefone." }, { status: 409 });
    }

    const insertSql = `
      INSERT INTO patients (
        full_name, email, phone_number, birth_date, address_line1, city, zip_code,
        emergency_contact_name, emergency_contact_phone, medical_history, allergies,
        current_medications, insurance_provider, insurance_policy_number,
        preferred_contact_method, notes, funnel_stage, last_contact_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'lead_created', NOW())
    `;
    const result = await execute(insertSql, [
      name, email, phone, birthDate ? new Date(birthDate).toISOString().slice(0,10) : null, address, city, zipCode,
      emergencyContact, emergencyPhone, medicalHistory, allergies, medications,
      insuranceProvider, insuranceNumber, preferredContact, notes
    ]);

    if (!result.insertId) {
      throw new Error("Falha ao criar paciente no banco de dados.");
    }

    const newPatientResult = await query(
        `SELECT id, full_name, email, phone_number, last_contact_at, funnel_stage, status, avatar_url, created_at,
        0 as total_value, 0 as procedures_count, NULL as next_appointment_raw, 0 as total_spent, 0 as total_profit
        FROM patients WHERE id = ?`,
        [result.insertId]
    );
    const newPatientResponse = mapDbRowToPatientListItem(newPatientResult[0]);

    return NextResponse.json({ success: true, patient: newPatientResponse }, { status: 201 });
  } catch (error) {
    console.error("API POST /api/patients Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao criar paciente.";
    return NextResponse.json({ error: "Erro ao criar paciente.", details: errorMessage }, { status: 500 });
  }
}
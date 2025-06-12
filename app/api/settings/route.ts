import { NextRequest, NextResponse } from "next/server";
import { query, execute } from '@/lib/db';

// Interface baseada em SettingsModalProps e seu estado interno
interface ClinicSettings {
    clinicName?: string;
    doctorName?: string;
    email?: string; // contato@dramayguitton.com.br
    phone?: string; // (11) 3456-7890
    address?: string;
    cro?: string; // CRO-SP 12345
    specialty?: string;

    emailNotifications?: boolean;
    smsNotifications?: boolean;
    whatsappNotifications?: boolean;
    appointmentReminders?: boolean;
    // paymentReminders?: boolean; // Não presente no DB schema, adicionar se necessário
    // marketingEmails?: boolean; // Não presente no DB schema, adicionar se necessário
    reminderTime?: string; // "24" (horas)

    theme?: string; // "light"
    language?: string; // "pt-BR"
    dateFormat?: string; // "dd/MM/yyyy"
    timeFormat?: string; // "24h"
    currency?: string; // "BRL"

    workingHours?: any; // JSON
    appointmentDuration?: string; // "30" (minutos)
    bufferTime?: string; // "15" (minutos)
    maxAdvanceBooking?: string; // "60" (dias)

    // defaultProcedurePrices?: any; // JSON ou link para procedure_catalog
    taxRate?: string; // "0"
    paymentMethods?: any; // JSON

    sessionTimeout?: string; // "60" (minutos)
    // requirePasswordChange?: boolean; // Não presente no DB schema
    // twoFactorAuth?: boolean; // Não presente no DB schema
    dataRetention?: string; // "7" (anos) - DB não tem este campo diretamente, é mais uma política
}

function mapDbToClinicSettings(dbRow: any): ClinicSettings {
    if (!dbRow) return {};
    return {
        clinicName: dbRow.clinic_name,
        doctorName: dbRow.doctor_name, // Adicionar ao DB schema se necessário, ou vir da tabela Users
        email: dbRow.contact_email,
        phone: dbRow.contact_phone,
        address: dbRow.address,
        cro: dbRow.cro_number,
        specialty: dbRow.specialty,
        emailNotifications: Boolean(dbRow.email_notifications_enabled),
        smsNotifications: Boolean(dbRow.sms_notifications_enabled),
        whatsappNotifications: Boolean(dbRow.whatsapp_notifications_enabled),
        appointmentReminders: Boolean(dbRow.appointment_reminder_enabled),
        reminderTime: dbRow.appointment_reminder_lead_time_hours?.toString(),
        theme: dbRow.display_theme,
        language: dbRow.language,
        dateFormat: dbRow.date_format,
        timeFormat: dbRow.time_format, // Precisa converter para "24h" ou "12h"
        currency: dbRow.currency_code,
        workingHours: typeof dbRow.working_hours === 'string' ? JSON.parse(dbRow.working_hours) : dbRow.working_hours,
        appointmentDuration: dbRow.default_appointment_duration_minutes?.toString(),
        bufferTime: dbRow.appointment_buffer_time_minutes?.toString(),
        maxAdvanceBooking: dbRow.max_advance_booking_days?.toString(),
        taxRate: dbRow.default_tax_rate?.toString(),
        paymentMethods: typeof dbRow.accepted_payment_methods === 'string' ? JSON.parse(dbRow.accepted_payment_methods) : dbRow.accepted_payment_methods,
        sessionTimeout: dbRow.session_timeout_minutes?.toString(),
    };
}


export async function GET(request: NextRequest) {
    try {
        const result = await query("SELECT * FROM clinic_settings WHERE id = 1");
        if (!result || result.length === 0) {
            // Opcional: Inserir configurações padrão se não existirem
            // await execute("INSERT INTO clinic_settings (id, clinic_name) VALUES (1, 'Meu Consultório Padrão') ON DUPLICATE KEY UPDATE id=id");
            // const newResult = await query("SELECT * FROM clinic_settings WHERE id = 1");
            // return NextResponse.json(mapDbToClinicSettings(newResult[0] || {}));
            return NextResponse.json({}); // Retorna objeto vazio se não houver settings
        }
        return NextResponse.json(mapDbToClinicSettings(result[0]));
    } catch (error) {
        console.error("API GET /api/settings Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
        return NextResponse.json({ error: "Erro ao buscar configurações.", details: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body: ClinicSettings = await request.json();

        // Mapear de volta para snake_case para o DB
        const dbPayload: Record<string, any> = {
            clinic_name: body.clinicName,
            // doctor_name: body.doctorName, // Se for armazenar aqui
            contact_email: body.email,
            contact_phone: body.phone,
            address: body.address,
            cro_number: body.cro,
            specialty: body.specialty,
            email_notifications_enabled: body.emailNotifications,
            sms_notifications_enabled: body.smsNotifications,
            whatsapp_notifications_enabled: body.whatsappNotifications,
            appointment_reminder_enabled: body.appointmentReminders,
            appointment_reminder_lead_time_hours: body.reminderTime ? parseInt(body.reminderTime) : null,
            display_theme: body.theme,
            language: body.language,
            date_format: body.dateFormat,
            time_format: body.timeFormat, // Ajustar para 'HH:mm' ou 'h:mm a'
            currency_code: body.currency,
            working_hours: body.workingHours ? JSON.stringify(body.workingHours) : null,
            default_appointment_duration_minutes: body.appointmentDuration ? parseInt(body.appointmentDuration) : null,
            appointment_buffer_time_minutes: body.bufferTime ? parseInt(body.bufferTime) : null,
            max_advance_booking_days: body.maxAdvanceBooking ? parseInt(body.maxAdvanceBooking) : null,
            default_tax_rate: body.taxRate ? parseFloat(body.taxRate) : null,
            accepted_payment_methods: body.paymentMethods ? JSON.stringify(body.paymentMethods) : null,
            session_timeout_minutes: body.sessionTimeout ? parseInt(body.sessionTimeout) : null,
        };

        const updates: string[] = [];
        const values: any[] = [];

        for (const key in dbPayload) {
            if (dbPayload[key] !== undefined) {
                updates.push(`${key} = ?`);
                values.push(dbPayload[key]);
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: "Nenhum dado para atualizar." }, { status: 400 });
        }

        // Garante que a linha de settings exista (upsert)
        await execute(
            `INSERT INTO clinic_settings (id, ${Object.keys(dbPayload).filter(k => dbPayload[k] !== undefined).join(", ")}) VALUES (1, ${Object.values(dbPayload).filter(v => v !== undefined).map(() => '?').join(", ")})
             ON DUPLICATE KEY UPDATE ${updates.join(", ")}`,
            [...Object.values(dbPayload).filter(v => v !== undefined), ...values] // Para o INSERT e para o UPDATE
        );


        const updatedSettingsResult = await query("SELECT * FROM clinic_settings WHERE id = 1");
        return NextResponse.json({ success: true, settings: mapDbToClinicSettings(updatedSettingsResult[0]) });

    } catch (error) {
        console.error("API PUT /api/settings Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
        return NextResponse.json({ error: "Erro ao atualizar configurações.", details: errorMessage }, { status: 500 });
    }
}
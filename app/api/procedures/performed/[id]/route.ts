// app/api/procedures/performed/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from '@/lib/db';

interface PerformedProcedureDB {
    id: number;
    procedure_date: string; // Date string
    patient_id: number;
    appointment_id?: number | null;
    procedure_catalog_id: number;
    user_id?: number | null;
    status: "completed" | "pending" | "cancelled" | "in_progress" | "aborted";
    price_charged: number; // DECIMAL
    cost_incurred?: number | null; // DECIMAL
    notes?: string | null;
    payment_method?: string | null;
    payment_status?: "paid" | "pending" | "overdue" | "waived" | null;
    // Campos de join
    patient_name?: string;
    procedure_name?: string;
    category?: string;
}

interface PerformedProcedureAPI {
    id: string;
    date: string; // YYYY-MM-DD
    patientName: string;
    procedureName: string;
    category: string;
    status: "completed" | "pending" | "cancelled" | "in_progress" | "aborted";
    value: number;
    cost: number;
    profit: number;
    margin: number; // percentage
    paymentMethod?: string;
    paymentStatus?: "paid" | "pending" | "overdue" | "waived";
    notes?: string;
    patientId?: string;
    appointmentId?: string;
    procedureCatalogId?: string;
    userId?: string;
}


interface UpdatePerformedProcedurePayload {
    procedureDate?: string; // YYYY-MM-DD or ISO
    status?: PerformedProcedureAPI['status'];
    priceCharged?: number;
    costIncurred?: number;
    notes?: string;
    paymentMethod?: string;
    paymentStatus?: PerformedProcedureAPI['paymentStatus'];
}

function mapDbToPerformedProcedureDetail(dbRow: PerformedProcedureDB): PerformedProcedureAPI {
    const price = parseFloat(dbRow.price_charged as any || 0);
    const cost = parseFloat(dbRow.cost_incurred as any || 0);
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;

    return {
        id: dbRow.id.toString(),
        date: new Date(dbRow.procedure_date).toISOString().split('T')[0],
        patientName: dbRow.patient_name || "N/A",
        procedureName: dbRow.procedure_name || "N/A",
        category: dbRow.category || "N/A",
        status: dbRow.status,
        value: price,
        cost: cost,
        profit: profit,
        margin: parseFloat(margin.toFixed(1)),
        paymentMethod: dbRow.payment_method || undefined,
        paymentStatus: dbRow.payment_status || undefined,
        notes: dbRow.notes || undefined,
        patientId: dbRow.patient_id?.toString(),
        appointmentId: dbRow.appointment_id?.toString() || undefined,
        procedureCatalogId: dbRow.procedure_catalog_id?.toString(),
        userId: dbRow.user_id?.toString() || undefined,
    };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const performedId = params.id;
        if (isNaN(parseInt(performedId))) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

        const result = await query(
            `SELECT 
                pp.*, pat.full_name as patient_name, pc.name as procedure_name, pc.category
            FROM procedures_performed pp
            JOIN patients pat ON pp.patient_id = pat.id
            JOIN procedure_catalog pc ON pp.procedure_catalog_id = pc.id
            WHERE pp.id = ?`, [performedId]
        );
        if (!result || result.length === 0) {
            return NextResponse.json({ error: "Procedimento realizado não encontrado." }, { status: 404 });
        }
        return NextResponse.json(mapDbToPerformedProcedureDetail(result[0]));
    } catch (error) {
        console.error(`API GET /api/procedures/performed/${params.id} Error:`, error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
        return NextResponse.json({ error: "Erro ao buscar procedimento realizado.", details: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const performedId = params.id;
        if (isNaN(parseInt(performedId))) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

        const body: UpdatePerformedProcedurePayload = await request.json();

        const allowedUpdates: Record<string, string> = {
            procedureDate: "procedure_date", status: "status", priceCharged: "price_charged",
            costIncurred: "cost_incurred", notes: "notes", paymentMethod: "payment_method",
            paymentStatus: "payment_status"
        };
        const updates: string[] = [];
        const values: any[] = [];

        for (const key in body) {
            if (Object.prototype.hasOwnProperty.call(body, key) && allowedUpdates[key] && (body as any)[key] !== undefined) {
                updates.push(`${allowedUpdates[key]} = ?`);
                let value = (body as any)[key];
                if (key === 'procedureDate' && value) {
                    value = new Date(value).toISOString().slice(0,10);
                }
                values.push(value);
            }
        }

        if (updates.length === 0) {
          return NextResponse.json({ error: "Nenhum campo válido para atualização." }, { status: 400 });
        }

        const sql = `UPDATE procedures_performed SET ${updates.join(", ")} WHERE id = ?`;
        values.push(performedId);
        const result = await execute(sql, values);

        if (result.affectedRows === 0) {
          return NextResponse.json({ error: "Procedimento realizado não encontrado ou dados inalterados." }, { status: 404 });
        }
        
        // Re-fetch para retornar o objeto atualizado
        const getResult = await query(
            `SELECT pp.*, pat.full_name as patient_name, pc.name as procedure_name, pc.category
             FROM procedures_performed pp
             JOIN patients pat ON pp.patient_id = pat.id
             JOIN procedure_catalog pc ON pp.procedure_catalog_id = pc.id
             WHERE pp.id = ?`, [performedId]
        );
        return NextResponse.json(mapDbToPerformedProcedureDetail(getResult[0]));

    } catch (error) {
        console.error(`API PUT /api/procedures/performed/${params.id} Error:`, error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
        return NextResponse.json({ error: "Erro ao atualizar procedimento realizado.", details: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const performedId = params.id;
        if (isNaN(parseInt(performedId))) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

        // Soft delete alterando o status para 'cancelled', por exemplo, ou adicionar um campo is_deleted
        // Para um delete real: const result = await execute("DELETE FROM procedures_performed WHERE id = ?", [performedId]);
        const result = await execute("UPDATE procedures_performed SET status = 'cancelled' WHERE id = ?", [performedId]);


        if (result.affectedRows === 0) {
          return NextResponse.json({ error: "Procedimento realizado não encontrado." }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: "Procedimento realizado cancelado com sucesso." });
    } catch (error) {
        console.error(`API DELETE /api/procedures/performed/${params.id} Error:`, error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
        return NextResponse.json({ error: "Erro ao cancelar o procedimento realizado.", details: errorMessage }, { status: 500 });
    }
}
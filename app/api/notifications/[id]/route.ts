import { NextRequest, NextResponse } from "next/server";
import { query, execute } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) { // Marcar como lida
    try {
        const notificationId = params.id;
        // TODO: Verificar se a notificação pertence ao usuário autenticado
        const userId = 1; // Placeholder

        const result = await execute(
            "UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?",
            [notificationId, userId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Notificação não encontrada ou não pertence ao usuário." }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: "Notificação marcada como lida." });
    } catch (error) {
        console.error(`API PUT /api/notifications/${params.id} Error:`, error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
        return NextResponse.json({ error: "Erro ao marcar notificação como lida.", details: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) { // Dispensar
    try {
        const notificationId = params.id;
        // TODO: Verificar se a notificação pertence ao usuário autenticado
        const userId = 1; // Placeholder

        const result = await execute(
            "DELETE FROM notifications WHERE id = ? AND user_id = ?",
            [notificationId, userId]
        );
        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Notificação não encontrada ou não pertence ao usuário." }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: "Notificação dispensada." });
    } catch (error) {
        console.error(`API DELETE /api/notifications/${params.id} Error:`, error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
        return NextResponse.json({ error: "Erro ao dispensar notificação.", details: errorMessage }, { status: 500 });
    }
}
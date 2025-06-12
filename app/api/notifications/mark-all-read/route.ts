import { NextRequest, NextResponse } from "next/server";
import { execute } from '@/lib/db';

export async function PUT(request: NextRequest) {
    try {
        // TODO: Obter user_id do usuário autenticado
        const userId = 1; // Placeholder

        await execute(
            "UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE",
            [userId]
        );
        return NextResponse.json({ success: true, message: "Todas as notificações foram marcadas como lidas." });
    } catch (error) {
        console.error("API PUT /api/notifications/mark-all-read Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
        return NextResponse.json({ error: "Erro ao marcar todas as notificações como lidas.", details: errorMessage }, { status: 500 });
    }
}
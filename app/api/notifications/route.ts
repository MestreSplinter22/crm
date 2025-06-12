import { NextRequest, NextResponse } from "next/server";
import { query } from '@/lib/db';

interface NotificationFE { // Baseado em NotificationsDropdownProps
  id: string; // DB é INT, converter para string
  type: "info" | "warning" | "success" | "error" | "reminder";
  title: string;
  message: string;
  time: string; // Formatado como "X min atrás" ou data
  read: boolean;
  createdAt?: string; // ISO Date
}

// Função para formatar o tempo (simplificada)
function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 60) return `${diffSeconds} seg atrás`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} h atrás`;
    return new Date(dateString).toLocaleDateString('pt-BR');
}


export async function GET(request: NextRequest) {
    try {
        // TODO: Obter user_id do usuário autenticado
        const userId = 1; // Placeholder

        const { searchParams } = new URL(request.url);
        const filterRead = searchParams.get("read"); // 'true', 'false', ou não presente para todos

        let sql = "SELECT id, type, title, message, created_at, is_read FROM notifications WHERE user_id = ? ";
        const params: any[] = [userId];

        if (filterRead === 'true') {
            sql += "AND is_read = TRUE ";
        } else if (filterRead === 'false') {
            sql += "AND is_read = FALSE ";
        }
        sql += "ORDER BY created_at DESC LIMIT 50"; // Limitar resultados

        const dbResults = await query(sql, params);
        const notifications: NotificationFE[] = dbResults.map((n: any) => ({
            id: n.id.toString(),
            type: n.type,
            title: n.title,
            message: n.message,
            time: formatTimeAgo(n.created_at),
            read: Boolean(n.is_read),
            createdAt: new Date(n.created_at).toISOString(),
        }));

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("API GET /api/notifications Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
        return NextResponse.json({ error: "Erro ao buscar notificações.", details: errorMessage }, { status: 500 });
    }
}
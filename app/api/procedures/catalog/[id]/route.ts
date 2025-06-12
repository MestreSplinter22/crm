// app/api/procedures/catalog/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { query, execute } from '@/lib/db';
import type { ProcedureCatalogAPI } from "../route"; // Importar a interface do GET geral

// DB Interface (pode ser importada se definida em um arquivo compartilhado)
interface ProcedureCatalogDB {
  id: number; name: string; description?: string | null; category: string;
  default_price: number; default_cost?: number | null; default_duration_minutes?: number | null;
  is_active: boolean | number;
}

function mapDbToAPI(item: ProcedureCatalogDB): ProcedureCatalogAPI {
    return {
      id: item.id.toString(),
      name: item.name,
      description: item.description || undefined,
      category: item.category,
      defaultPrice: parseFloat(item.default_price as any),
      defaultCost: item.default_cost ? parseFloat(item.default_cost as any) : undefined,
      defaultDurationMinutes: item.default_duration_minutes || undefined,
      isActive: Boolean(item.is_active),
    };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (isNaN(parseInt(id))) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const result = await query("SELECT * FROM procedure_catalog WHERE id = ?", [id]);
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Procedimento do catálogo não encontrado." }, { status: 404 });
    }
    return NextResponse.json(mapDbToAPI(result[0]));
  } catch (error) {
    console.error(`API GET /api/procedures/catalog/${params.id} Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao buscar procedimento do catálogo.", details:errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (isNaN(parseInt(id))) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const body = await request.json() as Partial<ProcedureCatalogAPI & {isActive?: boolean}>; // isActive é opcional no update
    const { name, description, category, defaultPrice, defaultCost, defaultDurationMinutes, isActive } = body;

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { fieldsToUpdate.push("name = ?"); values.push(name); }
    if (description !== undefined) { fieldsToUpdate.push("description = ?"); values.push(description); }
    if (category !== undefined) { fieldsToUpdate.push("category = ?"); values.push(category); }
    if (defaultPrice !== undefined) { fieldsToUpdate.push("default_price = ?"); values.push(defaultPrice); }
    if (defaultCost !== undefined) { fieldsToUpdate.push("default_cost = ?"); values.push(defaultCost); }
    if (defaultDurationMinutes !== undefined) { fieldsToUpdate.push("default_duration_minutes = ?"); values.push(defaultDurationMinutes); }
    if (isActive !== undefined) { fieldsToUpdate.push("is_active = ?"); values.push(Boolean(isActive)); }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar fornecido." }, { status: 400 });
    }

    values.push(id);

    const result = await execute(
      `UPDATE procedure_catalog SET ${fieldsToUpdate.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Procedimento do catálogo não encontrado ou dados inalterados." }, { status: 404 });
    }
    const updatedItemResult = await query("SELECT * FROM procedure_catalog WHERE id = ?", [id]);
    if (!updatedItemResult || updatedItemResult.length === 0) {
        throw new Error("Falha ao buscar o item recém-atualizado no catálogo.");
    }
    return NextResponse.json({ success: true, item: mapDbToAPI(updatedItemResult[0]) });
  } catch (error) {
    console.error(`API PUT /api/procedures/catalog/${params.id} Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao atualizar procedimento do catálogo.", details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
   try {
    const id = params.id;
    if (isNaN(parseInt(id))) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const result = await execute("UPDATE procedure_catalog SET is_active = FALSE WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Procedimento do catálogo não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Procedimento do catálogo desativado." });
  } catch (error) {
    console.error(`API DELETE /api/procedures/catalog/${params.id} Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao desativar procedimento do catálogo.", details: errorMessage }, { status: 500 });
  }
}
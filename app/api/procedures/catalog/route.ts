// app/api/procedures/catalog/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { query, execute } from '@/lib/db';

// Interface para o que vem do banco de dados
interface ProcedureCatalogDB {
  id: number;
  name: string;
  description?: string | null;
  category: string;
  default_price: number; // DECIMAL no DB é tratado como string ou number pelo driver
  default_cost?: number | null;
  default_duration_minutes?: number | null;
  is_active: boolean | number; // BOOLEAN pode ser 0 ou 1
  // created_at: string; // DATETIME/TIMESTAMP
  // updated_at: string;
}

// Interface para o que a API retorna (camelCase, tipos corretos)
export interface ProcedureCatalogAPI {
  id: string;
  name: string;
  description?: string;
  category: string;
  defaultPrice: number;
  defaultCost?: number;
  defaultDurationMinutes?: number;
  isActive: boolean;
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

export async function GET(request: NextRequest) {
  try {
    const catalogResult = await query("SELECT * FROM procedure_catalog WHERE is_active = TRUE ORDER BY category, name");
    const catalog = catalogResult.map(mapDbToAPI);
    return NextResponse.json(catalog);
  } catch (error) {
    console.error("API GET /api/procedures/catalog Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao buscar catálogo de procedimentos.", details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Tipar o body conforme a entrada esperada (similar à ProcedureCatalogAPI mas sem id e isActive)
    const { name, description, category, defaultPrice, defaultCost, defaultDurationMinutes } = body as Omit<ProcedureCatalogAPI, 'id' | 'isActive'>;

    if (!name || !category || defaultPrice === undefined) {
      return NextResponse.json({ error: "Nome, categoria e preço padrão são obrigatórios." }, { status: 400 });
    }

    const result = await execute(
      "INSERT INTO procedure_catalog (name, description, category, default_price, default_cost, default_duration_minutes, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)",
      [name, description || null, category, defaultPrice, defaultCost || null, defaultDurationMinutes || null]
    );

    if (!result.insertId) {
        throw new Error("Falha ao inserir procedimento no catálogo.");
    }

    const newCatalogItemResult = await query("SELECT * FROM procedure_catalog WHERE id = ?", [result.insertId]);
    if (!newCatalogItemResult || newCatalogItemResult.length === 0) {
        throw new Error("Falha ao buscar o item recém-criado no catálogo.");
    }

    return NextResponse.json({ success: true, item: mapDbToAPI(newCatalogItemResult[0]) }, { status: 201 });
  } catch (error) {
    console.error("API POST /api/procedures/catalog Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: "Erro ao criar procedimento no catálogo.", details: errorMessage }, { status: 500 });
  }
}
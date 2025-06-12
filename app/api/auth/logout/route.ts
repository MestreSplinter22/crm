import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Blocklist simples em memória (em produção, use Redis ou banco de dados)
const tokenBlocklist = new Set<string>();

export async function POST(request: NextRequest) {
  // Busca o token do cabeçalho Authorization
  const authHeader = request.headers.get('authorization');
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (token) {
    tokenBlocklist.add(token);
    console.log('Token JWT adicionado à blocklist:', token);
    return NextResponse.json({ success: true, message: 'Logout realizado. Token invalidado no servidor.' });
  } else {
    return NextResponse.json({ success: false, message: 'Token JWT não encontrado no cabeçalho Authorization.' }, { status: 400 });
  }
}
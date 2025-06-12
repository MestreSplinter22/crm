// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Função auxiliar para verificar o token
async function verifyToken(token: string, secret: string) {
  try {
    // A biblioteca 'jose' espera o segredo como um Uint8Array
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (err) {
    // Logamos o erro no servidor para depuração, mas não o expomos ao cliente
    console.error('Falha na verificação do JWT:', err);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // MELHORIA: Verificar a existência do segredo JWT no início.
  // Se ele não existir, é um erro crítico de configuração do servidor.
  const tokenSecret = process.env.JWT_SECRET;
  if (!tokenSecret) {
    console.error('FATAL: JWT_SECRET não está definido nas variáveis de ambiente.');
    // Retorna um erro genérico para não expor detalhes da configuração
    return new NextResponse(
      JSON.stringify({ error: 'Erro de configuração interna no servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // CORREÇÃO: A lógica de 'publicPaths' foi removida.
  // O 'config.matcher' abaixo já cuida disso de forma mais eficiente,
  // impedindo que o middleware rode em rotas públicas.

  const authHeader = request.headers.get('Authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    // Busca o token no cookie 'jwt'
    const cookie = request.headers.get('cookie');
    if (cookie) {
      const match = cookie.match(/(?:^|; )jwt=([^;]*)/);
      if (match) token = match[1];
    }
  }

  // Se não houver token, redireciona para o login ou retorna 401 para APIs
  if (!token) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Não autorizado: Token não fornecido.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // Para páginas normais, redireciona para a tela de login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Tenta verificar o token
  const decodedPayload = await verifyToken(token, tokenSecret);

  // Se o token for inválido (expirado, assinatura incorreta, etc.)
  if (!decodedPayload) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Não autorizado: Token inválido ou expirado.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // Para páginas, redireciona para login com um erro para o frontend tratar
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'invalid_token');
    return NextResponse.redirect(loginUrl);
  }

  // Se o token for válido, a requisição pode continuar.
  // Opcional e útil: Anexar dados do usuário nos cabeçalhos para uso posterior.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', String(decodedPayload.userId));
  requestHeaders.set('x-user-email', String(decodedPayload.email));
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// O 'config.matcher' é a fonte única da verdade para quais rotas são protegidas.
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas, exceto as que começam com:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico (ícone do site)
     * - /login (página de login)
     * - /api/user (endpoint de login/cadastro)
     * - /api/webhook (endpoint de webhook público)
     * O '?!' é um negative lookahead do regex.
     */
    '/((?!_next/static|_next/image|favicon.ico|login|api/user|api/webhook).*)',
  ],
};
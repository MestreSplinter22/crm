// app/api/user/route.ts (agora com lógica de Login ou Cadastro)
import { type NextRequest, NextResponse } from "next/server";
import { query } from '@/lib/db';
import { compare, hash } from 'bcrypt'; // Adicionamos a função 'hash'
import jwt from 'jsonwebtoken';

interface ApiPayload {
  email: string;
  password: string;
}

interface UserFromDB {
  id: number;
  email: string;
  password_hash: string;
}

// A função agora lida com Login ou Cadastro
export async function POST(request: NextRequest) {
  try {
    const body: ApiPayload = await request.json();
    const { email, password } = body;

    // 1. Validação básica de entrada
    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    // 2. Tenta encontrar o usuário pelo e-mail
    const userResult: UserFromDB[] = await query(
      "SELECT id, email, password_hash FROM users WHERE email = ?", 
      [email]
    );

    let userForToken: { id: number; email: string; };

    // 3. Lógica principal: O usuário existe ou não?
    if (userResult.length > 0) {
      // --- O USUÁRIO EXISTE: LÓGICA DE LOGIN ---
      console.log(`Usuário com email ${email} encontrado. Tentando login...`);
      const user = userResult[0];
      const storedHash = user.password_hash;
      
      const passwordMatch = await compare(password, storedHash);

      if (!passwordMatch) {
        // A senha não bate com o hash existente
        return NextResponse.json(
          { error: "Credenciais inválidas." }, 
          { status: 401 }
        );
      }

      console.log(`Senha correta para ${email}. Login bem-sucedido.`);
      userForToken = { id: user.id, email: user.email };

    } else {
      // --- O USUÁRIO NÃO EXISTE: LÓGICA DE CADASTRO ---
      console.log(`Usuário com email ${email} não encontrado. Criando novo usuário...`);
      
      // Gera o hash da nova senha. O '10' é o custo (salt rounds), um valor padrão e seguro.
      const newPasswordHash = await hash(password, 10);
      
      // Insere o novo usuário no banco de dados
      const insertResult: any = await query(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)", 
        [email, newPasswordHash]
      );

      // Verificação se a inserção ocorreu (opcional, mas boa prática)
      if (insertResult.affectedRows === 0) {
          throw new Error("Falha ao criar o novo usuário.");
      }
      
      console.log(`Novo usuário ${email} criado com sucesso.`);
      
      // Prepara os dados para gerar o token para o novo usuário
      userForToken = { id: insertResult.insertId, email: email };
    }

    // 4. Geração do Token JWT (Comum para ambos os casos: login e cadastro)
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET não está definido nas variáveis de ambiente.");
      return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
    }

    const token = jwt.sign(userForToken, secret, {
      expiresIn: '7d', 
    });

    console.log(`Token gerado para o usuário ID: ${userForToken.id}`);
    
    // 5. Retorno de sucesso com o token
    return NextResponse.json({ 
      success: true, 
      message: "Operação bem-sucedida!",
      token: token
    });

  } catch (error) {
    console.error("API POST /api/user Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: errorMessage },
      { status: 500 }
    );
  }
}
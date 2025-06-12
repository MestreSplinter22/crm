// lib/db.ts
import mysql from 'mysql2/promise';

// --- INÍCIO DA IMPLEMENTAÇÃO DO SINGLETON PATTERN ---

// Declaramos a variável 'pool' no escopo global, mas não a inicializamos ainda.
let pool: mysql.Pool | null = null;

// Esta função cria a piscina de conexões se ela ainda não existir.
const initializePool = () => {
  if (pool) {
    return pool; // Se a piscina já existe, retorna ela.
  }
  
  // Se não existe, cria uma nova. As credenciais vêm do .env.local
  const newPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'crm',
    waitForConnections: true,
    connectionLimit: 10, // Limite padrão do MySQL pode ser baixo, 10 é um bom começo
    queueLimit: 0,
    dateStrings: true,
  });

  console.log("MySQL connection pool created.");
  pool = newPool;
  return pool;
};

// Garantimos que a piscina seja inicializada apenas uma vez.
const dbPool = initializePool();

// --- FIM DA IMPLEMENTAÇÃO DO SINGLETON PATTERN ---


interface QueryResult {
  insertId?: number;
  affectedRows?: number;
}

export async function query(sql: string, params?: any[]): Promise<any[]> {
  try {
    // Usamos a piscina de conexões já inicializada (dbPool)
    const [rows] = await dbPool.execute(sql, params);
    return rows as any[];
  } catch (error: any) {
    console.error("DB Query Error:", error.message, "\nSQL:", sql, "\nParams:", params);
    throw new Error(`Database query failed: ${error.message}`);
  }
}

export async function execute(sql: string, params?: any[]): Promise<QueryResult> {
  try {
    // Usamos a piscina de conexões já inicializada (dbPool)
    const [result] = await dbPool.execute(sql, params);
    return result as QueryResult;
  } catch (error: any) {
    console.error("DB Execute Error:", error.message, "\nSQL:", sql, "\nParams:", params);
    throw new Error(`Database execution failed: ${error.message}`);
  }
}

// Exportamos a piscina para poder usá-la em outros lugares se necessário,
// mas as funções query/execute são a forma preferencial de interagir.
export default dbPool;
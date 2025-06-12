// lib/apiClient.ts (ou um nome similar, como services/api.ts)

async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && typeof options.body === 'object' && options.body !== null) {
    // Se o corpo não for FormData e for um objeto, define Content-Type como application/json
    // e converte o corpo para JSON string, a menos que já seja uma string.
    if (!headers.has('Content-Type')) {
        headers.append('Content-Type', 'application/json');
    }
    if (typeof options.body !== 'string') {
        options.body = JSON.stringify(options.body);
    }
  } else if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)){
    // Para outros tipos de corpo (ex: string simples), se não houver Content-Type, pode-se definir um padrão ou deixar como está.
    // headers.append('Content-Type', 'text/plain'); // Exemplo
  }
  // Se for FormData, o navegador define o Content-Type automaticamente com o boundary correto.

  const response = await fetch(`/api${endpoint}`, { // Assume que todos os endpoints da API começam com /api
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // Se não conseguir parsear JSON, usa o statusText
      errorData = { error: response.statusText || 'Erro desconhecido na API' };
    }
    // Lança um erro que pode ser pego pelo chamador
    const error = new Error(errorData.error || `API Error: ${response.status}`);
    // Você pode querer adicionar mais informações ao erro, como o status code
    // (error as any).status = response.status;
    // (error as any).data = errorData;
    throw error;
  }

  // Se a resposta for 204 No Content ou similar, pode não haver corpo JSON
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T; // Ou null, ou um objeto vazio, dependendo do que fizer sentido
  }

  return response.json() as Promise<T>;
}

export default apiClient;

// Exemplo de uso em um componente:
/*
import apiClient from '@/lib/apiClient';

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

async function fetchUserProfile() {
  try {
    const userProfile = await apiClient<UserProfile>('/profile'); // Ex: GET /api/profile
    console.log(userProfile);
  } catch (error) {
    console.error('Falha ao buscar perfil do usuário:', error);
    // Tratar o erro, ex: redirecionar para login se for 401
    if ((error as any).message.includes('Não autorizado') || (error as any).status === 401) {
      // localStorage.removeItem('jwtToken');
      // window.location.href = '/login';
    }
  }
}
*/
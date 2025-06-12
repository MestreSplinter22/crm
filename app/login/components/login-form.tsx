"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user', { // Ajustado para /api/user se o nome do arquivo mudou
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        // Se a resposta não for OK, usa o erro da API ou um padrão
        throw new Error(data.error || `Falha na autenticação: ${response.statusText}`);
      }

      // Se a resposta for OK e tiver sucesso e token
      if (data.success && data.token) {
        localStorage.setItem('jwtToken', data.token);
        document.cookie = `jwt=${data.token}; path=/; max-age=604800`; // 7 dias
        window.location.href = '/';
      } else {
        // Caso data.success seja false ou token não exista, mesmo com response.ok (improvável com a API acima)
        throw new Error(data.error || "Falha ao fazer login. Resposta inesperada do servidor.");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("grid gap-6", className)}
      {...props}
    >
      <div className="grid gap-2">
        <Label className="text-white font-bold" htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="nome@exemplo.com"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          disabled={isLoading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-slate-200/20 border-0 lg:bg-opacity-5 lg:backdrop-blur-sm"
        />
      </div>
      <div className="grid gap-2">
        <Label className="text-white font-bold" htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Sua senha"
          disabled={isLoading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-slate-200/20 border-0 lg:bg-opacity-5 lg:backdrop-blur-sm"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
      <Button disabled={isLoading} className="w-full text-white bg-transparent  border backdrop-blur-2xl">
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
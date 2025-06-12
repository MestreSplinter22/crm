// components/global-loader.tsx
"use client";

import { useLoading } from '@/context/loading-context';
import { Threads } from '@/app/login/components/Silk';
import { TrueFocus } from '@/app/login/components/title';

export function GlobalLoader() {
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null; // Não renderiza nada se não estiver carregando
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1C1D1F] animate-fade-in">
      {/* Usando o seu background animado */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <Threads amplitude={1} distance={0} enableMouseInteraction={false} />
      </div>

      {/* Título animado centralizado */}
      <div className="relative z-10 flex flex-col items-center">
        <TrueFocus 
          sentence="Gennius Solutions" // Pode ser o nome da clínica ou do seu software
          manualMode={false} // Deixe em modo automático para um efeito legal
          blurAmount={5}
          borderColor="#9C8CF2"
          glowColor="rgba(156, 140, 242, 0.5)"
          animationDuration={0.8}
          pauseBetweenAnimations={0.5}
        />
        <p className="mt-4 text-sm text-gray-400 animate-pulse">
          Carregando informações...
        </p>
      </div>
    </div>
  );
}
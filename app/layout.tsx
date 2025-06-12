// app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LoadingProvider } from "@/context/loading-context"; // Importe o Provider
import { GlobalLoader } from "@/components/global-loader";   // Importe o Loader

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM Odontológico - Dra. Maylis Guitton",
  description: "Plataforma integrada de CRM e análise de funil para consultório odontológico",
  generator: 'Gennius Solutions'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Kyra — Controle de Aulas",
  description: "Gerenciamento de aulas particulares, pacotes e agenda.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="bg-screen-bg text-foreground antialiased">
      <body>{children}</body>
    </html>
  );
}

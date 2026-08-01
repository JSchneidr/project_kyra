"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import Image from "next/image";
import kyraLogo from "@/img/Kyra-dark-green.svg";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    /* 1. FUNDO DA TELA: Aplica o tom off-white mais escuro estruturado em coluna */
    <main className="flex min-h-screen flex-col items-center justify-center bg-screen-bg px-4 gap-6 select-none">
      
      {/* 2. LOGOTIPO: Posicionado acima do card, centralizado e com a variação verde escuro */}
      <div className="flex items-center justify-center">
        <Image 
          src={kyraLogo} 
          alt="Project Kyra Logo" 
          className="h-10 w-auto object-contain" 
          priority 
        />
      </div>

      {/* 3. CARD DE LOGIN: Base off-white claro com bordas finas para contraste de profundidade */}
      <Card className="w-full max-w-sm bg-card border-border/60 shadow-md rounded-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-extrabold text-primary tracking-tight">
            Entrar
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Acesse sua conta do Project Kyra
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            
            {/* Campo: Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-primary/90">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Campo: Senha */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-primary/90">
                  Senha
                </Label>
                {/* Link futuro opcional de recuperar senha */}
                <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Tratamento de Erros Dinâmicos */}
            {error && (
              <p className="text-sm font-medium text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
                {error}
              </p>
            )}
          </CardContent>

          {/* 4. RODAPÉ: Botão Terracota de alta conversão */}
          <CardFooter className="flex flex-col items-stretch gap-4 pt-2">
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-accent text-accent-foreground font-semibold hover:bg-accent/90 shadow transition-all active:scale-[0.98]"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            
            <Link
              href="/signup"
              className="text-center text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-primary transition-colors"
            >
              Ainda não tem conta? Criar conta
            </Link>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

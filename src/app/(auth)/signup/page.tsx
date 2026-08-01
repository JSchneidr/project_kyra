"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import Image from "next/image";
import kyraLogo from "@/img/Kyra-dark-green.svg";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // O nome vai em raw_user_meta_data e é lido pelo trigger
    // handle_new_user() (migration 0002) ao criar o perfil.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Se a confirmação de email estiver ativada no projeto Supabase,
    // data.session vem null aqui — o usuário é criado, mas ainda não
    // está autenticado até clicar no link recebido por email.
    if (!data.session) {
      setCheckEmail(true);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    /* 1. FUNDO DA TELA: Consistente com a tela de login */
    <main className="flex min-h-screen flex-col items-center justify-center bg-screen-bg px-4 gap-6 select-none">
      
      {/* 2. LOGOTIPO: Centralizado e no tom Verde Escuro oficial */}
      <div className="flex items-center justify-center">
        <Image 
          src={kyraLogo} 
          alt="Project Kyra Logo" 
          className="h-10 w-auto object-contain" 
          priority 
        />
      </div>

      {/* 3. CARD DE CADASTRO: Base off-white claro com as bordas harmônicas */}
      <Card className="w-full max-w-sm bg-card border-border/60 shadow-md rounded-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-extrabold text-primary tracking-tight">
            Criar conta
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Comece a usar o Project Kyra
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            
            {/* Campo: Nome */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-sm font-semibold text-primary/90">
                Nome
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
              <Label htmlFor="password" className="text-sm font-semibold text-primary/90">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="No mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {/* Alerta de erro estilizado */}
            {error && (
              <p className="text-sm font-medium text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
                {error}
              </p>
            )}
          </CardContent>

          {/* 4. RODAPÉ: Botão Terracota estruturado */}
          <CardFooter className="flex flex-col items-stretch gap-4 pt-2">
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-accent text-accent-foreground font-semibold hover:bg-accent/90 shadow transition-all active:scale-[0.98]"
            >
              {loading ? "Criando..." : "Criar conta"}
            </Button>
            
            <Link
              href="/login"
              className="text-center text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-primary transition-colors"
            >
              Já tem conta? Entrar
            </Link>
          </CardFooter>
        </form>
      </Card>

      {/* 5. MODAL DE CONFIRMAÇÃO DO SUPABASE ESTILIZADO */}
      <AlertDialog open={checkEmail}>
        <AlertDialogContent className="bg-card border-border/60 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-primary">
              Confirme seu email
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Enviamos um link de confirmação para <span className="font-semibold text-primary/90">{email}</span>. Clique nele para ativar sua conta e depois faça login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => router.push("/login")}
              className="bg-accent text-accent-foreground font-semibold hover:bg-accent/90"
            >
              Ir para o login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

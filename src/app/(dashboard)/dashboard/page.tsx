import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users, Calendar, CircleDollarSign, GraduationCap, Plus } from "lucide-react";
import Link from "next/link";

// Definição de tipos explícitos para evitar erros de compilação 'never'
type Student = {
  id: string;
  name: string;
  email: string;
  active: boolean;
};

type PackagePrice = {
  price: number;
};

type UserProfile = {
  name: string | null;
  timezone: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Garantindo o tipo da consulta de perfil
  const { data: profile } = (await supabase
    .from("users")
    .select("name, timezone")
    .eq("id", user.id)
    .single()) as { data: UserProfile | null };

  // Garantindo o tipo da lista de estudantes
  const { data: students } = (await supabase
    .from("students")
    .select("id, name, email, active")
    .order("name")) as { data: Student[] | null };

  // Cálculos rápidos
  const totalStudents = students?.length ?? 0;
  const activeStudents = students?.filter((s) => s.active).length ?? 0;

  async function getActivePackagesCount() {
    const { count } = await supabase
      .from("lesson_packages")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE");
    return count ?? 0;
  }

  async function getScheduledLessonsCurrentMonthCount() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { count, error } = await supabase
      .from("lessons")
      .select("*", { count: "exact", head: true })
      .eq("status", "SCHEDULED")
      .gte("start_at", startOfMonth)
      .lt("start_at", startOfNextMonth);

    if (error) {
      console.error("Erro ao buscar aulas agendadas do mês:", error);
      return 0;
    }

    return count ?? 0;
  }

  async function getTotalRevenueCurrentMonth() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    // Forçando o tipo retornado pela consulta do Supabase
    const { data, error } = (await supabase
      .from("lesson_packages")
      .select("price")
      .gte("paid_at", startOfMonth)
      .lt("paid_at", startOfNextMonth)) as { data: PackagePrice[] | null; error: any };

    if (error || !data) {
      if (error) console.error("Erro ao buscar total a receber:", error.message);
      return 0;
    }

    // O TypeScript agora reconhece 'packageItem.price' perfeitamente
    const total = data.reduce((acc, packageItem) => acc + (packageItem.price ?? 0), 0);

    return total;
  }

  return (
    <div className="space-y-8">
      {/* 1. SEÇÃO DE BOAS-VINDAS DINÂMICA */}
      <div>
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">
          Olá, {profile?.name ?? user.email}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fuso horário: <span className="font-semibold text-primary/80">{profile?.timezone ?? "Não definido"}</span>
        </p>
      </div>

      {/* 2. GRID DE CARDS DE MÉTRICAS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Alunos Cadastrados */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Alunos Ativos</h3>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-primary">{activeStudents}</span>
            <span className="text-xs text-muted-foreground">De {totalStudents} cadastrados</span>
          </div>
        </div>

        {/* Card 2: Aulas este Mês */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Aulas Agendadas</h3>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-primary">{await getScheduledLessonsCurrentMonthCount()}</span>
            <span className="text-xs text-muted-foreground">Este mês</span>
          </div>
        </div>

        {/* Card 3: Pacotes Ativos */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Pacotes Ativos</h3>
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-primary">{await getActivePackagesCount()}</span>
            <span className="text-xs text-muted-foreground">Controle de créditos</span>
          </div>
        </div>

        {/* Card 4: Previsão de Ganhos */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">A Receber</h3>
            <CircleDollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-primary">USD {await getTotalRevenueCurrentMonth()}</span>
            <span className="text-xs text-muted-foreground">Mês atual</span>
          </div>
        </div>

      </div>

      {/* 3. LISTAGEM DE ALUNOS OU ESTADO VAZIO */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary tracking-tight">Seus Alunos</h2>
          {students && students.length > 0 && (
            <Link className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground shadow transition-colors hover:bg-accent/90"
              href="/students">
              <Plus className="h-3.5 w-3.5" /> Adicionar Aluno
            </Link>
          )}
        </div>

        {students && students.length > 0 ? (
          <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <ul className="divide-y divide-border/40">
              {students.map((student) => (
                <li key={student.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-semibold text-primary">{student.name}</span>
                    <span className="text-xs text-muted-foreground">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      student.active 
                        ? "bg-secondary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {student.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          /* ESTADO VAZIO: Quando a tabela do Supabase retorna 0 registros */
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
              <Users className="h-6 w-6 text-primary/60" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-primary">Nenhum aluno cadastrado</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Comece adicionando seus alunos para gerenciar seus pacotes de aulas e liberar a página de consulta pública.
            </p>
            <Link className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground shadow transition-colors hover:bg-accent/90"
              href="/students">
              Cadastrar meu primeiro aluno
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
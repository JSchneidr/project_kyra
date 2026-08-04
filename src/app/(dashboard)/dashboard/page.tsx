import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { 
  Users, 
  Calendar, 
  CircleDollarSign, 
  GraduationCap, 
  Plus, 
  ChevronRight,
  Globe
} from "lucide-react";
import Link from "next/link";
import { LessonCalendar } from "@/components/calendar/lesson-calendar";
import { Card } from "@/components/ui/card";

// Helper para formatar moeda
const formatCurrency = (amount: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// Helper para pegar iniciais do nome
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Prepara as datas do mês atual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  // Executa todas as consultas em paralelo
  const [
    { data: profile },
    { data: students },
    { count: activePackagesCount },
    { count: scheduledLessonsCount },
    { data: revenueData }
  ] = await Promise.all([
    supabase.from("users").select("name, timezone").eq("id", user.id).single(),
    supabase.from("students").select("id, name, email, active").order("name"),
    supabase.from("lesson_packages").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("lessons").select("*", { count: "exact", head: true }).eq("status", "SCHEDULED").gte("start_at", startOfMonth).lt("start_at", startOfNextMonth),
    supabase.from("lesson_packages").select("price").gte("paid_at", startOfMonth).lt("paid_at", startOfNextMonth)
  ]);

  const totalStudents = students?.length ?? 0;
  const activeStudents = students?.filter((s) => s.active).length ?? 0;
  const totalRevenue = revenueData?.reduce((acc, item) => acc + (item.price ?? 0), 0) ?? 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. CABEÇALHO DE BOAS-VINDAS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Olá, {profile?.name ?? user.email}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-muted-foreground/70" />
            Fuso horário: <span className="font-medium text-foreground">{profile?.timezone ?? "Não definido"}</span>
          </p>
        </div>

        <Link
          href="/students"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" /> Novo Aluno
        </Link>
      </div>

      {/* 2. SEÇÃO DE MÉTRICAS + CALENDÁRIO (Mudança no breakpoint para lg) */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-2 items-start">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Card 1: Alunos */}
          <Card className="p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Alunos Ativos
              </span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">{activeStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                De <span className="font-medium text-foreground">{totalStudents}</span> cadastrados
              </p>
            </div>
          </Card>

          {/* Card 2: Aulas Agendadas */}
          <Card className="p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aulas Agendadas
              </span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">{scheduledLessonsCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Neste mês corrente</p>
            </div>
          </Card>

          {/* Card 3: Pacotes Ativos */}
          <Card className="p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pacotes Ativos
              </span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">{activePackagesCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
            </div>
          </Card>

          {/* Card 4: Faturamento */}
          <Card className="p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recebido (Mês)
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CircleDollarSign className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total referente ao mês atual</p>
            </div>
          </Card>
        </div>

        {/* Widget do Calendário */}
        <div className="w-full h-full min-h-[480px]">
          <LessonCalendar readOnly size="sm" students={students ?? []} />
        </div>
      </section>

      {/* 3. SEÇÃO DA LISTA DE ALUNOS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Seus Alunos</h2>
            <p className="text-xs text-muted-foreground">Visão geral dos alunos registrados na plataforma.</p>
          </div>
          {students && students.length > 0 && (
            <Link
              href="/students"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              Ver todos <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {students && students.length > 0 ? (
          <div className="rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden">
            <ul className="divide-y divide-border/40">
              {students.map((student) => (
                <li
                  key={student.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(student.name ?? "A")}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {student.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{student.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        student.active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                          : "bg-muted text-muted-foreground border-transparent"
                      }`}
                    >
                      {student.active ? "Ativo" : "Inativo"}
                    </span>

                    <Link
                      href={`/students/${student.id}`}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Ver detalhes"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          /* ESTADO VAZIO (EMPTY STATE) */
          <div className="rounded-xl border border-dashed border-border/80 bg-card/50 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">Nenhum aluno cadastrado</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Adicione alunos para gerenciar seus pacotes de aulas, agendamentos e faturamento em um só lugar.
            </p>
            <div className="mt-6">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
                href="/students"
              >
                <Plus className="h-4 w-4" /> Cadastrar primeiro aluno
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPackageForm } from "@/components/packages/new-package-form";
import { GraduationCap, CheckCircle2, AlertCircle, Calendar, DollarSign } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default async function PackagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Consulta de Alunos
  const { data: students } = await supabase
    .from("students")
    .select("id, name")
    .eq("active", true)
    .order("name");

  // 2. Consulta de Pacotes com Join de Alunos
  const { data: packages } = await supabase
    .from("lesson_packages")
    .select("*, students(name)")
    .order("paid_at", { ascending: false });

  // 3. Consulta de Aulas Concluídas
  const { data: completedLessons } = await supabase
    .from("lessons")
    .select("package_id")
    .eq("status", "COMPLETED")
    .eq("professor_id", user.id);

  const completedByPackage = new Map<string, number>();
  for (const lesson of completedLessons ?? []) {
    if (!lesson.package_id) continue;
    completedByPackage.set(
      lesson.package_id,
      (completedByPackage.get(lesson.package_id) ?? 0) + 1
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. CABEÇALHO DA PÁGINA */}
      <div>
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">
          Pacotes de Aulas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os créditos de aulas contratados pelos seus alunos e acompanhe a evolução de consumo.
        </p>
      </div>

      {/* 2. FORMULÁRIO DE NOVO PACOTE */}
      <Card className="border border-border/50 bg-card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-secondary" /> Novo Pacote
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Adicione um novo contrato. Cada aluno só pode ter um pacote ativo por vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <NewPackageForm students={students ?? []} />
        </CardContent>
      </Card>

      {/* 3. SEÇÃO DE LISTAGEM DE TODOS OS PACOTES */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-primary tracking-tight">Histórico de Contratos</h2>

        {packages && packages.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {packages.map((pkg) => {
              const done = completedByPackage.get(pkg.id) ?? 0;
              const size = pkg.package_size ?? 1;
              const percentage = Math.min((done / size) * 100, 100);
              const isActive = pkg.status === "ACTIVE";

              // Acesso direto e tipado automaticamente pelo Database
              const studentName = pkg.students?.name ?? "Aluno removido";

              return (
                <div 
                  key={pkg.id} 
                  className={`relative rounded-xl border p-5 bg-card shadow-sm transition-all flex flex-col justify-between gap-4 ${
                    isActive ? "border-border/60" : "border-border/30 opacity-75"
                  }`}
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <p className="font-bold text-primary text-base tracking-tight">{studentName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Pago em: {pkg.paid_at ? new Date(pkg.paid_at).toLocaleDateString('pt-BR') : 'Pendente'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {usdFormatter.format(Number(pkg.price ?? 0))}
                      </p>
                    </div>

                    {/* Badge de Status */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isActive
                          ? "bg-secondary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isActive ? (
                        <CheckCircle2 className="h-3 w-3 text-secondary" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {isActive ? "Ativo" : pkg.status}
                    </span>
                  </div>

                  {/* Progresso de Consumo de Aulas */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">Progresso do Pacote</span>
                      <span className="font-bold text-primary">{done} / {size} aulas</span>
                    </div>
                    
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          percentage >= 100 
                            ? "bg-accent" 
                            : "bg-secondary"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Estado Vazio */
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
              <GraduationCap className="h-6 w-6 text-primary/60" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-primary">Nenhum pacote contratado</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Seus alunos precisam de um pacote ativo atrelado a eles para que consigam agendar e computar as aulas ministradas.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
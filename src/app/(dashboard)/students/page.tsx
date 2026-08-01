import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewStudentForm } from "@/components/students/new-student-form";
import { StudentCard } from "@/components/students/student-card";
import { Users } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default async function StudentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, name, email, whatsapp, active, share_token")
    .order("name");

  return (
    <div className="space-y-8">
      {/* 1. CABEÇALHO DA PÁGINA */}
      <div>
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">
          Alunos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cadastre seus alunos para poder criar pacotes e agendar aulas.
        </p>
      </div>

      {/* 2. FORMULÁRIO DE NOVO ALUNO */}
      <Card className="border border-border/50 bg-card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary" /> Novo Aluno
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            O email é o meio de comunicação principal; o WhatsApp é opcional.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <NewStudentForm />
        </CardContent>
      </Card>

      {/* 3. SEÇÃO DE LISTAGEM DE TODOS OS ALUNOS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-primary tracking-tight">
          Todos os Alunos
        </h2>

        {students && students.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {students.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
              <Users className="h-6 w-6 text-primary/60" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-primary">
              Nenhum aluno cadastrado
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Cadastre seu primeiro aluno acima para começar a criar pacotes e
              agendar aulas.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

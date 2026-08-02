import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewStudentDialog } from "@/components/students/new-student-dialog";
import { StudentsTable } from "@/components/students/students-table";
import { Users } from "lucide-react";

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Alunos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre seus alunos para poder criar pacotes e agendar aulas.
          </p>
        </div>
        <NewStudentDialog />
      </div>

      <section className="space-y-4">
        {students && students.length > 0 ? (
          <StudentsTable students={students} />
        ) : (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
              <Users className="h-6 w-6 text-primary/60" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-primary">Nenhum aluno cadastrado</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Cadastre seu primeiro aluno para começar a criar pacotes e agendar aulas.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
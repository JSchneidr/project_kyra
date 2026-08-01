import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LessonCalendar } from "@/components/calendar/lesson-calendar";
import { CalendarDays } from "lucide-react";

export default async function CalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">
          Calendário
        </h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          Clique num horário vazio para agendar, ou numa aula para editar,
          concluir, cancelar ou remarcar.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <LessonCalendar students={students ?? []} />
      </div>
    </div>
  );
}

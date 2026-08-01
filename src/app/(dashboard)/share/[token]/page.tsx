import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { LocalDate, LocalDateTime } from "@/components/share/local-date-time";
import {
  CalendarDays,
  DollarSign,
  History,
  GraduationCap,
} from "lucide-react";
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

// Rota pública — NÃO tem sessão de professor. O acesso é validado
// manualmente pelo share_token, usando a secret key (que bypassa RLS).
// Nunca reaproveite este client fora de rotas públicas como esta.
export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: student, error } = await supabase
    .from("students")
    .select("id, name, active")
    .eq("share_token", token)
    .single();

  if (error || !student || !student.active) {
    notFound();
  }

  const { data: activePackage } = await supabase
    .from("lesson_packages")
    .select("id, package_size, price, paid_at, status")
    .eq("student_id", student.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  const { count: completedCount } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("package_id", activePackage?.id ?? "")
    .eq("status", "COMPLETED");

  const { data: scheduledLessons } = await supabase
    .from("lessons")
    .select("id, title, notes, start_at, end_at, status")
    .eq("student_id", student.id)
    .eq("status", "SCHEDULED")
    .order("start_at");

  const { data: reschedules } = await supabase
    .from("lesson_reschedules")
    .select("id, old_start_at, new_start_at, reason, changed_at, lessons!inner(title, notes, student_id)")
    .eq("lessons.student_id", student.id)
    .order("changed_at", { ascending: false });

  return (
    <main className="mx-auto w-full px-4 py-10 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">
          {student.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Times shown in your local time zone.
        </p>
      </div>

      {/* Current package */}
      <Card className="border border-border/50 bg-card shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-secondary" />
            Current Package
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activePackage ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  Package Price
                </span>
                <span className="font-semibold text-primary">
                  {usdFormatter.format(Number(activePackage.price ?? 0))}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Payment Date
                </span>
                <span className="font-semibold text-primary">
                  <LocalDate iso={activePackage.paid_at} />
                </span>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">
                    Package Progress
                  </span>
                  <span className="font-bold text-primary">
                    {completedCount ?? 0} / {activePackage.package_size} lessons
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        ((completedCount ?? 0) / activePackage.package_size) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active package at the moment.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming lessons */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-primary tracking-tight flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-secondary" />
          Upcoming Lessons
        </h2>

        {scheduledLessons && scheduledLessons.length > 0 ? (
          <ul className="space-y-2">
            {scheduledLessons.map((lesson) => (
              <li
                key={lesson.id}
                className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
              >
                <p className="font-semibold text-primary">
                  {lesson.title || lesson.notes || "Lesson"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <LocalDateTime iso={lesson.start_at} withWeekday /> —{" "}
                  <LocalDateTime iso={lesson.end_at} />
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No scheduled lessons at the moment.
          </p>
        )}
      </section>

      {/* Reschedule history */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-primary tracking-tight flex items-center gap-2">
          <History className="h-5 w-5 text-secondary" />
          Reschedules
        </h2>

        {reschedules && reschedules.length > 0 ? (
          <ul className="space-y-2">
            {reschedules.map((r) => {
              const lessonInfo = r.lessons as unknown as {
                title: string | null;
                notes: string | null;
              } | null;

              return (
                <li
                  key={r.id}
                  className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
                >
                  <p className="font-semibold text-primary">
                    {lessonInfo?.title || lessonInfo?.notes || "Lesson"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    From <LocalDateTime iso={r.old_start_at} /> to{" "}
                    <LocalDateTime iso={r.new_start_at} />
                  </p>
                  {r.reason && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Reason: {r.reason}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No lessons have been rescheduled so far.
          </p>
        )}
      </section>
    </main>
  );
}
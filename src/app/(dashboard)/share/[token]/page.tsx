import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { LocalDate, LocalDateTime } from "@/components/share/local-date-time";
import {
  CalendarDays,
  DollarSign,
  History,
  GraduationCap,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

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
    .select(
      "id, old_start_at, new_start_at, reason, changed_at, lessons!inner(title, notes, student_id)"
    )
    .eq("lessons.student_id", student.id)
    .order("changed_at", { ascending: false });

  const { data: completedLessons } = await supabase
    .from("lessons")
    .select("id, title, notes, start_at, end_at, status")
    .eq("student_id", student.id)
    .eq("status", "COMPLETED")
    .order("start_at", { ascending: false });

  const totalPackageLessons = activePackage?.package_size || 1;
  const totalCompleted = completedCount ?? 0;
  const progressPercentage = Math.min(
    (totalCompleted / totalPackageLessons) * 100,
    100
  );

  const nextLesson = scheduledLessons?.[0] ?? null;

  return (
    <main className="mx-auto w-full px-4 py-10 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-primary tracking-tight">
              {student.name}
            </h1>
            <Badge>
              Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Times shown in your local time zone.
          </p>
        </div>
      </div>

      {/* Next lesson highlight */}
      {nextLesson && (
        <Card className="border border-secondary/30 bg-secondary/5 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/15">
              <Sparkles className="h-5 w-5 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your next lesson
              </p>
              <p className="font-bold text-primary truncate">
                {nextLesson.title || nextLesson.notes || "Lesson"}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <LocalDateTime iso={nextLesson.start_at} withWeekday /> —{" "}
                <LocalDateTime iso={nextLesson.end_at} />
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                  {activePackage.paid_at ? (
                    <LocalDate iso={activePackage.paid_at} />
                  ) : (
                    "Pending"
                  )}
                </span>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">
                    Package Progress
                  </span>
                  <span className="font-bold text-primary">
                    {totalCompleted} / {activePackage.package_size} lessons
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                No active package at the moment.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Get in touch with your instructor to set up your next package.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lessons & history tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming
            {scheduledLessons && scheduledLessons.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({scheduledLessons.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {completedLessons && completedLessons.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({completedLessons.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reschedules">Reschedules</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="pt-4">
          {scheduledLessons && scheduledLessons.length > 0 ? (
            <ul className="space-y-2">
              {scheduledLessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="rounded-xl border border-border/50 bg-card p-4 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-primary truncate">
                      {lesson.title || lesson.notes || "Lesson"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <LocalDateTime iso={lesson.start_at} withWeekday /> —{" "}
                      <LocalDateTime iso={lesson.end_at} />
                    </p>
                  </div>
                  <Badge className="shrink-0" variant="outline">
                    Scheduled
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6 text-primary/60" />}
              text="No scheduled lessons at the moment."
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="pt-4">
          {completedLessons && completedLessons.length > 0 ? (
            <ul className="space-y-2">
              {completedLessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="rounded-xl border border-border/50 bg-card p-4 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-primary truncate">
                      {lesson.title || lesson.notes || "Lesson"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <LocalDateTime iso={lesson.start_at} withWeekday /> —{" "}
                      <LocalDateTime iso={lesson.end_at} />
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-muted-foreground">
                    Completed
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<GraduationCap className="h-6 w-6 text-primary/60" />}
              text="No completed lessons at the moment."
            />
          )}
        </TabsContent>

        <TabsContent value="reschedules" className="pt-4">
          {reschedules && reschedules.length > 0 ? (
            <ul className="space-y-2">
              {reschedules.map((r) => {
                const lessonInfo = r.lessons;
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
            <EmptyState
              icon={<History className="h-6 w-6 text-primary/60" />}
              text="No lessons have been rescheduled so far."
            />
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-8 text-center shadow-sm">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
        {icon}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
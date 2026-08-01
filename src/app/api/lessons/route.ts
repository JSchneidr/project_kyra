import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createLessonSchema = z
  .object({
    student_id: z.string().uuid(),
    title: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    start_at: z.string().datetime(),
    end_at: z.string().datetime(),
  })
  // Regra: precisa de pelo menos título ou descrição (mesma regra do banco).
  .refine((data) => (data.title && data.title.length > 0) || (data.notes && data.notes.length > 0), {
    message: "Informe pelo menos um título ou uma descrição para a aula.",
    path: ["title"],
  });

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  let query = supabase
    .from("lessons")
    .select("*, students(name)")
    .eq("professor_id", user.id)
    .order("start_at");

  // FullCalendar manda o intervalo visível da tela; filtramos para não
  // trazer o histórico inteiro de aulas a cada troca de mês/semana.
  if (start) query = query.gte("start_at", start);
  if (end) query = query.lte("start_at", end);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lessons: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createLessonSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Confere que o aluno pertence a este professor.
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("id", parsed.data.student_id)
    .eq("user_id", user.id)
    .single();

  if (studentError || !student) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  // Regra de negócio 5: package_id é definido no agendamento, a partir
  // do pacote ACTIVE do aluno — desde que ainda tenha crédito disponível.
  const { data: activePackage } = await supabase
    .from("lesson_packages")
    .select("id, package_size")
    .eq("student_id", parsed.data.student_id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!activePackage) {
    return NextResponse.json(
      { error: "Este aluno não tem um pacote ativo. Crie um pacote antes de agendar." },
      { status: 409 }
    );
  }

  const { count: reservedCount } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("package_id", activePackage.id)
    .in("status", ["SCHEDULED", "COMPLETED"]);

  if ((reservedCount ?? 0) >= activePackage.package_size) {
    return NextResponse.json(
      { error: "Este pacote não tem mais créditos disponíveis." },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("lessons")
    .insert({
      student_id: parsed.data.student_id,
      professor_id: user.id,
      package_id: activePackage.id,
      title: parsed.data.title || null,
      notes: parsed.data.notes || null,
      start_at: parsed.data.start_at,
      end_at: parsed.data.end_at,
      status: "SCHEDULED",
    })
    .select()
    .single();

  if (error) {
    // 23P01 = exclusion_violation -> sobreposição de horário (constraint
    // no_overlapping_lessons da migration 0001).
    if (error.code === "23P01") {
      return NextResponse.json(
        { error: "Já existe uma aula agendada nesse horário." },
        { status: 409 }
      );
    }
    // 23514 = check_violation -> falhou a regra de título/descrição.
    if (error.code === "23514") {
      return NextResponse.json(
        { error: "Informe pelo menos um título ou uma descrição para a aula." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lesson: data }, { status: 201 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { Tables, TablesUpdate } from "@/types/database.types";

const rescheduleSchema = z.object({
  new_start_at: z.string().datetime(),
  new_end_at: z.string().datetime(),
  reason: z.string().trim().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = rescheduleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: lesson, error: lessonError } =( await supabase
    .from("lessons")
    .select("id, start_at, status")
    .eq("id", id)
    .eq("professor_id", user.id)
    .single()) as { data: Tables<"lessons"> | null; error: any };

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Aula não encontrada" }, { status: 404 });
  }

  if (lesson.status !== "SCHEDULED") {
    return NextResponse.json(
      { error: "Só é possível remarcar aulas ainda agendadas." },
      { status: 409 }
    );
  }

  // Regra de negócio 3: remarcação não consome crédito — só atualiza a
  // data e guarda o histórico. O status continua SCHEDULED.
  const updateData: TablesUpdate<"lessons"> = {
    start_at: parsed.data.new_start_at,
    end_at: parsed.data.new_end_at,
  };

  const { data: updated, error: updateError } = (await supabase
    .from("lessons")
    .update(updateData)
    .eq("id", id)
    .eq("professor_id", user.id)
    .select()
    .single()) as { data: Tables<"lessons"> | null; error: any };

  if (updateError) {
    if (updateError.code === "23P01") {
      return NextResponse.json(
        { error: "Já existe uma aula agendada nesse novo horário." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: historyError } = await supabase
    .from("lesson_reschedules")
    .insert({
      lesson_id: id,
      old_start_at: lesson.start_at,
      new_start_at: parsed.data.new_start_at,
      reason: parsed.data.reason || null,
      changed_by: user.id,
    });

  if (historyError) {
    // A aula já foi remarcada; o histórico é auxiliar, então só logamos
    // o erro em vez de reverter a remarcação por causa dele.
    console.error("Falha ao registrar histórico de remarcação:", historyError);
  }

  return NextResponse.json({ lesson: updated });
}

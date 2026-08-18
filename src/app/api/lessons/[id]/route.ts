import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateLessonSchema = z.object({
  title: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  status: z
    .enum(["SCHEDULED", "COMPLETED", "CANCELLED"])
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }

  const body = await request.json();

  const parsed = updateLessonSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Atualiza a aula
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .update(parsed.data)
    .eq("id", id)
    .eq("professor_id", user.id)
    .select()
    .single();

  if (lessonError) {
    if (lessonError.code === "23514") {
      return NextResponse.json(
        {
          error:
            "A aula precisa de pelo menos um título ou uma descrição.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: lessonError.message },
      { status: 500 }
    );
  }

  // Se a aula não pertence a um pacote, não há nada para atualizar
  if (!lesson.package_id) {
    return NextResponse.json({ lesson });
  }

  // Busca o pacote
  const { data: lessonPackage, error: packageError } = await supabase
    .from("lesson_packages")
    .select("id, package_size, status")
    .eq("id", lesson.package_id)
    .single();

  if (packageError) {
    return NextResponse.json(
      { error: packageError.message },
      { status: 500 }
    );
  }

  // Busca todas as aulas do pacote
  const { data: packageLessons, error: packageLessonsError } =
    await supabase
      .from("lessons")
      .select("id, status")
      .eq("package_id", lesson.package_id)
      .eq("professor_id", user.id);

  if (packageLessonsError) {
    return NextResponse.json(
      { error: packageLessonsError.message },
      { status: 500 }
    );
  }

  // Conta quantas aulas foram concluídas
  const completedLessons = packageLessons.filter(
    (packageLesson) => packageLesson.status === "COMPLETED"
  ).length;

  // O pacote termina quando atingir a quantidade contratada
  const packageFinished =
    completedLessons >= lessonPackage.package_size;

  if (packageFinished) {
    // Finaliza o pacote
    const { error: finishError } = await supabase
      .from("lesson_packages")
      .update({ status: "FINISHED" })
      .eq("id", lesson.package_id)
      .eq("status", "ACTIVE");

    if (finishError) {
      return NextResponse.json(
        { error: finishError.message },
        { status: 500 }
      );
    }
  } else {
    // Se uma aula foi reaberta, volta o pacote para ACTIVE
    const { error: reopenError } = await supabase
      .from("lesson_packages")
      .update({ status: "ACTIVE" })
      .eq("id", lesson.package_id)
      .eq("status", "FINISHED");

    if (reopenError) {
      return NextResponse.json(
        { error: reopenError.message },
        { status: 500 }
      );
    }
  }

return NextResponse.json({ lesson });
}
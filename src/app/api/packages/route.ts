import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createPackageSchema = z.object({
  student_id: z.string().uuid(),
  package_size: z.number().int().positive(),
  price: z.number().nonnegative(),
});

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // RLS já restringe por dono do aluno; o select traz o nome do aluno
  // junto para não precisar de uma segunda query no client.
  const { data, error } = await supabase
    .from("lesson_packages")
    .select("*, students(name)")
    .order("paid_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ packages: data });
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
  const parsed = createPackageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Confere que o aluno pertence a este professor antes de criar o
  // pacote (defesa em profundidade além do RLS).
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("id", parsed.data.student_id)
    .eq("user_id", user.id)
    .single();

  if (studentError || !student) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("lesson_packages")
    .insert({
      student_id: parsed.data.student_id,
      package_size: parsed.data.package_size,
      price: parsed.data.price,
      status: "ACTIVE",
    })
    .select()
    .single();

  if (error) {
    // O Postgres rejeita com código 23505 se já existir um pacote
    // ACTIVE para este aluno (unique index parcial da migration 0001).
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Este aluno já tem um pacote ativo." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ package: data }, { status: 201 });
}

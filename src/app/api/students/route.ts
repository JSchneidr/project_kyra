import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createStudentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(), // meio de comunicação principal, obrigatório
  whatsapp: z.string().optional(),
});

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // RLS já garante que só vêm alunos deste professor, mas o filtro
  // explícito por user_id evita depender só do RLS.
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ students: data });
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
  const parsed = createStudentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("students")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      email: parsed.data.email,
      whatsapp: parsed.data.whatsapp ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ student: data }, { status: 201 });
}

const updateStudentSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(), // meio de comunicação principal
  whatsapp: z.string().nullable().optional(),
  active: z.boolean().optional(),
});
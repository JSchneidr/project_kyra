"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  Pencil,
  Power,
  CheckCircle2,
  AlertCircle,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Student = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  active: boolean;
  share_token: string;
};

export function StudentCard({ student }: { student: Student }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [whatsapp, setWhatsapp] = useState(student.whatsapp ?? "");

  async function patchStudent(payload: Record<string, unknown>) {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/students/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json();
      setError(
        typeof body.error === "string"
          ? body.error
          : "Não foi possível atualizar o aluno."
      );
      return false;
    }

    router.refresh();
    return true;
  }

  async function handleSave() {
    const ok = await patchStudent({
      name,
      email,
      whatsapp: whatsapp || null,
    });
    if (ok) setEditing(false);
  }

  async function handleToggleActive() {
    await patchStudent({ active: !student.active });
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/share/${student.share_token}`;
    navigator.clipboard.writeText(url);
  }

  return (
    <div
      className={`relative rounded-xl border p-5 bg-card shadow-sm transition-all flex flex-col justify-between gap-4 ${
        student.active ? "border-border/60" : "border-border/30 opacity-75"
      }`}
    >
      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`name-${student.id}`}>Nome</Label>
            <Input
              id={`name-${student.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`email-${student.id}`}>Email</Label>
            <Input
              id={`email-${student.id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`whatsapp-${student.id}`}>WhatsApp (opcional)</Label>
            <Input
              id={`whatsapp-${student.id}`}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setName(student.name);
                setEmail(student.email);
                setWhatsapp(student.whatsapp ?? "");
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <p className="font-bold text-primary text-base tracking-tight">
                {student.name}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {student.email}
              </p>
              {student.whatsapp && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {student.whatsapp}
                </p>
              )}
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                student.active
                  ? "bg-secondary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {student.active ? (
                <CheckCircle2 className="h-3 w-3 text-secondary" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {student.active ? "Ativo" : "Inativo"}
            </span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleActive}
              disabled={loading}
            >
              <Power className="h-3.5 w-3.5" />
              {student.active ? "Desativar" : "Reativar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCopyLink}>
              <Link2 className="h-3.5 w-3.5" />
              Copiar link público
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

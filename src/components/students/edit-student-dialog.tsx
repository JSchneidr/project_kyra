"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Student = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
};

export function EditStudentDialog({
  student,
  open,
  onOpenChange,
}: {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [whatsapp, setWhatsapp] = useState(student.whatsapp ?? "");

  async function handleSave() {
    setLoading(true);

    const res = await fetch(`/api/students/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, whatsapp: whatsapp || null }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json();
      toast.error(
        typeof body.error === "string" ? body.error : "Não foi possível atualizar o aluno."
      );
      return;
    }

    toast.success("Aluno atualizado.");
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar aluno</DialogTitle>
          <DialogDescription>Atualize os dados de contato de {student.name}.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`name-${student.id}`}>Nome</Label>
            <Input id={`name-${student.id}`} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`email-${student.id}`}>Email</Label>
            <Input id={`email-${student.id}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`whatsapp-${student.id}`}>WhatsApp (opcional)</Label>
            <Input id={`whatsapp-${student.id}`} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
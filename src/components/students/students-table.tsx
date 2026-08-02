"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Power, Link2, CheckCircle2, AlertCircle } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EditStudentDialog } from "@/components/students/edit-student-dialog";

type Student = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  active: boolean;
  share_token: string;
};

export function StudentsTable({ students }: { students: Student[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggleActive(student: Student) {
    setLoadingId(student.id);

    const res = await fetch(`/api/students/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !student.active }),
    });

    setLoadingId(null);

    if (!res.ok) {
      const body = await res.json();
      toast.error(
        typeof body.error === "string" ? body.error : "Não foi possível atualizar o status do aluno."
      );
      return;
    }

    toast.success(student.active ? "Aluno desativado." : "Aluno reativado.");
    router.refresh();
  }

  function handleCopyLink(student: Student) {
    const url = `${window.location.origin}/share/${student.share_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link público copiado.");
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id} className={!student.active ? "opacity-60" : undefined}>
              <TableCell className="font-medium text-primary">{student.name}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{student.email}</span>
                  {student.whatsapp && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{student.whatsapp}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    student.active ? "bg-secondary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {student.active ? <CheckCircle2 className="h-3 w-3 text-secondary" /> : <AlertCircle className="h-3 w-3" />}
                  {student.active ? "Ativo" : "Inativo"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <EditStudentDialog student={student} />
                  <Button size="sm" variant="outline" onClick={() => handleToggleActive(student)} disabled={loadingId === student.id}>
                    <Power className="h-3.5 w-3.5" />
                    {student.active ? "Desativar" : "Reativar"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCopyLink(student)}>
                    <Link2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
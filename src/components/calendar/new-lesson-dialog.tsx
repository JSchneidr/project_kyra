"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Student = { id: string; name: string };

// Converte um Date para o formato aceito por <input type="datetime-local">,
// no fuso local do navegador (o professor).
function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function NewLessonDialog({
  open,
  onOpenChange,
  students,
  initialStart,
  initialEnd,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  initialStart: Date | null;
  initialEnd: Date | null;
  onCreated: () => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStudentId("");
      setTitle("");
      setNotes("");
      setError(null);
      setStartAt(initialStart ? toLocalInputValue(initialStart) : "");
      setEndAt(
        initialEnd
          ? toLocalInputValue(initialEnd)
          : initialStart
          ? toLocalInputValue(new Date(initialStart.getTime() + 60 * 60 * 1000))
          : ""
      );
    }
  }, [open, initialStart, initialEnd]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!studentId) {
      setError("Selecione um aluno.");
      return;
    }
    if (!title.trim() && !notes.trim()) {
      setError("Informe pelo menos um título ou uma descrição.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const resBody = await res.json();
      setError(
        typeof resBody.error === "string"
          ? resBody.error
          : "Não foi possível agendar a aula."
      );
      return;
    }

    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar aula</DialogTitle>
          <DialogDescription>
            Ex: título "Blender Lessons", ou deixe o título em branco e
            descreva no campo abaixo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lesson-student">Aluno</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger id="lesson-student">
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lesson-start">Início</Label>
              <Input
                id="lesson-start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lesson-end">Fim</Label>
              <Input
                id="lesson-end"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lesson-title">Título (opcional)</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Blender Lessons"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lesson-notes">Descrição (opcional)</Label>
            <Textarea
              id="lesson-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que vai ser abordado nessa aula"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Agendando..." : "Agendar aula"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export type LessonDetails = {
  id: string;
  studentName: string;
  title: string | null;
  notes: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  startAt: string;
  endAt: string;
};

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function LessonDetailsDialog({
  lesson,
  onOpenChange,
  onUpdated,
}: {
  lesson: LessonDetails | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [newStartAt, setNewStartAt] = useState("");
  const [newEndAt, setNewEndAt] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title ?? "");
      setNotes(lesson.notes ?? "");
      setRescheduling(false);
      setReason("");
      setError(null);
      setNewStartAt(toLocalInputValue(lesson.startAt));
      setNewEndAt(toLocalInputValue(lesson.endAt));
    }
  }, [lesson]);

  if (!lesson) return null;

  async function patchLesson(payload: Record<string, unknown>) {
    if (!lesson) return false;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/lessons/${lesson.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json();
      setError(
        typeof body.error === "string" ? body.error : "Não foi possível atualizar a aula."
      );
      return false;
    }
    return true;
  }

  async function handleSaveDetails() {
    if (!title.trim() && !notes.trim()) {
      setError("Informe pelo menos um título ou uma descrição.");
      return;
    }
    const ok = await patchLesson({ title: title.trim() || null, notes: notes.trim() || null });
    if (ok) {
      onOpenChange(false);
      onUpdated();
    }
  }

  async function handleComplete() {
    const ok = await patchLesson({ status: "COMPLETED" });
    if (ok) {
      onOpenChange(false);
      onUpdated();
    }
  }

  async function handleCancel() {
    const ok = await patchLesson({ status: "CANCELLED" });
    if (ok) {
      onOpenChange(false);
      onUpdated();
    }
  }

  async function handleReschedule() {
    if (!lesson) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/lessons/${lesson.id}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        new_start_at: new Date(newStartAt).toISOString(),
        new_end_at: new Date(newEndAt).toISOString(),
        reason: reason.trim() || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json();
      setError(
        typeof body.error === "string" ? body.error : "Não foi possível remarcar a aula."
      );
      return;
    }

    onOpenChange(false);
    onUpdated();
  }

  const isScheduled = lesson.status === "SCHEDULED";

  return (
    <Dialog open={!!lesson} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{lesson.studentName}</DialogTitle>
          <DialogDescription>
            {isScheduled
              ? "Aula agendada"
              : lesson.status === "COMPLETED"
              ? "Aula concluída"
              : "Aula cancelada"}
          </DialogDescription>
        </DialogHeader>

        {rescheduling ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="reschedule-start">Novo início</Label>
                <Input
                  id="reschedule-start"
                  type="datetime-local"
                  value={newStartAt}
                  onChange={(e) => setNewStartAt(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reschedule-end">Novo fim</Label>
                <Input
                  id="reschedule-end"
                  type="datetime-local"
                  value={newEndAt}
                  onChange={(e) => setNewEndAt(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reschedule-reason">Motivo (opcional)</Label>
              <Input
                id="reschedule-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: aluno pediu para mudar de dia"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={() => setRescheduling(false)}>
                Voltar
              </Button>
              <Button onClick={handleReschedule} disabled={loading}>
                {loading ? "Remarcando..." : "Confirmar remarcação"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="details-title">Título</Label>
              <Input
                id="details-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Blender Lessons"
                disabled={!isScheduled}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="details-notes">Descrição</Label>
              <Textarea
                id="details-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isScheduled}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {isScheduled && (
              <DialogFooter className="sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRescheduling(true)}
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    Remarcar
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                    <XCircle className="h-3.5 w-3.5" />
                    Cancelar aula
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleSaveDetails} disabled={loading}>
                    Salvar
                  </Button>
                  <Button type="button" onClick={handleComplete} disabled={loading}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Concluir aula
                  </Button>
                </div>
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

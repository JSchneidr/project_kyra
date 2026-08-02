"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NewStudentForm } from "@/components/students/new-student-form";

export function NewStudentDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Adicionar aluno
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary" />
            Novo Aluno
          </DialogTitle>
          <DialogDescription>
            O email é o meio de comunicação principal; o WhatsApp é opcional.
          </DialogDescription>
        </DialogHeader>
        <NewStudentForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
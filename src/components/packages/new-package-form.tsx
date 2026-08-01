"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SelectGroup, SelectLabel } from "@radix-ui/react-select";

type Student = {
  id: string;
  name: string;
};

export function NewPackageForm({ students }: { students: Student[] }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string>("");
  const [packageTitle, setPackageTitle] = useState<string>("");
  const [packageSize, setPackageSize] = useState("5");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!studentId) {
      setError("Selecione um aluno.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        package_title: packageTitle,
        package_size: Number(packageSize),
        price: Number(price),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json();
      setError(
        typeof body.error === "string"
          ? body.error
          : "Não foi possível criar o pacote."
      );
      return;
    }

    setPrice("");
    setPackageSize("5");
    setPackageTitle("");
    setStudentId("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="package_title">Título do Pacote</Label>
        <Input
          id="package_title"
          type="text"
          value={packageTitle}
          onChange={(e) => setPackageTitle(e.target.value)}
          placeholder="Ex: Pacote de 5 aulas"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="student">Aluno</Label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger id="student" className="w-full max-w-48">
            <SelectValue placeholder="Selecione um aluno" />
          </SelectTrigger>
          <SelectContent position="item-aligned">
            <SelectGroup>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="package_size">Qtd. de aulas</Label>
          <Input
            id="package_size"
            type="number"
            min={1}
            value={packageSize}
            onChange={(e) => setPackageSize(e.target.value)}
            required
          />
        </div>

       <div className="flex flex-col gap-2">
          <Label htmlFor="price">Preço (USD)</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="pl-6"
              placeholder="0.00"
              required
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Criando..." : "Criar pacote"}
      </Button>
    </form>
  );
}

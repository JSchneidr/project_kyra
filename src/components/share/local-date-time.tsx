"use client";

// Converte um ISO (armazenado em UTC) para o fuso local de quem está
// vendo a página — o navegador do aluno, não o do professor.
export function LocalDateTime({
  iso,
  withWeekday = false,
}: {
  iso: string;
  withWeekday?: boolean;
}) {
  const date = new Date(iso);

  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    weekday: withWeekday ? "short" : undefined,
  }).format(date);

  return <span>{formatted}</span>;
}

export function LocalDate({ iso }: { iso: string }) {
  const date = new Date(iso);
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  return <span>{formatted}</span>;
}

"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const VIEWS = [
  { key: "dayGridMonth", label: "Month" },
  { key: "timeGridWeek", label: "Week" },
  { key: "timeGridDay", label: "Day" },
  { key: "listWeek", label: "List" },
] as const;

export function CalendarToolbar({
  title,
  currentView,
  onToday,
  onPrev,
  onNext,
  onChangeView,
  onAddEvent,
}: {
  title: string;
  currentView: string;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onChangeView: (view: string) => void;
  onAddEvent: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
      <div className="flex items-center gap-2">
        <Button onClick={onAddEvent}>
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
        <Button variant="outline" onClick={onToday}>
          Today
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold text-primary min-w-[10ch] text-center">
          {title}
        </span>
      </div>

      <div className="inline-flex items-center gap-0.5 rounded-full bg-muted p-1">
        {VIEWS.map((view) => (
          <button
            key={view.key}
            type="button"
            onClick={() => onChangeView(view.key)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              currentView === view.key
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}

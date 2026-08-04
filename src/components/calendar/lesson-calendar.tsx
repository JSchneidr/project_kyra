"use client";

import { useCallback, useRef, useState } from "react";
import interactionPlugin from "@fullcalendar/react/interaction";
import FullCalendar from "@fullcalendar/react";
import type {
  CalendarController,
  DateClickInfo,
  EventClickInfo,
  EventDropInfo,
  EventInput,
} from "@fullcalendar/react";
import { EventCalendar } from "@/components/event-calendar";
import { NewLessonDialog } from "@/components/calendar/new-lesson-dialog";
import {
  LessonDetailsDialog,
  type LessonDetails,
} from "@/components/calendar/lesson-details-dialog";

type Student = { id: string; name: string };

type LessonRow = {
  id: string;
  title: string | null;
  notes: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  start_at: string;
  end_at: string;
  students: { name: string } | null;
};

interface LessonCalendarProps {
  students: Student[];
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

function eventClassNames(status: LessonRow["status"], readOnly?: boolean) {
  const basePointer = readOnly ? "cursor-default select-none" : "";
  
  switch (status) {
    case "COMPLETED":
      return `!bg-accent/20 !border-accent !text-primary ${basePointer}`;
    case "CANCELLED":
      return `!bg-muted !border-border !text-muted-foreground line-through opacity-60 ${basePointer}`;
    default:
      return `!bg-secondary/20 !border-secondary !text-primary ${basePointer}`;
  }
}

export function LessonCalendar({ students, readOnly = false, size='md' }: LessonCalendarProps) {
  const controllerRef = useRef<CalendarController | null>(null);

  const [newLessonOpen, setNewLessonOpen] = useState(false);
  const [newLessonRange, setNewLessonRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  const [selectedLesson, setSelectedLesson] = useState<LessonDetails | null>(null);

  const calendarRef = useRef<React.ComponentRef<typeof FullCalendar> | null>(null);

  const refetch = useCallback(() => {
    calendarRef.current?.getApi().refetchEvents();
  }, []);

  // Funções tratam a trava do readOnly sem quebrar os adereços do FullCalendar
  function handleDateClick(arg: DateClickInfo) {
    if (readOnly) return;
    setNewLessonRange({ start: arg.date, end: null });
    setNewLessonOpen(true);
  }

  function handleEventClick(arg: EventClickInfo) {
    if (readOnly) return;
    const props = arg.event.extendedProps as {
      notes: string | null;
      status: LessonRow["status"];
      studentName: string;
      originalTitle: string | null;
    };

    setSelectedLesson({
      id: arg.event.id,
      title: props.originalTitle,
      notes: props.notes,
      status: props.status,
      studentName: props.studentName,
      startAt: arg.event.startStr,
      endAt: arg.event.endStr,
    });
  }

  async function handleEventDrop(arg: EventDropInfo) {
    if (readOnly) {
      arg.revert();
      return;
    }

    const res = await fetch(`/api/lessons/${arg.event.id}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        new_start_at: arg.event.start?.toISOString(),
        new_end_at: (arg.event.end ?? arg.event.start)?.toISOString(),
      }),
    });

    if (!res.ok) {
      arg.revert();
      const body = await res.json();
      alert(
        typeof body.error === "string"
          ? body.error
          : "Não foi possível remarcar a aula arrastando."
      );
    }
  }

  return (
    <>
      {/* Container com altura mínima garantida (h-full min-h-[600px]) para não sumir no flexbox/grid */}
      <div className={`w-full h-full ${readOnly ? "[&_.fc-event]:pointer-events-none [&_.fc-daygrid-day]:pointer-events-none" : ""}`}>
        <EventCalendar
          size={size}
          borderless
          controllerRef={controllerRef}
          calendarRef={calendarRef}
          plugins={[interactionPlugin]}
          availableViews={["dayGridMonth", "timeGridWeek", "timeGridDay", "listWeek"]}
          addButton={
            readOnly
              ? undefined
              : {
                  text: "Add Event",
                  click: () => {
                    setNewLessonRange({ start: new Date(), end: null });
                    setNewLessonOpen(true);
                  },
                }
          }
          locale="pt-br"
          firstDay={1}
          dayMaxEvents
          editable={!readOnly}
          selectable={!readOnly}
          allDaySlot={false}
          height="100%"
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventClass={(info) =>
            eventClassNames(
              info.event.extendedProps.status as LessonRow["status"],
              readOnly
            )
          }
          events={async (info, successCallback, failureCallback) => {
            try {
              const params = new URLSearchParams({
                start: info.startStr,
                end: info.endStr,
              });
              const res = await fetch(`/api/lessons?${params.toString()}`);
              const body = await res.json();

              if (!res.ok) {
                failureCallback(new Error(body.error ?? "Erro ao carregar aulas"));
                return;
              }

              const events: EventInput[] = (body.lessons as LessonRow[]).map(
                (lesson) => ({
                  id: lesson.id,
                  title:
                    lesson.title ||
                    lesson.notes?.slice(0, 30) ||
                    lesson.students?.name ||
                    "Aula",
                  start: lesson.start_at,
                  end: lesson.end_at,
                  extendedProps: {
                    notes: lesson.notes,
                    status: lesson.status,
                    studentName: lesson.students?.name ?? "Aluno removido",
                    originalTitle: lesson.title,
                  },
                })
              );

              successCallback(events);
            } catch (err) {
              failureCallback(err as Error);
            }
          }}
        />
      </div>

      {!readOnly && (
        <>
          <NewLessonDialog
            open={newLessonOpen}
            onOpenChange={setNewLessonOpen}
            students={students}
            initialStart={newLessonRange.start}
            initialEnd={newLessonRange.end}
            onCreated={refetch}
          />

          <LessonDetailsDialog
            lesson={selectedLesson}
            onOpenChange={(open) => {
              if (!open) setSelectedLesson(null);
            }}
            onUpdated={refetch}
          />
        </>
      )}
    </>
  );
}
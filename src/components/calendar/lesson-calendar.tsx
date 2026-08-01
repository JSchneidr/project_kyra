"use client";

import { useCallback, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import type {
  DatesSetArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { NewLessonDialog } from "@/components/calendar/new-lesson-dialog";
import {
  LessonDetailsDialog,
  type LessonDetails,
} from "@/components/calendar/lesson-details-dialog";
import "@/styles/calendar.css";

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

function eventClassNames(status: LessonRow["status"]) {
  switch (status) {
    case "COMPLETED":
      return ["!bg-accent/20", "!border-accent", "!text-primary"];
    case "CANCELLED":
      return ["!bg-muted", "!border-border", "!text-muted-foreground", "line-through", "opacity-60"];
    default:
      return ["!bg-secondary/20", "!border-secondary", "!text-primary"];
  }
}

export function LessonCalendar({ students }: { students: Student[] }) {
  const calendarRef = useRef<FullCalendar | null>(null);

  const [title, setTitle] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");

  const [newLessonOpen, setNewLessonOpen] = useState(false);
  const [newLessonRange, setNewLessonRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  const [selectedLesson, setSelectedLesson] = useState<LessonDetails | null>(null);

  const refetch = useCallback(() => {
    calendarRef.current?.getApi().refetchEvents();
  }, []);

  function handleDatesSet(arg: DatesSetArg) {
    setTitle(arg.view.title);
    setCurrentView(arg.view.type);
  }

  function handleDateClick(arg: DateClickArg) {
    setNewLessonRange({ start: arg.date, end: null });
    setNewLessonOpen(true);
  }

  function handleAddEventClick() {
    setNewLessonRange({ start: new Date(), end: null });
    setNewLessonOpen(true);
  }

  function handleEventClick(arg: EventClickArg) {
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
      startAt: arg.event.startStr,
      endAt: arg.event.endStr,
    });
  }

  async function handleEventDrop(arg: EventDropArg) {
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
      <CalendarToolbar
        title={title}
        currentView={currentView}
        onToday={() => calendarRef.current?.getApi().today()}
        onPrev={() => calendarRef.current?.getApi().prev()}
        onNext={() => calendarRef.current?.getApi().next()}
        onChangeView={(view) => calendarRef.current?.getApi().changeView(view)}
        onAddEvent={handleAddEventClick}
      />

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={false}
        locale="pt-br"
        firstDay={1}
        weekNumbers
        dayMaxEvents
        editable
        selectable
        allDaySlot={false}
        height="auto"
        datesSet={handleDatesSet}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventClassNames={(arg) =>
          eventClassNames(arg.event.extendedProps.status as LessonRow["status"])
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
  );
}

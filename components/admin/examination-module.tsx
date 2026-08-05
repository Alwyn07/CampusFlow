"use client";

import { FormEvent, useMemo, useState } from "react";

type Option = { id: string; label: string };
type Exam = {
  id: string;
  title: string;
  code: string;
  type: string;
  academicYear: string;
  term: string;
  status: string;
  startsOn: string;
  endsOn: string;
  schedules: number;
};
type Schedule = {
  id: string;
  examId: string;
  classId: string;
  subjectId: string;
  scheduleDate: string;
  startsAt: string;
  endsAt: string;
  status: string;
  instructions: string;
  examTitle: string;
  classCode: string;
  subjectCode: string;
  rooms: string;
  invigilators: string;
};
type Room = Option & { capacity: number };
type Faculty = Option;

type ExaminationModuleProps = {
  exams: Exam[];
  schedules: Schedule[];
  rooms: Room[];
  classes: Option[];
  subjects: Option[];
  faculty: Faculty[];
};

const examTypes = ["INTERNAL", "MIDTERM", "SEMESTER", "SUPPLEMENTARY", "IMPROVEMENT"];
const examStatuses = ["DRAFT", "SCHEDULED", "ONGOING", "COMPLETED", "RESULT_PROCESSING", "PUBLISHED", "ARCHIVED"];
const scheduleStatuses = ["DRAFT", "CONFIRMED", "RESCHEDULED", "CANCELLED", "COMPLETED"];
const assignmentRoles = ["CHIEF_SUPERINTENDENT", "INVIGILATOR", "RELIEVER", "OBSERVER"];

function toInputDate(value: string) {
  return value ? value.slice(0, 10) : "";
}

function toInputDateTime(value: string) {
  return value ? value.slice(0, 16) : "";
}

function formObject(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

export function ExaminationModule(props: ExaminationModuleProps) {
  const [exams, setExams] = useState(props.exams);
  const [schedules, setSchedules] = useState(props.schedules);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState(props.schedules[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState<Array<{ type: string; message: string }>>([]);

  const calendarRows = useMemo(
    () =>
      [...schedules].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    [schedules],
  );

  async function refresh() {
    const [examRes, scheduleRes] = await Promise.all([
      fetch("/api/exams"),
      fetch("/api/exam-schedules"),
    ]);
    const examData = await examRes.json();
    const scheduleData = await scheduleRes.json();
    setExams(
      (examData.items ?? []).map((exam: {
        id: string;
        title: string;
        code: string;
        type: string;
        academicYear: string;
        term: string;
        status: string;
        startsOn: string | null;
        endsOn: string | null;
        _count?: { schedules?: number };
      }) => ({
        id: exam.id,
        title: exam.title,
        code: exam.code,
        type: exam.type,
        academicYear: exam.academicYear,
        term: exam.term,
        status: exam.status,
        startsOn: exam.startsOn ?? "",
        endsOn: exam.endsOn ?? "",
        schedules: exam._count?.schedules ?? 0,
      })),
    );
    setSchedules(
      (scheduleData.items ?? []).map((schedule: {
        id: string;
        examId: string;
        classId: string;
        subjectId: string;
        scheduleDate: string;
        startsAt: string;
        endsAt: string;
        status: string;
        instructions: string | null;
        exam: { title: string };
        class: { code: string };
        subject: { code: string };
        roomAllocations: Array<{ room: { code: string } }>;
        assignments: Array<{ faculty: { user: { name: string } } }>;
      }) => ({
        id: schedule.id,
        examId: schedule.examId,
        classId: schedule.classId,
        subjectId: schedule.subjectId,
        scheduleDate: schedule.scheduleDate,
        startsAt: schedule.startsAt,
        endsAt: schedule.endsAt,
        status: schedule.status,
        instructions: schedule.instructions ?? "",
        examTitle: schedule.exam.title,
        classCode: schedule.class.code,
        subjectCode: schedule.subject.code,
        rooms: schedule.roomAllocations.map((item) => item.room.code).join(", "),
        invigilators: schedule.assignments.map((item) => item.faculty.user.name).join(", "),
      })),
    );
  }

  async function submitJson(path: string, method: string, payload: object) {
    setError("");
    setMessage("");
    setConflicts([]);
    const response = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setConflicts(data?.conflicts ?? []);
      throw new Error(data?.error ?? "Action failed.");
    }
    return data;
  }

  async function saveExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = formObject(event.currentTarget);
      await submitJson(editingExam ? `/api/exams/${editingExam.id}` : "/api/exams", editingExam ? "PATCH" : "POST", payload);
      setEditingExam(null);
      event.currentTarget.reset();
      await refresh();
      setMessage("Exam saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save exam.");
    }
  }

  async function saveSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const payload = formObject(event.currentTarget);
      await submitJson(editingSchedule ? `/api/exam-schedules/${editingSchedule.id}` : "/api/exam-schedules", editingSchedule ? "PATCH" : "POST", payload);
      setEditingSchedule(null);
      event.currentTarget.reset();
      await refresh();
      setMessage("Timetable session saved and notifications queued when confirmed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save session.");
    }
  }

  async function allocateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await submitJson("/api/room-allocations", "POST", formObject(event.currentTarget));
      await refresh();
      setMessage("Hall allocated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to allocate hall.");
    }
  }

  async function assignInvigilator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await submitJson("/api/invigilator-assignments", "POST", formObject(event.currentTarget));
      await refresh();
      setMessage("Invigilator assigned and notified.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to assign invigilator.");
    }
  }

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await submitJson("/api/exam-rooms", "POST", formObject(event.currentTarget));
      setMessage("Hall created. Refresh the page to use it in allocations.");
      event.currentTarget.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create hall.");
    }
  }

  async function cancelExam(id: string) {
    if (!confirm("Cancel this exam and all related sessions?")) return;
    try {
      await submitJson(`/api/exams/${id}/cancel`, "POST", {});
      await refresh();
      setMessage("Exam cancelled and notifications queued.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to cancel exam.");
    }
  }

  async function cancelSchedule(id: string) {
    if (!confirm("Cancel this timetable session?")) return;
    try {
      await submitJson(`/api/exam-schedules/${id}`, "DELETE", {});
      await refresh();
      setMessage("Session cancelled and notifications queued.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to cancel session.");
    }
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Examination Module</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Exam scheduling and duty control</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Create exams, build timetables, allocate halls, assign invigilators, detect conflicts, and notify users automatically.
          </p>
        </div>
      </div>

      {error ? <p className="mt-5 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
      {message ? <p className="mt-5 rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      {conflicts.length ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {conflicts.map((conflict, index) => (
            <p key={`${conflict.type}-${index}`}>{conflict.message}</p>
          ))}
        </div>
      ) : null}

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <form onSubmit={saveExam} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">{editingExam ? "Edit exam" : "Create exam"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input name="title" required placeholder="Exam title" defaultValue={editingExam?.title} className="h-11 rounded-md border px-3" />
            <input name="code" required placeholder="Code" defaultValue={editingExam?.code} className="h-11 rounded-md border px-3" />
            <select name="type" required defaultValue={editingExam?.type ?? "INTERNAL"} className="h-11 rounded-md border px-3">
              {examTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
            <select name="status" required defaultValue={editingExam?.status ?? "DRAFT"} className="h-11 rounded-md border px-3">
              {examStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <input name="academicYear" required placeholder="2025-2026" defaultValue={editingExam?.academicYear} className="h-11 rounded-md border px-3" />
            <input name="term" required placeholder="March 2026" defaultValue={editingExam?.term} className="h-11 rounded-md border px-3" />
            <input name="startsOn" type="date" defaultValue={toInputDate(editingExam?.startsOn ?? "")} className="h-11 rounded-md border px-3" />
            <input name="endsOn" type="date" defaultValue={toInputDate(editingExam?.endsOn ?? "")} className="h-11 rounded-md border px-3" />
          </div>
          <div className="mt-4 flex gap-3">
            <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{editingExam ? "Update exam" : "Create exam"}</button>
            {editingExam ? <button type="button" onClick={() => setEditingExam(null)} className="rounded-md border px-4 py-2 text-sm">Cancel edit</button> : null}
          </div>
        </form>

        <form onSubmit={saveSchedule} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">{editingSchedule ? "Edit timetable session" : "Create timetable session"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <select name="examId" required defaultValue={editingSchedule?.examId ?? ""} className="h-11 rounded-md border px-3">
              <option value="">Exam</option>
              {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.code} - {exam.title}</option>)}
            </select>
            <select name="classId" required defaultValue={editingSchedule?.classId ?? ""} className="h-11 rounded-md border px-3">
              <option value="">Class</option>
              {props.classes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <select name="subjectId" required defaultValue={editingSchedule?.subjectId ?? ""} className="h-11 rounded-md border px-3">
              <option value="">Subject</option>
              {props.subjects.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <select name="status" required defaultValue={editingSchedule?.status ?? "DRAFT"} className="h-11 rounded-md border px-3">
              {scheduleStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <input name="scheduleDate" type="date" required defaultValue={toInputDate(editingSchedule?.scheduleDate ?? "")} className="h-11 rounded-md border px-3" />
            <input name="startsAt" type="datetime-local" required defaultValue={toInputDateTime(editingSchedule?.startsAt ?? "")} className="h-11 rounded-md border px-3" />
            <input name="endsAt" type="datetime-local" required defaultValue={toInputDateTime(editingSchedule?.endsAt ?? "")} className="h-11 rounded-md border px-3" />
            <input name="instructions" placeholder="Instructions" defaultValue={editingSchedule?.instructions} className="h-11 rounded-md border px-3" />
          </div>
          <div className="mt-4 flex gap-3">
            <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{editingSchedule ? "Update session" : "Create session"}</button>
            {editingSchedule ? <button type="button" onClick={() => setEditingSchedule(null)} className="rounded-md border px-4 py-2 text-sm">Cancel edit</button> : null}
          </div>
        </form>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-3">
        <form onSubmit={createRoom} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Create exam hall</h2>
          <div className="mt-4 grid gap-4">
            <input name="code" required placeholder="Hall code" className="h-11 rounded-md border px-3" />
            <input name="name" required placeholder="Hall name" className="h-11 rounded-md border px-3" />
            <div className="grid grid-cols-2 gap-4">
              <input name="building" placeholder="Building" className="h-11 rounded-md border px-3" />
              <input name="floor" placeholder="Floor" className="h-11 rounded-md border px-3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select name="type" defaultValue="CLASSROOM" className="h-11 rounded-md border px-3">
                {["CLASSROOM", "LAB", "HALL", "AUDITORIUM"].map((type) => <option key={type}>{type}</option>)}
              </select>
              <input name="capacity" type="number" required placeholder="Capacity" className="h-11 rounded-md border px-3" />
            </div>
          </div>
          <button className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Create hall</button>
        </form>

        <form onSubmit={allocateRoom} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Hall allocation</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <select name="scheduleId" required value={selectedScheduleId} onChange={(event) => setSelectedScheduleId(event.target.value)} className="h-11 rounded-md border px-3">
              <option value="">Session</option>
              {schedules.map((item) => <option key={item.id} value={item.id}>{item.classCode} - {item.subjectCode}</option>)}
            </select>
            <select name="roomId" required className="h-11 rounded-md border px-3">
              <option value="">Hall</option>
              {props.rooms.map((room) => <option key={room.id} value={room.id}>{room.label} ({room.capacity})</option>)}
            </select>
            <input name="capacityUsed" type="number" required placeholder="Capacity used" className="h-11 rounded-md border px-3" />
          </div>
          <button className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Allocate hall</button>
        </form>

        <form onSubmit={assignInvigilator} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Invigilator assignment</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <select name="scheduleId" required defaultValue={selectedScheduleId} className="h-11 rounded-md border px-3">
              <option value="">Session</option>
              {schedules.map((item) => <option key={item.id} value={item.id}>{item.classCode} - {item.subjectCode}</option>)}
            </select>
            <select name="roomId" required className="h-11 rounded-md border px-3">
              <option value="">Hall</option>
              {props.rooms.map((room) => <option key={room.id} value={room.id}>{room.label}</option>)}
            </select>
            <select name="facultyId" required className="h-11 rounded-md border px-3">
              <option value="">Faculty</option>
              {props.faculty.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <select name="role" required defaultValue="INVIGILATOR" className="h-11 rounded-md border px-3">
              {assignmentRoles.map((role) => <option key={role}>{role}</option>)}
            </select>
            <input name="notes" placeholder="Notes" className="h-11 rounded-md border px-3 sm:col-span-2" />
          </div>
          <button className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Assign invigilator</button>
        </form>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-950">Exam calendar and timetable</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Exam</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Halls</th>
                <th className="px-5 py-3">Invigilators</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calendarRows.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3">{new Date(item.scheduleDate).toLocaleDateString()}</td>
                  <td className="px-5 py-3">{new Date(item.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(item.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-5 py-3">{item.examTitle}</td>
                  <td className="px-5 py-3">{item.classCode}</td>
                  <td className="px-5 py-3">{item.subjectCode}</td>
                  <td className="px-5 py-3">{item.rooms || "-"}</td>
                  <td className="px-5 py-3">{item.invigilators || "-"}</td>
                  <td className="px-5 py-3">{item.status}</td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <button onClick={() => setEditingSchedule(item)} className="mr-3 font-medium text-emerald-700">Edit</button>
                    <button onClick={() => cancelSchedule(item.id)} className="font-medium text-red-600">Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-950">Exams</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <tbody className="divide-y divide-slate-100">
              {exams.map((exam) => (
                <tr key={exam.id}>
                  <td className="px-5 py-3 font-medium">{exam.code}</td>
                  <td className="px-5 py-3">{exam.title}</td>
                  <td className="px-5 py-3">{exam.type}</td>
                  <td className="px-5 py-3">{exam.status}</td>
                  <td className="px-5 py-3">{exam.schedules} sessions</td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <button onClick={() => setEditingExam(exam)} className="mr-3 font-medium text-emerald-700">Edit</button>
                    <button onClick={() => cancelExam(exam.id)} className="font-medium text-red-600">Cancel exam</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

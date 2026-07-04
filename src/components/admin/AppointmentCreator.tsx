"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";

const now = new Date();
const defaultStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
defaultStart.setMinutes(0, 0, 0);
const defaultEnd = new Date(defaultStart.getTime() + 45 * 60 * 1000);

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AppointmentCreator() {
  const [startTime, setStartTime] = useState(toLocalInputValue(defaultStart));
  const [endTime, setEndTime] = useState(toLocalInputValue(defaultEnd));
  const [modality, setModality] = useState("in_person");
  const [notes, setNotes] = useState("Appointment created from the operations console.");
  const [createGoogleEvent, setCreateGoogleEvent] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        modality,
        notes,
        createGoogleEvent,
      }),
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    setStatus("saved");
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#dbeafe] text-[#1d4ed8]">
          <CalendarPlus className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-semibold text-[#262626]">Create appointment</h2>
          <p className="text-sm text-[#737373]">Uses Google Calendar when calendar sync is selected and configured.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-[#262626]">
          Start
          <input
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2 text-[#262626] outline-none focus:border-[#60a5fa]"
          />
        </label>
        <label className="text-sm font-medium text-[#262626]">
          End
          <input
            type="datetime-local"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2 text-[#262626] outline-none focus:border-[#60a5fa]"
          />
        </label>
        <label className="text-sm font-medium text-[#262626]">
          Mode
          <select
            value={modality}
            onChange={(event) => setModality(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2 text-[#262626] outline-none focus:border-[#60a5fa]"
          >
            <option value="in_person">In person</option>
            <option value="virtual">Virtual</option>
            <option value="phone">Phone</option>
          </select>
        </label>
        <label className="flex items-end gap-3 text-sm font-medium text-[#262626]">
          <input
            type="checkbox"
            checked={createGoogleEvent}
            onChange={(event) => setCreateGoogleEvent(event.target.checked)}
            className="mb-2 h-4 w-4 rounded border-[#e5e5e5] bg-[#fafafa]"
          />
          Sync calendar event when credentials exist
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-[#262626]">
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-3 py-2 text-[#262626] outline-none focus:border-[#60a5fa]"
        />
      </label>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-[#ffffff] disabled:opacity-60"
        >
          {status === "saving" ? "Creating..." : "Create appointment"}
        </button>
        {status === "saved" ? <span className="text-sm text-[#1d4ed8]">Appointment created.</span> : null}
        {status === "error" ? <span className="text-sm text-red-700">Could not create appointment.</span> : null}
      </div>
    </form>
  );
}

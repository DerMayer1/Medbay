import { google } from "googleapis";

export type Slot = {
  start: string;
  end: string;
};

function getCalendarClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function getAvailableSlots(startDate?: string, endDate?: string): Promise<Slot[]> {
  const calendar = getCalendarClient();
  const timeZone = process.env.CLINIC_TIMEZONE || "America/Sao_Paulo";
  const duration = Number(process.env.DEFAULT_APPOINTMENT_DURATION_MINUTES || 60);

  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (!calendar || !process.env.GOOGLE_CALENDAR_ID) {
    return buildBusinessHourSlots(start, end, duration);
  }

  const busy = await calendar.freebusy.query({
    requestBody: {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      timeZone,
      items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
    },
  });

  const busySlots = busy.data.calendars?.[process.env.GOOGLE_CALENDAR_ID]?.busy || [];
  return buildBusinessHourSlots(start, end, duration).filter((slot) => {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();
    return !busySlots.some((item) => {
      const busyStart = new Date(item.start || "").getTime();
      const busyEnd = new Date(item.end || "").getTime();
      return slotStart < busyEnd && slotEnd > busyStart;
    });
  });
}

function buildBusinessHourSlots(start: Date, end: Date, durationMinutes: number) {
  const slots: Slot[] = [];
  const cursor = new Date(start);
  cursor.setHours(9, 0, 0, 0);

  while (cursor < end && slots.length < 30) {
    const day = cursor.getDay();
    const hour = cursor.getHours();
    if (day >= 1 && day <= 5 && hour >= 9 && hour <= 17) {
      const slotEnd = new Date(cursor.getTime() + durationMinutes * 60 * 1000);
      slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
    }
    cursor.setHours(cursor.getHours() + 1);
  }

  return slots;
}

export async function createCalendarEvent(input: {
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
}) {
  const calendar = getCalendarClient();
  if (!calendar || !process.env.GOOGLE_CALENDAR_ID) return { googleEventId: undefined };

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startTime, timeZone: process.env.CLINIC_TIMEZONE || "America/Sao_Paulo" },
      end: { dateTime: input.endTime, timeZone: process.env.CLINIC_TIMEZONE || "America/Sao_Paulo" },
    },
  });

  return { googleEventId: event.data.id || undefined };
}

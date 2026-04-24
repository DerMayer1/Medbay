import type { Lead } from "@/types/lead";

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phonePattern = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4})[-\s]?\d{4}/;

export function extractLeadHints(message: string): Partial<Lead> {
  const email = message.match(emailPattern)?.[0];
  const phone = message.match(phonePattern)?.[0];
  const text = message.toLowerCase();
  const extracted: Partial<Lead> = {};

  if (email) extracted.email = email;
  if (phone) extracted.phone = phone;
  if (/\bprimeira\b|\b1[ªa]?\s*consulta\b/.test(text)) extracted.consultationType = "first_consultation";
  if (/\bretorno\b/.test(text)) extracted.consultationType = "return";
  if (/\bonline\b/.test(text)) extracted.modality = "online";
  if (/\bpresencial\b/.test(text)) extracted.modality = "in_person";

  if (/meu nome [eé]\s+/.test(text)) {
    extracted.name = message.replace(/.*meu nome [eé]\s+/i, "").trim().slice(0, 120);
  }

  return extracted;
}

export function extractLeadByState(message: string, state: string): Partial<Lead> {
  const extracted = extractLeadHints(message);
  const clean = message.trim().slice(0, 240);

  if (state === "collecting_name" && !extracted.name) extracted.name = clean;
  if (state === "collecting_consultation_type" && !extracted.consultationType) {
    extracted.consultationType = /retorno/i.test(clean) ? "return" : "first_consultation";
  }
  if (state === "collecting_goal" && !extracted.goal) extracted.goal = clean;
  if (state === "collecting_modality" && !extracted.modality) {
    extracted.modality = /presencial/i.test(clean) ? "in_person" : /online/i.test(clean) ? "online" : "unknown";
  }
  if (state === "collecting_schedule_preference" && !extracted.schedulePreference) {
    extracted.schedulePreference = clean;
  }
  if (state === "collecting_contact" && !extracted.phone && !extracted.email) {
    if (clean.includes("@")) extracted.email = clean;
    else extracted.phone = clean;
  }

  return extracted;
}

import { Resend } from "resend";
import { isDemoMode } from "@/lib/constants";
import type { Lead } from "@/types/lead";

let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY || isDemoMode()) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export function renderLeadEmail(lead: Partial<Lead>, summary?: string) {
  return `New Medbay clinic intake event.

Patient: ${lead.name || "Not provided"}
Contact: ${lead.contact || lead.phone || lead.email || "Not provided"}
Reason for visit: ${lead.reasonForVisit || lead.reason_for_visit || lead.goal || "Not provided"}
Preferred service: ${lead.preferredService || lead.preferred_service || lead.consultation_type || "Not provided"}
Urgency: ${lead.urgencyLevel || lead.urgency_level || "Not provided"}
Availability: ${lead.availability || lead.schedulePreference || lead.schedule_preference || "Not provided"}
Payment: ${lead.paymentType || lead.payment_type || "Not provided"}
Status: ${lead.status || "new"}

AI intake summary:
${summary || lead.summary || "No summary available yet."}

Open the Medbay admin dashboard to review the full conversation.`;
}

export async function notifyTeam(subject: string, lead: Partial<Lead>, summary?: string) {
  const client = getResend();
  const to = process.env.TEAM_EMAIL;
  const from = process.env.FROM_EMAIL;

  if (!client || !to || !from) {
    const event = { mocked: true, subject, text: renderLeadEmail(lead, summary) };
    console.info("demo_email_notification", event);
    return event;
  }

  return client.emails.send({ from, to, subject, text: renderLeadEmail(lead, summary) });
}

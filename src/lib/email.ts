import { Resend } from "resend";
import type { Lead } from "@/types/lead";

let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export function renderLeadEmail(lead: Partial<Lead>, summary?: string) {
  return `Novo atendimento recebido pela Secretária Virtual.

Nome: ${lead.name || "Não informado"}
Contato: ${lead.phone || lead.email || "Não informado"}
Tipo: ${lead.consultationType || lead.consultation_type || "Não informado"}
Objetivo: ${lead.goal || "Não informado"}
Modalidade: ${lead.modality || "Não informado"}
Preferência: ${lead.schedulePreference || lead.schedule_preference || "Não informado"}
Status: ${lead.status || "new"}

Resumo da conversa:
${summary || lead.summary || "Resumo ainda não disponível."}

Acesse o painel para visualizar o histórico completo.`;
}

export async function notifyTeam(subject: string, lead: Partial<Lead>, summary?: string) {
  const client = getResend();
  const to = process.env.TEAM_EMAIL;
  const from = process.env.FROM_EMAIL;

  if (!client || !to || !from) return { skipped: true };

  return client.emails.send({
    from,
    to,
    subject,
    text: renderLeadEmail(lead, summary),
  });
}

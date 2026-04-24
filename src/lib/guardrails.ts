import { CLINICAL_HANDOFF_REPLY } from "@/lib/constants";
import type { AssistantOutput } from "@/types/assistant";
import type { Intent } from "@/types/lead";

const clinicalPatterns = [
  /\bdieta\b/i,
  /\bcard[aá]pio\b/i,
  /\bplano alimentar\b/i,
  /\bsuplement/i,
  /\bcreatina\b/i,
  /\bwhey\b/i,
  /\bcaloria/i,
  /\bmacro/i,
  /\bexame/i,
  /\bdiagn[oó]st/i,
  /\bmedicamento/i,
  /\brem[eé]dio/i,
  /\btranstorno alimentar\b/i,
  /\banorexia\b/i,
  /\bbulimia\b/i,
  /\bgesta/i,
  /\bgr[aá]vida\b/i,
  /\bsintoma/i,
  /\bdor\b/i,
];

const complaintPatterns = [
  /\breclama/i,
  /\birritad/i,
  /\babsurdo\b/i,
  /\bp[ée]ssim/i,
  /\bnunca respondem\b/i,
];

export function requiresClinicalHandoff(message: string) {
  return clinicalPatterns.some((pattern) => pattern.test(message));
}

export function isComplaint(message: string) {
  return complaintPatterns.some((pattern) => pattern.test(message));
}

export function classifyIntent(message: string): Intent {
  const text = message.toLowerCase();

  if (requiresClinicalHandoff(message)) return "clinical_question";
  if (isComplaint(message)) return "complaint";
  if (/\b(humano|atendente|equipe|pessoa|falar com algu[eé]m)\b/i.test(text)) return "human_handoff";
  if (/\b(remarcar|reagendar|mudar hor[aá]rio)\b/i.test(text)) return "reschedule_appointment";
  if (/\b(cancelar|desmarcar)\b/i.test(text)) return "cancel_appointment";
  if (/\b(pre[cç]o|valor|quanto custa|investimento)\b/i.test(text)) return "ask_price";
  if (/\b(endere[cç]o|local|onde fica|presencial)\b/i.test(text)) return "ask_location";
  if (/\b(online|presencial|modalidade)\b/i.test(text)) return "ask_online_or_in_person";
  if (/\b(como funciona|acompanhamento|consulta)\b/i.test(text)) return "ask_how_it_works";
  if (/\b(retorno|pol[ií]tica)\b/i.test(text)) return "ask_return_policy";
  if (/\b(enviar exames|mandar exames|exames)\b/i.test(text)) return "send_exams";
  if (/\b(agendar|marcar|hor[aá]rio|consulta|quero atendimento)\b/i.test(text)) return "schedule_appointment";

  return "other";
}

export function applyDeterministicGuardrails(message: string, output: AssistantOutput): AssistantOutput {
  const intent = classifyIntent(message);

  if (intent === "clinical_question" || intent === "complaint") {
    return {
      ...output,
      reply: CLINICAL_HANDOFF_REPLY,
      intent,
      leadState: "human_handoff",
      handoffRequired: true,
      handoffReason: intent,
      shouldNotifyTeam: true,
      shouldCheckCalendar: false,
      shouldCreateAppointment: false,
    };
  }

  return {
    ...output,
    intent: output.intent === "other" ? intent : output.intent,
  };
}

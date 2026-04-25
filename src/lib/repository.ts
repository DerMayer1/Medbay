import { isDemoMode } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { ChatMessage, KnowledgeItem, Lead } from "@/types/lead";

const defaultKnowledge: KnowledgeItem[] = [
  {
    id: "services-primary-care",
    category: "services",
    title: "Northstar Clinic services",
    content:
      "Northstar Clinic is a fictional demo clinic offering primary care, dermatology, orthopedics, cardiology, pediatrics, and behavioral health intake workflows.",
    active: true,
  },
  {
    id: "safety-admin-only",
    category: "safety",
    title: "AI safety scope",
    content:
      "The assistant handles administrative intake, scheduling support, knowledge-base answers, and human handoff. It does not provide diagnosis, prescriptions, clinical advice, diet plans, supplement guidance, or exam interpretation.",
    active: true,
  },
  {
    id: "schedule-demo",
    category: "schedule",
    title: "Demo scheduling hours",
    content: "Demo appointment slots are available Monday through Friday from 9:00 AM to 5:00 PM.",
    active: true,
  },
];

const memory = {
  conversations: new Map<string, Record<string, unknown>>(),
  messages: new Map<string, ChatMessage[]>(),
  leads: new Map<string, Partial<Lead> & { id: string }>(),
  appointments: new Map<string, Record<string, unknown>>(),
  knowledge: defaultKnowledge,
};

const demoLeads: Array<Partial<Lead> & { id: string }> = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Alex Morgan",
    email: "alex@example.com",
    contact: "alex@example.com",
    reason_for_visit: "New patient dermatology consult",
    preferred_service: "Dermatology",
    urgency_level: "medium",
    availability: "Tuesday or Thursday afternoon",
    payment_type: "insurance",
    status: "qualified",
    source: "demo",
    summary: "Qualified dermatology intake. Patient prefers afternoon availability and will use insurance.",
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Jordan Lee",
    phone: "555-010-0123",
    contact: "555-010-0123",
    reason_for_visit: "Asked for clinical interpretation of lab results",
    preferred_service: "Primary care",
    urgency_level: "high",
    availability: "Today if possible",
    payment_type: "self_pay",
    handoff_required: true,
    status: "waiting_human",
    source: "demo",
    summary: "Needs human review because the user requested lab interpretation.",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

export async function getActiveKnowledge() {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) return memory.knowledge;

  const { data, error } = await supabase
    .from("knowledge_items")
    .select("*")
    .eq("active", true)
    .order("category");

  if (error || !data?.length) return defaultKnowledge;
  return data as KnowledgeItem[];
}

export async function listKnowledge() {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) return memory.knowledge;

  const { data, error } = await supabase.from("knowledge_items").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createKnowledgeItem(input: Omit<KnowledgeItem, "id">) {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    const item = { ...input, id: crypto.randomUUID() } as KnowledgeItem;
    memory.knowledge.unshift(item);
    return item;
  }

  const { data, error } = await supabase.from("knowledge_items").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateKnowledgeItem(id: string, input: Partial<KnowledgeItem>) {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    memory.knowledge = memory.knowledge.map((item) => (item.id === id ? { ...item, ...input } : item));
    return memory.knowledge.find((item) => item.id === id);
  }

  const { data, error } = await supabase.from("knowledge_items").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function ensureConversation(conversationId: string, visitorId: string, source = "landing_page") {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    if (!memory.conversations.has(conversationId)) {
      memory.conversations.set(conversationId, {
        id: conversationId,
        visitor_id: visitorId,
        status: "new",
        source,
        created_at: new Date().toISOString(),
      });
    }
    return memory.conversations.get(conversationId);
  }

  const { data: existing } = await supabase.from("conversations").select("*").eq("id", conversationId).maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ id: conversationId, visitor_id: visitorId, source })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role,
      content,
      metadata,
      created_at: new Date().toISOString(),
    };
    const messages = memory.messages.get(conversationId) || [];
    messages.push(message);
    memory.messages.set(conversationId, messages);
    return message;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content, metadata })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getRecentMessages(conversationId: string, limit = 12) {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) return (memory.messages.get(conversationId) || []).slice(-limit);

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).reverse() as ChatMessage[];
}

export async function upsertLeadForConversation(conversationId: string, lead: Partial<Lead>) {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    const conversation = memory.conversations.get(conversationId);
    const existingId = conversation?.lead_id as string | undefined;
    const id = existingId || crypto.randomUUID();
    const existing = memory.leads.get(id) || { id, source: "landing_page", status: "new" };
    const next = { ...existing, ...lead, id } as Partial<Lead> & { id: string };
    memory.leads.set(id, next);
    memory.conversations.set(conversationId, { ...conversation, lead_id: id, status: next.status });
    return next;
  }

  const { data: conversation } = await supabase.from("conversations").select("lead_id").eq("id", conversationId).maybeSingle();
  const dbLead = {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    contact: lead.contact,
    reason_for_visit: lead.reasonForVisit || lead.reason_for_visit || lead.goal,
    preferred_service: lead.preferredService || lead.preferred_service || lead.consultation_type,
    urgency_level: lead.urgencyLevel || lead.urgency_level,
    availability: lead.availability || lead.schedulePreference || lead.schedule_preference,
    payment_type: lead.paymentType || lead.payment_type,
    handoff_required: lead.handoffRequired || lead.handoff_required || false,
    consultation_type: lead.consultationType || lead.consultation_type || lead.preferredService || lead.preferred_service,
    goal: lead.goal || lead.reasonForVisit || lead.reason_for_visit,
    modality: lead.modality,
    schedule_preference: lead.schedulePreference || lead.schedule_preference,
    status: lead.status,
    source: lead.source || "landing_page",
    summary: lead.summary,
    updated_at: new Date().toISOString(),
  };

  if (conversation?.lead_id) {
    const { data, error } = await supabase
      .from("leads")
      .update(dbLead)
      .eq("id", conversation.lead_id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from("leads").insert(dbLead).select("*").single();
  if (error) throw error;
  await supabase.from("conversations").update({ lead_id: data.id, status: data.status }).eq("id", conversationId);
  return data;
}

export async function getLeadForConversation(conversationId: string) {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    const conversation = memory.conversations.get(conversationId);
    const leadId = conversation?.lead_id as string | undefined;
    return leadId ? memory.leads.get(leadId) : null;
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("lead_id, leads(*)")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation?.lead_id) return null;
  const embedded = conversation.leads;
  if (embedded) return embedded as Partial<Lead>;

  const { data } = await supabase.from("leads").select("*").eq("id", conversation.lead_id).maybeSingle();
  return data as Partial<Lead> | null;
}

export async function updateConversationStatus(
  conversationId: string,
  input: { status?: string; last_intent?: string; handoff_required?: boolean; handoff_reason?: string; summary?: string },
) {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    const existing = memory.conversations.get(conversationId) || {};
    memory.conversations.set(conversationId, { ...existing, ...input, updated_at: new Date().toISOString() });
    return;
  }

  await supabase
    .from("conversations")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function listLeads() {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    const liveLeads = Array.from(memory.leads.values());
    return liveLeads.length ? liveLeads : demoLeads;
  }

  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getLeadBundle(id: string) {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    const lead = memory.leads.get(id) || demoLeads.find((item) => item.id === id);
    const conversation = Array.from(memory.conversations.values()).find((item) => item.lead_id === id);
    const messages = conversation?.id ? memory.messages.get(conversation.id as string) || [] : [];
    return { lead, conversation, messages, appointments: [] };
  }

  const { data: lead, error } = await supabase.from("leads").select("*").eq("id", id).single();
  if (error) throw error;
  const { data: conversation } = await supabase.from("conversations").select("*").eq("lead_id", id).maybeSingle();
  const { data: messages } = conversation
    ? await supabase.from("messages").select("*").eq("conversation_id", conversation.id).order("created_at")
    : { data: [] };
  const { data: appointments } = await supabase.from("appointments").select("*").eq("lead_id", id).order("start_time");
  return { lead, conversation, messages, appointments };
}

export async function updateLeadRecord(id: string, input: Partial<Lead> & { notes?: string }) {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    const existing = memory.leads.get(id) || demoLeads.find((item) => item.id === id) || { id, source: "demo" };
    const updated = { ...existing, ...input, id, updated_at: new Date().toISOString() } as Partial<Lead> & {
      id: string;
    };
    memory.leads.set(id, updated);
    return updated;
  }

  const { data, error } = await supabase
    .from("leads")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listConversations() {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    const liveConversations = Array.from(memory.conversations.values());
    if (liveConversations.length) return liveConversations;
    return demoLeads.map((lead) => ({
      id: `conversation-${lead.id}`,
      lead_id: lead.id,
      status: lead.status,
      last_intent: lead.status === "waiting_human" ? "clinical_question" : "patient_intake",
      summary: lead.summary,
      updated_at: lead.created_at,
    }));
  }

  const { data, error } = await supabase
    .from("conversations")
    .select("*, leads(*)")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function listAppointments() {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    const liveAppointments = Array.from(memory.appointments.values());
    if (liveAppointments.length) return liveAppointments;
    return [
      {
        id: "33333333-3333-4333-8333-333333333333",
        lead_id: demoLeads[0].id,
        start_time: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        end_time: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
        modality: "in_person",
        status: "pending_confirmation",
        google_event_id: "demo-calendar-event",
      },
    ];
  }

  const { data, error } = await supabase.from("appointments").select("*, leads(*)").order("start_time", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createAppointmentRecord(record: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    const appointment = {
      id: crypto.randomUUID(),
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memory.appointments.set(String(appointment.id), appointment);
    return appointment;
  }

  const { data, error } = await supabase.from("appointments").insert(record).select("*").single();
  if (error) throw error;
  return data;
}

export async function writeAuditLog(input: {
  actor?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  if (isDemoMode() || !supabase) {
    console.info("demo_audit_log", input);
    return;
  }

  await supabase.from("audit_logs").insert({
    actor: input.actor || "system",
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata || {},
  });
}

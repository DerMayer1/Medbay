import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { ChatMessage, KnowledgeItem, Lead } from "@/types/lead";

const defaultKnowledge: KnowledgeItem[] = [
  {
    id: "prices-placeholder",
    category: "prices",
    title: "Valores",
    content: "Valores ainda não cadastrados. Quando perguntarem, informar que a equipe confirmará por contato humano.",
    active: true,
  },
  {
    id: "general-placeholder",
    category: "general",
    title: "Escopo da assistente",
    content: "A assistente atua apenas em dúvidas administrativas, triagem e pré-agendamento.",
    active: true,
  },
];

const memory = {
  conversations: new Map<string, Record<string, unknown>>(),
  messages: new Map<string, ChatMessage[]>(),
  leads: new Map<string, Partial<Lead> & { id: string }>(),
  knowledge: defaultKnowledge,
};

export async function getActiveKnowledge() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return memory.knowledge;

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
  if (!supabase) return memory.knowledge;

  const { data, error } = await supabase.from("knowledge_items").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createKnowledgeItem(input: Omit<KnowledgeItem, "id">) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
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
  if (!supabase) {
    memory.knowledge = memory.knowledge.map((item) => (item.id === id ? { ...item, ...input } : item));
    return memory.knowledge.find((item) => item.id === id);
  }

  const { data, error } = await supabase.from("knowledge_items").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function ensureConversation(conversationId: string, visitorId: string, source = "landing_page") {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
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
  if (!supabase) {
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
  if (!supabase) return (memory.messages.get(conversationId) || []).slice(-limit);

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
  if (!supabase) {
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
    consultation_type: lead.consultationType || lead.consultation_type,
    goal: lead.goal,
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
  if (!supabase) {
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
  if (!supabase) {
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
  if (!supabase) return Array.from(memory.leads.values());

  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getLeadBundle(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const lead = memory.leads.get(id);
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

export async function listConversations() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return Array.from(memory.conversations.values());

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
  if (!supabase) return [];

  const { data, error } = await supabase.from("appointments").select("*, leads(*)").order("start_time", { ascending: true });
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
  if (!supabase) return;

  await supabase.from("audit_logs").insert({
    actor: input.actor || "system",
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata || {},
  });
}

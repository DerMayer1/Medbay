import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { ChatMessage, KnowledgeItem, Lead } from "@/types/lead";

function requireSupabaseAdmin() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase service role is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return supabase;
}

export async function getActiveKnowledge() {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("knowledge_items")
    .select("*")
    .eq("active", true)
    .order("category");

  if (error) throw error;
  return (data || []) as KnowledgeItem[];
}

export async function listKnowledge() {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.from("knowledge_items").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createKnowledgeItem(input: Omit<KnowledgeItem, "id">) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.from("knowledge_items").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateKnowledgeItem(id: string, input: Partial<KnowledgeItem>) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.from("knowledge_items").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function ensureConversation(conversationId: string, visitorId: string, source = "landing_page") {
  const supabase = requireSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (existingError) throw existingError;
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
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content, metadata })
    .select("*")
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

export async function getRecentMessages(conversationId: string, limit = 12) {
  const supabase = requireSupabaseAdmin();
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
  const supabase = requireSupabaseAdmin();
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("lead_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (conversationError) throw conversationError;

  const consultationType = lead.consultationType || lead.consultation_type;

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
    consultation_type:
      consultationType === "first_consultation" || consultationType === "return" || consultationType === "unknown"
        ? consultationType
        : undefined,
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
  const { error: updateError } = await supabase
    .from("conversations")
    .update({ lead_id: data.id, status: data.status })
    .eq("id", conversationId);
  if (updateError) throw updateError;
  return data;
}

export async function getLeadForConversation(conversationId: string) {
  const supabase = requireSupabaseAdmin();
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("lead_id, leads(*)")
    .eq("id", conversationId)
    .maybeSingle();
  if (conversationError) throw conversationError;

  if (!conversation?.lead_id) return null;
  const embedded = conversation.leads;
  if (embedded) return embedded as Partial<Lead>;

  const { data, error } = await supabase.from("leads").select("*").eq("id", conversation.lead_id).maybeSingle();
  if (error) throw error;
  return data as Partial<Lead> | null;
}

export async function updateConversationStatus(
  conversationId: string,
  input: { status?: string; last_intent?: string; handoff_required?: boolean; handoff_reason?: string; summary?: string },
) {
  const supabase = requireSupabaseAdmin();
  const { error } = await supabase
    .from("conversations")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (error) throw error;
}

export async function listLeads() {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getLeadBundle(id: string) {
  const supabase = requireSupabaseAdmin();
  const { data: lead, error } = await supabase.from("leads").select("*").eq("id", id).single();
  if (error) throw error;

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("*")
    .eq("lead_id", id)
    .maybeSingle();
  if (conversationError) throw conversationError;

  const { data: messages, error: messagesError } = conversation
    ? await supabase.from("messages").select("*").eq("conversation_id", conversation.id).order("created_at")
    : { data: [], error: null };
  if (messagesError) throw messagesError;

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("*")
    .eq("lead_id", id)
    .order("start_time");
  if (appointmentsError) throw appointmentsError;

  const { data: auditEvents, error: auditError } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("entity_id", id)
    .order("created_at");
  if (auditError) throw auditError;

  return { lead, conversation, messages, appointments, auditEvents };
}

export async function updateLeadRecord(id: string, input: Partial<Lead> & { notes?: string }) {
  const supabase = requireSupabaseAdmin();
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
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("conversations")
    .select("*, leads(*)")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function listAppointments() {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.from("appointments").select("*, leads(*)").order("start_time", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createAppointmentRecord(record: Record<string, unknown>) {
  const supabase = requireSupabaseAdmin();
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
  const supabase = requireSupabaseAdmin();
  const { error } = await supabase.from("audit_logs").insert({
    actor: input.actor || "system",
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata || {},
  });
  if (error) throw error;
}

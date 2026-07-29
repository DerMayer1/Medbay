const now = "2026-07-03T12:00:00.000Z";

export async function withDemoFallback<T>(promise: Promise<T>, fallback: T, timeoutMs = 2500): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export const demoLeads = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Maya Chen",
    email: "maya.chen@example.com",
    phone: "(415) 555-0148",
    contact: "maya.chen@example.com",
    reason_for_visit: "Cardiology follow-up after referral for recurring palpitations.",
    preferred_service: "cardiology",
    urgency_level: "medium",
    availability: "Weekday mornings",
    payment_type: "insurance",
    handoff_required: false,
    status: "ready_for_scheduling",
    source: "landing_page",
    summary: "Patient intake and referral documents were assembled for physician review before the visit.",
    brief_review_status: "needs_review" as const,
    pre_consultation_brief: {
      schemaVersion: "2.0.1" as const,
      versionId: "aaaaaaaa-2222-4222-8222-aaaaaaaa2222",
      versionNumber: 1,
      caseId: "11111111-1111-4111-8111-111111111111",
      specialty: "cardiology" as const,
      consultationType: "first_consultation" as const,
      status: "needs_review" as const,
      generatedAt: now,
      generatedBy: "synthetic_stage_1" as const,
      contentSha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      purpose: "Prepare the cardiologist with source-linked context. This brief does not diagnose, score risk, or recommend treatment.",
      facts: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          section: "reason_for_visit" as const,
          label: "Reason for visit",
          value: "Cardiology follow-up for recurring palpitations.",
          citations: [{ documentId: "20000000-0000-4000-8000-000000000001", pageNumber: 1, quote: "Recurring palpitations; cardiology follow-up requested." }],
        },
        {
          id: "10000000-0000-4000-8000-000000000002",
          section: "medications" as const,
          label: "Patient-reported medication",
          value: "Propranolol 10 mg as needed.",
          citations: [{ documentId: "20000000-0000-4000-8000-000000000002", pageNumber: 1, quote: "Propranolol 10 mg as needed." }],
        },
        {
          id: "10000000-0000-4000-8000-000000000003",
          section: "prior_results" as const,
          label: "Prior result referenced",
          value: "Referral notes a previous ECG; the report itself is not attached.",
          citations: [{ documentId: "20000000-0000-4000-8000-000000000001", pageNumber: 1, quote: "Previous ECG referenced; report not attached." }],
        },
      ],
      sources: [
        {
          documentId: "20000000-0000-4000-8000-000000000001",
          fileName: "synthetic-referral.pdf",
          mimeType: "application/pdf" as const,
          byteSize: 1842,
          documentSha256: "1111111111111111111111111111111111111111111111111111111111111111",
          pages: [{ pageNumber: 1, text: "Recurring palpitations; cardiology follow-up requested. Previous ECG referenced; report not attached.", textSha256: "2222222222222222222222222222222222222222222222222222222222222222" }],
        },
        {
          documentId: "20000000-0000-4000-8000-000000000002",
          fileName: "synthetic-medications.pdf",
          mimeType: "application/pdf" as const,
          byteSize: 1210,
          documentSha256: "3333333333333333333333333333333333333333333333333333333333333333",
          pages: [{ pageNumber: 1, text: "Patient-reported medication: Propranolol 10 mg as needed.", textSha256: "4444444444444444444444444444444444444444444444444444444444444444" }],
        },
      ],
    },
    created_at: now,
    updated_at: now,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Jordan Lee",
    email: "jordan.lee@example.com",
    phone: "(212) 555-0199",
    contact: "(212) 555-0199",
    reason_for_visit: "Asked for interpretation of recent lab result.",
    preferred_service: "primary care",
    urgency_level: "high",
    availability: "Today after 3 PM",
    payment_type: "self_pay",
    handoff_required: true,
    status: "needs_human_review",
    intent: "clinical_question",
    source: "landing_page",
    summary: "Clinical interpretation request was blocked and routed to human review. No pre-consultation brief was approved.",
    brief_review_status: "draft" as const,
    pre_consultation_brief: null,
    created_at: now,
    updated_at: now,
  },
];

export const demoConversations = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    visitor_id: "portfolio-visitor-1",
    lead_id: demoLeads[0].id,
    status: "ready_for_scheduling",
    source: "landing_page",
    last_intent: "schedule_appointment",
    handoff_required: false,
    summary: demoLeads[0].summary,
    created_at: now,
    updated_at: now,
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    visitor_id: "portfolio-visitor-2",
    lead_id: demoLeads[1].id,
    status: "needs_human_review",
    source: "landing_page",
    last_intent: "clinical_question",
    handoff_required: true,
    handoff_reason: "exam_interpretation_request",
    summary: demoLeads[1].summary,
    created_at: now,
    updated_at: now,
  },
];

export const demoAppointments = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    lead_id: demoLeads[0].id,
    conversation_id: demoConversations[0].id,
    start_time: null,
    end_time: null,
    modality: "in_person",
    status: "requested",
    google_event_id: null,
    notes: "Patient availability: Weekday mornings",
    created_at: now,
    updated_at: now,
  },
];

export const demoKnowledge = [
  {
    id: "44444444-4444-4444-8444-444444444444",
    category: "services",
    title: "Northstar Clinic services",
    content: "Northstar Clinic supports primary care, dermatology, orthopedics, cardiology, pediatrics, and behavioral health intake.",
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    category: "safety",
    title: "AI safety scope",
    content: "The assistant supports administrative intake and routing. It does not diagnose, prescribe, or interpret clinical results.",
    active: true,
    created_at: now,
    updated_at: now,
  },
];

export function getDemoLeadBundle(id: string) {
  const lead = demoLeads.find((item) => item.id === id) || demoLeads[0];
  const conversation = demoConversations.find((item) => item.lead_id === lead.id) || demoConversations[0];
  return {
    lead,
    conversation,
    messages: [
      {
        id: "66666666-6666-4666-8666-666666666666",
        conversation_id: conversation.id,
        role: "user",
        content: lead.reason_for_visit,
        metadata: {},
        created_at: now,
      },
      {
        id: "77777777-7777-4777-8777-777777777777",
        conversation_id: conversation.id,
        role: "assistant",
        content: lead.handoff_required
          ? "I cannot interpret results. I can route this to clinic staff for review."
          : "I have the core intake details and can route this for scheduling review.",
        metadata: { caseStatus: lead.status, handoffRequired: lead.handoff_required },
        created_at: now,
      },
    ],
    appointments: demoAppointments.filter((appointment) => appointment.lead_id === lead.id),
    auditEvents: [
      {
        id: "88888888-8888-4888-8888-888888888888",
        actor: "system",
        action: "policy_evaluated",
        entity_type: "intake_case",
        entity_id: lead.id,
        metadata: lead.handoff_required
          ? { decision: "block", severity: "warning", flags: ["exam_interpretation_request"] }
          : { decision: "allow", severity: "info", flags: [] },
        created_at: now,
      },
      {
        id: "99999999-9999-4999-8999-999999999999",
        actor: "system",
        action: "intake_extracted",
        entity_type: "intake_case",
        entity_id: lead.id,
        metadata: {
          extractedFields: {
            patientName: lead.name,
            contact: lead.contact,
            reasonForVisit: lead.reason_for_visit,
            requestedService: lead.preferred_service,
            urgencyLevel: lead.urgency_level,
            paymentType: lead.payment_type,
            availability: lead.availability,
          },
          completeness: { score: 100, missingFields: [], readyForScheduling: true },
        },
        created_at: now,
      },
      {
        id: "aaaaaaaa-1111-4aaa-8aaa-aaaaaaaa1111",
        actor: "system",
        action: lead.handoff_required ? "handoff_requested" : "appointment_requested",
        entity_type: "intake_case",
        entity_id: lead.id,
        metadata: lead.handoff_required
          ? { reason: "exam_interpretation_request", severity: "warning" }
          : { availability: lead.availability, appointmentId: demoAppointments[0].id, persisted: true },
        created_at: now,
      },
    ],
  };
}

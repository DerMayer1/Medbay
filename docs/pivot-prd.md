# Medbay 2.x Pivot PRD

**Status:** Active product direction  
**Current release:** 2.2.0 — Phase 0 deployment hardening  
**Brief schema version:** 2.0.1 (data contract; does not track the release version)  
**Last updated:** 2026-07-29  
**Reference clinic:** Northstar Clinic (fictional)

## 1. Executive Summary

Medbay is pivoting from a broad AI intake and clinic-operations assistant into a narrow, source-linked visit-preparation product for specialty clinics.

The product does not attempt to practice medicine. It organizes born-digital records into a factual pre-consultation brief, links every displayed fact to an exact document page and quote, identifies information that is missing, and requires an identified clinician to approve or reject an immutable version.

The first validation target is deliberately narrow:

- one fictional clinic
- one specialty: cardiology
- one visit type: first consultation
- born-digital PDFs only
- synthetic data only
- no diagnosis, clinical interpretation, risk scoring, or treatment recommendation

The immediate objective is to prove that the provenance, review, authorization, immutability, and audit contracts are reliable before adding real patient data, a production PDF parser, or a live AI drafting provider.

## 2. The Pivot

### Previous direction

Medbay began as a general clinic intake and operations platform. Its principal workflow converted patient conversations into structured intake cases, routed unsafe requests to humans, supported scheduling, and exposed an administrative console.

### New direction

Medbay 2.x focuses on the work immediately before a specialty consultation: reconstructing useful context from records while preserving evidence and clinician control.

The intake system remains supporting infrastructure, but it is no longer the central product thesis. The new core artifact is the `PreConsultationBrief`.

### Positioning

> Medbay turns scattered pre-visit records into a clinician-reviewed brief in which every factual statement can be traced to an exact source page.

Medbay is not an autonomous clinical agent, diagnostic system, medical search engine, or replacement for an EHR.

## 3. Problem Statement

Before a consultation, clinicians and staff often reconstruct context manually across referrals, medication lists, intake forms, prior reports, and other uploaded records. Generic AI summaries can reduce reading time, but they introduce a more serious problem when their claims cannot be verified quickly.

The product must therefore solve two problems together:

1. Reduce the work required to assemble relevant pre-visit context.
2. Make every output independently verifiable and keep the final decision with a clinician.

A faster summary without reliable provenance is not a successful product.

## 4. Product Thesis

Clinics may pay for AI-assisted visit preparation when the product:

- reduces repetitive record reconstruction
- makes supporting evidence faster to inspect
- prevents uncited or altered facts from reaching an approved artifact
- fits into a simple staff-to-clinician review workflow
- creates a durable audit record without claiming autonomous medical judgment

This thesis is not yet commercially validated. Stage 1 validates the engineering and safety contracts. A later clinic pilot must validate usability, time savings, willingness to adopt, and willingness to pay.

## 5. Buyer and Users

### Economic buyer

The expected buyer is a specialty-clinic owner, medical director, or operations leader responsible for clinician capacity, preparation quality, and workflow cost.

### Clinic operations staff

Operations staff create or locate the case, collect permitted source documents, confirm that extraction completed, and send a generated version for clinical review. Staff cannot make the final clinical-artifact decision.

### Clinician reviewer

The clinician verifies facts against their cited pages, approves or rejects the version, records a review reason, and exports an approved artifact. Only a verified `clinician` role may perform the final decision.

### Technical administrator

The technical administrator configures the deployment, providers, clinic membership, retention controls, monitoring, and incident response. Administrator access does not grant clinical approval authority.

### Patient

The patient may provide intake information and documents through a future clinic-controlled workflow. The patient is not the primary Stage 1 user, and Stage 1 uses no real patient data.

## 6. Stage 1 Objective

Prove with a synthetic cardiology cohort that Medbay can preserve an unbroken chain from source document to extracted page, factual statement, clinician decision, and audit event.

Stage 1 should answer:

- Can the system reject unsupported or malformed facts deterministically?
- Can a reviewer find the exact evidence for every displayed fact?
- Can generic administrators be prevented from approving clinical artifacts?
- Can stale or concurrent review attempts be rejected?
- Can approved content and review decisions remain immutable?
- Can the complete workflow be tested without real patient information?

Stage 1 does not attempt to prove clinical effectiveness or production readiness.

## 7. Stage 1 Workflow

```text
Create case
  -> attach up to five born-digital PDFs
  -> validate PDF type, signature, and 6 MB limit
  -> extract consecutive page text
  -> hash document and normalized page text
  -> generate a strictly structured factual draft
  -> verify every quote against its referenced page
  -> place immutable version in needs_review
  -> clinician approves or rejects with a reason
  -> atomically save decision, final status, and audit event
  -> print/export approved version
```

As of 2.2.0 the upload, extraction and generation path is connected end to end. Staff upload born-digital PDFs, `unpdf` extracts the page text, and a deterministic draft is generated and persisted for review. The interactive demo still ships with embedded fictional pages so a visitor sees a populated case without uploading anything.

## 8. Functional Requirements

### Case and source intake

- A case belongs to exactly one clinic.
- Stage 1 accepts only `application/pdf` documents whose bytes begin with `%PDF-`.
- A document must be between 1 byte and 6 MB.
- A case may have no more than five Stage 1 source documents.
- A document contains between 1 and 100 consecutive, one-based pages.
- Empty page text is rejected. Scanned PDFs and OCR are outside Stage 1.
- Document bytes and normalized page text receive SHA-256 hashes.

### Brief generation

- A brief uses the strict schema version `2.0.1`.
- Stage 1 supports only cardiology first consultations.
- Facts are restricted to the approved factual sections.
- Every fact has at least one citation.
- Every citation contains a document ID, page number, and exact quote.
- The quoted text must occur on the referenced extracted page.
- Unknown fields and unsupported specialties fail validation.
- A new correction creates a new version; it does not edit an existing version.

### Clinical boundaries

The brief must not produce or present:

- diagnosis or differential diagnosis
- clinical risk scores
- interpretation of exams, images, or laboratory results
- prescriptions or medication changes
- treatment recommendations
- guideline-based care recommendations
- claims that the system has clinically validated the underlying documents

### Review

- A final decision requires an authenticated clinician profile.
- Generic administrators and operations staff cannot approve or reject a version.
- Approval and rejection require a non-empty review reason.
- The request includes the expected content hash.
- A mismatched hash or previously finalized version returns a conflict.
- Approval is blocked when schema or provenance validation fails.
- Final decisions are immutable.

### Export and audit

- Only approved versions expose the print/export action.
- The exported view contains the approved immutable version and its evidence references.
- The review transaction records the clinician ID, decision, reason, timestamp, reviewed hash, and audit event atomically.
- Audit metadata must not duplicate full clinical source content unnecessarily.

## 9. Security and Privacy Requirements

- Stage 1 validation uses synthetic data only.
- Source PDFs use a private storage bucket.
- Data access is scoped by clinic membership.
- Row-level security is enabled on all new exposed clinical-artifact tables.
- Storage paths begin with the clinic identifier and are protected by storage policies.
- The service-role credential never reaches the browser.
- Clinical review uses the authenticated user session rather than the service-role client.
- Mutations enforce authentication, role authorization, same-origin protection, and rate limiting.
- Production use requires an approved retention and deletion policy, access logging, incident response, and jurisdiction-specific legal review.

## 10. Stage 1 Success Parameters

These are release gates, not retrospective claims.

| Area | Success gate |
| --- | --- |
| Synthetic cohort | At least 12 synthetic cardiology cases are represented in automated validation. |
| Schema | 100% of accepted briefs pass the strict 2.0.1 schema; malformed and unknown fields are rejected. |
| Provenance | 100% of facts in an approvable brief have at least one quote that exists on the referenced page. |
| Negative provenance | Every injected missing, fabricated, or wrong-page citation is blocked before approval. |
| Authorization | Non-clinician final-review attempts are rejected. |
| Concurrency | Stale expected hashes and repeated final decisions return a conflict without overwriting the first result. |
| Immutability | Source pages, brief content, and final decisions cannot be edited in place. |
| Atomicity | Status, review decision, and audit event succeed or fail in one database transaction. |
| Data boundary | Automated Stage 1 fixtures contain no real patient data. |
| Engineering | TypeScript, lint, unit tests, repository diff checks, and CI pass. |
| Claims | Documentation distinguishes implemented, synthetic-only, unverified, and planned capabilities. |

Stage 1 is complete only when the automated gates pass and the full synthetic workflow can be demonstrated without manual database editing.

As of 2026-07-29 all eleven gates have automated coverage in the repository suite. The synthetic vertical slice runs end to end from real PDF bytes to an approved version, and the immutability and atomicity gates are exercised in `tests/integration/databaseContracts.test.ts`, which applies every migration to an in-process PostgreSQL instance and asserts the triggers, row-level security, clinic isolation and transaction rollback behaviour.

One qualification: those database tests shim Supabase's `auth` and `storage` schemas, so they prove the SQL contracts but not the hosted integration. Storage policies, real JWT-derived `auth.uid()`, and migration application against a managed Supabase project remain unverified. `tests/integration/liveDatabase.test.ts` covers that layer and is skipped until `SUPABASE_TEST_URL`, `SUPABASE_TEST_SERVICE_ROLE_KEY` and `SUPABASE_TEST_ANON_KEY` are supplied.

## 11. Pilot Success Hypotheses

The following targets are proposals to test during a later supervised pilot. They are not validated results or Stage 1 acceptance criteria.

| Hypothesis | Proposed pilot target |
| --- | --- |
| Preparation efficiency | At least 30% reduction in median record-preparation time compared with the clinic's baseline. |
| Reviewer effort | Median clinician review time of three minutes or less for supported cases. |
| Brief usefulness | At least 80% of generated briefs are usable without a complete rewrite. |
| Citation quality | Zero uncited facts in an approved export; citation correction rate below 5%. |
| Safety | Zero autonomous diagnosis, interpretation, risk-score, or treatment outputs. |
| Adoption | At least 70% of eligible pilot cases are completed through the workflow after onboarding. |

The baseline, sample size, specialty-specific relevance, and measurement method must be agreed with the pilot clinic before these numbers are treated as commitments.

## 12. Current Implementation Truth

### Implemented in the 2.x line

- strict source, page, fact, citation, brief, and review schemas
- deterministic quote-to-page provenance validation
- PDF type, size, signature, page, and hashing boundary behind an extractor port
- synthetic cardiology brief and review experience
- required clinician review note and stale-content hash submission
- demo-mode atomic review behavior and audit event
- normalized Supabase migration for clinics, documents, pages, brief versions, and review decisions
- clinician-only atomic review RPC
- private storage and clinic-scoped RLS definitions
- print/export action for approved briefs
- 12-case synthetic cohort tests covering every approved fact section, multi-document and multi-page cases, and negative validation cases
- provenance re-verification on the authenticated approval path, not only in the synthetic demo path
- content digests derived from the reviewed content: by the database in a deployment, by a canonical serializer in the synthetic store
- a five-document Stage 1 budget enforced at the upload boundary and by a database trigger
- automated coverage for authorization, stale-hash concurrency, repeated final decisions, and wrong-page citations

### Implemented but not live-validated

- Supabase storage bucket and object policies
- JWT-derived `auth.uid()` as resolved by Supabase Auth
- migration application against a managed Supabase project

Every migration now applies cleanly to an in-process PostgreSQL 18 instance, and the triggers, policies, clinic isolation and review RPC are exercised there. What remains unverified is the hosted Supabase layer: the storage policies have no coverage, and `auth.uid()` is shimmed by a session setting rather than a real JWT claim.

### Connected in Stage 1B

- born-digital PDF parsing through `unpdf`, tested against real generated PDF bytes
- document upload screen, storage orchestration into the private bucket, and persisted source documents and pages
- deterministic, source-bounded draft generation in which every fact quotes the sentence it was derived from
- persisted end-to-end brief-version creation, with corrections producing a new version

### Not connected yet

- live AI provider for brief drafting (Stage 2)
- dedicated formatted PDF export; the current action is a browser print path
- operational retention/deletion workflow
- pilot analytics and outcome measurement

The current print action is a simple browser print/export path, not a dedicated medical-report generator.

## 13. Explicitly Deferred Scope

- OCR and scanned-document support
- FHIR ingestion
- MCP or direct EMR integration
- writes back to an EMR
- multiple specialties and visit types
- diagnosis, triage scoring, or clinical decision support
- guideline retrieval or medical RAG
- treatment planning or medication recommendations
- autonomous patient communication based on the brief
- multi-clinic administration and billing
- calendar or scheduling redesign
- mobile applications

Deferred capabilities should be introduced only when the preceding stage has evidence and the new risk is explicitly reviewed.

## 14. Delivery Stages

### Stage 1A — synthetic safety foundation (2.0.1)

Establish strict contracts, deterministic provenance, clinician-only final review, immutability, auditability, synthetic fixtures, and the database design.

### Stage 1B — complete synthetic vertical slice (2.1.0)

Connect the upload screen, a concrete born-digital PDF parser, storage orchestration, persisted version creation, deterministic generation fixtures, and export. Apply the migration in a disposable Supabase environment and test RLS, transactions, and failure recovery end to end.

Delivered, except that the migrations were exercised against an in-process PostgreSQL instance rather than a managed Supabase project. See Phase 0.

### Phase 0 — deployment hardening (2.2.0)

Make the existing stack safe to run outside demo mode, as the prerequisite for every commercial phase that follows.

| Item | Status |
| --- | --- |
| Stage 1 vertical slice merged to `main` | Done |
| Production dependency tree free of known high-severity advisories, gated in CI | Done |
| Credential-less admin refused whenever a service-role credential is present | Done |
| Structured JSON logging and a vendor-neutral error reporting seam | Done |
| Migrations applied to a managed Supabase project; storage policies and JWT `auth.uid()` verified | **Open** — see `docs/supabase-validation-runbook.md` |

Phase 0 is complete only when the runbook has been executed and its outcome recorded in §12.

### Stage 2 — supervised AI evaluation

Connect a source-bounded AI draft provider in an evaluation environment. Test valid and adversarial synthetic cases, measure citation precision and correction rates, and prevent unsafe output from entering review.

### Stage 3 — controlled clinic pilot

Complete legal, privacy, security, retention, monitoring, and incident-response requirements. Run a small supervised pilot with an agreed specialty, workflow, dataset, and measurement plan. No autonomous clinical action is introduced.

### Stage 4 — expansion gate

Consider additional document types, specialties, interoperability, and commercial packaging only if the pilot demonstrates useful time savings, reliable citations, safe operation, and adoption.

## 15. Risks and Failure Modes

| Risk | Required response |
| --- | --- |
| Fabricated or mismatched citation | Deterministically block approval and require a new version. |
| Correct quote attached to misleading fact | Clinician rejects the version; evaluation records the correction pattern. |
| Image-only or corrupted PDF | Reject extraction with an explicit unsupported-document message. |
| Stale reviewer screen | Reject the decision through expected-hash concurrency control. |
| Unauthorized approval | Deny through application authorization and database policy. |
| Cross-clinic access | Deny through clinic-scoped queries, RLS, storage policies, and isolation tests. |
| Partial approval write | Use one transaction for status, decision, and audit event. |
| Silent provider failure | Mark generation failed; never produce an approvable fallback artifact. |
| Product overclaim | Keep public documentation aligned with executable and deployed evidence. |
| Workflow adds more work than it saves | Stop expansion and revise or abandon the workflow based on pilot evidence. |

## 16. Open Decisions

- Which cardiology document types are mandatory for the first complete vertical slice?
- What exact brief sections do pilot clinicians consider useful?
- Should operations staff be allowed to reject for administrative reasons, or only return a case for correction?
- What retention and deletion periods apply to source documents, extracted text, and exports?
- Which PDF extraction library meets deployment, licensing, and security requirements?
- Which AI provider and structured-output contract will be evaluated in Stage 2?
- What clinic baseline will be used to measure preparation time and reviewer effort?
- What evidence is required before the product can be sold rather than piloted?

## 17. Definition of Product Success

Medbay succeeds only if it makes preparation meaningfully faster without weakening verification or clinician control.

Success is not the number of generated briefs. It is a workflow in which:

- the evidence is faster to inspect than the original record set
- unsupported facts do not reach approved artifacts
- clinicians retain the final decision
- the system behaves predictably under failure and concurrency
- clinics can measure time saved and trust the audit trail
- product claims remain narrower than or equal to demonstrated capability


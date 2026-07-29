# Medbay Product Spec

## Overview

Medbay is an AI-assisted visit-preparation platform for specialty clinics. The reference workspace uses a fictional clinic called Northstar Clinic.

## 2.0.1 Stage 1 Goal

Validate one narrow workflow with 12 synthetic cardiology cases before connecting real patient data or a live AI provider.

## In Scope

- One specialty: cardiology.
- One visit type: first consultation.
- Born-digital PDFs only, up to five documents and 6 MB each.
- Page text, document/page SHA-256 hashes, exact quoted citations.
- Strict factual brief schema; no diagnosis, risk score, interpretation, or treatment.
- Identified clinician approval/rejection with a required reason.
- Immutable versions, atomic final decision, audit record, and private storage model.

## Out of Scope

- OCR, FHIR, MCP, EMR writes, chatbot changes, calendar changes, guideline RAG, diagnosis, risk scoring, and treatment recommendations.
- Real patient data or clinic deployment in Stage 1.

## Existing Product Goals

- Convert inbound patient interest into structured intake records.
- Assemble source-linked pre-consultation briefs from available administrative and clinical records.
- Make missing documents visible before the visit.
- Require explicit human approval before a brief is treated as visit-preparation material.
- Qualify intake cases for staff review.
- Support scheduling workflows with Google Calendar.
- Escalate unsafe or clinical requests to humans.
- Manage clinic knowledge-base content.
- Provide a portfolio-ready admin dashboard.

## Users

- Patient: starts intake and asks administrative questions.
- Clinic operations staff: reviews intake cases, conversations, appointments, and knowledge.
- Technical administrator: configures providers and deployment.

## Core Modules

- Public intake
- Intake assistant
- Pre-consultation brief review
- Source provenance and missing-document checks
- Admin overview
- Intake Cases
- Conversations
- Appointments
- Knowledge Base
- Safety Rules / Settings

## Acceptance Criteria

- Required production providers are configured explicitly.
- Unsafe medical requests trigger handoff.
- Every displayed brief fact cites an exact quote on a known PDF page.
- A brief cannot be approved when its schema or any quote-to-page citation is invalid.
- Approval and rejection decisions are timestamped and audited.
- Generic administrators cannot make the final clinical-artifact decision.
- Concurrent/stale approval fails when the expected content hash differs.
- Intake creates persisted intake cases.
- Admin dashboard is usable.
- Knowledge-base items can be managed.
- Documentation explains architecture and setup.

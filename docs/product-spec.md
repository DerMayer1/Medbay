# Medbay Product Spec

## Overview

Medbay is an AI clinic operations platform for modern clinics. The reference workspace uses a fictional clinic called Northstar Clinic.

## Goals

- Convert inbound patient interest into structured intake records.
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
- Admin overview
- Intake Cases
- Conversations
- Appointments
- Knowledge Base
- Safety Rules / Settings

## Acceptance Criteria

- Required production providers are configured explicitly.
- Unsafe medical requests trigger handoff.
- Intake creates persisted intake cases.
- Admin dashboard is usable.
- Knowledge-base items can be managed.
- Documentation explains architecture and setup.

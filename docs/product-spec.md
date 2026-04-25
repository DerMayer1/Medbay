# Medbay Product Spec

## Overview

Medbay is an AI clinic operations platform for modern clinics. The demo workspace uses a fictional clinic called Northstar Clinic.

## Goals

- Convert inbound patient interest into structured intake records.
- Qualify leads for staff review.
- Support scheduling workflows with Google Calendar or a mock calendar.
- Escalate unsafe or clinical requests to humans.
- Manage clinic knowledge-base content.
- Provide a portfolio-ready admin dashboard.

## Users

- Patient or lead: starts intake and asks administrative questions.
- Clinic operations staff: reviews leads, conversations, appointments, and knowledge.
- Technical administrator: configures providers and deployment.

## Core Modules

- Public demo
- Intake assistant
- Admin overview
- Leads
- Conversations
- Appointments
- Knowledge Base
- Safety Rules / Settings

## Acceptance Criteria

- Demo mode works without external credentials.
- Unsafe medical requests trigger handoff.
- Intake creates or simulates leads.
- Admin dashboard is usable.
- Knowledge-base items can be managed.
- Documentation explains architecture and setup.

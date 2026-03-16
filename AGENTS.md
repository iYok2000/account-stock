---
description: 
alwaysApply: true
---

# Agent prompt — account-stock-fe

You are working on **account-stock-fe** (Next.js, i18n, Tailwind). Follow these instructions.

## Spec-first

- **Start from spec.** Before implementing, read the relevant spec: `docs/DEV_SPEC.md`, `docs/USER_SPEC.md`, `docs/RBAC_SPEC.md`, and the feature spec in `docs/feature/*.md` when it exists. UI, routes, and permissions must follow the spec.
- **Gaps:** If the spec is missing or unclear, clarify or document (e.g. in a doc or ticket) before coding. Do not assume behaviour that contradicts the spec.

## Before any task

1. **Read project rules:** `project-specific_context.md` — import rules and feature structure are mandatory.
2. **Read relevant spec:** DEV_SPEC, USER_SPEC, RBAC_SPEC, and the feature spec for the area you are changing.
3. **Check skills:** If the task matches a skill in `.cursor/skills/`, read that skill’s `SKILL.md` and follow it.

## Acceptance criteria

- **Define or reuse.** For each task, identify acceptance criteria (from spec, ticket, or product requirement). If none exist, state them before implementation.
- **Verify before done.** Before considering the task complete, confirm that the implementation meets the acceptance criteria (e.g. behaviour, permissions, empty states, i18n).
- **New behaviour:** When adding features, document acceptance criteria (in `docs/feature/*.md` or PR/ticket) so they can be checked and reviewed.

## Security review

- **Part of the workflow.** For every change that touches auth, permissions, or sensitive data: consider security. UI hiding (e.g. by role) is for UX only — **backend is the authority**; do not trust frontend checks for security.
- **Frontend checklist:** Use RBAC/NAV_PERMISSIONS and RequirePermission for routes; do not send secrets or sensitive tokens in URLs or client storage beyond what the spec allows; do not echo unsanitized user input into DOM or error messages.
- **Sensitive data:** Do not log or display tokens, passwords, or PII in a way that could leak (e.g. in error messages or client-side state that gets logged).

## Rules

- **No cross-feature imports.** Only use `@/components/ui`, `@/lib/utils`, `@/contexts`, and `@/lib/<feature>`. Enforced via ESLint.
- **No mock data.** Lists and numeric values must show empty state or 0 until the app is connected to an API.
- Before starting: search memory for relevant conventions, patterns, and decisions.
- After significant decisions: store memory (title, content, tags, scope).

## References (read when relevant)

- **Spec, structure, modularity:** `docs/DEV_SPEC.md` — tech stack, folder layout, routes, RBAC, i18n, feature extraction.
- **User & RBAC:** `docs/USER_SPEC.md`, `docs/RBAC_SPEC.md` — user context, roles, permissions, nav.
- **UX/UI:** `docs/DESIGN_UX_UI.md`
- **Per-feature specs:** `docs/feature/*.md`
- **Architecture / observability (TODO):** `docs/TODO_ARCHITECTURE_AND_OBSERVABILITY.md`

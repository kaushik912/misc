# Mattpocock skills: idea → ship workflow (notes app example)

Reusable reference. State lives in files (spec, tickets, glossary, ADRs), never only in chat, so any session can resume.

## Overview

```
setup (once) → grill → [prototype/research] → to-spec → to-tickets → /clear
→ implement (per ticket, /clear between) → code-review → pr → retro
```

Keep grill → to-spec → to-tickets in ONE unbroken context (no clear/compact until after to-tickets). Smart zone ≈150k tokens; if near it, `/compact` at a phase boundary.

## Step by step

### 0. Setup (once per repo)
- `/setup-matt-pocock-skills`
  - Choices used: local markdown tracker, default triage labels, single-context, `CLAUDE.md`.
  - Writes `CLAUDE.md` (## Agent skills) + `docs/agents/{issue-tracker,triage-labels,domain}.md`.
- Optional: `/setup-pre-commit`, `/git-guardrails-claude-code`, `/setup-ts-deep-modules`.
- Lost? `/ask-matt "<situation>"` routes you to the right skill.

### 1. Clarify
- `/grill-with-docs I want to build a notes app`
  - Interview in rounds; each question has a recommended answer. Reply by number or "accept all".
  - Writes `GLOSSARY.md` inline as terms resolve; offers ADRs sparingly (`docs/adr/0001-...md`).
  - Challenge/redirect any time ("I don't want markdown, just plain text"); earlier answers get revised.
  - Finish by confirming the shared-understanding summary ("yes").
- Side tools as needed:
  - `/research "<question>"` cited findings file
  - `/prototype` throwaway answer to a design question (bridge with `/handoff`)
  - `/to-questionnaire` questions for someone else
  - `/wayfinder` only if the effort is too big for one session
  - `/wait-what` when a message didn't land

### 2. Plan
- `/to-spec`
  - No interview. Proposes test seams first; confirm ("yes"). Fewer seams is better (ideal: one).
  - Publishes `.scratch/<feature>/spec.md` with `Status: ready-for-agent`.
- `/to-tickets`
  - Proposes numbered tracer-bullet tickets with blocking edges; confirm granularity/edges ("approve").
  - Publishes `.scratch/<feature>/issues/NN-slug.md`, one file each (Blocked by, Status, acceptance checkboxes).
- Do NOT `/triage` these tickets; they're already agent-ready. `/triage` is only for raw external issues/bugs.

### 3. Build
Fresh session per ticket (`/clear` between):
```
Read CLAUDE.md, GLOSSARY.md, docs/adr/, .scratch/<feature>/spec.md.
Then /implement .scratch/<feature>/issues/01-<slug>.md
```
- `/implement` drives `/tdd` (red-green slices) and `/code-review` per ticket.
- Or whole spec at once: `/implement-spec` (parallel subagents on one integration branch, one `/code-review` at the end).
- Next ticket = any whose blockers are all done. After finishing: set ticket `Status:` to done, tick boxes, commit, push.
- Bugs: `/diagnosing-bugs "<symptom>"`.
- PR body: `/pr` (model-invoked).

### 4. Wrap
- `/retro` in the session it reviews, before clearing.
- Spare moment: `/improve-codebase-architecture`.

## Resuming

| Situation | Do |
|---|---|
| Context too big, planning done | `/clear`, then the prompt in step 3 |
| Mid-phase, need compression | `/compact` at a phase boundary (default) |
| New harness/directory/colleague, or fork a side task | `/handoff`, then "read handoff doc X and continue" |
| Hand work to a background agent | `/claude-handoff` |
| Cold restart, nothing else | "Read CLAUDE.md, GLOSSARY.md, docs/adr/, spec, and tickets. Pick the next unblocked ticket and /implement it." |

Always commit and push `.scratch/`, `GLOSSARY.md`, `docs/`: cloud containers are ephemeral.

## Notes-app decisions (this project)
- Local-first PWA, plain text (no Markdown), single user, ~10k notes. ADR 0001: no server in v1.
- Stack: TypeScript, Vite, React, textarea, IndexedDB + Dexie + MiniSearch, Vitest + Playwright.
- Layout: deep `core/` (public interface) + `ui/`.
- Note = plain text; Title = first non-blank line; Tag = inline `#tag` (flat, case-insensitive); Trash with restore; Export bundle = zip of `<id>.txt`.
- Test seams: `core/` public interface (Vitest + fake-indexeddb) primary; 2–3 Playwright smoke flows.
- 12 tickets; frontier: 01 → 02 → {03, 06, 09} → ...

## Gotchas seen
- In the cloud session these skills weren't registered as slash commands; the agent read each `SKILL.md` and followed it. Same outcome, but invoke by name in your own environment.
- `.scratch/` tracker = files only; nothing on GitHub unless you pick the GitHub tracker in setup.

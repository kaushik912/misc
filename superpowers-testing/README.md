# superpowers-testing

Sandbox for **testing [Superpowers](https://github.com/obra/superpowers)**, the skills framework for coding agents, in Claude Code.

The plugin is enabled project-wide in `/.claude/settings.json`
(`superpowers@superpowers-marketplace`). Restart Claude Code after cloning so it loads.

## Verify the install

Start a fresh session in this folder and send:

> Let's make a todo app.

A working install triggers the **brainstorming** skill *before* any code is written.
If the agent jumps straight to coding, the plugin isn't loaded.

## Full Superpowers workflow (reference)

| # | Skill | Does |
|---|-------|------|
| 1 | `brainstorming` | Questions, 2-3 approaches, sectioned design; saves spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` |
| 2 | `using-git-worktrees` | Isolated branch workspace, clean test baseline |
| 3 | `writing-plans` | 2-5 min tasks with file paths, code, verify steps; saves to `docs/superpowers/plans/` |
| 4 | `subagent-driven-development` / `executing-plans` | Fresh subagent per task + review, or inline execution |
| 5 | `test-driven-development` | Red-green-refactor; code before tests gets deleted |
| 6 | `requesting-code-review` | Review vs plan, issues by severity |
| 7 | `finishing-a-development-branch` | Verify tests; merge / PR / keep / discard |

Skills trigger automatically; no slash command is needed.

## Minimum P0 workflow

Smallest loop that still exercises the core of Superpowers:

1. **brainstorming** (gate): idea -> approved design spec. No code until approved.
2. **writing-plans**: spec -> bite-sized task plan.
3. **executing-plans** (native, inline): implement the tasks one by one.
   - **test-driven-development** runs inside each task: failing test -> minimal code -> pass -> commit.
4. **verification-before-completion**: run tests and show the output before claiming "done".

Deferred to P1 (add once P0 works): `using-git-worktrees`, `subagent-driven-development`,
`requesting-code-review`, `finishing-a-development-branch`, `systematic-debugging`.

## Steps: build a new todo app with the P0 workflow

1. Start a new session in `superpowers-testing/`. Confirm the plugin loaded (see above).
2. Prompt: `Let's make a todo app.` Answer the clarifying questions one at a time
   (suggested scope: add / complete / delete / persist in localStorage; no backend, no auth).
3. Pick an approach when offered (e.g. vanilla JS + Vitest vs Vue/React + Vite) and approve the
   design section by section.
4. Review the committed spec in `docs/superpowers/specs/`. Approve it to hand off to planning.
5. Review the generated plan in `docs/superpowers/plans/`. Choose **native (inline)** execution
   to stay on the minimal path.
6. Watch for TDD: each task should show a failing test first, then the implementation.
7. Before finishing, confirm the agent runs the test suite and reports real output.
8. Open the app, manually try add / complete / delete / reload-persists.

## What to observe

- Did brainstorming fire unprompted, and did it hold the "no code yet" gate?
- Were questions asked one at a time, with 2-3 approaches and a recommendation?
- Did the plan contain exact paths, tests and verification steps?
- Was a test written and seen failing before each implementation?
- Was "done" backed by test output?

# 01: Walking skeleton: create and list Notes

**What to build:** From the user's perspective: open the app, create a Note, and see it in a list after reload. The Title shows the first non-blank line, or "Untitled" when empty. Sets up the project (TypeScript, Vite, React), the deep `core/` module with a small public interface, the Vitest + fake-indexeddb harness, the Playwright harness, and a CI job that runs the tests. See spec.md.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Creating a Note persists it (UUIDv7 id, createdAt, updatedAt, trashedAt null) and it survives reload
- [ ] List shows Notes with derived Title; empty Note shows "Untitled"
- [ ] Core tests (Vitest, fake-indexeddb) drive the public interface, TDD, no mocks of internals
- [ ] CI runs the unit tests green

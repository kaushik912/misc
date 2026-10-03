/** Normalise the deploy base path (e.g. from NOTES_BASE) to "/" or "/sub/path/". */
export function normalizeBase(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim().replace(/^\/+|\/+$/g, "");
  return trimmed === "" ? "/" : `/${trimmed}/`;
}

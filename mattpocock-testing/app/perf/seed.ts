import { strToU8, zipSync, type Zippable } from "fflate";
import { v7 as uuidv7 } from "uuid";

const WORDS = "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey xray yankee zulu budget garden meeting recipe travel invoice project reading workout idea".split(" ");
const TAGS = Array.from({ length: 200 }, (_, i) => `tag${i}`);

/** Deterministic pseudo-random so runs are comparable. */
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

/** An Export bundle of `count` Notes (~300 chars each, 0-3 Tags), for seeding via importBundle. */
export function seedBundle(count: number): Uint8Array {
  const rand = rng(42);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]!;
  const base = Date.UTC(2024, 0, 1);
  const entries: Zippable = {};
  for (let i = 0; i < count; i++) {
    const title = `${pick(WORDS)} ${pick(WORDS)} note ${i}`;
    const body = Array.from({ length: 40 }, () => pick(WORDS)).join(" ");
    const tags = Array.from({ length: Math.floor(rand() * 4) }, () => `#${pick(TAGS)}`).join(" ");
    entries[`${uuidv7()}.txt`] = [
      strToU8(`${title}\n${body}\n${tags}`),
      { mtime: base + i * 60_000 },
    ];
  }
  return zipSync(entries, { level: 0 });
}

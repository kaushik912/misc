import { strFromU8 } from "fflate";

/**
 * Reads entry mtimes straight from the zip's central directory, independently
 * of the library that wrote it. Returns both encodings a bundle carries:
 * the extended-timestamp field (UTC seconds) and the DOS time (local, 2s).
 */
export function readEntryTimes(zip: Uint8Array) {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let eocd = zip.length - 22;
  while (v.getUint32(eocd, true) !== 0x06054b50) eocd--;
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const out = new Map<string, { utcSeconds?: number; dos: Date }>();
  for (let i = 0; i < count; i++) {
    const time = v.getUint16(p + 12, true);
    const date = v.getUint16(p + 14, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const name = strFromU8(zip.subarray(p + 46, p + 46 + nameLen));
    let utcSeconds: number | undefined;
    let e = p + 46 + nameLen;
    const end = e + extraLen;
    while (e + 4 <= end) {
      const id = v.getUint16(e, true);
      const size = v.getUint16(e + 2, true);
      if (id === 0x5455 && v.getUint8(e + 4) & 1) {
        utcSeconds = v.getInt32(e + 5, true);
      }
      e += 4 + size;
    }
    const dos = new Date(
      1980 + (date >> 9),
      ((date >> 5) & 15) - 1,
      date & 31,
      time >> 11,
      (time >> 5) & 63,
      (time & 31) * 2,
    );
    out.set(name, { utcSeconds, dos });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

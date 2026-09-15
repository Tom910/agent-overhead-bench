export type Interval = { start: number; end: number };

/** Inclusive-exclusive style: duration is end-start; overlapping intervals merge. */
export function unionDuration(intervals: Interval[]): number {
  const usable = intervals
    .map((i) => ({ start: i.start, end: i.end }))
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);
  if (usable.length === 0) return 0;
  let total = 0;
  let curStart = usable[0]!.start;
  let curEnd = usable[0]!.end;
  for (let i = 1; i < usable.length; i++) {
    const next = usable[i]!;
    if (next.start <= curEnd) {
      if (next.end > curEnd) curEnd = next.end;
    } else {
      total += curEnd - curStart;
      curStart = next.start;
      curEnd = next.end;
    }
  }
  total += curEnd - curStart;
  return total;
}

export function subtractOverlap(base: Interval[], minus: Interval[]): number {
  const unionMinus = merge(minus);
  let total = 0;
  for (const b of merge(base)) {
    let cursor = b.start;
    for (const m of unionMinus) {
      if (m.end <= cursor || m.start >= b.end) continue;
      const overlapStart = Math.max(cursor, m.start);
      const overlapEnd = Math.min(b.end, m.end);
      if (overlapStart > cursor) total += overlapStart - cursor;
      cursor = Math.max(cursor, overlapEnd);
    }
    if (cursor < b.end) total += b.end - cursor;
  }
  return total;
}

function merge(intervals: Interval[]): Interval[] {
  const usable = intervals
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const i of usable) {
    const last = out[out.length - 1];
    if (!last || i.start > last.end) out.push({ ...i });
    else if (i.end > last.end) last.end = i.end;
  }
  return out;
}

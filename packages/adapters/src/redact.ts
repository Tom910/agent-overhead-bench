const SECRET = /sk-[A-Za-z0-9_-]+|sk-or-[A-Za-z0-9_-]+|Bearer\s+\S+/g;

export function redact(text: string, extra: string[] = []): string {
  let out = text.replace(SECRET, "[redacted]");
  for (const v of extra) {
    if (v.length >= 8) out = out.split(v).join("[redacted]");
  }
  return out;
}

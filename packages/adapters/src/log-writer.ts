import { closeSync, fchmodSync, openSync, writeSync } from "node:fs";
import { StringDecoder } from "node:string_decoder";
import { ToolError } from "@aob/contracts";

const MARKER = "[redacted]";
const CHUNK_BYTES = 64 * 1024;

/** Fixed-size input slices and token suppression avoid buffering unbounded lines. */
class GenericRedactor {
  private pending = "";
  private state: "normal" | "sk" | "bearer-space" | "bearer-token" = "normal";

  feed(input: string, final = false): string {
    let text = this.pending + input;
    this.pending = "";
    const output: string[] = [];
    while (text.length > 0) {
      if (this.state !== "normal") {
        const pattern = this.state === "sk" ? /^[A-Za-z0-9_-]+/ :
          this.state === "bearer-space" ? /^\s+/ : /^\S+/;
        const consumed = pattern.exec(text)?.[0].length ?? 0;
        text = text.slice(consumed);
        if (text.length === 0) break;
        this.state = this.state === "bearer-space" ? "bearer-token" : "normal";
        continue;
      }
      const match = /sk-[A-Za-z0-9_-]|Bearer\s/.exec(text);
      if (match === null) {
        const count = final ? text.length : Math.max(0, text.length - 6);
        output.push(text.slice(0, count));
        this.pending = text.slice(count);
        break;
      }
      output.push(text.slice(0, match.index), MARKER);
      this.state = match[0].startsWith("sk-") ? "sk" : "bearer-space";
      text = text.slice(match.index + match[0].length);
    }
    return output.join("");
  }
}

/** Each literal stage preserves the existing ordered split/join semantics. */
class LiteralRedactor {
  private pending = "";
  private readonly secret: string;
  constructor(secret: string) { this.secret = secret; }
  feed(input: string, final: boolean): string {
    const text = this.pending + input;
    const output: string[] = [];
    let start = 0;
    let index: number;
    while ((index = text.indexOf(this.secret, start)) !== -1) {
      output.push(text.slice(start, index), MARKER);
      start = index + this.secret.length;
    }
    const end = final ? text.length : Math.max(start, text.length - this.secret.length + 1);
    output.push(text.slice(start, end));
    this.pending = text.slice(end);
    return output.join("");
  }
}

export interface RunLogWriter {
  write(chunk: Buffer): void;
  close(): void;
}

/**
 * Private, incremental UTF-8 logs. Memory depends on chunk/extra-secret sizes,
 * never total output. A trailing `Bearer` plus whitespace is conservatively
 * redacted even without a token at EOF (unlike complete-string redact()).
 */
export function createRunLogWriter(path: string, extra: string[] = []): RunLogWriter {
  let fd: number;
  try {
    fd = openSync(path, "w", 0o600);
    try { fchmodSync(fd, 0o600); } catch (error) { closeSync(fd); throw error; }
  } catch { throw new ToolError("Unable to open private run log"); }
  const decoder = new StringDecoder("utf8");
  const generic = new GenericRedactor();
  const literals = extra.filter((value) => value.length >= 8).map((value) => new LiteralRedactor(value));
  let closed = false;
  let surrogate = "";
  const emit = (input: string, final: boolean) => {
    let text = generic.feed(input, final);
    for (const literal of literals) text = literal.feed(text, final);
    text = surrogate + text;
    surrogate = "";
    const last = text.charCodeAt(text.length - 1);
    if (!final && last >= 0xd800 && last <= 0xdbff) {
      surrogate = text.slice(-1);
      text = text.slice(0, -1);
    }
    const bytes = Buffer.from(text, "utf8");
    let offset = 0;
    while (offset < bytes.length) {
      const written = writeSync(fd, bytes, offset, bytes.length - offset);
      if (written === 0) throw new ToolError("Run log write made no progress");
      offset += written;
    }
  };
  return {
    write(chunk) {
      if (closed) throw new ToolError("Cannot write a closed run log");
      try {
        for (let offset = 0; offset < chunk.length; offset += CHUNK_BYTES) {
          emit(decoder.write(chunk.subarray(offset, offset + CHUNK_BYTES)), false);
        }
      } catch { throw new ToolError("Unable to write run log"); }
    },
    close() {
      if (closed) return;
      closed = true;
      try { emit(decoder.end(), true); }
      catch { throw new ToolError("Unable to finalize run log"); }
      finally {
        try { closeSync(fd); } catch { throw new ToolError("Unable to close run log"); }
      }
    },
  };
}

import { ftruncateSync, readSync, writeSync } from "node:fs";
import { StringDecoder } from "node:string_decoder";
import { ConfigError } from "@aob/contracts";

const BLOCK_BYTES = 64 * 1024;
const RELEASE_SECRET = /(?<![A-Za-z0-9])sk-or-v1-[A-Za-z0-9_-]+|(?<![A-Za-z0-9])sk-or-[A-Za-z0-9_-]+|(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+|(?:OPENROUTER_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|API_KEY|authorization|x-api-key)\s*[:=]\s*["']?[^\s"',}]+/gi;
const PREFIX_CARRY = 18;

export function redactReleaseLog(text: string): string {
  return text.replace(RELEASE_SECRET, "[redacted]");
}

class Destination {
  private readonly fd: number;
  position = 0;
  constructor(fd: number) { this.fd = fd; }
  write(bytes: Buffer): void {
    let offset = 0;
    while (offset < bytes.length) {
      const written = writeSync(this.fd, bytes, offset, bytes.length - offset, this.position);
      if (written === 0) throw new ConfigError("release evidence write made no progress");
      offset += written;
      this.position += written;
    }
  }
  text(value: string): void { this.write(Buffer.from(value, "utf8")); }
  redact(start: number): void {
    ftruncateSync(this.fd, start);
    this.position = start;
    this.text("[redacted]");
  }
}

type State = "normal" | "sk-candidate" | "sk-token" | "bearer-required" |
  "bearer-space" | "bearer-token" | "key-separator" | "key-space" | "key-start" | "key-token";

/**
 * Speculative output contains only credential labels/separators/whitespace.
 * Once a token confirms a match, rewind that non-secret prefix and emit one
 * marker. This preserves failed candidates without buffering their whitespace.
 */
class ReleaseRedactor {
  private readonly out: Destination;
  private readonly prefix = /(?<![A-Za-z0-9])sk-|Bearer|OPENROUTER_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|API_KEY|authorization|x-api-key/gi;
  private pending = "";
  private previous = "";
  private state: State = "normal";
  private candidate = "";
  private candidateStart = 0;
  constructor(out: Destination) { this.out = out; }

  feed(input: string, final = false): void {
    let text = this.pending + input;
    this.pending = "";
    const consume = (count: number) => {
      const value = text.slice(0, count);
      if (count > 0) this.previous = value.slice(-1);
      text = text.slice(count);
      return value;
    };
    const provisionalWhitespace = () => {
      const count = /^\s+/.exec(text)?.[0].length ?? 0;
      if (count > 0) this.out.text(consume(count));
    };
    while (text.length > 0 || (final && this.state === "sk-candidate")) {
      if (this.state === "normal") {
        this.prefix.lastIndex = this.previous.length;
        const match = this.prefix.exec(this.previous + text);
        if (match === null) {
          let count = final ? text.length : Math.max(0, text.length - PREFIX_CARRY);
          // Never encode half of a surrogate pair at an output boundary.
          const last = text.charCodeAt(count - 1);
          if (!final && last >= 0xd800 && last <= 0xdbff) count--;
          this.out.text(consume(count));
          this.pending = text;
          break;
        }
        this.out.text(consume(match.index - this.previous.length));
        const prefix = consume(match[0].length);
        if (prefix.toLowerCase() === "sk-") {
          this.candidate = prefix;
          this.state = "sk-candidate";
        } else {
          this.candidateStart = this.out.position;
          this.out.text(prefix);
          this.state = prefix.toLowerCase() === "bearer" ? "bearer-required" : "key-separator";
        }
        continue;
      }
      if (this.state === "sk-candidate") {
        const count = Math.min(/^[A-Za-z0-9_-]+/.exec(text)?.[0].length ?? 0, 11 - this.candidate.length);
        this.candidate += consume(count);
        const body = this.candidate.slice(3);
        if (body.length >= 8 || (body.length >= 4 && body.toLowerCase().startsWith("or-"))) {
          this.out.text("[redacted]");
          this.candidate = "";
          this.state = "sk-token";
        } else if (text.length > 0 || final) {
          // A failed short prefix can contain a later valid SK start.
          this.out.text(this.candidate[0]!);
          this.previous = this.candidate[0]!;
          text = this.candidate.slice(1) + text;
          this.candidate = "";
          this.state = "normal";
        } else break;
        continue;
      }
      if (this.state === "sk-token" || this.state === "bearer-token" || this.state === "key-token") {
        const pattern = this.state === "sk-token" ? /^[A-Za-z0-9_-]+/ :
          this.state === "bearer-token" ? /^\S+/ : /^[^\s"',}]+/;
        consume(pattern.exec(text)?.[0].length ?? 0);
        if (text.length === 0) break;
        this.state = "normal";
        continue;
      }
      if (this.state === "bearer-required") {
        if (!/^\s/.test(text)) { this.state = "normal"; continue; }
        this.state = "bearer-space";
      }
      if (this.state === "bearer-space") {
        provisionalWhitespace();
        if (text.length === 0) break;
        this.out.redact(this.candidateStart);
        this.state = "bearer-token";
        continue;
      }
      if (this.state === "key-separator") {
        provisionalWhitespace();
        if (text.length === 0) break;
        if (!/^[:=]/.test(text)) { this.state = "normal"; continue; }
        this.out.text(consume(1));
        this.state = "key-space";
      }
      if (this.state === "key-space") {
        provisionalWhitespace();
        if (text.length === 0) break;
        if (/^["']/.test(text)) this.out.text(consume(1));
        this.state = "key-start";
        if (text.length === 0) break;
      }
      if (this.state === "key-start") {
        if (!/^[^\s"',}]/.test(text)) { this.state = "normal"; continue; }
        this.out.redact(this.candidateStart);
        this.state = "key-token";
      }
    }
  }
}

/** Descriptors are caller-owned, regular files; destination starts empty. */
export function copyRedactedReleaseLog(sourceFd: number, destinationFd: number): void {
  try {
    const out = new Destination(destinationFd);
    const redactor = new ReleaseRedactor(out);
    const decoder = new StringDecoder("utf8");
    const block = Buffer.allocUnsafe(BLOCK_BYTES);
    let count: number;
    while ((count = readSync(sourceFd, block, 0, block.length, null)) > 0) {
      redactor.feed(decoder.write(block.subarray(0, count)));
    }
    redactor.feed(decoder.end(), true);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError("cannot stream redacted release evidence");
  }
}

export function copyRawEvidence(sourceFd: number, destinationFd: number): void {
  try {
    const out = new Destination(destinationFd);
    const block = Buffer.allocUnsafe(BLOCK_BYTES);
    let count: number;
    while ((count = readSync(sourceFd, block, 0, block.length, null)) > 0) out.write(block.subarray(0, count));
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError("cannot stream release evidence");
  }
}

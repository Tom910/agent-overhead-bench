import { ConfigError } from "@aob/contracts";

export type ActivityExportSummary = {
  rowCount: number;
  matchingRowCount: number;
  spendUsd: number;
};

const MODEL_HEADERS = new Set(["model", "modelname", "modelid", "modelslug", "modelpermaslug"]);
const SPEND_HEADERS = new Set(["spend", "spendusd", "totalspend", "totalspendusd", "cost", "costusd", "costtotal"]);

function invalid(message: string): never {
  throw new ConfigError(`Activity Export CSV is invalid: ${message}`);
}

function normalizeHeader(value: string): string {
  return value.trim().replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let fieldStarted = false;
  let quotedClosed = false;
  const pushField = () => {
    row.push(field);
    field = "";
    fieldStarted = false;
    quotedClosed = false;
  };
  const pushRow = () => {
    if (row.length > 0 && row.some((value) => value.trim() !== "")) rows.push(row);
    row = [];
  };

  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          quoted = false;
          quotedClosed = true;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      if (fieldStarted || field.length > 0 || quotedClosed) invalid("a quoted field must start at a field boundary");
      quoted = true;
      fieldStarted = true;
    } else if (character === ",") {
      if (quotedClosed) {
        pushField();
        continue;
      }
      pushField();
    } else if (character === "\n") {
      if (quotedClosed) {
        pushField();
        pushRow();
        continue;
      }
      pushField();
      pushRow();
    } else if (character === "\r") {
      if (input[index + 1] !== "\n") invalid("bare carriage return is not supported");
    } else {
      if (quotedClosed) invalid("characters after a quoted field are not supported");
      field += character;
      fieldStarted = true;
    }
  }
  if (quoted) invalid("unterminated quoted field");
  if (fieldStarted || row.length > 0) {
    pushField();
    pushRow();
  }
  if (rows.length < 2) invalid("a header and at least one data row are required");
  return rows;
}

function requiredColumn(headers: string[], names: Set<string>, label: string): number {
  const matches = headers.flatMap((header, index) => names.has(normalizeHeader(header)) ? [index] : []);
  if (matches.length === 0) invalid(`${label} column is missing`);
  if (matches.length > 1) invalid(`${label} column is ambiguous`);
  return matches[0]!;
}

function spendValue(raw: string, rowNumber: number): number {
  const normalized = raw.trim().replace(/^\$/, "");
  const validNumber = normalized.includes(",")
    ? /^(?:0|[1-9][0-9]{0,2}(?:,[0-9]{3})+)(?:\.[0-9]+)?$/.test(normalized)
    : /^(?:0|[0-9]+(?:\.[0-9]+)?)$/.test(normalized);
  if (normalized === "" || !validNumber) {
    invalid(`spend at row ${rowNumber} is not a nonnegative USD number`);
  }
  const value = Number(normalized.replace(/,/g, ""));
  if (!Number.isFinite(value)) invalid(`spend at row ${rowNumber} is not finite`);
  return value;
}

/** Parse an OpenRouter Activity Export CSV and sum rows for one exact model. */
export function parseActivityExportCsv(input: string, model: string, aliases: readonly string[] = []): ActivityExportSummary {
  if (model.trim() === "") invalid("requested model must not be empty");
  const accepted = new Set([model, ...aliases].map((value) => value.trim()).filter((value) => value.length > 0));
  const rows = parseCsvRows(input);
  const headers = rows[0]!;
  const modelColumn = requiredColumn(headers, MODEL_HEADERS, "model");
  const spendColumn = requiredColumn(headers, SPEND_HEADERS, "spend");
  let spendUsd = 0;
  let matchingRowCount = 0;
  for (let index = 1; index < rows.length; index++) {
    const row = rows[index]!;
    if (row.length !== headers.length) invalid(`row ${index + 1} has a different number of columns`);
    const rowModel = row[modelColumn]!.trim();
    const spend = spendValue(row[spendColumn]!, index + 1);
    if (accepted.has(rowModel)) {
      spendUsd += spend;
      matchingRowCount++;
    }
  }
  return { rowCount: rows.length - 1, matchingRowCount, spendUsd };
}

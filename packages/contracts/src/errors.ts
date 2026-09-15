export class ContractViolation extends Error {
  readonly kind = "ContractViolation" as const;
  constructor(message: string) {
    super(message);
    this.name = "ContractViolation";
  }
}

export class ConfigError extends Error {
  readonly kind = "ConfigError" as const;
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class UpstreamError extends Error {
  readonly kind = "UpstreamError" as const;
  constructor(message: string) {
    super(message);
    this.name = "UpstreamError";
  }
}

export class ToolError extends Error {
  readonly kind = "ToolError" as const;
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

export class BudgetExceeded extends Error {
  readonly kind = "BudgetExceeded" as const;
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceeded";
  }
}

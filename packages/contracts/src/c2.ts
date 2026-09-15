export type C2TaskYaml = {
  id: string;
  source: {
    kind: string;
    repository: string;
    revision: string;
    task_id: string;
    license_notes: string;
    /** Optional source-specific upstream/base revision for provenance. */
    base_revision?: string;
  };
  language: "python" | "typescript" | "go" | "javascript" | "rust";
  size: "small" | "medium";
  shape: "bugfix" | "test-fix" | "feature" | "refactor";
  timeout_s: number;
  expected_minutes: [number, number];
  description: string;
};

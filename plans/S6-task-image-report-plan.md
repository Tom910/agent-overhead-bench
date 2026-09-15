# S6 task-specific image consistency in reports

The real Pi report fails when combining PSD-tools and cattrs because the headline check requires a single agent image across every task. Source-owned task environments intentionally use different pinned images. Repetitions of one task must still use the same agent and verifier image.

Group the existing image-consistency check by task within each already-separated tool/model/source/regime/routing section. Keep global tool-version and visibility consistency. Reject agent or verifier image drift within a task. Preserve C1–C4, costs, timing, row grouping and source-release gates. No dependencies or provider requests.

Acceptance: a two-task report with distinct stable image pairs succeeds; agent or verifier drift within one task still fails, including failed outcomes. Run report tests, TypeScript checks, and regenerate the real retained Pi report without modifying raw evidence.

Implemented and independently reviewed. All 36 report tests and workspace TypeScript checks pass; the retained two-task Pi report now generates successfully. Original evidence is unchanged.

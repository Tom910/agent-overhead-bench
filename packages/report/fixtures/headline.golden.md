| Harness | vX.Y | Vis. | Source/regime | E2E (med/IQR) | Harness share (full only) | Non-model share (fallback) | Cold start | Parallelism | First byte (med) | Turns | Tokens in/out | Cached % | Cost/task | Cost vs. token floor | Success | Raw |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tool-a | 1.0.0 | full | — | 12.50s / 0ms | 14% | — | 2.50s | 1.62 | — | 2 | 20/4 | 0% | $0.41 | 1.1× | 9/10 | — |
| tool-b | 0.9.1 | none | — | 12.50s / 0ms | — | — (non-model 28%) | 2.50s | 1.00 | — | 1 | — | — | $1.18 | 2.4× | 9/10 | — |

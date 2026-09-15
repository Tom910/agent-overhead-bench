# S6 separate provider-routing conditions in reports

Status: implemented and independently reviewed; 34 report tests and the full
offline suite pass, following S7 routing/evidence binding.

Include raw provider routing in report-section and within-cell anomaly-group
keys. Label routed sections and their chart rows with excluded providers; when
a results tree mixes routed and original conditions, label the original as no
exclusions. Never pool those conditions into medians or outlier baselines.
Legacy-only reports retain their existing labels. No C4 metrics or dependency.

Verify four same-task repetitions split into two conditions and that the slow
routed repetition is not judged against the faster unrouted group's median.

## September 9 single-provider labels

Existing full-policy keys already separate single-provider runs. Extend headings
and chart source labels to show the endpoint and disabled fallbacks, retaining
legacy-only formatting. Verify distinct pins render as separate named sections.

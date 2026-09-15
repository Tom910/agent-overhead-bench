# S6 explicit unpriced diagnostic report preview

Authorized variable-price recovery deliberately records null spend with an
existing price book that lacks this model. The report currently throws before
rendering its valid timing/usage data. Add an explicit API preview option
allowUnpricedModels; default behavior and release callers stay strict.

In opted-in previews only, missing model rates in a valid price book produce
null cost and null token floor. Existing C4/C1 cost-availability agreement
rejects a numeric C4 estimate without rates. Missing/malformed price books
still fail. Preserve the existing task/repetition aggregation and report
structure. Label previews with unavailable model pricing. No new dependencies,
new derived C4 fields, API requests, or changes to the paid execution path.

Test strict default rejection, opted-in usage/timing with unavailable cost,
and rejection of fabricated numeric C4 spend. Use the report engine output
for the final results rather than introducing another aggregation model.

Expose the already-derived headline rows alongside Markdown/HTML so the
closeout can export the exact existing aggregation without recomputing it.

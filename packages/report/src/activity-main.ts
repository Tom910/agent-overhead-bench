import { runActivityCrosscheck } from "./activity-cli.js";

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  process.stdout.write("Usage: s7-activity-crosscheck.mjs RESULTS_DIR ACTIVITY_EXPORT.csv SUMMARY.json MODEL PRICE_BOOK STATE.json WINDOW_START_ISO WINDOW_END_ISO [RERUN_RESULTS_DIR RERUN_STATE.json REPLACEMENT_RUN_IDS]\n");
} else if (argv.length !== 8 && argv.length !== 11) {
  process.stderr.write("usage: s7-activity-crosscheck.mjs RESULTS_DIR ACTIVITY_EXPORT.csv SUMMARY.json MODEL PRICE_BOOK STATE.json WINDOW_START_ISO WINDOW_END_ISO [RERUN_RESULTS_DIR RERUN_STATE.json REPLACEMENT_RUN_IDS]\n");
  process.exit(1);
} else {
  try {
    if (argv.length === 11 && (argv[8]!.trim() === "" || argv[9]!.trim() === "" || argv[10]!.trim() === "")) throw new Error("replacement results, state, and run IDs must be supplied together");
    const summary = runActivityCrosscheck({
      resultsDir: argv[0]!, exportCsv: argv[1]!, output: argv[2]!, model: argv[3]!, priceBook: argv[4]!, statePath: argv[5]!,
      window: { startIso: argv[6]!, endIso: argv[7]! },
      ...(argv.length === 11 ? { replacementResultsDir: argv[8]!, replacementStatePath: argv[9]!, replacementRunIds: argv[10]!.split(",") } : {}),
    });
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    if (!summary.within_tolerance) process.exitCode = 2;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

import { runInNewContext } from "node:vm";
import { beforeAll, expect, it } from "vitest";
import { renderCampaignResultsSite } from "./results-site.js";
import { siteCampaign } from "./results-site.test-fixtures.js";

type Event = { target: { value?: string; closest?: (selector: string) => { dataset: Record<string, string> } | null } };
class Element {
  value = ""; innerHTML = ""; textContent = ""; hidden = false; clientWidth = 360;
  listeners = new Map<string, (event: Event) => void>();
  attributes = new Map<string, string>();
  addEventListener(name: string, fn: (event: Event) => void) { this.listeners.set(name, fn); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  querySelectorAll() { return []; }
  querySelector(_selector: string): Element | null { return null; }
  scrollIntoView() {} focus() {}
}
let html: string;
beforeAll(() => { html = renderCampaignResultsSite([siteCampaign("alpha"), siteCampaign("beta", ["pi", "qwen"], { input: 0.000004, cached_input: 0.000002, output: 0.000006 })], "2026-09-29"); });
function client(search = "", markup = html) {
  const elements = new Map([...markup.matchAll(/\bid="([^"]+)"/g)].map(m => [m[1]!, new Element()]));
  const get = (id: string) => { const element = elements.get(id); if (!element) throw new Error(`Missing real HTML element ${id}`); return element; };
  const caption = new Element();
  caption.textContent = markup.match(/<table id="results-table"><caption[^>]*>(.*?)<\/caption>/)![1]!;
  get("results-table").querySelector = selector => { if (selector !== "caption") throw new Error(`Unexpected selector ${selector}`); return caption; };
  const payload = markup.match(/<script id="site-data" type="application\/json">([\s\S]*?)<\/script>/)![1]!;
  get("site-data").textContent = payload;
  const panels = JSON.parse(payload).panels;
  let location = new URL("http://localhost/" + search), cursor = 0;
  const entries = [location.href], listeners = new Map<string, () => void>();
  const setUrl = (url: string) => { location = new URL(url, location); };
  const history = {
    replaceState(_state: unknown, _title: string, url: string) { setUrl(url); entries[cursor] = location.href; },
    pushState(_state: unknown, _title: string, url: string) { setUrl(url); entries.splice(++cursor, entries.length, location.href); },
  };
  const context = { document: { getElementById: get, querySelectorAll: () => [] },
    get location() { return location; }, history, URLSearchParams, Set, Map,
    window: { addEventListener(name: string, fn: () => void) { listeners.set(name, fn); } },
    requestAnimationFrame: (fn: () => void) => { fn(); return 1; }, cancelAnimationFrame: () => {} };
  runInNewContext(markup.match(/<script>([\s\S]*?)<\/script>/)![1]!, context);
  return { get, panels, url: () => location, entries, change(id: string, value: string) { get(id).value = value; get(id).listeners.get("change")!({ target: { value } }); },
    click(id: string, dataset?: Record<string, string>) { get(id).listeners.get("click")!({ target: { closest: () => dataset ? { dataset } : null } }); },
    move(delta: number) { cursor += delta; setUrl(entries[cursor]!); listeners.get("popstate")!(); } };
}
it("changes model, task, reference and evidence as one selection, then restores them with browser history", () => {
  const app = client(), firstReference = app.get("confidence-baseline").value;
  app.change("model-select", "1");
  expect(app.get("results-body").innerHTML).toContain("qwen");
  expect(app.get("results-body").innerHTML).not.toContain("codex");
  expect(app.get("method-pricing").textContent).toContain("$4 per million");
  expect(app.get("confidence-baseline").innerHTML).not.toContain("codex");
  app.change("task-select", "1");
  const reference = app.panels[1].views[0].rows.find((r: { id: string }) => r.id !== app.panels[1].baseline).id;
  app.change("confidence-baseline", reference);
  expect(app.url().searchParams.get("reference")).toBe(reference);
  expect(app.url().searchParams.get("population")).toBe(app.panels[1].id);
  expect(app.get("confidence-scope").textContent).toContain("One task");
  expect(app.get("decision-differences").innerHTML).toContain("one task; interval unavailable");
  app.move(-1); app.move(-1); app.move(-1);
  expect(app.get("model-select").value).toBe("0");
  expect(app.get("confidence-baseline").value).toBe(firstReference);
  expect(app.get("results-body").innerHTML).toContain("codex");
  app.move(1);
  expect(app.get("model-select").value).toBe("1");
  expect(app.get("method-pricing").textContent).toContain("$4 per million");
});
it("updates the accessible comparison denominator when models have different harness counts", () => {
  const app = client("", renderCampaignResultsSite([siteCampaign("alpha"), siteCampaign("beta", ["pi"])], "2026-09-29"));
  const caption = app.get("results-table").querySelector("caption")!;
  expect(caption.textContent).toContain("all 2 harnesses");
  app.change("model-select", "1");
  expect(app.get("active-scope").textContent).toContain("showing 1 of 1");
  expect(caption.textContent).toContain("all 1 harness");
  expect(caption.textContent).not.toContain("all 2 harnesses");
  app.move(-1);
  expect(caption.textContent).toContain("all 2 harnesses");
});
it("keeps a hidden reference fixed and round-trips its version identity through the URL", () => {
  const app = client(), row = app.panels[0].views[0].rows[0];
  app.change("confidence-baseline", row.id);
  app.click("harness-controls", { harness: row.id });
  expect(app.get("results-body").innerHTML).not.toContain(row.label);
  expect(app.get("confidence-baseline").value).toBe(row.id);
  expect(app.get("decision-reference").textContent).toBe(row.label);
  const restored = client(app.url().search);
  expect(restored.get("confidence-baseline").value).toBe(row.id);
  expect(restored.get("results-body").innerHTML).not.toContain(row.label);
});
it("falls back from stale URL choices and resets population, task, reference and visibility together", () => {
  const app = client("?population=missing&task=missing&reference=missing&h=missing&cost=unknown");
  expect(app.get("model-select").value).toBe("0");
  expect(app.get("task-select").value).toBe("0");
  expect(app.get("results-body").innerHTML).toContain("codex");
  app.change("model-select", "1"); app.change("task-select", "1"); app.change("chart-metric", "benchmark");
  app.click("reset");
  expect(app.get("model-select").value).toBe("0"); expect(app.get("task-select").value).toBe("0");
  expect(app.get("chart-metric").value).toBe("cost");
  expect(app.get("confidence-baseline").value).toBe(app.panels[0].baseline);
  expect(app.get("results-body").innerHTML).toContain("cline"); expect(app.get("results-body").innerHTML).toContain("codex");
});

(() => {
  "use strict";
  const payload = JSON.parse(document.getElementById("site-data").textContent);
  const panels = payload.panels || [payload];
  let panelIndex = 0, data = panels[0];
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const palette = ["#b77828", "#007d68", "#8662b2", "#377daa", "#c25d69"];
  let harnesses = [];
  let colors = {};
  const label = id => data.views[0].rows.find(r => r.id === id)?.label || id;
  const visible = new Set();
  let viewIndex = 0, sort = "harness", ascending = true, chartMetric = "cost", selected = null;
  const scoreText = score => score === null ? "Not scored" : `${(score === 100 ? 100 : Math.min(99.9, score)).toFixed(1)}% of best`;
  const current = () => data.views[viewIndex];
  const value = (r,key) => key === "harness" ? r.label : key === "pass" ? r.pass_display.rate : r[key].value;
  const dot = h => `<span class="dot" style="background:${colors[h]}"></span>`;
  const filtered = () => current().rows.filter(r => visible.has(r.id));
  function details(row) {
    selected = row.id;
    document.querySelectorAll(".plot-point").forEach(point => point.setAttribute("aria-pressed", String(point.dataset.harness === selected)));
    $("chart-detail").innerHTML = `<span class="eyebrow">${esc(current().task || `ALL ${data.views.length - 1} TASKS`)}</span><h3>${dot(row.id)} ${esc(row.label)}</h3><p><strong>${row.display.pass}</strong> ${row.pass_display.estimated ? "estimated pass rate" : "pass rate"} · ${row.pass_display.passed}/${row.selected} runs</p><p><strong>${row.display[chartMetric]}</strong> ${chartMetric === "cost" ? "average / task" : "selected-run total"}</p><p class="muted">Pass rate: ${scoreText(row.pass_display.score)}<br>Cost: ${scoreText(row.scores[chartMetric])}</p>`;
  }
  function renderChart(rows) {
    const eligible = rows.filter(r => r[chartMetric].n === r.selected && r[chartMetric].value !== null);
    const baseline = current().rows.filter(r => r[chartMetric].n === r.selected && r[chartMetric].value !== null);
    const max = Math.max(.001, ...baseline.map(r => r[chartMetric].value)) * 1.22;
    const canvasWidth = Math.max(320, $("chart").clientWidth);
    const compact = canvasWidth < 500;
    const left = compact ? 43 : 65, top = 32, width = canvasWidth - left - (compact ? 48 : 65), height = compact ? 225 : 250;
    const x = v => left + v / max * width, y = v => top + (100-v) / 100 * height;
    let svg = `<svg viewBox="0 0 ${canvasWidth} ${height+90}" role="group" aria-label="Pass rate versus ${chartMetric === "cost" ? "average task cost" : "selected benchmark cost"}. Higher and further left means more passes at lower cost.">`;
    for (let tick = 0; tick <= 100; tick += 25) svg += `<line x1="${left}" y1="${y(tick)}" x2="${left+width}" y2="${y(tick)}" stroke="#e6eae4"/><text x="${left-12}" y="${y(tick)+4}" text-anchor="end">${tick}%</text>`;
    const ticks = compact ? 3 : 4;
    for (let i = 0; i <= ticks; i++) svg += `<text x="${x(max*i/ticks)}" y="${top+height+24}" text-anchor="middle">$${(max*i/ticks).toFixed(chartMetric === "cost" ? 3 : 2)}</text>`;
    svg += `<text x="${left}" y="16">PASS RATE ↑</text><text x="${canvasWidth/2}" y="${top+height+52}" text-anchor="middle">${chartMetric === "cost" ? "AVERAGE COST / TASK" : "SELECTED BENCHMARK COST"} (USD) →</text>`;
    // Place labels away from every marker and previously placed label.
    const points = eligible.map(row => ({row, x:x(row[chartMetric].value), y:y(row.pass_display.rate)}));
    const labels = [];
    const intersects = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
    for (const point of points.toSorted((a,b) => a.y-b.y)) {
      const {row, x:px, y:py} = point;
      const pointLabel = row.label + (row.pass_display.estimated ? " (est.)" : "");
      const labelWidth = pointLabel.length * 7 + 6;
      const candidates = [[13,4],[13,-15],[-labelWidth-13,4],[-labelWidth-13,-15],[13,24],[13,-34],[-labelWidth-13,24],[13,-53],[13,43]];
      let box;
      for (const [dx,dy] of candidates) {
        const candidate = {x:px+dx,y:py+dy-12,w:labelWidth,h:16};
        if (candidate.x < left || candidate.x+candidate.w > canvasWidth-4 || candidate.y < 22 || candidate.y+candidate.h > top+height) continue;
        if (labels.some(other => intersects(candidate,other)) || points.some(other => intersects(candidate,{x:other.x-9,y:other.y-9,w:18,h:18}))) continue;
        box = candidate; break;
      }
      box ??= {x:Math.min(canvasWidth-labelWidth-4,px+13),y:Math.max(22,py-28),w:labelWidth,h:16};
      labels.push(box);
      const labelX = box.x, labelY = box.y+12;
      const anchorX = px < box.x ? box.x : box.x+box.w;
      svg += `<g class="plot-point" tabindex="0" role="button" data-harness="${esc(row.id)}" aria-label="${esc(row.label)}: ${row.display.pass} ${row.pass_display.estimated ? "estimated " : ""}pass rate, ${row.display[chartMetric]}. Show details."><title>${esc(row.label)}: ${row.display.pass}, ${row.display[chartMetric]}</title><circle cx="${px}" cy="${py}" r="14" fill="transparent"/><line x1="${px}" y1="${py}" x2="${anchorX}" y2="${labelY-4}" stroke="${colors[row.id]}" opacity=".45"/><circle class="selection-ring" cx="${px}" cy="${py}" r="12" fill="none"/><circle class="marker" cx="${px}" cy="${py}" r="7" fill="${colors[row.id]}"/><text class="plot-label" x="${labelX}" y="${labelY}">${esc(pointLabel)}</text></g>`;
    }
    $("chart").innerHTML = svg + "</svg>";
    $("legend").innerHTML = rows.map(r => `<span>${dot(r.id)}${esc(r.label)}</span>`).join("");
    document.querySelectorAll(".plot-point").forEach(point => {
      const show = () => details(rows.find(r => r.id === point.dataset.harness));
      point.addEventListener("click", show); point.addEventListener("focus", show);
      point.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); show(); } });
    });
    const active = eligible.find(r => r.id === selected) || eligible.toSorted((a,b) => b.pass_display.rate - a.pass_display.rate)[0];
    if (active) details(active);
    else { selected = null; $("chart-detail").innerHTML = '<span class="eyebrow">EXPLORE THE PLOT</span><h3>Cost meets outcome.</h3><p>Select a point to inspect its measurements.</p><p class="muted">Up = more passes<br>Left = lower cost</p>'; }
    if (!eligible.length) $("chart-detail").innerHTML = '<h3>Cost unavailable</h3><p>No complete cost measurements in this selection. See the table for known lower bounds.</p>';
  }
  function renderConfidence() {
    const view = current(), baseline = $("confidence-baseline").value;
    const rows = view.confidenceByBaseline[baseline].map(r => ({ ...r, id: r.harness })).filter(r => visible.has(r.id));
    const extent = Math.max(10, ...rows.flatMap(r => r.interval ? r.interval.map(Math.abs) : [Math.abs(r.difference)]));
    const x = value => 150 + value / extent * 135;
    $("confidence-scope").textContent = view.task ? "One task · raw differences only; uncertainty needs more distinct tasks" : `${data.views.length - 1} task clusters · original verification · exploratory intervals`;
    $("confidence-results").innerHTML = rows.length ? `<table class="confidence-table"><caption>Pass-rate difference from ${esc(label(baseline))}. Positive means more passes. The reference stays fixed when hidden.</caption><thead><tr><th scope="col">Harness</th><th scope="col">Observed difference</th><th scope="col">Exploratory 95% interval</th></tr></thead><tbody>${rows.map(r => `<tr><th scope="row">${dot(r.id)} ${esc(r.label)}</th><td><strong>${esc(r.difference_text)}</strong>${r.interval ? `<svg class="interval-plot" viewBox="0 0 300 30" role="img" aria-label="${esc(r.interval_text)}"><line x1="150" y1="0" x2="150" y2="30" stroke="#bbc9c5" stroke-dasharray="3 3"/><line x1="${x(r.interval[0])}" x2="${x(r.interval[1])}" y1="15" y2="15" stroke="${colors[r.id]}" stroke-width="3"/><line x1="${x(r.interval[0])}" x2="${x(r.interval[0])}" y1="10" y2="20" stroke="${colors[r.id]}"/><line x1="${x(r.interval[1])}" x2="${x(r.interval[1])}" y1="10" y2="20" stroke="${colors[r.id]}"/><circle cx="${x(r.difference)}" cy="15" r="5" fill="${colors[r.id]}"/></svg>` : ""}</td><td>${esc(r.interval_text)}<small>${esc(r.note)}</small></td></tr>`).join("")}</tbody></table>` : "<p>Show another harness to compare it with the selected reference.</p>";
  }
  function renderDecision() {
    const decision = current().decision;
    if (!decision) return;
    const open = $("decision-explanation")?.open || false;
    $("decision-content").innerHTML = decision.html;
    $("decision-explanation").open = open;
    const baseline = $("confidence-baseline").value;
    $("decision-differences").innerHTML = decision.differences[baseline];
    $("decision-reference").textContent = label(baseline);
    $("decision-content").querySelectorAll("[data-decision-harness]").forEach(node => { node.hidden = !visible.has(node.dataset.decisionHarness); });
  }
  function writeUrl(mode) {
    const params = new URLSearchParams();
    if (data.id) params.set("population", data.id);
    if (viewIndex) params.set("task", current().id);
    params.set("reference", $("confidence-baseline").value);
    if (visible.size < harnesses.length) params.set("h", JSON.stringify([...visible]));
    if (chartMetric !== "cost") params.set("cost", chartMetric);
    const url = location.pathname + "?" + params + location.hash;
    if (mode === "replace") history.replaceState(null, "", url);
    else if (mode === "push" && url !== location.pathname + location.search + location.hash) history.pushState(null, "", url);
  }
  function render(mode = "push") {
    const view = current(); const rows = filtered();
    rows.sort((a,b) => { const av = value(a,sort), bv = value(b,sort); if (av === null) return bv === null ? 0 : 1; if (bv === null) return -1; const result = typeof av === "string" ? av.localeCompare(bv) : av-bv; return (ascending ? 1 : -1)*result; });
    $("mobile-sort").value = sort;
    $("active-scope").textContent = `${view.task || `All ${data.views.length - 1} tasks`} · ${view.rows[0].selected} runs per harness · showing ${rows.length} of ${harnesses.length} harnesses`;
    $("results-body").innerHTML = rows.map(row => `<tr><th scope="row">${dot(row.id)} ${esc(row.label)}<small>${row.pass_display.passed}/${row.selected} ${row.pass_display.estimated ? "estimated passes" : "passes"}</small></th>${data.metrics.map(m => { const score = m.key === "pass" ? row.pass_display.score : row.scores[m.key]; const best = score === 100; return `<td data-label="${esc(m.label)}"><span class="value">${esc(row.display[m.key])}</span>${m.key === "pass" && row.pass_estimate ? `<small class="pass-estimate">estimated</small>` : ""}<span class="score ${best ? "best" : ""}">${scoreText(score)}</span>${score === null ? "" : `<span class="track" aria-hidden="true"><span class="${best ? "best" : ""}" style="width:${Math.max(0,Math.min(100,score))}%"></span></span>`}</td>`; }).join("")}</tr>`).join("");
    $("total-note").textContent = view.total + (visible.size < harnesses.length ? " Total includes hidden harnesses." : "");
    document.querySelectorAll("[data-sort]").forEach(button => { button.parentElement.setAttribute("aria-sort",button.dataset.sort === sort ? ascending ? "ascending" : "descending" : "none"); button.querySelector("span").textContent = button.dataset.sort === sort ? ascending ? "↑" : "↓" : "↕"; });
    renderChart(rows);
    renderConfidence();
    renderDecision();
    document.querySelectorAll(".harness-toggle").forEach(button => { const active = visible.has(button.dataset.harness); button.setAttribute("aria-pressed",String(active)); button.disabled = active && visible.size === 1; });
    writeUrl(mode);
  }
  function selectPanel(index) {
    panelIndex = Number.isInteger(index) && panels[index] ? index : 0;
    data = panels[panelIndex]; viewIndex = 0; selected = null;
    harnesses = data.views[0].rows.map(r => r.id);
    $("results-table").querySelector("caption").textContent = `Harness measurements for the selected task scope. Relative scores compare all ${harnesses.length} harness${harnesses.length === 1 ? "" : "es"} in this population, including hidden harnesses.`;
    colors = Object.fromEntries(harnesses.map((h,i) => [h,palette[i % palette.length]]));
    visible.clear(); harnesses.forEach(h => visible.add(h));
    $("task-select").innerHTML = data.views.map((view,i) => `<option value="${i}">${esc(view.task || `All ${data.views.length - 1} tasks`)}</option>`).join("");
    $("confidence-baseline").innerHTML = data.views[0].rows.map(r => `<option value="${esc(r.id)}">${esc(r.label)}</option>`).join("");
    $("confidence-baseline").value = data.baseline || data.views[0].rows.toSorted((a,b) => b.pass_rate-a.pass_rate || a.id.localeCompare(b.id))[0].id;
    $("harness-controls").innerHTML = harnesses.map(h => `<button class="harness-toggle" type="button" data-harness="${esc(h)}" aria-pressed="true">${dot(h)}${esc(label(h))}</button>`).join("");
    $("task-matrix").innerHTML = `<table><caption class="sr-only">Passes and selected repetitions per task, all measured harnesses.</caption><thead><tr><th scope="col">Task</th>${harnesses.map(h => `<th scope="col">${esc(label(h))}</th>`).join("")}</tr></thead><tbody>${data.views.slice(1).map((v,i) => `<tr><th scope="row"><button class="task-button" data-task-index="${i+1}">${esc(v.task)}</button></th>${v.rows.map(r => `<td><span class="heat" style="background:rgba(0,125,104,${.04+r.pass_display.rate/100*.24})">${r.pass_display.passed} / ${r.selected}${r.pass_display.estimated ? " est." : ""}</span></td>`).join("")}</tr>`).join("")}</tbody></table>`;
    $("model-name").textContent = data.model;
    $("model-name").setAttribute("title", data.model);
    $("confidence-method").textContent = `${data.views.length - 1} task clusters; 10,000 deterministic task-cluster resamples. Exploratory 95% intervals, no winner-selection correction. Repetitions are not independent tasks.`;
    if (data.links) {
      $("model-select").value = String(panelIndex);
      $("model-context").textContent = data.context;
      $("decision-pricing").textContent = data.pricing;
      $("method-pricing").textContent = data.pricing;
      $("method-population").textContent = `Model ${data.model}. ${harnesses.length} harnesses, ${data.views.length - 1} tasks; repetition counts are shown for each task.`;
      $("method-provenance").textContent = data.provenance;
      $("decision-audit").innerHTML = data.audit;
      $("population-evidence").innerHTML = data.evidence;
      document.querySelectorAll("[data-panel-link]").forEach(a => a.setAttribute("href", data.links[a.dataset.panelLink]));
    }
  }
  function readUrl() {
    const params = new URLSearchParams(location.search);
    selectPanel(panels.findIndex(p => p.id === params.get("population")));
    const requestedTask = params.get("task");
    const exact = data.views.findIndex(v => v.id === requestedTask);
    const legacy = data.views.filter(v => v.task === requestedTask);
    viewIndex = exact >= 0 ? exact : requestedTask && legacy.length === 1 ? data.views.indexOf(legacy[0]) : 0;
    const reference = params.get("reference");
    if (harnesses.includes(reference)) $("confidence-baseline").value = reference;
    let requested = [];
    try { const parsed = JSON.parse(params.get("h")); if (Array.isArray(parsed)) requested = parsed; } catch { requested = (params.get("h") || "").split(","); }
    const chosen = requested.map(h => harnesses.includes(h) ? h : data.views[0].rows.filter(r => r.harness === h).length === 1 ? data.views[0].rows.find(r => r.harness === h).id : null).filter(h => harnesses.includes(h));
    if (chosen.length) { visible.clear(); chosen.forEach(h => visible.add(h)); }
    chartMetric = params.get("cost") === "benchmark" ? "benchmark" : "cost";
    $("task-select").value = String(viewIndex); $("chart-metric").value = chartMetric;
  }
  $("harness-controls").addEventListener("click", event => {
    const button = event.target.closest(".harness-toggle"); if (!button) return;
    const h = button.dataset.harness; if (!harnesses.includes(h)) return;
    if (visible.has(h)) { if (visible.size > 1) visible.delete(h); } else visible.add(h);
    render();
  });
  $("model-select")?.addEventListener("change", event => { selectPanel(Number(event.target.value)); $("task-select").value = "0"; render(); });
  document.querySelectorAll("[data-sort]").forEach(button => button.addEventListener("click",() => { const key = button.dataset.sort; ascending = key === sort ? !ascending : key !== "pass" && key !== "cache"; sort = key; render(); }));
  $("mobile-sort").addEventListener("change", event => { sort = event.target.value; ascending = sort !== "pass" && sort !== "cache"; render(); });
  $("task-select").addEventListener("change",event => { viewIndex = Number(event.target.value); render(); });
  $("chart-metric").addEventListener("change",event => { chartMetric = event.target.value; render(); });
  $("confidence-baseline").addEventListener("change", () => render());
  $("reset").addEventListener("click", () => {
    selectPanel(0); chartMetric = "cost"; sort = "harness"; ascending = true;
    $("task-select").value = "0"; $("chart-metric").value = "cost"; render();
  });
  $("task-matrix").addEventListener("click", event => {
    const button = event.target.closest(".task-button"); if (!button) return;
    viewIndex = Number(button.dataset.taskIndex); $("task-select").value = String(viewIndex); render();
    $("comparison").scrollIntoView(); $("task-select").focus({preventScroll:true});
  });
  window.addEventListener("popstate", () => { readUrl(); render("replace"); });
  readUrl();
  let resizeFrame;
  window.addEventListener("resize", () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => renderChart(filtered())); });
  $("controls").hidden=false; $("chart-card").hidden=false; render("replace");
})();

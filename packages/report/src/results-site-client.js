(() => {
  "use strict";
  const data = JSON.parse(document.getElementById("site-data").textContent);
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const palette = ["#b77828", "#007d68", "#8662b2", "#377daa", "#c25d69"];
  const harnesses = data.views[0].rows.map(r => r.harness);
  const colors = Object.fromEntries(harnesses.map((h,i) => [h,palette[i % palette.length]]));
  const visible = new Set(harnesses);
  let viewIndex = 0, sort = "harness", ascending = true, chartMetric = "cost", selected = null;
  const scoreText = score => score === null ? "Not scored" : `${(score === 100 ? 100 : Math.min(99.9, score)).toFixed(1)}% of best`;
  const current = () => data.views[viewIndex];
  const value = (r,key) => key === "harness" ? r.harness : key === "pass" ? r.pass_rate : r[key].value;
  const dot = h => `<span class="dot" style="background:${colors[h]}"></span>`;
  const filtered = () => current().rows.filter(r => visible.has(r.harness));
  function details(row) {
    selected = row.harness;
    document.querySelectorAll(".plot-point").forEach(point => point.setAttribute("aria-pressed", String(point.dataset.harness === selected)));
    $("chart-detail").innerHTML = `<span class="eyebrow">${esc(current().task || "ALL EIGHT TASKS")}</span><h3>${dot(row.harness)} ${esc(row.harness)}</h3><p><strong>${row.display.pass}</strong> pass rate · ${row.passes}/${row.selected} runs</p><p><strong>${row.display[chartMetric]}</strong> ${chartMetric === "cost" ? "average / task" : "selected-run total"}</p><p class="muted">Pass rate: ${scoreText(row.scores.pass)}<br>Cost: ${scoreText(row.scores[chartMetric])}</p>`;
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
    const points = eligible.map(row => ({row, x:x(row[chartMetric].value), y:y(row.pass_rate)}));
    const labels = [];
    const intersects = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
    for (const point of points.toSorted((a,b) => a.y-b.y)) {
      const {row, x:px, y:py} = point;
      const labelWidth = row.harness.length * 7 + 6;
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
      svg += `<g class="plot-point" tabindex="0" role="button" data-harness="${esc(row.harness)}" aria-label="${esc(row.harness)}: ${row.display.pass} pass rate, ${row.display[chartMetric]}. Show details."><title>${esc(row.harness)}: ${row.display.pass}, ${row.display[chartMetric]}</title><circle cx="${px}" cy="${py}" r="14" fill="transparent"/><line x1="${px}" y1="${py}" x2="${anchorX}" y2="${labelY-4}" stroke="${colors[row.harness]}" opacity=".45"/><circle class="selection-ring" cx="${px}" cy="${py}" r="12" fill="none"/><circle class="marker" cx="${px}" cy="${py}" r="7" fill="${colors[row.harness]}"/><text class="plot-label" x="${labelX}" y="${labelY}">${esc(row.harness)}</text></g>`;
    }
    $("chart").innerHTML = svg + "</svg>";
    $("legend").innerHTML = rows.map(r => `<span>${dot(r.harness)}${esc(r.harness)}</span>`).join("");
    document.querySelectorAll(".plot-point").forEach(point => {
      const show = () => details(rows.find(r => r.harness === point.dataset.harness));
      point.addEventListener("click", show); point.addEventListener("focus", show);
      point.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); show(); } });
    });
    const active = eligible.find(r => r.harness === selected) || eligible.toSorted((a,b) => b.pass_rate - a.pass_rate)[0];
    if (active) details(active);
    else { selected = null; $("chart-detail").innerHTML = '<span class="eyebrow">EXPLORE THE PLOT</span><h3>Cost meets outcome.</h3><p>Select a point to inspect its measurements.</p><p class="muted">Up = more passes<br>Left = lower cost</p>'; }
    if (!eligible.length) $("chart-detail").innerHTML = '<h3>Cost unavailable</h3><p>No complete cost measurements in this selection. See the table for known lower bounds.</p>';
  }
  function render() {
    const view = current(); const rows = filtered();
    rows.sort((a,b) => { const av = value(a,sort), bv = value(b,sort); if (av === null) return bv === null ? 0 : 1; if (bv === null) return -1; const result = typeof av === "string" ? av.localeCompare(bv) : av-bv; return (ascending ? 1 : -1)*result; });
    $("mobile-sort").value = sort;
    $("active-scope").textContent = `${view.task || "All eight tasks"} · ${view.rows[0].selected} runs per harness · showing ${rows.length} of ${harnesses.length} harnesses`;
    $("results-body").innerHTML = rows.map(row => `<tr><th scope="row">${dot(row.harness)} ${esc(row.harness)}<small>${row.passes}/${row.selected} passes</small></th>${data.metrics.map(m => { const score = row.scores[m.key]; const best = score === 100; return `<td data-label="${esc(m.label)}"><span class="value">${esc(row.display[m.key])}</span><span class="score ${best ? "best" : ""}">${scoreText(score)}</span>${score === null ? "" : `<span class="track" aria-hidden="true"><span class="${best ? "best" : ""}" style="width:${Math.max(0,Math.min(100,score))}%"></span></span>`}</td>`; }).join("")}</tr>`).join("");
    $("total-note").textContent = view.total + (visible.size < harnesses.length ? " Total includes hidden harnesses." : "");
    document.querySelectorAll("[data-sort]").forEach(button => { button.parentElement.setAttribute("aria-sort",button.dataset.sort === sort ? ascending ? "ascending" : "descending" : "none"); button.querySelector("span").textContent = button.dataset.sort === sort ? ascending ? "↑" : "↓" : "↕"; });
    renderChart(rows);
    document.querySelectorAll(".harness-toggle").forEach(button => { const active = visible.has(button.dataset.harness); button.setAttribute("aria-pressed",String(active)); button.disabled = active && visible.size === 1; });
    const params = new URLSearchParams(); if (viewIndex) params.set("task",view.task); if (visible.size<harnesses.length) params.set("h",[...visible].join(",")); if(chartMetric!=="cost")params.set("cost",chartMetric);
    history.replaceState(null,"",location.pathname+(params.size?"?"+params:"")+location.hash);
  }
  $("harness-controls").innerHTML = harnesses.map(h => `<button class="harness-toggle" type="button" data-harness="${esc(h)}" aria-pressed="true">${dot(h)}${esc(h)}</button>`).join("");
  document.querySelectorAll(".harness-toggle").forEach(button => button.addEventListener("click",() => { const h = button.dataset.harness; if (visible.has(h)) { if (visible.size>1) visible.delete(h); } else visible.add(h); render(); }));
  document.querySelectorAll("[data-sort]").forEach(button => button.addEventListener("click",() => { const key = button.dataset.sort; ascending = key === sort ? !ascending : key !== "pass" && key !== "cache"; sort = key; render(); }));
  $("mobile-sort").addEventListener("change", event => { sort = event.target.value; ascending = sort !== "pass" && sort !== "cache"; render(); });
  $("task-select").addEventListener("change",event => { viewIndex = Number(event.target.value); render(); });
  $("chart-metric").addEventListener("change",event => { chartMetric = event.target.value; render(); });
  $("reset").addEventListener("click",() => { viewIndex=0; chartMetric="cost"; sort="harness"; ascending=true; selected=null; harnesses.forEach(h=>visible.add(h)); $("task-select").value="0"; $("chart-metric").value="cost"; render(); });
  $("task-matrix").innerHTML = `<table><caption class="sr-only">Passes per task out of five repetitions, all harnesses.</caption><thead><tr><th scope="col">Task</th>${harnesses.map(h => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${data.views.slice(1).map((v,i) => `<tr><th scope="row"><button class="task-button" data-task-index="${i+1}">${esc(v.task)}</button></th>${v.rows.map(r => `<td><span class="heat" style="background:rgba(0,125,104,${.04+r.pass_rate/100*.24})">${r.passes} / ${r.selected}</span></td>`).join("")}</tr>`).join("")}</tbody></table>`;
  document.querySelectorAll(".task-button").forEach(button => button.addEventListener("click",() => { viewIndex=Number(button.dataset.taskIndex); $("task-select").value=String(viewIndex); render(); $("comparison").scrollIntoView(); $("task-select").focus({preventScroll:true}); }));
  const params = new URLSearchParams(location.search);
  const requested = data.views.findIndex(v => v.task === params.get("task")); if (requested>=0)viewIndex=requested;
  const requestedHarnesses = (params.get("h") || "").split(",").filter(h=>harnesses.includes(h)); if(requestedHarnesses.length){visible.clear();requestedHarnesses.forEach(h=>visible.add(h));}
  if(params.get("cost")==="benchmark")chartMetric="benchmark";
  $("task-select").value=String(viewIndex); $("chart-metric").value=chartMetric;
  let resizeFrame;
  window.addEventListener("resize", () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => renderChart(filtered())); });
  $("controls").hidden=false; $("chart-card").hidden=false; render();
})();

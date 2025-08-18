  // ================= GLOBAL CONFIG (single source of truth) =================
  window.AppConfig = { FASTFOREX_KEY: "c79f5a1f3d-0b4acae3f4-t15yui" }; // <- put your key here

  // ================ UTILITIES (shared, no global collisions) ================
  const FastForex = (() => {
    const key = () => window.AppConfig?.FASTFOREX_KEY || "";
    const base = "https://api.fastforex.io";

    async function fetchJSON(url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }

    // Single pair
    async function fetchOne(from, to) {
      try {
        const data = await fetchJSON(`${base}/fetch-one?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&api_key=${key()}`);
        // API returns { result: { [to]: number } }
        return data?.result?.[to] ?? null;
      } catch (e) {
        console.warn("fetchOne fallback:", e);
        return null;
      }
    }

    // Multiple "to" in one request (bar chart)
    async function fetchMulti(from, toList) {
      try {
        const data = await fetchJSON(`${base}/fetch-multi?from=${encodeURIComponent(from)}&to=${encodeURIComponent(toList.join(","))}&api_key=${key()}`);
        // Expect { results: { EUR: x, GBP: y, ... } } or { result: {...} } depending on version
        return (data?.results || data?.result) ?? {};
      } catch (e) {
        console.warn("fetchMulti fallback:", e);
        return {};
      }
    }

    // Historical day (used to build a series)
    async function fetchHistoricalDay(dateISO, from, to) {
      try {
        const data = await fetchJSON(`${base}/historical?date=${encodeURIComponent(dateISO)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&api_key=${key()}`);
        // Some versions use "results", others "result"
        const bucket = data?.results || data?.result;
        return bucket?.[to] ?? null;
      } catch (e) {
        console.warn("fetchHistoricalDay fallback:", e);
        return null;
      }
    }

    return { fetchOne, fetchMulti, fetchHistoricalDay };
  })();

  // ========================= KPI CARDS (isolated) ===========================
  (() => {
    const el = {
      gdp: document.getElementById("kpi-gdp"),
      gdpUpd: document.getElementById("kpi-gdp-upd"),
      cpi: document.getElementById("kpi-cpi"),
      cpiUpd: document.getElementById("kpi-cpi-upd"),
      usdmyr: document.getElementById("kpi-usdmyr"),
      usdmyrUpd: document.getElementById("kpi-usdmyr-upd"),
      eurmyr: document.getElementById("kpi-eurmyr"),
      eurmyrUpd: document.getElementById("kpi-eurmyr-upd"),
    };

    // Simulated GDP/Inflation so the tiles are "live"
    function updateFakeMacro() {
      const gdp = (Math.random() * 6 + 1).toFixed(2) + "%";   // 1% .. +5%
      const cpi = (Math.random() * 4 + 1).toFixed(2) + "%";   // 1% .. 5%
      el.gdp.textContent = gdp; el.cpi.textContent = cpi;
      const t = "Updated: " + new Date().toLocaleTimeString();
      el.gdpUpd.textContent = t; el.cpiUpd.textContent = t;
    }

    async function updateFX() {
      const [usd, eur] = await Promise.all([
        FastForex.fetchOne("USD","MYR"),
        FastForex.fetchOne("EUR","MYR")
      ]);
      if (usd) el.usdmyr.textContent = usd.toFixed(2);
      else     el.usdmyr.textContent = "N/A";
      if (eur) el.eurmyr.textContent = eur.toFixed(2);
      else     el.eurmyr.textContent = "N/A";
      const t = "Updated: " + new Date().toLocaleTimeString();
      el.usdmyrUpd.textContent = t; el.eurmyrUpd.textContent = t;
    }

    function start() {
      updateFakeMacro();
      updateFX();
      setInterval(updateFakeMacro, 60_000);
      setInterval(updateFX,        60_000);
    }

    document.addEventListener("DOMContentLoaded", start);
  })();

  // =========================== LINE CHART (isolated) ========================
  (() => {
    const canvas = document.getElementById("lineChart");
    if (!canvas) return; // page safety
    let chart;

    function lastNDates(n) {
      const out = [];
      const today = new Date();
      for (let i=n-1; i>=0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate()-i);
        out.push(d.toISOString().slice(0,10));
      }
      return out;
    }

    async function buildSeries(from="USD", to="MYR", days=14) {
      const dates = lastNDates(days);
      const promises = dates.map(d => FastForex.fetchHistoricalDay(d, from, to));
      const values = await Promise.all(promises);
      return { labels: dates, values: values.map(v => (v ? Number(v) : null)) };
    }

    async function draw() {
      const {labels, values} = await buildSeries("USD","MYR",14);
      if (chart) chart.destroy();
      chart = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: { labels,
          datasets: [{ label:"USD → MYR", data: values, tension:.25, fill:true }]},
        options: {
          responsive:true,
          plugins:{ legend:{ display:true }, tooltip:{ enabled:true }},
          scales:{ x:{ ticks:{ maxRotation:0 }}, y:{ beginAtZero:false } }
        }
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
      draw();
      // refresh hourly
      setInterval(draw, 3_600_000);
    });
  })();

  // =========================== BAR CHART (isolated) ========================
  (() => {
    const canvas = document.getElementById("barChart");
    if (!canvas) return;
    let chart;

    async function draw() {
      // Major pairs vs USD
      const base = "USD";
      const targets = ["EUR","GBP","MYR","JPY","AUD","SGD"];
      const map = await FastForex.fetchMulti(base, targets);
      const labels = targets;
      const values = labels.map(k => Number(map?.[k] ?? null));

      if (chart) chart.destroy();
      chart = new Chart(canvas.getContext("2d"), {
        type:"bar",
        data:{ labels, datasets:[{ label:`Rate vs ${base}`, data: values }] },
        options:{
          responsive:true,
          plugins:{ legend:{ display:false }, tooltip:{ enabled:true } },
          scales:{ y:{ beginAtZero:false } }
        }
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
      draw();
      setInterval(draw, 3_600_000); // hourly
    });
  })();

  // ====================== FILTERABLE TABLE (isolated) =======================
  (() => {
    const baseSel   = document.getElementById("baseCurrency");
    const targetSel = document.getElementById("targetCurrency");
    const tbody     = document.getElementById("exchangeTable");
    if (!baseSel || !targetSel || !tbody) return; // safety if section not present

    const history = []; // keep last 10

    async function updateRate() {
      const base = baseSel.value;
      const target = targetSel.value;
      if (base === target) { alert("Base and Target cannot be the same."); return; }

      const rate = await FastForex.fetchOne(base, target);
      const ts = new Date().toLocaleString();
      history.unshift({ ts, base, target, rate: rate ? Number(rate) : null });
      if (history.length > 5) history.pop();
      render();
    }

    function render() {
      if (!history.length) { tbody.innerHTML = '<tr><td colspan="4">No data</td></tr>'; return; }
      tbody.innerHTML = history.map(r => `
        <tr>
          <td>${r.ts}</td>
          <td>${r.base}</td>
          <td>${r.target}</td>
          <td>${r.rate ? r.rate.toFixed(4) : "N/A"}</td>
        </tr>
      `).join("");
    }

    baseSel.addEventListener("change", updateRate);
    targetSel.addEventListener("change", updateRate);

    document.addEventListener("DOMContentLoaded", () => {
      updateRate();
      setInterval(updateRate, 60_000);
    });
  })();
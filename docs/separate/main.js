(() => {
  // src/main.js
  var fmtTime = (iso, tz = "Europe/London", opts = {}) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz, ...opts }).format(new Date(iso));
  var fmtDateTime = (iso, tz = "Europe/London") => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(new Date(iso));
  var _memoryStore = /* @__PURE__ */ new Map();
  function storageAvailable() {
    try {
      const x = "__dash_test__";
      window.localStorage.setItem(x, x);
      window.localStorage.removeItem(x);
      return true;
    } catch (_) {
      return false;
    }
  }
  var canPersist = storageAvailable();
  function loadReadSet(source) {
    const key = `read:${source}`;
    if (canPersist) {
      try {
        const raw = window.localStorage.getItem(key);
        return new Set(raw ? JSON.parse(raw) : []);
      } catch (_) {
      }
    }
    return new Set(_memoryStore.get(key) || []);
  }
  function saveReadSet(source, set) {
    const key = `read:${source}`;
    const arr = Array.from(set);
    if (canPersist) {
      try {
        window.localStorage.setItem(key, JSON.stringify(arr));
      } catch (_) {
      }
    } else {
      _memoryStore.set(key, arr);
    }
  }
  function markRead(source, id, isRead2) {
    const set = loadReadSet(source);
    if (isRead2) set.add(id);
    else set.delete(id);
    saveReadSet(source, set);
  }
  function isRead(source, id) {
    return loadReadSet(source).has(id);
  }
  function updateLiveDateTime() {
    const now = /* @__PURE__ */ new Date();
    const dateStr = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(now);
    const timeStr = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(now);
    const liveDateTimeEl = document.getElementById("liveDateTime");
    if (liveDateTimeEl) {
      liveDateTimeEl.textContent = `${dateStr} at ${timeStr}`;
    }
  }
  var weatherCodeMap = { 0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle", 56: "Light freezing drizzle", 57: "Dense freezing drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain", 66: "Light freezing rain", 67: "Heavy freezing rain", 71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 77: "Snow grains", 80: "Rain showers: slight", 81: "Rain showers: moderate", 82: "Rain showers: violent", 85: "Snow showers: slight", 86: "Snow showers: heavy", 95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail" };
  function upgradeBBCImageResolution(imageUrl) {
    if (!imageUrl || !imageUrl.includes("ichef.bbci.co.uk")) return imageUrl;
    const sizeUpgrades = {
      "/120/": "/512/",
      "/240/": "/512/",
      "/480/": "/512/",
      "/640/": "/800/",
      "/800/": "/1024/"
    };
    for (const [smallSize, largeSize] of Object.entries(sizeUpgrades)) {
      if (imageUrl.includes(smallSize)) {
        return imageUrl.replace(smallSize, largeSize);
      }
    }
    return imageUrl;
  }
  var WEATHER_EL = { updated: document.getElementById("weatherUpdated"), skeleton: document.getElementById("weatherSkeleton"), currentTemp: document.getElementById("currentTemp"), tempRange: document.getElementById("tempRange"), avgRain: document.getElementById("avgRain"), conditionNow: document.getElementById("conditionNow"), nextRain: document.getElementById("nextRain"), nextRainDetail: document.getElementById("nextRainDetail") };
  var weatherChart;
  async function loadWeather() {
    var _a2, _b;
    const lat = 54.9783, lon = -1.6178;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&timezone=Europe%2FLondon&forecast_days=2`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather fetch failed");
    const data = await res.json();
    const { time, temperature_2m, precipitation_probability, precipitation, weathercode } = data.hourly;
    const now = Date.now();
    let startIdx = time.findIndex((t) => new Date(t).getTime() >= now);
    if (startIdx === -1) startIdx = 0;
    const range = [...Array(24)].map((_, i) => startIdx + i).filter((i) => i < time.length);
    const labels = range.map((i) => fmtTime(time[i]));
    const temps = range.map((i) => temperature_2m[i]);
    const probs = range.map((i) => precipitation_probability[i]);
    const precs = range.map((i) => precipitation[i]);
    const nowCode = weathercode[startIdx];
    WEATHER_EL.currentTemp.textContent = `${Math.round((_a2 = temperature_2m[startIdx]) != null ? _a2 : temperature_2m.at(0))}\xB0C`;
    WEATHER_EL.tempRange.textContent = `${Math.round(Math.min(...temps))}\xB0C \u2192 ${Math.round(Math.max(...temps))}\xB0C`;
    WEATHER_EL.avgRain.textContent = `${Math.round(probs.reduce((a, b) => a + b, 0) / probs.length)}%`;
    WEATHER_EL.conditionNow.textContent = weatherCodeMap[nowCode] || "\u2014";
    WEATHER_EL.updated.textContent = `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(/* @__PURE__ */ new Date())}`;
    let nextIdx = range.find((i) => precipitation_probability[i] >= 50 || precipitation[i] >= 0.2);
    if (nextIdx === void 0) {
      let bestI = range[0];
      let bestP = -1;
      for (const i of range) {
        if (precipitation_probability[i] > bestP) {
          bestP = precipitation_probability[i];
          bestI = i;
        }
      }
      nextIdx = bestI;
      WEATHER_EL.nextRain.textContent = `No high chance soon \u2014 highest in next 24h at ${fmtDateTime(time[nextIdx])}`;
    } else {
      WEATHER_EL.nextRain.textContent = `Likely around ${fmtDateTime(time[nextIdx])}`;
    }
    WEATHER_EL.nextRainDetail.textContent = `Probability ${precipitation_probability[nextIdx]}%, expected precipitation ${(_b = precs[range.indexOf(nextIdx)]) != null ? _b : precipitation[nextIdx]} mm.`;
    const ctx = document.getElementById("weatherChart").getContext("2d");
    WEATHER_EL.skeleton.style.display = "none";
    if (weatherChart) weatherChart.destroy();
    weatherChart = new Chart(ctx, { type: "bar", data: { labels, datasets: [{ type: "line", label: "Temperature (\xB0C)", data: temps, yAxisID: "y", tension: 0.35, borderWidth: 2, pointRadius: 0 }, { type: "bar", label: "Precipitation Probability (%)", data: probs, yAxisID: "y1", borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { position: "left", ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.15)" } }, y1: { position: "right", ticks: { color: "#cbd5e1" }, grid: { drawOnChartArea: false } }, x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.1)" } } }, plugins: { legend: { labels: { color: "#e2e8f0" } }, tooltip: { callbacks: { title: (items) => `Hour: ${items[0].label}` } } }, animation: { duration: 900 } } });
  }
  var radarMap;
  var radarFrames = [];
  var radarLayers = [];
  var radarIndex = 0;
  var radarTimer = null;
  async function initRadar() {
    var _a2, _b;
    const center = [54.9783, -1.6178];
    radarMap = L.map("radarMap", { zoomControl: true, attributionControl: true }).setView(center, 7);
    const base = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
    base.addTo(radarMap);
    try {
      const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      if (!res.ok) throw new Error("Radar metadata fetch failed");
      const json = await res.json();
      const allFrames = [...((_a2 = json.radar) == null ? void 0 : _a2.past) || [], ...((_b = json.radar) == null ? void 0 : _b.nowcast) || []];
      const cutoff = Date.now() - 4 * 60 * 60 * 1e3;
      radarFrames = allFrames.filter((f) => f.time * 1e3 >= cutoff);
      if (radarFrames.length === 0) {
        document.getElementById("radarMap").innerHTML = '<div class="p-3 text-sm">No radar frames available right now.</div>';
        return;
      }
      radarLayers = radarFrames.map((f) => L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${f.time}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: 0.7, attribution: 'Radar \xA9 <a href="https://rainviewer.com">RainViewer</a>' }));
      radarIndex = radarLayers.length - 1;
      radarLayers[radarIndex].addTo(radarMap);
      updateRadarTimeLabel();
      const playBtn = document.getElementById("radarPlay");
      playBtn.addEventListener("click", toggleRadar);
      document.getElementById("radarPrev").addEventListener("click", () => stepRadar(-1));
      document.getElementById("radarNext").addEventListener("click", () => stepRadar(1));
      toggleRadar();
    } catch (e) {
      document.getElementById("radarMap").innerHTML = `<div class="p-3 text-sm">Failed to load radar. ${e.message}</div>`;
    }
  }
  function updateRadarTimeLabel() {
    var _a2;
    const ts = ((_a2 = radarFrames[radarIndex]) == null ? void 0 : _a2.time) * 1e3;
    if (!ts) return;
    document.getElementById("radarTime").textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
  }
  function stepRadar(dir = 1) {
    var _a2;
    if (!radarLayers.length) return;
    (_a2 = radarLayers[radarIndex]) == null ? void 0 : _a2.remove();
    radarIndex = (radarIndex + dir + radarLayers.length) % radarLayers.length;
    radarLayers[radarIndex].addTo(radarMap);
    updateRadarTimeLabel();
  }
  function toggleRadar() {
    const btn = document.getElementById("radarPlay");
    if (radarTimer) {
      clearInterval(radarTimer);
      radarTimer = null;
      btn.textContent = "Play";
      return;
    }
    btn.textContent = "Pause";
    radarTimer = setInterval(() => stepRadar(1), 600);
  }
  async function loadReddit() {
    const el = document.getElementById("redditList");
    el.innerHTML = "";
    el.insertAdjacentHTML("beforeend", Array.from({ length: 8 }).map(() => `
    <div class="glass rounded-2xl p-4 card-hover">
      <div class="h-32 w-full rounded-lg skeleton animate-shimmer mb-3"></div>
      <div class="h-5 w-3/4 rounded-md skeleton animate-shimmer"></div>
      <div class="mt-3 h-4 w-1/2 rounded-md skeleton animate-shimmer"></div>
      <div class="mt-3 h-8 w-24 rounded-lg skeleton animate-shimmer"></div>
    </div>`).join(""));
    let json;
    let error;
    const fetchWithTimeout = async (url, timeoutMs = 1e4) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };
    try {
      const res = await fetchWithTimeout("https://www.reddit.com/r/popular/hot.json?limit=20");
      if (res.ok) {
        json = await res.json();
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (e) {
      error = e;
      console.log("Direct Reddit API failed, trying CORS proxy...", e.message);
    }
    if (!json) {
      try {
        const res = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent("https://www.reddit.com/r/popular/hot.json?limit=20")}`);
        if (res.ok) {
          json = await res.json();
          console.log("Used allorigins.win CORS proxy");
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (e) {
        error = e;
        console.log("allorigins.win proxy failed, trying next...", e.message);
      }
    }
    if (!json) {
      try {
        const res = await fetchWithTimeout(`https://cors-anywhere.herokuapp.com/https://www.reddit.com/r/popular/hot.json?limit=20`);
        if (res.ok) {
          json = await res.json();
          console.log("Used cors-anywhere proxy");
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (e) {
        error = e;
        console.log("cors-anywhere proxy failed, trying next...", e.message);
      }
    }
    if (!json) {
      try {
        const res = await fetchWithTimeout(`https://thingproxy.freeboard.io/fetch/https://www.reddit.com/r/popular/hot.json?limit=20`);
        if (res.ok) {
          json = await res.json();
          console.log("Used thingproxy proxy");
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (e) {
        error = e;
        console.log("thingproxy failed, all methods exhausted", e.message);
      }
    }
    if (!json) {
      const errorMessage = (error == null ? void 0 : error.message) || "Unknown error";
      const isCorsError = errorMessage.includes("CORS") || errorMessage.includes("NetworkError") || errorMessage.includes("Failed to fetch");
      const userMessage = isCorsError ? "CORS restrictions or network issues. This is common on mobile browsers and some networks." : errorMessage;
      el.innerHTML = `<div class="glass rounded-2xl p-4 text-sm">
      <div class="font-semibold text-red-300 mb-2">Failed to load Reddit</div>
      <div class="text-slate-300/80 mb-2">All fetch methods failed. Last error: ${userMessage}</div>
      <div class="text-xs text-slate-400">This may be due to network restrictions, CORS policies, or Reddit API changes.</div>
    </div>`;
      return;
    }
    try {
      const items = json.data.children.map((c) => c.data);
      document.getElementById("redditUpdated").textContent = `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(/* @__PURE__ */ new Date())}`;
      el.innerHTML = "";
      for (const post of items) {
        const url = `https://www.reddit.com${post.permalink}`;
        const id = post.id || post.permalink;
        const flair = post.link_flair_text ? `<span class='ml-2 text-xs px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10'>${post.link_flair_text}</span>` : "";
        let imageUrl = null;
        let imageAlt = post.title;
        if (post.preview && post.preview.images && post.preview.images.length > 0) {
          const preview = post.preview.images[0];
          if (preview.variants && preview.variants.gif) {
            imageUrl = preview.variants.gif.source.url;
          } else if (preview.variants && preview.variants.mp4) {
            imageUrl = preview.source.url;
          } else {
            imageUrl = preview.source.url;
          }
        } else if (post.thumbnail && post.thumbnail !== "self" && post.thumbnail !== "default" && post.thumbnail !== "nsfw") {
          imageUrl = post.thumbnail;
        } else if (post.url && (post.url.includes(".jpg") || post.url.includes(".jpeg") || post.url.includes(".png") || post.url.includes(".gif"))) {
          imageUrl = post.url;
        }
        if (imageUrl && imageUrl.includes("reddit.com")) {
          imageUrl = imageUrl.split("?")[0];
        }
        const collapsed = isRead("reddit", id);
        if (collapsed) {
          addToReadList("reddit", { id, title: post.title, href: url });
          continue;
        }
        el.insertAdjacentHTML("beforeend", `
        <div class="article glass rounded-2xl p-4 card-hover${collapsed ? " collapsed" : ""}" data-source="reddit" data-id="${id}" data-url="${url}">
          <a class="article-link block" href="${url}" target="_blank" rel="noreferrer">
            ${imageUrl ? `
              <div class="h-32 w-full rounded-lg overflow-hidden mb-3 bg-slate-800/50">
                <img src="${imageUrl}" alt="${post.title}" class="w-full h-full object-cover article-image" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('bg-slate-800/50');">
              </div>
            ` : ""}
            <div class="text-sm text-slate-300/70 article-meta">r/${post.subreddit} \u2022 \u2B06\uFE0E ${post.ups.toLocaleString("en-GB")} \u2022 ${new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(post.created_utc * 1e3))}</div>
            <h3 class="mt-1 font-semibold leading-snug">${post.title.replace(/</g, "&lt;")}</h3>
            <div class="mt-3 inline-flex items-center text-xs text-slate-300/80 article-meta">by u/${post.author}${flair}</div>
          </a>
          <button class="article-toggle glass px-2 py-1 rounded-md text-xs" type="button" aria-label="Toggle read">${collapsed ? "Mark unread" : "Mark read"}</button>
        </div>
      `);
      }
    } catch (e) {
      el.innerHTML = `<div class="glass rounded-2xl p-4 text-sm">
      <div class="font-semibold text-red-300 mb-2">Failed to parse Reddit data</div>
      <div class="text-slate-300/80">Error: ${e.message}</div>
    </div>`;
    }
  }
  async function loadWowClassic() {
    const el = document.getElementById("wowClassicList");
    el.innerHTML = "";
    el.insertAdjacentHTML("beforeend", Array.from({ length: 8 }).map(() => `
    <div class="glass rounded-2xl p-4 card-hover">
      <div class="h-32 w-full rounded-lg skeleton animate-shimmer mb-3"></div>
      <div class="h-5 w-3/4 rounded-md skeleton animate-shimmer"></div>
      <div class="mt-3 h-4 w-1/2 rounded-md skeleton animate-shimmer"></div>
      <div class="mt-3 h-8 w-24 rounded-lg skeleton animate-shimmer"></div>
    </div>`).join(""));
    let json;
    let error;
    const fetchWithTimeout = async (url, timeoutMs = 1e4) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };
    try {
      const res = await fetchWithTimeout("https://www.reddit.com/r/classicwow/hot.json?limit=20");
      if (res.ok) {
        json = await res.json();
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (e) {
      error = e;
      console.log("Direct WoW Classic API failed, trying CORS proxy...", e.message);
    }
    if (!json) {
      try {
        const res = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent("https://www.reddit.com/r/classicwow/hot.json?limit=20")}`);
        if (res.ok) {
          json = await res.json();
          console.log("Used allorigins.win CORS proxy for WoW Classic");
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (e) {
        error = e;
        console.log("allorigins.win proxy failed for WoW Classic, trying next...", e.message);
      }
    }
    if (!json) {
      try {
        const res = await fetchWithTimeout(`https://cors-anywhere.herokuapp.com/https://www.reddit.com/r/classicwow/hot.json?limit=20`);
        if (res.ok) {
          json = await res.json();
          console.log("Used cors-anywhere proxy for WoW Classic");
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (e) {
        error = e;
        console.log("cors-anywhere proxy failed for WoW Classic, trying next...", e.message);
      }
    }
    if (!json) {
      try {
        const res = await fetchWithTimeout(`https://thingproxy.freeboard.io/fetch/https://www.reddit.com/r/classicwow/hot.json?limit=20`);
        if (res.ok) {
          json = await res.json();
          console.log("Used thingproxy for WoW Classic");
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (e) {
        error = e;
        console.log("thingproxy failed for WoW Classic, all methods exhausted", e.message);
      }
    }
    if (!json) {
      const errorMessage = (error == null ? void 0 : error.message) || "Unknown error";
      const isCorsError = errorMessage.includes("CORS") || errorMessage.includes("NetworkError") || errorMessage.includes("Failed to fetch");
      const userMessage = isCorsError ? "CORS restrictions or network issues. This is common on mobile browsers and some networks." : errorMessage;
      el.innerHTML = `<div class="glass rounded-2xl p-4 text-sm">
      <div class="font-semibold text-red-300 mb-2">Failed to load WoW Classic</div>
      <div class="text-slate-300/80 mb-2">All fetch methods failed. Last error: ${userMessage}</div>
      <div class="text-xs text-slate-400">This may be due to network restrictions, CORS policies, or Reddit API changes.</div>
    </div>`;
      return;
    }
    try {
      const items = json.data.children.map((c) => c.data);
      document.getElementById("wowClassicUpdated").textContent = `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(/* @__PURE__ */ new Date())}`;
      el.innerHTML = "";
      for (const post of items) {
        const url = `https://www.reddit.com${post.permalink}`;
        const id = post.id || post.permalink;
        const flair = post.link_flair_text ? `<span class='ml-2 text-xs px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10'>${post.link_flair_text}</span>` : "";
        let imageUrl = null;
        let imageAlt = post.title;
        if (post.preview && post.preview.images && post.preview.images.length > 0) {
          const preview = post.preview.images[0];
          if (preview.variants && preview.variants.gif) {
            imageUrl = preview.variants.gif.source.url;
          } else if (preview.variants && preview.variants.mp4) {
            imageUrl = preview.source.url;
          } else {
            imageUrl = preview.source.url;
          }
        } else if (post.thumbnail && post.thumbnail !== "self" && post.thumbnail !== "default" && post.thumbnail !== "nsfw") {
          imageUrl = post.thumbnail;
        } else if (post.url && (post.url.includes(".jpg") || post.url.includes(".jpeg") || post.url.includes(".png") || post.url.includes(".gif"))) {
          imageUrl = post.url;
        }
        if (imageUrl && imageUrl.includes("reddit.com")) {
          imageUrl = imageUrl.split("?")[0];
        }
        const collapsed = isRead("wow-classic", id);
        if (collapsed) {
          addToReadList("wow-classic", { id, title: post.title, href: url });
          continue;
        }
        el.insertAdjacentHTML("beforeend", `
        <div class="article glass rounded-2xl p-4 card-hover${collapsed ? " collapsed" : ""}" data-source="wow-classic" data-id="${id}" data-url="${url}">
          <a class="article-link block" href="${url}" target="_blank" rel="noreferrer">
            ${imageUrl ? `
              <div class="h-32 w-full rounded-lg overflow-hidden mb-3 bg-slate-800/50">
                <img src="${imageUrl}" alt="${post.title}" class="w-full h-full object-cover article-image" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('bg-slate-800/50');">
              </div>
            ` : ""}
            <div class="text-sm text-slate-300/70 article-meta">r/classicwow \u2022 \u2B06\uFE0E ${post.ups.toLocaleString("en-GB")} \u2022 ${new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(post.created_utc * 1e3))}</div>
            <h3 class="mt-1 font-semibold leading-snug">${post.title.replace(/</g, "&lt;")}</h3>
            <div class="mt-3 inline-flex items-center text-xs text-slate-300/80 article-meta">by u/${post.author}${flair}</div>
          </a>
          <button class="article-toggle glass px-2 py-1 rounded-md text-xs" type="button" aria-label="Toggle read">${collapsed ? "Mark unread" : "Mark read"}</button>
        </div>
      `);
      }
    } catch (e) {
      el.innerHTML = `<div class="glass rounded-2xl p-4 text-sm">
      <div class="font-semibold text-red-300 mb-2">Failed to parse WoW Classic data</div>
      <div class="text-slate-300/80">Error: ${e.message}</div>
    </div>`;
    }
  }
  async function loadFormula1() {
    const el = document.getElementById("formula1List");
    el.innerHTML = "";
    el.insertAdjacentHTML("beforeend", Array.from({ length: 8 }).map(() => `
    <div class="glass rounded-2xl p-4 card-hover">
      <div class="h-32 w-full rounded-lg skeleton animate-shimmer mb-3"></div>
      <div class="h-5 w-3/4 rounded-md skeleton animate-shimmer"></div>
      <div class="mt-3 h-4 w-1/2 rounded-md skeleton animate-shimmer"></div>
      <div class="mt-3 h-8 w-24 rounded-lg skeleton animate-shimmer"></div>
    </div>`).join(""));
    let json;
    let error;
    const fetchWithTimeout = async (url, timeoutMs = 1e4) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };
    try {
      const res = await fetchWithTimeout("https://www.reddit.com/r/formula1/hot.json?limit=20");
      if (res.ok) {
        json = await res.json();
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (e) {
      error = e;
      console.log("Direct Formula 1 API failed, trying CORS proxy...", e.message);
    }
    if (!json) {
      try {
        const res = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent("https://www.reddit.com/r/formula1/hot.json?limit=20")}`);
        if (res.ok) {
          json = await res.json();
          console.log("Used allorigins.win CORS proxy for Formula 1");
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (e) {
        error = e;
        console.log("allorigins.win proxy failed for Formula 1, trying next...", e.message);
      }
    }
    if (!json) {
      try {
        const res = await fetchWithTimeout(`https://cors-anywhere.herokuapp.com/https://www.reddit.com/r/formula1/hot.json?limit=20`);
        if (res.ok) {
          json = await res.json();
          console.log("Used cors-anywhere proxy for Formula 1");
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (e) {
        error = e;
        console.log("cors-anywhere proxy failed for Formula 1, trying next...", e.message);
      }
    }
    if (!json) {
      try {
        const res = await fetchWithTimeout(`https://thingproxy.freeboard.io/fetch/https://www.reddit.com/r/formula1/hot.json?limit=20`);
        if (res.ok) {
          json = await res.json();
          console.log("Used thingproxy for Formula 1");
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      } catch (e) {
        error = e;
        console.log("thingproxy failed for Formula 1, all methods exhausted", e.message);
      }
    }
    if (!json) {
      const errorMessage = (error == null ? void 0 : error.message) || "Unknown error";
      const isCorsError = errorMessage.includes("CORS") || errorMessage.includes("NetworkError") || errorMessage.includes("Failed to fetch");
      const userMessage = isCorsError ? "CORS restrictions or network issues. This is common on mobile browsers and some networks." : errorMessage;
      el.innerHTML = `<div class="glass rounded-2xl p-4 text-sm">
      <div class="font-semibold text-red-300 mb-2">Failed to load Formula 1</div>
      <div class="text-slate-300/80 mb-2">All fetch methods failed. Last error: ${userMessage}</div>
      <div class="text-xs text-slate-400">This may be due to network restrictions, CORS policies, or Reddit API changes.</div>
    </div>`;
      return;
    }
    try {
      const items = json.data.children.map((c) => c.data);
      document.getElementById("formula1Updated").textContent = `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(/* @__PURE__ */ new Date())}`;
      el.innerHTML = "";
      for (const post of items) {
        const url = `https://www.reddit.com${post.permalink}`;
        const id = post.id || post.permalink;
        const flair = post.link_flair_text ? `<span class='ml-2 text-xs px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10'>${post.link_flair_text}</span>` : "";
        let imageUrl = null;
        let imageAlt = post.title;
        if (post.preview && post.preview.images && post.preview.images.length > 0) {
          const preview = post.preview.images[0];
          if (preview.variants && preview.variants.gif) {
            imageUrl = preview.variants.gif.source.url;
          } else if (preview.variants && preview.variants.mp4) {
            imageUrl = preview.source.url;
          } else {
            imageUrl = preview.source.url;
          }
        } else if (post.thumbnail && post.thumbnail !== "self" && post.thumbnail !== "default" && post.thumbnail !== "nsfw") {
          imageUrl = post.thumbnail;
        } else if (post.url && (post.url.includes(".jpg") || post.url.includes(".jpeg") || post.url.includes(".png") || post.url.includes(".gif"))) {
          imageUrl = post.url;
        }
        if (imageUrl && imageUrl.includes("reddit.com")) {
          imageUrl = imageUrl.split("?")[0];
        }
        const collapsed = isRead("formula1", id);
        if (collapsed) {
          addToReadList("formula1", { id, title: post.title, href: url });
          continue;
        }
        el.insertAdjacentHTML("beforeend", `
        <div class="article glass rounded-2xl p-4 card-hover${collapsed ? " collapsed" : ""}" data-source="formula1" data-id="${id}" data-url="${url}">
          <a class="article-link block" href="${url}" target="_blank" rel="noreferrer">
            ${imageUrl ? `
              <div class="h-32 w-full rounded-lg overflow-hidden mb-3 bg-slate-800/50">
                <img src="${imageUrl}" alt="${post.title}" class="w-full h-full object-cover article-image" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('bg-slate-800/50');">
              </div>
            ` : ""}
            <div class="text-sm text-slate-300/70 article-meta">r/formula1 \u2022 \u2B06\uFE0E ${post.ups.toLocaleString("en-GB")} \u2022 ${new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(post.created_utc * 1e3))}</div>
            <h3 class="mt-1 font-semibold leading-snug">${post.title.replace(/</g, "&lt;")}</h3>
            <div class="mt-3 inline-flex items-center text-xs text-slate-300/80 article-meta">by u/${post.author}${flair}</div>
          </a>
          <button class="article-toggle glass px-2 py-1 rounded-md text-xs" type="button" aria-label="Toggle read">${collapsed ? "Mark unread" : "Mark read"}</button>
        </div>
      `);
      }
    } catch (e) {
      el.innerHTML = `<div class="glass rounded-2xl p-4 text-sm">
      <div class="font-semibold text-red-300 mb-2">Failed to parse Formula 1 data</div>
      <div class="text-slate-300/80">Error: ${e.message}</div>
    </div>`;
    }
  }
  async function loadBBC() {
    var _a2;
    const el = document.getElementById("bbcList");
    el.innerHTML = Array.from({ length: 6 }).map(() => `
    <div class="glass rounded-2xl p-4 card-hover">
      <div class="h-32 w-full rounded-lg skeleton animate-shimmer mb-3"></div>
      <div class="h-5 w-2/3 rounded-md skeleton animate-shimmer"></div>
      <div class="mt-3 h-4 w-1/2 rounded-md skeleton animate-shimmer"></div>
    </div>`).join("");
    try {
      const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/rss.xml");
      if (!res.ok) throw new Error("BBC RSS fetch failed");
      const json = await res.json();
      if (json.status !== "ok" || !json.items) {
        throw new Error("Invalid RSS response format");
      }
      const items = json.items.slice(0, 10);
      document.getElementById("bbcUpdated").textContent = `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(/* @__PURE__ */ new Date())}`;
      el.innerHTML = "";
      for (const art of items) {
        const t = new Date(art.pubDate);
        const when = isNaN(t) ? "" : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(t);
        let link = art.link;
        const id = link || art.guid || art.title;
        if (link.includes("bbc.com")) {
          link = link.replace("bbc.com", "bbc.co.uk");
        }
        let thumbnail = art.thumbnail || ((_a2 = art.enclosure) == null ? void 0 : _a2.thumbnail) || "https://news.bbcimg.co.uk/nol/shared/img/bbc_news_120x60.gif";
        thumbnail = upgradeBBCImageResolution(thumbnail);
        const collapsed = isRead("bbc", id);
        if (collapsed) {
          addToReadList("bbc", { id, title: art.title, href: link });
          continue;
        }
        el.insertAdjacentHTML("beforeend", `
        <div class="article glass rounded-2xl p-4 card-hover${collapsed ? " collapsed" : ""}" data-source="bbc" data-id="${id}" data-url="${link}">
          <a class="article-link block" href="${link}" target="_blank" rel="noreferrer">
            <div class="h-32 w-full rounded-lg overflow-hidden mb-3 bg-slate-800/50">
              <img src="${thumbnail}" alt="${art.title}" class="w-full h-full object-cover article-image" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('bg-slate-800/50');">
            </div>
            <div class="text-sm text-slate-300/70 article-meta">${when}</div>
            <h3 class="mt-1 font-semibold leading-snug">${art.title.replace(/</g, "&lt;")}</h3>
          </a>
          <button class="article-toggle glass px-2 py-1 rounded-md text-xs" type="button" aria-label="Toggle read">${collapsed ? "Mark unread" : "Mark read"}</button>
        </div>
      `);
      }
    } catch (e) {
      try {
        const res = await fetch("https://api.allorigins.win/raw?url=https://feeds.bbci.co.uk/news/rss.xml");
        if (!res.ok) throw new Error("BBC RSS fallback fetch failed");
        const text = await res.text();
        const xml = new DOMParser().parseFromString(text, "text/xml");
        const items = Array.from(xml.querySelectorAll("item")).slice(0, 10).map((item) => {
          var _a3, _b, _c, _d, _e, _f;
          return {
            title: ((_a3 = item.querySelector("title")) == null ? void 0 : _a3.textContent) || "Untitled",
            link: ((_b = item.querySelector("link")) == null ? void 0 : _b.textContent) || "#",
            pubDate: ((_c = item.querySelector("pubDate")) == null ? void 0 : _c.textContent) || "",
            thumbnail: ((_d = item.querySelector("media\\:thumbnail")) == null ? void 0 : _d.getAttribute("url")) || ((_e = item.querySelector('enclosure[type="image/jpeg"]')) == null ? void 0 : _e.getAttribute("url")) || ((_f = item.querySelector('enclosure[type="image/png"]')) == null ? void 0 : _f.getAttribute("url")) || "https://news.bbcimg.co.uk/nol/shared/img/bbc_news_120x60.gif"
          };
        });
        document.getElementById("bbcUpdated").textContent = `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(/* @__PURE__ */ new Date())} (fallback)`;
        el.innerHTML = "";
        for (const art of items) {
          const t = new Date(art.pubDate);
          const when = isNaN(t) ? "" : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(t);
          let link = art.link;
          const id = link || art.guid || art.title;
          if (link.includes("bbc.com")) {
            link = link.replace("bbc.com", "bbc.co.uk");
          }
          let thumbnail = upgradeBBCImageResolution(art.thumbnail);
          const collapsed = isRead("bbc", id);
          if (collapsed) {
            addToReadList("bbc", { id, title: art.title, href: link });
            continue;
          }
          el.insertAdjacentHTML("beforeend", `
          <div class="article glass rounded-2xl p-4 card-hover${collapsed ? " collapsed" : ""}" data-source="bbc" data-id="${id}" data-url="${link}">
            <a class="article-link block" href="${link}" target="_blank" rel="noreferrer">
              <div class="h-32 w-full rounded-lg overflow-hidden mb-3 bg-slate-800/50">
                <img src="${thumbnail}" alt="${art.title}" class="w-full h-full object-cover article-image" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('bg-slate-800/50');">
              </div>
              <div class="text-sm text-slate-300/70 article-meta">${when}</div>
              <h3 class="mt-1 font-semibold leading-snug">${art.title.replace(/</g, "&lt;")}</h3>
            </a>
            <button class="article-toggle glass px-2 py-1 rounded-md text-xs" type="button" aria-label="Toggle read">${collapsed ? "Mark unread" : "Mark read"}</button>
          </div>
        `);
        }
      } catch (fallbackError) {
        el.innerHTML = `<div class="glass rounded-2xl p-4 text-sm">Failed to load BBC. ${e.message} (fallback also failed: ${fallbackError.message})</div>`;
      }
    }
  }
  async function loadAll() {
    document.body.classList.add("loading");
    await Promise.allSettled([loadWeather(), initRadar(), loadReddit(), loadWowClassic(), loadFormula1(), loadBBC()]);
    document.body.classList.remove("loading");
    if (window.lucide) lucide.createIcons();
  }
  function startLiveDateTime() {
    updateLiveDateTime();
    setInterval(updateLiveDateTime, 1e3);
  }
  function initNavigation() {
    const navMenu = document.getElementById("navMenu");
    const navToggle = document.getElementById("navToggle");
    const navClose = document.getElementById("navClose");
    const navLinks = document.querySelectorAll(".nav-link");
    function toggleNav() {
      const isVisible = navMenu.classList.contains("show");
      if (isVisible) {
        navMenu.classList.remove("show");
      } else {
        navMenu.classList.add("show");
      }
    }
    function closeNav() {
      navMenu.classList.remove("show");
    }
    function smoothScrollToSection(e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        const headerHeight = document.querySelector("header").offsetHeight;
        const navHeight = navMenu.offsetHeight;
        const totalOffset = headerHeight + navHeight + 20;
        const targetPosition = targetSection.offsetTop - totalOffset;
        window.scrollTo({ top: targetPosition, behavior: "smooth" });
        if (window.innerWidth < 768) {
          closeNav();
        }
      }
    }
    navToggle.addEventListener("click", toggleNav);
    navClose.addEventListener("click", closeNav);
    navLinks.forEach((link) => link.addEventListener("click", smoothScrollToSection));
    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        closeNav();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeNav();
      }
    });
  }
  function initCollapsibleSections() {
    const sectionToggles = document.querySelectorAll(".section-toggle");
    sectionToggles.forEach((toggle) => {
      toggle.addEventListener("click", function() {
        const section = this.getAttribute("data-section");
        const content = this.closest("section").querySelector(".section-content");
        const chevron = this.querySelector(".section-chevron");
        if (content.classList.contains("collapsed")) {
          content.classList.remove("collapsed");
          chevron.classList.remove("rotated");
          this.closest("section").classList.remove("section-collapsed");
          content.style.height = "";
        } else {
          content.style.height = content.scrollHeight + "px";
          content.offsetHeight;
          content.style.height = "0px";
          setTimeout(() => {
            content.classList.add("collapsed");
            chevron.classList.add("rotated");
            this.closest("section").classList.add("section-collapsed");
          }, 10);
        }
      });
    });
  }
  function initArticleInteractions() {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    function handleToggle(e) {
      const btn = e.target.closest(".article-toggle");
      if (!btn) return;
      e.preventDefault();
      const article = btn.closest(".article");
      if (!article) return;
      const id = article.getAttribute("data-id");
      const source = article.getAttribute("data-source");
      const isMarkingRead = !article.classList.contains("collapsed");
      if (isMarkingRead) {
        article.classList.add("collapsed", "fade-out");
        markRead(source, id, true);
        setTimeout(() => {
          var _a3, _b2;
          article.remove();
          addToReadList(source, { id, title: ((_a3 = article.querySelector("h3")) == null ? void 0 : _a3.textContent) || "Untitled", href: ((_b2 = article.querySelector("a.article-link")) == null ? void 0 : _b2.getAttribute("href")) || "#" });
        }, 200);
      } else {
        markRead(source, id, false);
        removeFromReadList(source, id);
      }
    }
    function handleCardClick(e) {
      if (e.target.closest(".article-toggle")) return;
      const article = e.target.closest(".article");
      if (!article) return;
      const url = article.getAttribute("data-url");
      if (url && url !== "#") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }
    function handleMarkUnread(e) {
      const btn = e.target.closest(".mark-unread");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const source = btn.getAttribute("data-source");
      markRead(source, id, false);
      removeFromReadList(source, id);
      if (source === "reddit") loadReddit();
      else if (source === "wow-classic") loadWowClassic();
      else if (source === "formula1") loadFormula1();
      else if (source === "bbc") loadBBC();
    }
    (_a2 = document.getElementById("redditList")) == null ? void 0 : _a2.addEventListener("click", handleToggle);
    (_b = document.getElementById("redditList")) == null ? void 0 : _b.addEventListener("click", handleCardClick);
    (_c = document.getElementById("wowClassicList")) == null ? void 0 : _c.addEventListener("click", handleToggle);
    (_d = document.getElementById("wowClassicList")) == null ? void 0 : _d.addEventListener("click", handleCardClick);
    (_e = document.getElementById("formula1List")) == null ? void 0 : _e.addEventListener("click", handleToggle);
    (_f = document.getElementById("formula1List")) == null ? void 0 : _f.addEventListener("click", handleCardClick);
    (_g = document.getElementById("bbcList")) == null ? void 0 : _g.addEventListener("click", handleToggle);
    (_h = document.getElementById("bbcList")) == null ? void 0 : _h.addEventListener("click", handleCardClick);
    (_i = document.getElementById("readRedditList")) == null ? void 0 : _i.addEventListener("click", handleMarkUnread);
    (_j = document.getElementById("readWowClassicList")) == null ? void 0 : _j.addEventListener("click", handleMarkUnread);
    (_k = document.getElementById("readFormula1List")) == null ? void 0 : _k.addEventListener("click", handleMarkUnread);
    (_l = document.getElementById("readBbcList")) == null ? void 0 : _l.addEventListener("click", handleMarkUnread);
  }
  function addToReadList(source, item) {
    let target;
    if (source === "reddit") {
      target = document.getElementById("readRedditList");
    } else if (source === "wow-classic") {
      target = document.getElementById("readWowClassicList");
    } else if (source === "formula1") {
      target = document.getElementById("readFormula1List");
    } else if (source === "bbc") {
      target = document.getElementById("readBbcList");
    }
    if (!target) return;
    const li = document.createElement("li");
    li.dataset.id = item.id;
    li.className = "flex items-center justify-between group";
    li.innerHTML = `
    <a class="underline decoration-dotted flex-1" href="${item.href}" target="_blank" rel="noreferrer">${item.title.replace(/</g, "&lt;")}</a>
    <button class="mark-unread glass px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity" data-source="${source}" data-id="${item.id}">Mark unread</button>
  `;
    target.prepend(li);
  }
  function removeFromReadList(source, id) {
    let target;
    if (source === "reddit") {
      target = document.getElementById("readRedditList");
    } else if (source === "wow-classic") {
      target = document.getElementById("readWowClassicList");
    } else if (source === "formula1") {
      target = document.getElementById("readFormula1List");
    } else if (source === "bbc") {
      target = document.getElementById("readBbcList");
    }
    if (!target) return;
    const el = target.querySelector(`li[data-id="${CSS.escape(id)}"]`);
    if (el) el.remove();
  }
  var _a;
  (_a = document.getElementById("refreshBtn")) == null ? void 0 : _a.addEventListener("click", () => loadAll());
  window.addEventListener("DOMContentLoaded", () => {
    loadAll();
    startLiveDateTime();
    initNavigation();
    initCollapsibleSections();
    initArticleInteractions();
  });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIC0tLS0tLS0tLS0gVXRpbGl0aWVzIC0tLS0tLS0tLS1cbmNvbnN0IGZtdFRpbWUgPSAoaXNvLCB0eiA9ICdFdXJvcGUvTG9uZG9uJywgb3B0cyA9IHt9KSA9PiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcsIGhvdXIxMjogZmFsc2UsIHRpbWVab25lOiB0eiwgLi4ub3B0cyB9KS5mb3JtYXQobmV3IERhdGUoaXNvKSk7XG5jb25zdCBmbXREYXRlVGltZSA9IChpc28sIHR6ID0gJ0V1cm9wZS9Mb25kb24nKSA9PiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IHdlZWtkYXk6ICdzaG9ydCcsIGRheTogJzItZGlnaXQnLCBtb250aDogJ3Nob3J0JywgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JywgaG91cjEyOiBmYWxzZSwgdGltZVpvbmU6IHR6IH0pLmZvcm1hdChuZXcgRGF0ZShpc28pKTtcblxuLy8gU2FmZSBsb2NhbFN0b3JhZ2UgaGVscGVycyB3aXRoIGdyYWNlZnVsIGZhbGxiYWNrXG5jb25zdCBfbWVtb3J5U3RvcmUgPSBuZXcgTWFwKCk7XG5mdW5jdGlvbiBzdG9yYWdlQXZhaWxhYmxlKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHggPSAnX19kYXNoX3Rlc3RfXyc7XG4gICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHgsIHgpO1xuICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh4KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoXykgeyByZXR1cm4gZmFsc2U7IH1cbn1cbmNvbnN0IGNhblBlcnNpc3QgPSBzdG9yYWdlQXZhaWxhYmxlKCk7XG5mdW5jdGlvbiBsb2FkUmVhZFNldChzb3VyY2UpIHtcbiAgY29uc3Qga2V5ID0gYHJlYWQ6JHtzb3VyY2V9YDtcbiAgaWYgKGNhblBlcnNpc3QpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmF3ID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XG4gICAgICByZXR1cm4gbmV3IFNldChyYXcgPyBKU09OLnBhcnNlKHJhdykgOiBbXSk7XG4gICAgfSBjYXRjaCAoXykgeyAvKiBpZ25vcmUgKi8gfVxuICB9XG4gIHJldHVybiBuZXcgU2V0KF9tZW1vcnlTdG9yZS5nZXQoa2V5KSB8fCBbXSk7XG59XG5mdW5jdGlvbiBzYXZlUmVhZFNldChzb3VyY2UsIHNldCkge1xuICBjb25zdCBrZXkgPSBgcmVhZDoke3NvdXJjZX1gO1xuICBjb25zdCBhcnIgPSBBcnJheS5mcm9tKHNldCk7XG4gIGlmIChjYW5QZXJzaXN0KSB7XG4gICAgdHJ5IHsgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkoYXJyKSk7IH0gY2F0Y2ggKF8pIHsgLyogaWdub3JlICovIH1cbiAgfSBlbHNlIHtcbiAgICBfbWVtb3J5U3RvcmUuc2V0KGtleSwgYXJyKTtcbiAgfVxufVxuZnVuY3Rpb24gbWFya1JlYWQoc291cmNlLCBpZCwgaXNSZWFkKSB7XG4gIGNvbnN0IHNldCA9IGxvYWRSZWFkU2V0KHNvdXJjZSk7XG4gIGlmIChpc1JlYWQpIHNldC5hZGQoaWQpOyBlbHNlIHNldC5kZWxldGUoaWQpO1xuICBzYXZlUmVhZFNldChzb3VyY2UsIHNldCk7XG59XG5mdW5jdGlvbiBpc1JlYWQoc291cmNlLCBpZCkge1xuICByZXR1cm4gbG9hZFJlYWRTZXQoc291cmNlKS5oYXMoaWQpO1xufVxuXG4vLyBVcGRhdGUgcGFnZSBoZWFkaW5nIHdpdGggbGl2ZSBkYXRlIGFuZCB0aW1lXG5mdW5jdGlvbiB1cGRhdGVMaXZlRGF0ZVRpbWUoKSB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGRhdGVTdHIgPSBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7XG4gICAgd2Vla2RheTogJ2xvbmcnLFxuICAgIGRheTogJ251bWVyaWMnLFxuICAgIG1vbnRoOiAnbG9uZycsXG4gICAgeWVhcjogJ251bWVyaWMnXG4gIH0pLmZvcm1hdChub3cpO1xuICBjb25zdCB0aW1lU3RyID0gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJywge1xuICAgIGhvdXI6ICcyLWRpZ2l0JyxcbiAgICBtaW51dGU6ICcyLWRpZ2l0JyxcbiAgICBzZWNvbmQ6ICcyLWRpZ2l0JyxcbiAgICBob3VyMTI6IGZhbHNlXG4gIH0pLmZvcm1hdChub3cpO1xuICBjb25zdCBsaXZlRGF0ZVRpbWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXZlRGF0ZVRpbWUnKTtcbiAgaWYgKGxpdmVEYXRlVGltZUVsKSB7XG4gICAgbGl2ZURhdGVUaW1lRWwudGV4dENvbnRlbnQgPSBgJHtkYXRlU3RyfSBhdCAke3RpbWVTdHJ9YDtcbiAgfVxufVxuXG5jb25zdCB3ZWF0aGVyQ29kZU1hcCA9IHsgMDogJ0NsZWFyIHNreScsIDE6ICdNYWlubHkgY2xlYXInLCAyOiAnUGFydGx5IGNsb3VkeScsIDM6ICdPdmVyY2FzdCcsIDQ1OiAnRm9nJywgNDg6ICdEZXBvc2l0aW5nIHJpbWUgZm9nJywgNTE6ICdMaWdodCBkcml6emxlJywgNTM6ICdNb2RlcmF0ZSBkcml6emxlJywgNTU6ICdEZW5zZSBkcml6emxlJywgNTY6ICdMaWdodCBmcmVlemluZyBkcml6emxlJywgNTc6ICdEZW5zZSBmcmVlemluZyBkcml6emxlJywgNjE6ICdTbGlnaHQgcmFpbicsIDYzOiAnTW9kZXJhdGUgcmFpbicsIDY1OiAnSGVhdnkgcmFpbicsIDY2OiAnTGlnaHQgZnJlZXppbmcgcmFpbicsIDY3OiAnSGVhdnkgZnJlZXppbmcgcmFpbicsIDcxOiAnU2xpZ2h0IHNub3cnLCA3MzogJ01vZGVyYXRlIHNub3cnLCA3NTogJ0hlYXZ5IHNub3cnLCA3NzogJ1Nub3cgZ3JhaW5zJywgODA6ICdSYWluIHNob3dlcnM6IHNsaWdodCcsIDgxOiAnUmFpbiBzaG93ZXJzOiBtb2RlcmF0ZScsIDgyOiAnUmFpbiBzaG93ZXJzOiB2aW9sZW50JywgODU6ICdTbm93IHNob3dlcnM6IHNsaWdodCcsIDg2OiAnU25vdyBzaG93ZXJzOiBoZWF2eScsIDk1OiAnVGh1bmRlcnN0b3JtJywgOTY6ICdUaHVuZGVyc3Rvcm0gd2l0aCBzbGlnaHQgaGFpbCcsIDk5OiAnVGh1bmRlcnN0b3JtIHdpdGggaGVhdnkgaGFpbCcgfTtcblxuLy8gRnVuY3Rpb24gdG8gdXBncmFkZSBCQkMgaW1hZ2UgcmVzb2x1dGlvblxuZnVuY3Rpb24gdXBncmFkZUJCQ0ltYWdlUmVzb2x1dGlvbihpbWFnZVVybCkge1xuICBpZiAoIWltYWdlVXJsIHx8ICFpbWFnZVVybC5pbmNsdWRlcygnaWNoZWYuYmJjaS5jby51aycpKSByZXR1cm4gaW1hZ2VVcmw7XG5cbiAgY29uc3Qgc2l6ZVVwZ3JhZGVzID0ge1xuICAgICcvMTIwLyc6ICcvNTEyLycsXG4gICAgJy8yNDAvJzogJy81MTIvJyxcbiAgICAnLzQ4MC8nOiAnLzUxMi8nLFxuICAgICcvNjQwLyc6ICcvODAwLycsXG4gICAgJy84MDAvJzogJy8xMDI0LydcbiAgfTtcblxuICBmb3IgKGNvbnN0IFtzbWFsbFNpemUsIGxhcmdlU2l6ZV0gb2YgT2JqZWN0LmVudHJpZXMoc2l6ZVVwZ3JhZGVzKSkge1xuICAgIGlmIChpbWFnZVVybC5pbmNsdWRlcyhzbWFsbFNpemUpKSB7XG4gICAgICByZXR1cm4gaW1hZ2VVcmwucmVwbGFjZShzbWFsbFNpemUsIGxhcmdlU2l6ZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGltYWdlVXJsO1xufVxuXG4vLyAtLS0tLS0tLS0tIFdlYXRoZXIgKE9wZW5cdTIwMTFNZXRlbykgLS0tLS0tLS0tLVxuY29uc3QgV0VBVEhFUl9FTCA9IHsgdXBkYXRlZDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dlYXRoZXJVcGRhdGVkJyksIHNrZWxldG9uOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2VhdGhlclNrZWxldG9uJyksIGN1cnJlbnRUZW1wOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VycmVudFRlbXAnKSwgdGVtcFJhbmdlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGVtcFJhbmdlJyksIGF2Z1JhaW46IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdmdSYWluJyksIGNvbmRpdGlvbk5vdzogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmRpdGlvbk5vdycpLCBuZXh0UmFpbjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25leHRSYWluJyksIG5leHRSYWluRGV0YWlsOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV4dFJhaW5EZXRhaWwnKSB9O1xuXG5sZXQgd2VhdGhlckNoYXJ0O1xuYXN5bmMgZnVuY3Rpb24gbG9hZFdlYXRoZXIoKSB7XG4gIGNvbnN0IGxhdCA9IDU0Ljk3ODMsIGxvbiA9IC0xLjYxNzg7IC8vIE5ld2Nhc3RsZSB1cG9uIFR5bmVcbiAgY29uc3QgdXJsID0gYGh0dHBzOi8vYXBpLm9wZW4tbWV0ZW8uY29tL3YxL2ZvcmVjYXN0P2xhdGl0dWRlPSR7bGF0fSZsb25naXR1ZGU9JHtsb259JmhvdXJseT10ZW1wZXJhdHVyZV8ybSxwcmVjaXBpdGF0aW9uX3Byb2JhYmlsaXR5LHByZWNpcGl0YXRpb24sd2VhdGhlcmNvZGUmdGltZXpvbmU9RXVyb3BlJTJGTG9uZG9uJmZvcmVjYXN0X2RheXM9MmA7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ1dlYXRoZXIgZmV0Y2ggZmFpbGVkJyk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICBjb25zdCB7IHRpbWUsIHRlbXBlcmF0dXJlXzJtLCBwcmVjaXBpdGF0aW9uX3Byb2JhYmlsaXR5LCBwcmVjaXBpdGF0aW9uLCB3ZWF0aGVyY29kZSB9ID0gZGF0YS5ob3VybHk7XG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gIGxldCBzdGFydElkeCA9IHRpbWUuZmluZEluZGV4KHQgPT4gbmV3IERhdGUodCkuZ2V0VGltZSgpID49IG5vdyk7XG4gIGlmIChzdGFydElkeCA9PT0gLTEpIHN0YXJ0SWR4ID0gMDtcbiAgY29uc3QgcmFuZ2UgPSBbLi4uQXJyYXkoMjQpXS5tYXAoKF8sIGkpID0+IHN0YXJ0SWR4ICsgaSkuZmlsdGVyKGkgPT4gaSA8IHRpbWUubGVuZ3RoKTtcbiAgY29uc3QgbGFiZWxzID0gcmFuZ2UubWFwKGkgPT4gZm10VGltZSh0aW1lW2ldKSk7XG4gIGNvbnN0IHRlbXBzID0gcmFuZ2UubWFwKGkgPT4gdGVtcGVyYXR1cmVfMm1baV0pO1xuICBjb25zdCBwcm9icyA9IHJhbmdlLm1hcChpID0+IHByZWNpcGl0YXRpb25fcHJvYmFiaWxpdHlbaV0pO1xuICBjb25zdCBwcmVjcyA9IHJhbmdlLm1hcChpID0+IHByZWNpcGl0YXRpb25baV0pO1xuICBjb25zdCBub3dDb2RlID0gd2VhdGhlcmNvZGVbc3RhcnRJZHhdO1xuICBXRUFUSEVSX0VMLmN1cnJlbnRUZW1wLnRleHRDb250ZW50ID0gYCR7TWF0aC5yb3VuZCh0ZW1wZXJhdHVyZV8ybVtzdGFydElkeF0gPz8gdGVtcGVyYXR1cmVfMm0uYXQoMCkpfVx1MDBCMENgO1xuICBXRUFUSEVSX0VMLnRlbXBSYW5nZS50ZXh0Q29udGVudCA9IGAke01hdGgucm91bmQoTWF0aC5taW4oLi4udGVtcHMpKX1cdTAwQjBDIFx1MjE5MiAke01hdGgucm91bmQoTWF0aC5tYXgoLi4udGVtcHMpKX1cdTAwQjBDYDtcbiAgV0VBVEhFUl9FTC5hdmdSYWluLnRleHRDb250ZW50ID0gYCR7TWF0aC5yb3VuZChwcm9icy5yZWR1Y2UoKGEsYik9PmErYiwwKSAvIHByb2JzLmxlbmd0aCl9JWA7XG4gIFdFQVRIRVJfRUwuY29uZGl0aW9uTm93LnRleHRDb250ZW50ID0gd2VhdGhlckNvZGVNYXBbbm93Q29kZV0gfHwgJ1x1MjAxNCc7XG4gIFdFQVRIRVJfRUwudXBkYXRlZC50ZXh0Q29udGVudCA9IGBVcGRhdGVkICR7bmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJyx7aG91cjonMi1kaWdpdCcsbWludXRlOicyLWRpZ2l0J30pLmZvcm1hdChuZXcgRGF0ZSgpKX1gO1xuICBsZXQgbmV4dElkeCA9IHJhbmdlLmZpbmQoaSA9PiAocHJlY2lwaXRhdGlvbl9wcm9iYWJpbGl0eVtpXSA+PSA1MCkgfHwgKHByZWNpcGl0YXRpb25baV0gPj0gMC4yKSk7XG4gIGlmIChuZXh0SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICBsZXQgYmVzdEkgPSByYW5nZVswXTsgbGV0IGJlc3RQID0gLTE7IGZvciAoY29uc3QgaSBvZiByYW5nZSkgeyBpZiAocHJlY2lwaXRhdGlvbl9wcm9iYWJpbGl0eVtpXSA+IGJlc3RQKSB7IGJlc3RQID0gcHJlY2lwaXRhdGlvbl9wcm9iYWJpbGl0eVtpXTsgYmVzdEkgPSBpOyB9IH1cbiAgICBuZXh0SWR4ID0gYmVzdEk7IFdFQVRIRVJfRUwubmV4dFJhaW4udGV4dENvbnRlbnQgPSBgTm8gaGlnaCBjaGFuY2Ugc29vbiBcdTIwMTQgaGlnaGVzdCBpbiBuZXh0IDI0aCBhdCAke2ZtdERhdGVUaW1lKHRpbWVbbmV4dElkeF0pfWA7XG4gIH0gZWxzZSB7IFdFQVRIRVJfRUwubmV4dFJhaW4udGV4dENvbnRlbnQgPSBgTGlrZWx5IGFyb3VuZCAke2ZtdERhdGVUaW1lKHRpbWVbbmV4dElkeF0pfWA7IH1cbiAgV0VBVEhFUl9FTC5uZXh0UmFpbkRldGFpbC50ZXh0Q29udGVudCA9IGBQcm9iYWJpbGl0eSAke3ByZWNpcGl0YXRpb25fcHJvYmFiaWxpdHlbbmV4dElkeF19JSwgZXhwZWN0ZWQgcHJlY2lwaXRhdGlvbiAke3ByZWNzW3JhbmdlLmluZGV4T2YobmV4dElkeCldID8/IHByZWNpcGl0YXRpb25bbmV4dElkeF19IG1tLmA7XG4gIGNvbnN0IGN0eCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3ZWF0aGVyQ2hhcnQnKS5nZXRDb250ZXh0KCcyZCcpO1xuICBXRUFUSEVSX0VMLnNrZWxldG9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGlmICh3ZWF0aGVyQ2hhcnQpIHdlYXRoZXJDaGFydC5kZXN0cm95KCk7XG4gIHdlYXRoZXJDaGFydCA9IG5ldyBDaGFydChjdHgsIHsgdHlwZTogJ2JhcicsIGRhdGE6IHsgbGFiZWxzLCBkYXRhc2V0czogWyB7IHR5cGU6ICdsaW5lJywgbGFiZWw6ICdUZW1wZXJhdHVyZSAoXHUwMEIwQyknLCBkYXRhOiB0ZW1wcywgeUF4aXNJRDogJ3knLCB0ZW5zaW9uOiAwLjM1LCBib3JkZXJXaWR0aDogMiwgcG9pbnRSYWRpdXM6IDAgfSwgeyB0eXBlOiAnYmFyJywgbGFiZWw6ICdQcmVjaXBpdGF0aW9uIFByb2JhYmlsaXR5ICglKScsIGRhdGE6IHByb2JzLCB5QXhpc0lEOiAneTEnLCBib3JkZXJXaWR0aDogMCB9IF0gfSwgb3B0aW9uczogeyByZXNwb25zaXZlOiB0cnVlLCBtYWludGFpbkFzcGVjdFJhdGlvOiBmYWxzZSwgc2NhbGVzOiB7IHk6IHsgcG9zaXRpb246ICdsZWZ0JywgdGlja3M6IHsgY29sb3I6ICcjY2JkNWUxJyB9LCBncmlkOiB7IGNvbG9yOiAncmdiYSgxNDgsMTYzLDE4NCwwLjE1KScgfSB9LCB5MTogeyBwb3NpdGlvbjogJ3JpZ2h0JywgdGlja3M6IHsgY29sb3I6ICcjY2JkNWUxJyB9LCBncmlkOiB7IGRyYXdPbkNoYXJ0QXJlYTogZmFsc2UgfSB9LCB4OiB7IHRpY2tzOiB7IGNvbG9yOiAnI2NiZDVlMScgfSwgZ3JpZDogeyBjb2xvcjogJ3JnYmEoMTQ4LDE2MywxODQsMC4xKScgfSB9IH0sIHBsdWdpbnM6IHsgbGVnZW5kOiB7IGxhYmVsczogeyBjb2xvcjogJyNlMmU4ZjAnIH0gfSwgdG9vbHRpcDogeyBjYWxsYmFja3M6IHsgdGl0bGU6IChpdGVtcykgPT4gYEhvdXI6ICR7aXRlbXNbMF0ubGFiZWx9YCB9IH0gfSwgYW5pbWF0aW9uOiB7IGR1cmF0aW9uOiA5MDAgfSB9IH0pO1xufVxuXG4vLyAtLS0tLS0tLS0tIFJhZGFyIChSYWluVmlld2VyIG92ZXIgTGVhZmxldCkgLS0tLS0tLS0tLVxubGV0IHJhZGFyTWFwLCByYWRhckZyYW1lcyA9IFtdLCByYWRhckxheWVycyA9IFtdLCByYWRhckluZGV4ID0gMCwgcmFkYXJUaW1lciA9IG51bGw7XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRSYWRhcigpIHtcbiAgY29uc3QgY2VudGVyID0gWzU0Ljk3ODMsIC0xLjYxNzhdOyAvLyBOZXdjYXN0bGUgdXBvbiBUeW5lXG4gIHJhZGFyTWFwID0gTC5tYXAoJ3JhZGFyTWFwJywgeyB6b29tQ29udHJvbDogdHJ1ZSwgYXR0cmlidXRpb25Db250cm9sOiB0cnVlIH0pLnNldFZpZXcoY2VudGVyLCA3KTtcbiAgY29uc3QgYmFzZSA9IEwudGlsZUxheWVyKCdodHRwczovL3tzfS50aWxlLm9wZW5zdHJlZXRtYXAub3JnL3t6fS97eH0ve3l9LnBuZycsIHsgbWF4Wm9vbTogMTgsIGF0dHJpYnV0aW9uOiAnJmNvcHk7IDxhIGhyZWY9XCJodHRwczovL3d3dy5vcGVuc3RyZWV0bWFwLm9yZy9jb3B5cmlnaHRcIj5PcGVuU3RyZWV0TWFwPC9hPiBjb250cmlidXRvcnMnIH0pO1xuICBiYXNlLmFkZFRvKHJhZGFyTWFwKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkucmFpbnZpZXdlci5jb20vcHVibGljL3dlYXRoZXItbWFwcy5qc29uJyk7XG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcignUmFkYXIgbWV0YWRhdGEgZmV0Y2ggZmFpbGVkJyk7XG4gICAgY29uc3QganNvbiA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgY29uc3QgYWxsRnJhbWVzID0gWy4uLihqc29uLnJhZGFyPy5wYXN0fHxbXSksIC4uLihqc29uLnJhZGFyPy5ub3djYXN0fHxbXSldO1xuICAgIGNvbnN0IGN1dG9mZiA9IERhdGUubm93KCkgLSA0KjYwKjYwKjEwMDA7IC8vIGxhc3QgNCBob3Vyc1xuICAgIHJhZGFyRnJhbWVzID0gYWxsRnJhbWVzLmZpbHRlcihmID0+IChmLnRpbWUqMTAwMCkgPj0gY3V0b2ZmKTtcbiAgICBpZiAocmFkYXJGcmFtZXMubGVuZ3RoID09PSAwKSB7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhck1hcCcpLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicC0zIHRleHQtc21cIj5ObyByYWRhciBmcmFtZXMgYXZhaWxhYmxlIHJpZ2h0IG5vdy48L2Rpdj4nOyByZXR1cm47IH1cbiAgICByYWRhckxheWVycyA9IHJhZGFyRnJhbWVzLm1hcChmID0+IEwudGlsZUxheWVyKGBodHRwczovL3RpbGVjYWNoZS5yYWludmlld2VyLmNvbS92Mi9yYWRhci8ke2YudGltZX0vMjU2L3t6fS97eH0ve3l9LzIvMV8xLnBuZ2AsIHsgb3BhY2l0eTogMC43LCBhdHRyaWJ1dGlvbjogJ1JhZGFyIFx1MDBBOSA8YSBocmVmPVwiaHR0cHM6Ly9yYWludmlld2VyLmNvbVwiPlJhaW5WaWV3ZXI8L2E+JyB9KSk7XG4gICAgcmFkYXJJbmRleCA9IHJhZGFyTGF5ZXJzLmxlbmd0aCAtIDE7XG4gICAgcmFkYXJMYXllcnNbcmFkYXJJbmRleF0uYWRkVG8ocmFkYXJNYXApO1xuICAgIHVwZGF0ZVJhZGFyVGltZUxhYmVsKCk7XG4gICAgY29uc3QgcGxheUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhclBsYXknKTtcbiAgICBwbGF5QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdG9nZ2xlUmFkYXIpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhclByZXYnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHN0ZXBSYWRhcigtMSkpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhck5leHQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHN0ZXBSYWRhcigxKSk7XG4gICAgdG9nZ2xlUmFkYXIoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhck1hcCcpLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwicC0zIHRleHQtc21cIj5GYWlsZWQgdG8gbG9hZCByYWRhci4gJHtlLm1lc3NhZ2V9PC9kaXY+YDtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVSYWRhclRpbWVMYWJlbCgpIHtcbiAgY29uc3QgdHMgPSByYWRhckZyYW1lc1tyYWRhckluZGV4XT8udGltZSoxMDAwO1xuICBpZiAoIXRzKSByZXR1cm47XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhclRpbWUnKS50ZXh0Q29udGVudCA9IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicsIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KS5mb3JtYXQobmV3IERhdGUodHMpKTtcbn1cblxuZnVuY3Rpb24gc3RlcFJhZGFyKGRpciA9IDEpIHtcbiAgaWYgKCFyYWRhckxheWVycy5sZW5ndGgpIHJldHVybjtcbiAgcmFkYXJMYXllcnNbcmFkYXJJbmRleF0/LnJlbW92ZSgpO1xuICByYWRhckluZGV4ID0gKHJhZGFySW5kZXggKyBkaXIgKyByYWRhckxheWVycy5sZW5ndGgpICUgcmFkYXJMYXllcnMubGVuZ3RoO1xuICByYWRhckxheWVyc1tyYWRhckluZGV4XS5hZGRUbyhyYWRhck1hcCk7XG4gIHVwZGF0ZVJhZGFyVGltZUxhYmVsKCk7XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZVJhZGFyKCkge1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmFkYXJQbGF5Jyk7XG4gIGlmIChyYWRhclRpbWVyKSB7IGNsZWFySW50ZXJ2YWwocmFkYXJUaW1lcik7IHJhZGFyVGltZXIgPSBudWxsOyBidG4udGV4dENvbnRlbnQgPSAnUGxheSc7IHJldHVybjsgfVxuICBidG4udGV4dENvbnRlbnQgPSAnUGF1c2UnO1xuICByYWRhclRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4gc3RlcFJhZGFyKDEpLCA2MDApO1xufVxuXG4vLyAtLS0tLS0tLS0tIFJlZGRpdCBQb3B1bGFyIEhvdCAyMCAtLS0tLS0tLS0tXG5hc3luYyBmdW5jdGlvbiBsb2FkUmVkZGl0KCkge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWRkaXRMaXN0Jyk7XG4gIGVsLmlubmVySFRNTCA9ICcnO1xuICBlbC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIEFycmF5LmZyb20oe2xlbmd0aDogOH0pLm1hcCgoKSA9PiBgXG4gICAgPGRpdiBjbGFzcz1cImdsYXNzIHJvdW5kZWQtMnhsIHAtNCBjYXJkLWhvdmVyXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiaC0zMiB3LWZ1bGwgcm91bmRlZC1sZyBza2VsZXRvbiBhbmltYXRlLXNoaW1tZXIgbWItM1wiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImgtNSB3LTMvNCByb3VuZGVkLW1kIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lclwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm10LTMgaC00IHctMS8yIHJvdW5kZWQtbWQgc2tlbGV0b24gYW5pbWF0ZS1zaGltbWVyXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibXQtMyBoLTggdy0yNCByb3VuZGVkLWxnIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lclwiPjwvZGl2PlxuICAgIDwvZGl2PmApLmpvaW4oJycpKTtcbiAgXG4gIC8vIFRyeSBtdWx0aXBsZSBhcHByb2FjaGVzIHRvIGZldGNoIFJlZGRpdCBkYXRhXG4gIGxldCBqc29uO1xuICBsZXQgZXJyb3I7XG4gIFxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gZmV0Y2ggd2l0aCB0aW1lb3V0XG4gIGNvbnN0IGZldGNoV2l0aFRpbWVvdXQgPSBhc3luYyAodXJsLCB0aW1lb3V0TXMgPSAxMDAwMCkgPT4ge1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiBjb250cm9sbGVyLmFib3J0KCksIHRpbWVvdXRNcyk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7IHNpZ25hbDogY29udHJvbGxlci5zaWduYWwgfSk7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfTtcbiAgXG4gIC8vIE1ldGhvZCAxOiBEaXJlY3QgUmVkZGl0IEFQSSAobWF5IGZhaWwgZHVlIHRvIENPUlMpXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2hXaXRoVGltZW91dCgnaHR0cHM6Ly93d3cucmVkZGl0LmNvbS9yL3BvcHVsYXIvaG90Lmpzb24/bGltaXQ9MjAnKTtcbiAgICBpZiAocmVzLm9rKSB7XG4gICAgICBqc29uID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzLnN0YXR1c306ICR7cmVzLnN0YXR1c1RleHR9YCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyb3IgPSBlO1xuICAgIGNvbnNvbGUubG9nKCdEaXJlY3QgUmVkZGl0IEFQSSBmYWlsZWQsIHRyeWluZyBDT1JTIHByb3h5Li4uJywgZS5tZXNzYWdlKTtcbiAgfVxuICBcbiAgLy8gTWV0aG9kIDI6IENPUlMgcHJveHkgMSAoYWxsb3JpZ2lucy53aW4pXG4gIGlmICghanNvbikge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaFdpdGhUaW1lb3V0KGBodHRwczovL2FwaS5hbGxvcmlnaW5zLndpbi9yYXc/dXJsPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdodHRwczovL3d3dy5yZWRkaXQuY29tL3IvcG9wdWxhci9ob3QuanNvbj9saW1pdD0yMCcpfWApO1xuICAgICAgaWYgKHJlcy5vaykge1xuICAgICAgICBqc29uID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1VzZWQgYWxsb3JpZ2lucy53aW4gQ09SUyBwcm94eScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzLnN0YXR1c306ICR7cmVzLnN0YXR1c1RleHR9YCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyb3IgPSBlO1xuICAgICAgY29uc29sZS5sb2coJ2FsbG9yaWdpbnMud2luIHByb3h5IGZhaWxlZCwgdHJ5aW5nIG5leHQuLi4nLCBlLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gTWV0aG9kIDM6IENPUlMgcHJveHkgMiAoY29ycy1hbnl3aGVyZSlcbiAgaWYgKCFqc29uKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoV2l0aFRpbWVvdXQoYGh0dHBzOi8vY29ycy1hbnl3aGVyZS5oZXJva3VhcHAuY29tL2h0dHBzOi8vd3d3LnJlZGRpdC5jb20vci9wb3B1bGFyL2hvdC5qc29uP2xpbWl0PTIwYCk7XG4gICAgICBpZiAocmVzLm9rKSB7XG4gICAgICAgIGpzb24gPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBjb25zb2xlLmxvZygnVXNlZCBjb3JzLWFueXdoZXJlIHByb3h5Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyZXMuc3RhdHVzfTogJHtyZXMuc3RhdHVzVGV4dH1gKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnJvciA9IGU7XG4gICAgICBjb25zb2xlLmxvZygnY29ycy1hbnl3aGVyZSBwcm94eSBmYWlsZWQsIHRyeWluZyBuZXh0Li4uJywgZS5tZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIE1ldGhvZCA0OiBDT1JTIHByb3h5IDMgKHRoaW5ncHJveHkpXG4gIGlmICghanNvbikge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaFdpdGhUaW1lb3V0KGBodHRwczovL3RoaW5ncHJveHkuZnJlZWJvYXJkLmlvL2ZldGNoL2h0dHBzOi8vd3d3LnJlZGRpdC5jb20vci9wb3B1bGFyL2hvdC5qc29uP2xpbWl0PTIwYCk7XG4gICAgICBpZiAocmVzLm9rKSB7XG4gICAgICAgIGpzb24gPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBjb25zb2xlLmxvZygnVXNlZCB0aGluZ3Byb3h5IHByb3h5Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyZXMuc3RhdHVzfTogJHtyZXMuc3RhdHVzVGV4dH1gKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnJvciA9IGU7XG4gICAgICBjb25zb2xlLmxvZygndGhpbmdwcm94eSBmYWlsZWQsIGFsbCBtZXRob2RzIGV4aGF1c3RlZCcsIGUubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICBpZiAoIWpzb24pIHtcbiAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvcj8ubWVzc2FnZSB8fCAnVW5rbm93biBlcnJvcic7XG4gICAgY29uc3QgaXNDb3JzRXJyb3IgPSBlcnJvck1lc3NhZ2UuaW5jbHVkZXMoJ0NPUlMnKSB8fCBlcnJvck1lc3NhZ2UuaW5jbHVkZXMoJ05ldHdvcmtFcnJvcicpIHx8IGVycm9yTWVzc2FnZS5pbmNsdWRlcygnRmFpbGVkIHRvIGZldGNoJyk7XG4gICAgY29uc3QgdXNlck1lc3NhZ2UgPSBpc0NvcnNFcnJvciBcbiAgICAgID8gJ0NPUlMgcmVzdHJpY3Rpb25zIG9yIG5ldHdvcmsgaXNzdWVzLiBUaGlzIGlzIGNvbW1vbiBvbiBtb2JpbGUgYnJvd3NlcnMgYW5kIHNvbWUgbmV0d29ya3MuJ1xuICAgICAgOiBlcnJvck1lc3NhZ2U7XG4gICAgXG4gICAgZWwuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJnbGFzcyByb3VuZGVkLTJ4bCBwLTQgdGV4dC1zbVwiPlxuICAgICAgPGRpdiBjbGFzcz1cImZvbnQtc2VtaWJvbGQgdGV4dC1yZWQtMzAwIG1iLTJcIj5GYWlsZWQgdG8gbG9hZCBSZWRkaXQ8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LXNsYXRlLTMwMC84MCBtYi0yXCI+QWxsIGZldGNoIG1ldGhvZHMgZmFpbGVkLiBMYXN0IGVycm9yOiAke3VzZXJNZXNzYWdlfTwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRleHQteHMgdGV4dC1zbGF0ZS00MDBcIj5UaGlzIG1heSBiZSBkdWUgdG8gbmV0d29yayByZXN0cmljdGlvbnMsIENPUlMgcG9saWNpZXMsIG9yIFJlZGRpdCBBUEkgY2hhbmdlcy48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICAgIHJldHVybjtcbiAgfVxuICBcbiAgdHJ5IHtcbiAgICBjb25zdCBpdGVtcyA9IGpzb24uZGF0YS5jaGlsZHJlbi5tYXAoYyA9PiBjLmRhdGEpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWRkaXRVcGRhdGVkJykudGV4dENvbnRlbnQgPSBgVXBkYXRlZCAke25ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicse2hvdXI6JzItZGlnaXQnLG1pbnV0ZTonMi1kaWdpdCd9KS5mb3JtYXQobmV3IERhdGUoKSl9YDtcbiAgICBlbC5pbm5lckhUTUwgPSAnJztcbiAgICBmb3IgKGNvbnN0IHBvc3Qgb2YgaXRlbXMpIHtcbiAgICAgIGNvbnN0IHVybCA9IGBodHRwczovL3d3dy5yZWRkaXQuY29tJHtwb3N0LnBlcm1hbGlua31gO1xuICAgICAgY29uc3QgaWQgPSBwb3N0LmlkIHx8IHBvc3QucGVybWFsaW5rO1xuICAgICAgY29uc3QgZmxhaXIgPSBwb3N0LmxpbmtfZmxhaXJfdGV4dCA/IGA8c3BhbiBjbGFzcz0nbWwtMiB0ZXh0LXhzIHB4LTEuNSBweS0wLjUgcm91bmRlZC1tZCBiZy13aGl0ZS8xMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwJz4ke3Bvc3QubGlua19mbGFpcl90ZXh0fTwvc3Bhbj5gIDogJyc7XG4gICAgICBsZXQgaW1hZ2VVcmwgPSBudWxsO1xuICAgICAgbGV0IGltYWdlQWx0ID0gcG9zdC50aXRsZTtcbiAgICAgIGlmIChwb3N0LnByZXZpZXcgJiYgcG9zdC5wcmV2aWV3LmltYWdlcyAmJiBwb3N0LnByZXZpZXcuaW1hZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgcHJldmlldyA9IHBvc3QucHJldmlldy5pbWFnZXNbMF07XG4gICAgICAgIGlmIChwcmV2aWV3LnZhcmlhbnRzICYmIHByZXZpZXcudmFyaWFudHMuZ2lmKSB7XG4gICAgICAgICAgaW1hZ2VVcmwgPSBwcmV2aWV3LnZhcmlhbnRzLmdpZi5zb3VyY2UudXJsO1xuICAgICAgICB9IGVsc2UgaWYgKHByZXZpZXcudmFyaWFudHMgJiYgcHJldmlldy52YXJpYW50cy5tcDQpIHtcbiAgICAgICAgICBpbWFnZVVybCA9IHByZXZpZXcuc291cmNlLnVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbWFnZVVybCA9IHByZXZpZXcuc291cmNlLnVybDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChwb3N0LnRodW1ibmFpbCAmJiBwb3N0LnRodW1ibmFpbCAhPT0gJ3NlbGYnICYmIHBvc3QudGh1bWJuYWlsICE9PSAnZGVmYXVsdCcgJiYgcG9zdC50aHVtYm5haWwgIT09ICduc2Z3Jykge1xuICAgICAgICBpbWFnZVVybCA9IHBvc3QudGh1bWJuYWlsO1xuICAgICAgfSBlbHNlIGlmIChwb3N0LnVybCAmJiAocG9zdC51cmwuaW5jbHVkZXMoJy5qcGcnKSB8fCBwb3N0LnVybC5pbmNsdWRlcygnLmpwZWcnKSB8fCBwb3N0LnVybC5pbmNsdWRlcygnLnBuZycpIHx8IHBvc3QudXJsLmluY2x1ZGVzKCcuZ2lmJykpKSB7XG4gICAgICAgIGltYWdlVXJsID0gcG9zdC51cmw7XG4gICAgICB9XG4gICAgICBpZiAoaW1hZ2VVcmwgJiYgaW1hZ2VVcmwuaW5jbHVkZXMoJ3JlZGRpdC5jb20nKSkge1xuICAgICAgICBpbWFnZVVybCA9IGltYWdlVXJsLnNwbGl0KCc/JylbMF07XG4gICAgICB9XG4gICAgICBjb25zdCBjb2xsYXBzZWQgPSBpc1JlYWQoJ3JlZGRpdCcsIGlkKTtcbiAgICAgIGlmIChjb2xsYXBzZWQpIHsgYWRkVG9SZWFkTGlzdCgncmVkZGl0JywgeyBpZCwgdGl0bGU6IHBvc3QudGl0bGUsIGhyZWY6IHVybCB9KTsgY29udGludWU7IH1cbiAgICAgIGVsLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgYFxuICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aWNsZSBnbGFzcyByb3VuZGVkLTJ4bCBwLTQgY2FyZC1ob3ZlciR7Y29sbGFwc2VkID8gJyBjb2xsYXBzZWQnIDogJyd9XCIgZGF0YS1zb3VyY2U9XCJyZWRkaXRcIiBkYXRhLWlkPVwiJHtpZH1cIiBkYXRhLXVybD1cIiR7dXJsfVwiPlxuICAgICAgICAgIDxhIGNsYXNzPVwiYXJ0aWNsZS1saW5rIGJsb2NrXCIgaHJlZj1cIiR7dXJsfVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICR7aW1hZ2VVcmwgPyBgXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoLTMyIHctZnVsbCByb3VuZGVkLWxnIG92ZXJmbG93LWhpZGRlbiBtYi0zIGJnLXNsYXRlLTgwMC81MFwiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiJHtpbWFnZVVybH1cIiBhbHQ9XCIke3Bvc3QudGl0bGV9XCIgY2xhc3M9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBhcnRpY2xlLWltYWdlXCIgbG9hZGluZz1cImxhenlcIiBvbmVycm9yPVwidGhpcy5zdHlsZS5kaXNwbGF5PSdub25lJzsgdGhpcy5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2JnLXNsYXRlLTgwMC81MCcpO1wiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIGAgOiAnJ31cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LXNtIHRleHQtc2xhdGUtMzAwLzcwIGFydGljbGUtbWV0YVwiPnIvJHtwb3N0LnN1YnJlZGRpdH0gXHUyMDIyIFx1MkIwNlx1RkUwRSAke3Bvc3QudXBzLnRvTG9jYWxlU3RyaW5nKCdlbi1HQicpfSBcdTIwMjIgJHtuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IGRheTonMi1kaWdpdCcsIG1vbnRoOidzaG9ydCcsIGhvdXI6JzItZGlnaXQnLCBtaW51dGU6JzItZGlnaXQnIH0pLmZvcm1hdChuZXcgRGF0ZShwb3N0LmNyZWF0ZWRfdXRjICogMTAwMCkpfTwvZGl2PlxuICAgICAgICAgICAgPGgzIGNsYXNzPVwibXQtMSBmb250LXNlbWlib2xkIGxlYWRpbmctc251Z1wiPiR7cG9zdC50aXRsZS5yZXBsYWNlKC88L2csJyZsdDsnKX08L2gzPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm10LTMgaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIHRleHQteHMgdGV4dC1zbGF0ZS0zMDAvODAgYXJ0aWNsZS1tZXRhXCI+YnkgdS8ke3Bvc3QuYXV0aG9yfSR7ZmxhaXJ9PC9kaXY+XG4gICAgICAgICAgPC9hPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJhcnRpY2xlLXRvZ2dsZSBnbGFzcyBweC0yIHB5LTEgcm91bmRlZC1tZCB0ZXh0LXhzXCIgdHlwZT1cImJ1dHRvblwiIGFyaWEtbGFiZWw9XCJUb2dnbGUgcmVhZFwiPiR7Y29sbGFwc2VkID8gJ01hcmsgdW5yZWFkJyA6ICdNYXJrIHJlYWQnfTwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGApO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkgeyBcbiAgICBlbC5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImdsYXNzIHJvdW5kZWQtMnhsIHAtNCB0ZXh0LXNtXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZm9udC1zZW1pYm9sZCB0ZXh0LXJlZC0zMDAgbWItMlwiPkZhaWxlZCB0byBwYXJzZSBSZWRkaXQgZGF0YTwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRleHQtc2xhdGUtMzAwLzgwXCI+RXJyb3I6ICR7ZS5tZXNzYWdlfTwvZGl2PlxuICAgIDwvZGl2PmA7IFxuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0gV29XIENsYXNzaWMgSG90IDIwIC0tLS0tLS0tLS1cbmFzeW5jIGZ1bmN0aW9uIGxvYWRXb3dDbGFzc2ljKCkge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3b3dDbGFzc2ljTGlzdCcpO1xuICBlbC5pbm5lckhUTUwgPSAnJztcbiAgZWwuaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmVlbmQnLCBBcnJheS5mcm9tKHtsZW5ndGg6IDh9KS5tYXAoKCkgPT4gYFxuICAgIDxkaXYgY2xhc3M9XCJnbGFzcyByb3VuZGVkLTJ4bCBwLTQgY2FyZC1ob3ZlclwiPlxuICAgICAgPGRpdiBjbGFzcz1cImgtMzIgdy1mdWxsIHJvdW5kZWQtbGcgc2tlbGV0b24gYW5pbWF0ZS1zaGltbWVyIG1iLTNcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJoLTUgdy0zLzQgcm91bmRlZC1tZCBza2VsZXRvbiBhbmltYXRlLXNoaW1tZXJcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtdC0zIGgtNCB3LTEvMiByb3VuZGVkLW1kIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lclwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm10LTMgaC04IHctMjQgcm91bmRlZC1sZyBza2VsZXRvbiBhbmltYXRlLXNoaW1tZXJcIj48L2Rpdj5cbiAgICA8L2Rpdj5gKS5qb2luKCcnKSk7XG4gIFxuICAvLyBUcnkgbXVsdGlwbGUgYXBwcm9hY2hlcyB0byBmZXRjaCBSZWRkaXQgZGF0YVxuICBsZXQganNvbjtcbiAgbGV0IGVycm9yO1xuICBcbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGZldGNoIHdpdGggdGltZW91dFxuICBjb25zdCBmZXRjaFdpdGhUaW1lb3V0ID0gYXN5bmMgKHVybCwgdGltZW91dE1zID0gMTAwMDApID0+IHtcbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCB0aW1lb3V0TXMpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwgeyBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsIH0pO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH07XG4gIFxuICAvLyBNZXRob2QgMTogRGlyZWN0IFJlZGRpdCBBUEkgKG1heSBmYWlsIGR1ZSB0byBDT1JTKVxuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoV2l0aFRpbWVvdXQoJ2h0dHBzOi8vd3d3LnJlZGRpdC5jb20vci9jbGFzc2ljd293L2hvdC5qc29uP2xpbWl0PTIwJyk7XG4gICAgaWYgKHJlcy5vaykge1xuICAgICAganNvbiA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Jlcy5zdGF0dXN9OiAke3Jlcy5zdGF0dXNUZXh0fWApO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9yID0gZTtcbiAgICBjb25zb2xlLmxvZygnRGlyZWN0IFdvVyBDbGFzc2ljIEFQSSBmYWlsZWQsIHRyeWluZyBDT1JTIHByb3h5Li4uJywgZS5tZXNzYWdlKTtcbiAgfVxuICBcbiAgLy8gTWV0aG9kIDI6IENPUlMgcHJveHkgMSAoYWxsb3JpZ2lucy53aW4pXG4gIGlmICghanNvbikge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaFdpdGhUaW1lb3V0KGBodHRwczovL2FwaS5hbGxvcmlnaW5zLndpbi9yYXc/dXJsPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdodHRwczovL3d3dy5yZWRkaXQuY29tL3IvY2xhc3NpY3dvdy9ob3QuanNvbj9saW1pdD0yMCcpfWApO1xuICAgICAgaWYgKHJlcy5vaykge1xuICAgICAgICBqc29uID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1VzZWQgYWxsb3JpZ2lucy53aW4gQ09SUyBwcm94eSBmb3IgV29XIENsYXNzaWMnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Jlcy5zdGF0dXN9OiAke3Jlcy5zdGF0dXNUZXh0fWApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGVycm9yID0gZTtcbiAgICAgIGNvbnNvbGUubG9nKCdhbGxvcmlnaW5zLndpbiBwcm94eSBmYWlsZWQgZm9yIFdvVyBDbGFzc2ljLCB0cnlpbmcgbmV4dC4uLicsIGUubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBNZXRob2QgMzogQ09SUyBwcm94eSAyIChjb3JzLWFueXdoZXJlKVxuICBpZiAoIWpzb24pIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2hXaXRoVGltZW91dChgaHR0cHM6Ly9jb3JzLWFueXdoZXJlLmhlcm9rdWFwcC5jb20vaHR0cHM6Ly93d3cucmVkZGl0LmNvbS9yL2NsYXNzaWN3b3cvaG90Lmpzb24/bGltaXQ9MjBgKTtcbiAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAganNvbiA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VkIGNvcnMtYW55d2hlcmUgcHJveHkgZm9yIFdvVyBDbGFzc2ljJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyZXMuc3RhdHVzfTogJHtyZXMuc3RhdHVzVGV4dH1gKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnJvciA9IGU7XG4gICAgICBjb25zb2xlLmxvZygnY29ycy1hbnl3aGVyZSBwcm94eSBmYWlsZWQgZm9yIFdvVyBDbGFzc2ljLCB0cnlpbmcgbmV4dC4uLicsIGUubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBNZXRob2QgNDogQ09SUyBwcm94eSAzICh0aGluZ3Byb3h5KVxuICBpZiAoIWpzb24pIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2hXaXRoVGltZW91dChgaHR0cHM6Ly90aGluZ3Byb3h5LmZyZWVib2FyZC5pby9mZXRjaC9odHRwczovL3d3dy5yZWRkaXQuY29tL3IvY2xhc3NpY3dvdy9ob3QuanNvbj9saW1pdD0yMGApO1xuICAgICAgaWYgKHJlcy5vaykge1xuICAgICAgICBqc29uID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1VzZWQgdGhpbmdwcm94eSBmb3IgV29XIENsYXNzaWMnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Jlcy5zdGF0dXN9OiAke3Jlcy5zdGF0dXNUZXh0fWApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGVycm9yID0gZTtcbiAgICAgIGNvbnNvbGUubG9nKCd0aGluZ3Byb3h5IGZhaWxlZCBmb3IgV29XIENsYXNzaWMsIGFsbCBtZXRob2RzIGV4aGF1c3RlZCcsIGUubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICBpZiAoIWpzb24pIHtcbiAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvcj8ubWVzc2FnZSB8fCAnVW5rbm93biBlcnJvcic7XG4gICAgY29uc3QgaXNDb3JzRXJyb3IgPSBlcnJvck1lc3NhZ2UuaW5jbHVkZXMoJ0NPUlMnKSB8fCBlcnJvck1lc3NhZ2UuaW5jbHVkZXMoJ05ldHdvcmtFcnJvcicpIHx8IGVycm9yTWVzc2FnZS5pbmNsdWRlcygnRmFpbGVkIHRvIGZldGNoJyk7XG4gICAgY29uc3QgdXNlck1lc3NhZ2UgPSBpc0NvcnNFcnJvciBcbiAgICAgID8gJ0NPUlMgcmVzdHJpY3Rpb25zIG9yIG5ldHdvcmsgaXNzdWVzLiBUaGlzIGlzIGNvbW1vbiBvbiBtb2JpbGUgYnJvd3NlcnMgYW5kIHNvbWUgbmV0d29ya3MuJ1xuICAgICAgOiBlcnJvck1lc3NhZ2U7XG4gICAgXG4gICAgZWwuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJnbGFzcyByb3VuZGVkLTJ4bCBwLTQgdGV4dC1zbVwiPlxuICAgICAgPGRpdiBjbGFzcz1cImZvbnQtc2VtaWJvbGQgdGV4dC1yZWQtMzAwIG1iLTJcIj5GYWlsZWQgdG8gbG9hZCBXb1cgQ2xhc3NpYzwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRleHQtc2xhdGUtMzAwLzgwIG1iLTJcIj5BbGwgZmV0Y2ggbWV0aG9kcyBmYWlsZWQuIExhc3QgZXJyb3I6ICR7dXNlck1lc3NhZ2V9PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidGV4dC14cyB0ZXh0LXNsYXRlLTQwMFwiPlRoaXMgbWF5IGJlIGR1ZSB0byBuZXR3b3JrIHJlc3RyaWN0aW9ucywgQ09SUyBwb2xpY2llcywgb3IgUmVkZGl0IEFQSSBjaGFuZ2VzLjwvZGl2PlxuICAgIDwvZGl2PmA7XG4gICAgcmV0dXJuO1xuICB9XG4gIFxuICB0cnkge1xuICAgIGNvbnN0IGl0ZW1zID0ganNvbi5kYXRhLmNoaWxkcmVuLm1hcChjID0+IGMuZGF0YSk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dvd0NsYXNzaWNVcGRhdGVkJykudGV4dENvbnRlbnQgPSBgVXBkYXRlZCAke25ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicse2hvdXI6JzItZGlnaXQnLG1pbnV0ZTonMi1kaWdpdCd9KS5mb3JtYXQobmV3IERhdGUoKSl9YDtcbiAgICBlbC5pbm5lckhUTUwgPSAnJztcbiAgICBmb3IgKGNvbnN0IHBvc3Qgb2YgaXRlbXMpIHtcbiAgICAgIGNvbnN0IHVybCA9IGBodHRwczovL3d3dy5yZWRkaXQuY29tJHtwb3N0LnBlcm1hbGlua31gO1xuICAgICAgY29uc3QgaWQgPSBwb3N0LmlkIHx8IHBvc3QucGVybWFsaW5rO1xuICAgICAgY29uc3QgZmxhaXIgPSBwb3N0LmxpbmtfZmxhaXJfdGV4dCA/IGA8c3BhbiBjbGFzcz0nbWwtMiB0ZXh0LXhzIHB4LTEuNSBweS0wLjUgcm91bmRlZC1tZCBiZy13aGl0ZS8xMCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwJz4ke3Bvc3QubGlua19mbGFpcl90ZXh0fTwvc3Bhbj5gIDogJyc7XG4gICAgICBsZXQgaW1hZ2VVcmwgPSBudWxsO1xuICAgICAgbGV0IGltYWdlQWx0ID0gcG9zdC50aXRsZTtcbiAgICAgIGlmIChwb3N0LnByZXZpZXcgJiYgcG9zdC5wcmV2aWV3LmltYWdlcyAmJiBwb3N0LnByZXZpZXcuaW1hZ2VzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgcHJldmlldyA9IHBvc3QucHJldmlldy5pbWFnZXNbMF07XG4gICAgICAgIGlmIChwcmV2aWV3LnZhcmlhbnRzICYmIHByZXZpZXcudmFyaWFudHMuZ2lmKSB7XG4gICAgICAgICAgaW1hZ2VVcmwgPSBwcmV2aWV3LnZhcmlhbnRzLmdpZi5zb3VyY2UudXJsO1xuICAgICAgICB9IGVsc2UgaWYgKHByZXZpZXcudmFyaWFudHMgJiYgcHJldmlldy52YXJpYW50cy5tcDQpIHtcbiAgICAgICAgICBpbWFnZVVybCA9IHByZXZpZXcuc291cmNlLnVybDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbWFnZVVybCA9IHByZXZpZXcuc291cmNlLnVybDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChwb3N0LnRodW1ibmFpbCAmJiBwb3N0LnRodW1ibmFpbCAhPT0gJ3NlbGYnICYmIHBvc3QudGh1bWJuYWlsICE9PSAnZGVmYXVsdCcgJiYgcG9zdC50aHVtYm5haWwgIT09ICduc2Z3Jykge1xuICAgICAgICBpbWFnZVVybCA9IHBvc3QudGh1bWJuYWlsO1xuICAgICAgfSBlbHNlIGlmIChwb3N0LnVybCAmJiAocG9zdC51cmwuaW5jbHVkZXMoJy5qcGcnKSB8fCBwb3N0LnVybC5pbmNsdWRlcygnLmpwZWcnKSB8fCBwb3N0LnVybC5pbmNsdWRlcygnLnBuZycpIHx8IHBvc3QudXJsLmluY2x1ZGVzKCcuZ2lmJykpKSB7XG4gICAgICAgIGltYWdlVXJsID0gcG9zdC51cmw7XG4gICAgICB9XG4gICAgICBpZiAoaW1hZ2VVcmwgJiYgaW1hZ2VVcmwuaW5jbHVkZXMoJ3JlZGRpdC5jb20nKSkge1xuICAgICAgICBpbWFnZVVybCA9IGltYWdlVXJsLnNwbGl0KCc/JylbMF07XG4gICAgICB9XG4gICAgICBjb25zdCBjb2xsYXBzZWQgPSBpc1JlYWQoJ3dvdy1jbGFzc2ljJywgaWQpO1xuICAgICAgaWYgKGNvbGxhcHNlZCkgeyBhZGRUb1JlYWRMaXN0KCd3b3ctY2xhc3NpYycsIHsgaWQsIHRpdGxlOiBwb3N0LnRpdGxlLCBocmVmOiB1cmwgfSk7IGNvbnRpbnVlOyB9XG4gICAgICBlbC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIGBcbiAgICAgICAgPGRpdiBjbGFzcz1cImFydGljbGUgZ2xhc3Mgcm91bmRlZC0yeGwgcC00IGNhcmQtaG92ZXIke2NvbGxhcHNlZCA/ICcgY29sbGFwc2VkJyA6ICcnfVwiIGRhdGEtc291cmNlPVwid293LWNsYXNzaWNcIiBkYXRhLWlkPVwiJHtpZH1cIiBkYXRhLXVybD1cIiR7dXJsfVwiPlxuICAgICAgICAgIDxhIGNsYXNzPVwiYXJ0aWNsZS1saW5rIGJsb2NrXCIgaHJlZj1cIiR7dXJsfVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICR7aW1hZ2VVcmwgPyBgXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoLTMyIHctZnVsbCByb3VuZGVkLWxnIG92ZXJmbG93LWhpZGRlbiBtYi0zIGJnLXNsYXRlLTgwMC81MFwiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiJHtpbWFnZVVybH1cIiBhbHQ9XCIke3Bvc3QudGl0bGV9XCIgY2xhc3M9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBhcnRpY2xlLWltYWdlXCIgbG9hZGluZz1cImxhenlcIiBvbmVycm9yPVwidGhpcy5zdHlsZS5kaXNwbGF5PSdub25lJzsgdGhpcy5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2JnLXNsYXRlLTgwMC81MCcpO1wiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIGAgOiAnJ31cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LXNtIHRleHQtc2xhdGUtMzAwLzcwIGFydGljbGUtbWV0YVwiPnIvY2xhc3NpY3dvdyBcdTIwMjIgXHUyQjA2XHVGRTBFICR7cG9zdC51cHMudG9Mb2NhbGVTdHJpbmcoJ2VuLUdCJyl9IFx1MjAyMiAke25ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicsIHsgZGF5OicyLWRpZ2l0JywgbW9udGg6J3Nob3J0JywgaG91cjonMi1kaWdpdCcsIG1pbnV0ZTonMi1kaWdpdCcgfSkuZm9ybWF0KG5ldyBEYXRlKHBvc3QuY3JlYXRlZF91dGMgKiAxMDAwKSl9PC9kaXY+XG4gICAgICAgICAgICA8aDMgY2xhc3M9XCJtdC0xIGZvbnQtc2VtaWJvbGQgbGVhZGluZy1zbnVnXCI+JHtwb3N0LnRpdGxlLnJlcGxhY2UoLzwvZywnJmx0OycpfTwvaDM+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibXQtMyBpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgdGV4dC14cyB0ZXh0LXNsYXRlLTMwMC84MCBhcnRpY2xlLW1ldGFcIj5ieSB1LyR7cG9zdC5hdXRob3J9JHtmbGFpcn08L2Rpdj5cbiAgICAgICAgICA8L2E+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImFydGljbGUtdG9nZ2xlIGdsYXNzIHB4LTIgcHktMSByb3VuZGVkLW1kIHRleHQteHNcIiB0eXBlPVwiYnV0dG9uXCIgYXJpYS1sYWJlbD1cIlRvZ2dsZSByZWFkXCI+JHtjb2xsYXBzZWQgPyAnTWFyayB1bnJlYWQnIDogJ01hcmsgcmVhZCd9PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7IFxuICAgIGVsLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwiZ2xhc3Mgcm91bmRlZC0yeGwgcC00IHRleHQtc21cIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmb250LXNlbWlib2xkIHRleHQtcmVkLTMwMCBtYi0yXCI+RmFpbGVkIHRvIHBhcnNlIFdvVyBDbGFzc2ljIGRhdGE8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LXNsYXRlLTMwMC84MFwiPkVycm9yOiAke2UubWVzc2FnZX08L2Rpdj5cbiAgICA8L2Rpdj5gOyBcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tIEZvcm11bGEgMSBIb3QgMjAgLS0tLS0tLS0tLVxuYXN5bmMgZnVuY3Rpb24gbG9hZEZvcm11bGExKCkge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmb3JtdWxhMUxpc3QnKTtcbiAgZWwuaW5uZXJIVE1MID0gJyc7XG4gIGVsLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgQXJyYXkuZnJvbSh7bGVuZ3RoOiA4fSkubWFwKCgpID0+IGBcbiAgICA8ZGl2IGNsYXNzPVwiZ2xhc3Mgcm91bmRlZC0yeGwgcC00IGNhcmQtaG92ZXJcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJoLTMyIHctZnVsbCByb3VuZGVkLWxnIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lciBtYi0zXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiaC01IHctMy80IHJvdW5kZWQtbWQgc2tlbGV0b24gYW5pbWF0ZS1zaGltbWVyXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibXQtMyBoLTQgdy0xLzIgcm91bmRlZC1tZCBza2VsZXRvbiBhbmltYXRlLXNoaW1tZXJcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtdC0zIGgtOCB3LTI0IHJvdW5kZWQtbGcgc2tlbGV0b24gYW5pbWF0ZS1zaGltbWVyXCI+PC9kaXY+XG4gICAgPC9kaXY+YCkuam9pbignJykpO1xuICBcbiAgLy8gVHJ5IG11bHRpcGxlIGFwcHJvYWNoZXMgdG8gZmV0Y2ggUmVkZGl0IGRhdGFcbiAgbGV0IGpzb247XG4gIGxldCBlcnJvcjtcbiAgXG4gIC8vIEhlbHBlciBmdW5jdGlvbiB0byBmZXRjaCB3aXRoIHRpbWVvdXRcbiAgY29uc3QgZmV0Y2hXaXRoVGltZW91dCA9IGFzeW5jICh1cmwsIHRpbWVvdXRNcyA9IDEwMDAwKSA9PiB7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBjb25zdCB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgdGltZW91dE1zKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KTtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICB9O1xuICBcbiAgLy8gTWV0aG9kIDE6IERpcmVjdCBSZWRkaXQgQVBJIChtYXkgZmFpbCBkdWUgdG8gQ09SUylcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaFdpdGhUaW1lb3V0KCdodHRwczovL3d3dy5yZWRkaXQuY29tL3IvZm9ybXVsYTEvaG90Lmpzb24/bGltaXQ9MjAnKTtcbiAgICBpZiAocmVzLm9rKSB7XG4gICAgICBqc29uID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzLnN0YXR1c306ICR7cmVzLnN0YXR1c1RleHR9YCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyb3IgPSBlO1xuICAgIGNvbnNvbGUubG9nKCdEaXJlY3QgRm9ybXVsYSAxIEFQSSBmYWlsZWQsIHRyeWluZyBDT1JTIHByb3h5Li4uJywgZS5tZXNzYWdlKTtcbiAgfVxuICBcbiAgLy8gTWV0aG9kIDI6IENPUlMgcHJveHkgMSAoYWxsb3JpZ2lucy53aW4pXG4gIGlmICghanNvbikge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaFdpdGhUaW1lb3V0KGBodHRwczovL2FwaS5hbGxvcmlnaW5zLndpbi9yYXc/dXJsPSR7ZW5jb2RlVVJJQ29tcG9uZW50KCdodHRwczovL3d3dy5yZWRkaXQuY29tL3IvZm9ybXVsYTEvaG90Lmpzb24/bGltaXQ9MjAnKX1gKTtcbiAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAganNvbiA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VkIGFsbG9yaWdpbnMud2luIENPUlMgcHJveHkgZm9yIEZvcm11bGEgMScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzLnN0YXR1c306ICR7cmVzLnN0YXR1c1RleHR9YCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyb3IgPSBlO1xuICAgICAgY29uc29sZS5sb2coJ2FsbG9yaWdpbnMud2luIHByb3h5IGZhaWxlZCBmb3IgRm9ybXVsYSAxLCB0cnlpbmcgbmV4dC4uLicsIGUubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBNZXRob2QgMzogQ09SUyBwcm94eSAyIChjb3JzLWFueXdoZXJlKVxuICBpZiAoIWpzb24pIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2hXaXRoVGltZW91dChgaHR0cHM6Ly9jb3JzLWFueXdoZXJlLmhlcm9rdWFwcC5jb20vaHR0cHM6Ly93d3cucmVkZGl0LmNvbS9yL2Zvcm11bGExL2hvdC5qc29uP2xpbWl0PTIwYCk7XG4gICAgICBpZiAocmVzLm9rKSB7XG4gICAgICAgIGpzb24gPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICBjb25zb2xlLmxvZygnVXNlZCBjb3JzLWFueXdoZXJlIHByb3h5IGZvciBGb3JtdWxhIDEnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Jlcy5zdGF0dXN9OiAke3Jlcy5zdGF0dXNUZXh0fWApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGVycm9yID0gZTtcbiAgICAgIGNvbnNvbGUubG9nKCdjb3JzLWFueXdoZXJlIHByb3h5IGZhaWxlZCBmb3IgRm9ybXVsYSAxLCB0cnlpbmcgbmV4dC4uLicsIGUubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBNZXRob2QgNDogQ09SUyBwcm94eSAzICh0aGluZ3Byb3h5KVxuICBpZiAoIWpzb24pIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2hXaXRoVGltZW91dChgaHR0cHM6Ly90aGluZ3Byb3h5LmZyZWVib2FyZC5pby9mZXRjaC9odHRwczovL3d3dy5yZWRkaXQuY29tL3IvZm9ybXVsYTEvaG90Lmpzb24/bGltaXQ9MjBgKTtcbiAgICAgIGlmIChyZXMub2spIHtcbiAgICAgICAganNvbiA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2VkIHRoaW5ncHJveHkgZm9yIEZvcm11bGEgMScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzLnN0YXR1c306ICR7cmVzLnN0YXR1c1RleHR9YCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyb3IgPSBlO1xuICAgICAgY29uc29sZS5sb2coJ3RoaW5ncHJveHkgZmFpbGVkIGZvciBGb3JtdWxhIDEsIGFsbCBtZXRob2RzIGV4aGF1c3RlZCcsIGUubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICBpZiAoIWpzb24pIHtcbiAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvcj8ubWVzc2FnZSB8fCAnVW5rbm93biBlcnJvcic7XG4gICAgY29uc3QgaXNDb3JzRXJyb3IgPSBlcnJvck1lc3NhZ2UuaW5jbHVkZXMoJ0NPUlMnKSB8fCBlcnJvck1lc3NhZ2UuaW5jbHVkZXMoJ05ldHdvcmtFcnJvcicpIHx8IGVycm9yTWVzc2FnZS5pbmNsdWRlcygnRmFpbGVkIHRvIGZldGNoJyk7XG4gICAgY29uc3QgdXNlck1lc3NhZ2UgPSBpc0NvcnNFcnJvciBcbiAgICAgID8gJ0NPUlMgcmVzdHJpY3Rpb25zIG9yIG5ldHdvcmsgaXNzdWVzLiBUaGlzIGlzIGNvbW1vbiBvbiBtb2JpbGUgYnJvd3NlcnMgYW5kIHNvbWUgbmV0d29ya3MuJ1xuICAgICAgOiBlcnJvck1lc3NhZ2U7XG4gICAgXG4gICAgZWwuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJnbGFzcyByb3VuZGVkLTJ4bCBwLTQgdGV4dC1zbVwiPlxuICAgICAgPGRpdiBjbGFzcz1cImZvbnQtc2VtaWJvbGQgdGV4dC1yZWQtMzAwIG1iLTJcIj5GYWlsZWQgdG8gbG9hZCBGb3JtdWxhIDE8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LXNsYXRlLTMwMC84MCBtYi0yXCI+QWxsIGZldGNoIG1ldGhvZHMgZmFpbGVkLiBMYXN0IGVycm9yOiAke3VzZXJNZXNzYWdlfTwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInRleHQteHMgdGV4dC1zbGF0ZS00MDBcIj5UaGlzIG1heSBiZSBkdWUgdG8gbmV0d29yayByZXN0cmljdGlvbnMsIENPUlMgcG9saWNpZXMsIG9yIFJlZGRpdCBBUEkgY2hhbmdlcy48L2Rpdj5cbiAgICA8L2Rpdj5gO1xuICAgIHJldHVybjtcbiAgfVxuICBcbiAgdHJ5IHtcbiAgICBjb25zdCBpdGVtcyA9IGpzb24uZGF0YS5jaGlsZHJlbi5tYXAoYyA9PiBjLmRhdGEpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmb3JtdWxhMVVwZGF0ZWQnKS50ZXh0Q29udGVudCA9IGBVcGRhdGVkICR7bmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJyx7aG91cjonMi1kaWdpdCcsbWludXRlOicyLWRpZ2l0J30pLmZvcm1hdChuZXcgRGF0ZSgpKX1gO1xuICAgIGVsLmlubmVySFRNTCA9ICcnO1xuICAgIGZvciAoY29uc3QgcG9zdCBvZiBpdGVtcykge1xuICAgICAgY29uc3QgdXJsID0gYGh0dHBzOi8vd3d3LnJlZGRpdC5jb20ke3Bvc3QucGVybWFsaW5rfWA7XG4gICAgICBjb25zdCBpZCA9IHBvc3QuaWQgfHwgcG9zdC5wZXJtYWxpbms7XG4gICAgICBjb25zdCBmbGFpciA9IHBvc3QubGlua19mbGFpcl90ZXh0ID8gYDxzcGFuIGNsYXNzPSdtbC0yIHRleHQteHMgcHgtMS41IHB5LTAuNSByb3VuZGVkLW1kIGJnLXdoaXRlLzEwIGJvcmRlciBib3JkZXItd2hpdGUvMTAnPiR7cG9zdC5saW5rX2ZsYWlyX3RleHR9PC9zcGFuPmAgOiAnJztcbiAgICAgIGxldCBpbWFnZVVybCA9IG51bGw7XG4gICAgICBsZXQgaW1hZ2VBbHQgPSBwb3N0LnRpdGxlO1xuICAgICAgaWYgKHBvc3QucHJldmlldyAmJiBwb3N0LnByZXZpZXcuaW1hZ2VzICYmIHBvc3QucHJldmlldy5pbWFnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBwcmV2aWV3ID0gcG9zdC5wcmV2aWV3LmltYWdlc1swXTtcbiAgICAgICAgaWYgKHByZXZpZXcudmFyaWFudHMgJiYgcHJldmlldy52YXJpYW50cy5naWYpIHtcbiAgICAgICAgICBpbWFnZVVybCA9IHByZXZpZXcudmFyaWFudHMuZ2lmLnNvdXJjZS51cmw7XG4gICAgICAgIH0gZWxzZSBpZiAocHJldmlldy52YXJpYW50cyAmJiBwcmV2aWV3LnZhcmlhbnRzLm1wNCkge1xuICAgICAgICAgIGltYWdlVXJsID0gcHJldmlldy5zb3VyY2UudXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGltYWdlVXJsID0gcHJldmlldy5zb3VyY2UudXJsO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHBvc3QudGh1bWJuYWlsICYmIHBvc3QudGh1bWJuYWlsICE9PSAnc2VsZicgJiYgcG9zdC50aHVtYm5haWwgIT09ICdkZWZhdWx0JyAmJiBwb3N0LnRodW1ibmFpbCAhPT0gJ25zZncnKSB7XG4gICAgICAgIGltYWdlVXJsID0gcG9zdC50aHVtYm5haWw7XG4gICAgICB9IGVsc2UgaWYgKHBvc3QudXJsICYmIChwb3N0LnVybC5pbmNsdWRlcygnLmpwZycpIHx8IHBvc3QudXJsLmluY2x1ZGVzKCcuanBlZycpIHx8IHBvc3QudXJsLmluY2x1ZGVzKCcucG5nJykgfHwgcG9zdC51cmwuaW5jbHVkZXMoJy5naWYnKSkpIHtcbiAgICAgICAgaW1hZ2VVcmwgPSBwb3N0LnVybDtcbiAgICAgIH1cbiAgICAgIGlmIChpbWFnZVVybCAmJiBpbWFnZVVybC5pbmNsdWRlcygncmVkZGl0LmNvbScpKSB7XG4gICAgICAgIGltYWdlVXJsID0gaW1hZ2VVcmwuc3BsaXQoJz8nKVswXTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNvbGxhcHNlZCA9IGlzUmVhZCgnZm9ybXVsYTEnLCBpZCk7XG4gICAgICBpZiAoY29sbGFwc2VkKSB7IGFkZFRvUmVhZExpc3QoJ2Zvcm11bGExJywgeyBpZCwgdGl0bGU6IHBvc3QudGl0bGUsIGhyZWY6IHVybCB9KTsgY29udGludWU7IH1cbiAgICAgIGVsLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgYFxuICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aWNsZSBnbGFzcyByb3VuZGVkLTJ4bCBwLTQgY2FyZC1ob3ZlciR7Y29sbGFwc2VkID8gJyBjb2xsYXBzZWQnIDogJyd9XCIgZGF0YS1zb3VyY2U9XCJmb3JtdWxhMVwiIGRhdGEtaWQ9XCIke2lkfVwiIGRhdGEtdXJsPVwiJHt1cmx9XCI+XG4gICAgICAgICAgPGEgY2xhc3M9XCJhcnRpY2xlLWxpbmsgYmxvY2tcIiBocmVmPVwiJHt1cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgJHtpbWFnZVVybCA/IGBcbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImgtMzIgdy1mdWxsIHJvdW5kZWQtbGcgb3ZlcmZsb3ctaGlkZGVuIG1iLTMgYmctc2xhdGUtODAwLzUwXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCIke2ltYWdlVXJsfVwiIGFsdD1cIiR7cG9zdC50aXRsZX1cIiBjbGFzcz1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyIGFydGljbGUtaW1hZ2VcIiBsb2FkaW5nPVwibGF6eVwiIG9uZXJyb3I9XCJ0aGlzLnN0eWxlLmRpc3BsYXk9J25vbmUnOyB0aGlzLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYmctc2xhdGUtODAwLzUwJyk7XCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgYCA6ICcnfVxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRleHQtc20gdGV4dC1zbGF0ZS0zMDAvNzAgYXJ0aWNsZS1tZXRhXCI+ci9mb3JtdWxhMSBcdTIwMjIgXHUyQjA2XHVGRTBFICR7cG9zdC51cHMudG9Mb2NhbGVTdHJpbmcoJ2VuLUdCJyl9IFx1MjAyMiAke25ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicsIHsgZGF5OicyLWRpZ2l0JywgbW9udGg6J3Nob3J0JywgaG91cjonMi1kaWdpdCcsIG1pbnV0ZTonMi1kaWdpdCcgfSkuZm9ybWF0KG5ldyBEYXRlKHBvc3QuY3JlYXRlZF91dGMgKiAxMDAwKSl9PC9kaXY+XG4gICAgICAgICAgICA8aDMgY2xhc3M9XCJtdC0xIGZvbnQtc2VtaWJvbGQgbGVhZGluZy1zbnVnXCI+JHtwb3N0LnRpdGxlLnJlcGxhY2UoLzwvZywnJmx0OycpfTwvaDM+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibXQtMyBpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgdGV4dC14cyB0ZXh0LXNsYXRlLTMwMC84MCBhcnRpY2xlLW1ldGFcIj5ieSB1LyR7cG9zdC5hdXRob3J9JHtmbGFpcn08L2Rpdj5cbiAgICAgICAgICA8L2E+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImFydGljbGUtdG9nZ2xlIGdsYXNzIHB4LTIgcHktMSByb3VuZGVkLW1kIHRleHQteHNcIiB0eXBlPVwiYnV0dG9uXCIgYXJpYS1sYWJlbD1cIlRvZ2dsZSByZWFkXCI+JHtjb2xsYXBzZWQgPyAnTWFyayB1bnJlYWQnIDogJ01hcmsgcmVhZCd9PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7IFxuICAgIGVsLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwiZ2xhc3Mgcm91bmRlZC0yeGwgcC00IHRleHQtc21cIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmb250LXNlbWlib2xkIHRleHQtcmVkLTMwMCBtYi0yXCI+RmFpbGVkIHRvIHBhcnNlIEZvcm11bGEgMSBkYXRhPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwidGV4dC1zbGF0ZS0zMDAvODBcIj5FcnJvcjogJHtlLm1lc3NhZ2V9PC9kaXY+XG4gICAgPC9kaXY+YDsgXG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLSBCQkMgTGF0ZXN0IHZpYSBSU1MgKENPUlNcdTIwMTFmcmllbmRseSByZWFkZXIpIC0tLS0tLS0tLS1cbmFzeW5jIGZ1bmN0aW9uIGxvYWRCQkMoKSB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JiY0xpc3QnKTtcbiAgZWwuaW5uZXJIVE1MID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiA2fSkubWFwKCgpID0+IGBcbiAgICA8ZGl2IGNsYXNzPVwiZ2xhc3Mgcm91bmRlZC0yeGwgcC00IGNhcmQtaG92ZXJcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJoLTMyIHctZnVsbCByb3VuZGVkLWxnIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lciBtYi0zXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiaC01IHctMi8zIHJvdW5kZWQtbWQgc2tlbGV0b24gYW5pbWF0ZS1zaGltbWVyXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibXQtMyBoLTQgdy0xLzIgcm91bmRlZC1tZCBza2VsZXRvbiBhbmltYXRlLXNoaW1tZXJcIj48L2Rpdj5cbiAgICA8L2Rpdj5gKS5qb2luKCcnKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS5yc3MyanNvbi5jb20vdjEvYXBpLmpzb24/cnNzX3VybD1odHRwczovL2ZlZWRzLmJiY2kuY28udWsvbmV3cy9yc3MueG1sJyk7XG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcignQkJDIFJTUyBmZXRjaCBmYWlsZWQnKTtcbiAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICBpZiAoanNvbi5zdGF0dXMgIT09ICdvaycgfHwgIWpzb24uaXRlbXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBSU1MgcmVzcG9uc2UgZm9ybWF0Jyk7XG4gICAgfVxuICAgIGNvbnN0IGl0ZW1zID0ganNvbi5pdGVtcy5zbGljZSgwLCAxMCk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JiY1VwZGF0ZWQnKS50ZXh0Q29udGVudCA9IGBVcGRhdGVkICR7bmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJyx7aG91cjonMi1kaWdpdCcsbWludXRlOicyLWRpZ2l0J30pLmZvcm1hdChuZXcgRGF0ZSgpKX1gO1xuICAgIGVsLmlubmVySFRNTCA9ICcnO1xuICAgIGZvciAoY29uc3QgYXJ0IG9mIGl0ZW1zKSB7XG4gICAgICBjb25zdCB0ID0gbmV3IERhdGUoYXJ0LnB1YkRhdGUpO1xuICAgICAgY29uc3Qgd2hlbiA9IGlzTmFOKHQpID8gJycgOiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IGRheTonMi1kaWdpdCcsIG1vbnRoOidzaG9ydCcsIGhvdXI6JzItZGlnaXQnLCBtaW51dGU6JzItZGlnaXQnIH0pLmZvcm1hdCh0KTtcbiAgICAgIGxldCBsaW5rID0gYXJ0Lmxpbms7XG4gICAgICBjb25zdCBpZCA9IGxpbmsgfHwgYXJ0Lmd1aWQgfHwgYXJ0LnRpdGxlO1xuICAgICAgaWYgKGxpbmsuaW5jbHVkZXMoJ2JiYy5jb20nKSkge1xuICAgICAgICBsaW5rID0gbGluay5yZXBsYWNlKCdiYmMuY29tJywgJ2JiYy5jby51aycpO1xuICAgICAgfVxuICAgICAgbGV0IHRodW1ibmFpbCA9IGFydC50aHVtYm5haWwgfHwgYXJ0LmVuY2xvc3VyZT8udGh1bWJuYWlsIHx8ICdodHRwczovL25ld3MuYmJjaW1nLmNvLnVrL25vbC9zaGFyZWQvaW1nL2JiY19uZXdzXzEyMHg2MC5naWYnO1xuICAgICAgdGh1bWJuYWlsID0gdXBncmFkZUJCQ0ltYWdlUmVzb2x1dGlvbih0aHVtYm5haWwpO1xuICAgICAgY29uc3QgY29sbGFwc2VkID0gaXNSZWFkKCdiYmMnLCBpZCk7XG4gICAgICBpZiAoY29sbGFwc2VkKSB7IGFkZFRvUmVhZExpc3QoJ2JiYycsIHsgaWQsIHRpdGxlOiBhcnQudGl0bGUsIGhyZWY6IGxpbmsgfSk7IGNvbnRpbnVlOyB9XG4gICAgICBlbC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIGBcbiAgICAgICAgPGRpdiBjbGFzcz1cImFydGljbGUgZ2xhc3Mgcm91bmRlZC0yeGwgcC00IGNhcmQtaG92ZXIke2NvbGxhcHNlZCA/ICcgY29sbGFwc2VkJyA6ICcnfVwiIGRhdGEtc291cmNlPVwiYmJjXCIgZGF0YS1pZD1cIiR7aWR9XCIgZGF0YS11cmw9XCIke2xpbmt9XCI+XG4gICAgICAgICAgPGEgY2xhc3M9XCJhcnRpY2xlLWxpbmsgYmxvY2tcIiBocmVmPVwiJHtsaW5rfVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoLTMyIHctZnVsbCByb3VuZGVkLWxnIG92ZXJmbG93LWhpZGRlbiBtYi0zIGJnLXNsYXRlLTgwMC81MFwiPlxuICAgICAgICAgICAgICA8aW1nIHNyYz1cIiR7dGh1bWJuYWlsfVwiIGFsdD1cIiR7YXJ0LnRpdGxlfVwiIGNsYXNzPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXIgYXJ0aWNsZS1pbWFnZVwiIGxvYWRpbmc9XCJsYXp5XCIgb25lcnJvcj1cInRoaXMuc3R5bGUuZGlzcGxheT0nbm9uZSc7IHRoaXMucGFyZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdiZy1zbGF0ZS04MDAvNTAnKTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRleHQtc20gdGV4dC1zbGF0ZS0zMDAvNzAgYXJ0aWNsZS1tZXRhXCI+JHt3aGVufTwvZGl2PlxuICAgICAgICAgICAgPGgzIGNsYXNzPVwibXQtMSBmb250LXNlbWlib2xkIGxlYWRpbmctc251Z1wiPiR7YXJ0LnRpdGxlLnJlcGxhY2UoLzwvZywnJmx0OycpfTwvaDM+XG4gICAgICAgICAgPC9hPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJhcnRpY2xlLXRvZ2dsZSBnbGFzcyBweC0yIHB5LTEgcm91bmRlZC1tZCB0ZXh0LXhzXCIgdHlwZT1cImJ1dHRvblwiIGFyaWEtbGFiZWw9XCJUb2dnbGUgcmVhZFwiPiR7Y29sbGFwc2VkID8gJ01hcmsgdW5yZWFkJyA6ICdNYXJrIHJlYWQnfTwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGApO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkuYWxsb3JpZ2lucy53aW4vcmF3P3VybD1odHRwczovL2ZlZWRzLmJiY2kuY28udWsvbmV3cy9yc3MueG1sJyk7XG4gICAgICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKCdCQkMgUlNTIGZhbGxiYWNrIGZldGNoIGZhaWxlZCcpO1xuICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlcy50ZXh0KCk7XG4gICAgICBjb25zdCB4bWwgPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKHRleHQsICd0ZXh0L3htbCcpO1xuICAgICAgY29uc3QgaXRlbXMgPSBBcnJheS5mcm9tKHhtbC5xdWVyeVNlbGVjdG9yQWxsKCdpdGVtJykpLnNsaWNlKDAsIDEwKS5tYXAoaXRlbSA9PiAoeyBcbiAgICAgICAgdGl0bGU6IGl0ZW0ucXVlcnlTZWxlY3RvcigndGl0bGUnKT8udGV4dENvbnRlbnQgfHwgJ1VudGl0bGVkJywgXG4gICAgICAgIGxpbms6IGl0ZW0ucXVlcnlTZWxlY3RvcignbGluaycpPy50ZXh0Q29udGVudCB8fCAnIycsIFxuICAgICAgICBwdWJEYXRlOiBpdGVtLnF1ZXJ5U2VsZWN0b3IoJ3B1YkRhdGUnKT8udGV4dENvbnRlbnQgfHwgJycsXG4gICAgICAgIHRodW1ibmFpbDogaXRlbS5xdWVyeVNlbGVjdG9yKCdtZWRpYVxcXFw6dGh1bWJuYWlsJyk/LmdldEF0dHJpYnV0ZSgndXJsJykgfHwgXG4gICAgICAgICAgICAgICAgICBpdGVtLnF1ZXJ5U2VsZWN0b3IoJ2VuY2xvc3VyZVt0eXBlPVwiaW1hZ2UvanBlZ1wiXScpPy5nZXRBdHRyaWJ1dGUoJ3VybCcpIHx8IFxuICAgICAgICAgICAgICAgICAgaXRlbS5xdWVyeVNlbGVjdG9yKCdlbmNsb3N1cmVbdHlwZT1cImltYWdlL3BuZ1wiXScpPy5nZXRBdHRyaWJ1dGUoJ3VybCcpIHx8XG4gICAgICAgICAgICAgICAgICAnaHR0cHM6Ly9uZXdzLmJiY2ltZy5jby51ay9ub2wvc2hhcmVkL2ltZy9iYmNfbmV3c18xMjB4NjAuZ2lmJ1xuICAgICAgfSkpO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JiY1VwZGF0ZWQnKS50ZXh0Q29udGVudCA9IGBVcGRhdGVkICR7bmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJyx7aG91cjonMi1kaWdpdCcsbWludXRlOicyLWRpZ2l0J30pLmZvcm1hdChuZXcgRGF0ZSgpKX0gKGZhbGxiYWNrKWA7XG4gICAgICBlbC5pbm5lckhUTUwgPSAnJztcbiAgICAgIGZvciAoY29uc3QgYXJ0IG9mIGl0ZW1zKSB7XG4gICAgICAgIGNvbnN0IHQgPSBuZXcgRGF0ZShhcnQucHViRGF0ZSk7XG4gICAgICAgIGNvbnN0IHdoZW4gPSBpc05hTih0KSA/ICcnIDogbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJywgeyBkYXk6JzItZGlnaXQnLCBtb250aDonc2hvcnQnLCBob3VyOicyLWRpZ2l0JywgbWludXRlOicyLWRpZ2l0JyB9KS5mb3JtYXQodCk7XG4gICAgICAgIGxldCBsaW5rID0gYXJ0Lmxpbms7XG4gICAgICAgIGNvbnN0IGlkID0gbGluayB8fCBhcnQuZ3VpZCB8fCBhcnQudGl0bGU7XG4gICAgICAgIGlmIChsaW5rLmluY2x1ZGVzKCdiYmMuY29tJykpIHtcbiAgICAgICAgICBsaW5rID0gbGluay5yZXBsYWNlKCdiYmMuY29tJywgJ2JiYy5jby51aycpO1xuICAgICAgICB9XG4gICAgICAgIGxldCB0aHVtYm5haWwgPSB1cGdyYWRlQkJDSW1hZ2VSZXNvbHV0aW9uKGFydC50aHVtYm5haWwpO1xuICAgICAgICBjb25zdCBjb2xsYXBzZWQgPSBpc1JlYWQoJ2JiYycsIGlkKTtcbiAgICAgICAgaWYgKGNvbGxhcHNlZCkgeyBhZGRUb1JlYWRMaXN0KCdiYmMnLCB7IGlkLCB0aXRsZTogYXJ0LnRpdGxlLCBocmVmOiBsaW5rIH0pOyBjb250aW51ZTsgfVxuICAgICAgICBlbC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIGBcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aWNsZSBnbGFzcyByb3VuZGVkLTJ4bCBwLTQgY2FyZC1ob3ZlciR7Y29sbGFwc2VkID8gJyBjb2xsYXBzZWQnIDogJyd9XCIgZGF0YS1zb3VyY2U9XCJiYmNcIiBkYXRhLWlkPVwiJHtpZH1cIiBkYXRhLXVybD1cIiR7bGlua31cIj5cbiAgICAgICAgICAgIDxhIGNsYXNzPVwiYXJ0aWNsZS1saW5rIGJsb2NrXCIgaHJlZj1cIiR7bGlua31cIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoLTMyIHctZnVsbCByb3VuZGVkLWxnIG92ZXJmbG93LWhpZGRlbiBtYi0zIGJnLXNsYXRlLTgwMC81MFwiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiJHt0aHVtYm5haWx9XCIgYWx0PVwiJHthcnQudGl0bGV9XCIgY2xhc3M9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBhcnRpY2xlLWltYWdlXCIgbG9hZGluZz1cImxhenlcIiBvbmVycm9yPVwidGhpcy5zdHlsZS5kaXNwbGF5PSdub25lJzsgdGhpcy5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2JnLXNsYXRlLTgwMC81MCcpO1wiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRleHQtc20gdGV4dC1zbGF0ZS0zMDAvNzAgYXJ0aWNsZS1tZXRhXCI+JHt3aGVufTwvZGl2PlxuICAgICAgICAgICAgICA8aDMgY2xhc3M9XCJtdC0xIGZvbnQtc2VtaWJvbGQgbGVhZGluZy1zbnVnXCI+JHthcnQudGl0bGUucmVwbGFjZSgvPC9nLCcmbHQ7Jyl9PC9oMz5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJhcnRpY2xlLXRvZ2dsZSBnbGFzcyBweC0yIHB5LTEgcm91bmRlZC1tZCB0ZXh0LXhzXCIgdHlwZT1cImJ1dHRvblwiIGFyaWEtbGFiZWw9XCJUb2dnbGUgcmVhZFwiPiR7Y29sbGFwc2VkID8gJ01hcmsgdW5yZWFkJyA6ICdNYXJrIHJlYWQnfTwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChmYWxsYmFja0Vycm9yKSB7XG4gICAgICBlbC5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImdsYXNzIHJvdW5kZWQtMnhsIHAtNCB0ZXh0LXNtXCI+RmFpbGVkIHRvIGxvYWQgQkJDLiAke2UubWVzc2FnZX0gKGZhbGxiYWNrIGFsc28gZmFpbGVkOiAke2ZhbGxiYWNrRXJyb3IubWVzc2FnZX0pPC9kaXY+YDtcbiAgICB9XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLSBPcmNoZXN0cmF0ZSAtLS0tLS0tLS0tXG5hc3luYyBmdW5jdGlvbiBsb2FkQWxsKCkge1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2xvYWRpbmcnKTtcbiAgYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKFtsb2FkV2VhdGhlcigpLCBpbml0UmFkYXIoKSwgbG9hZFJlZGRpdCgpLCBsb2FkV293Q2xhc3NpYygpLCBsb2FkRm9ybXVsYTEoKSwgbG9hZEJCQygpXSk7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuICBpZiAod2luZG93Lmx1Y2lkZSkgbHVjaWRlLmNyZWF0ZUljb25zKCk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0TGl2ZURhdGVUaW1lKCkge1xuICB1cGRhdGVMaXZlRGF0ZVRpbWUoKTtcbiAgc2V0SW50ZXJ2YWwodXBkYXRlTGl2ZURhdGVUaW1lLCAxMDAwKTtcbn1cblxuLy8gLS0tLS0tLS0tLSBOYXZpZ2F0aW9uIE1lbnUgLS0tLS0tLS0tLVxuZnVuY3Rpb24gaW5pdE5hdmlnYXRpb24oKSB7XG4gIGNvbnN0IG5hdk1lbnUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2TWVudScpO1xuICBjb25zdCBuYXZUb2dnbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2VG9nZ2xlJyk7XG4gIGNvbnN0IG5hdkNsb3NlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdkNsb3NlJyk7XG4gIGNvbnN0IG5hdkxpbmtzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm5hdi1saW5rJyk7XG5cbiAgZnVuY3Rpb24gdG9nZ2xlTmF2KCkge1xuICAgIGNvbnN0IGlzVmlzaWJsZSA9IG5hdk1lbnUuY2xhc3NMaXN0LmNvbnRhaW5zKCdzaG93Jyk7XG4gICAgaWYgKGlzVmlzaWJsZSkge1xuICAgICAgbmF2TWVudS5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdk1lbnUuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb3NlTmF2KCkge1xuICAgIG5hdk1lbnUuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICB9XG5cbiAgZnVuY3Rpb24gc21vb3RoU2Nyb2xsVG9TZWN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgdGFyZ2V0SWQgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLnN1YnN0cmluZygxKTtcbiAgICBjb25zdCB0YXJnZXRTZWN0aW9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGFyZ2V0SWQpO1xuICAgIGlmICh0YXJnZXRTZWN0aW9uKSB7XG4gICAgICBjb25zdCBoZWFkZXJIZWlnaHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdoZWFkZXInKS5vZmZzZXRIZWlnaHQ7XG4gICAgICBjb25zdCBuYXZIZWlnaHQgPSBuYXZNZW51Lm9mZnNldEhlaWdodDtcbiAgICAgIGNvbnN0IHRvdGFsT2Zmc2V0ID0gaGVhZGVySGVpZ2h0ICsgbmF2SGVpZ2h0ICsgMjA7XG4gICAgICBjb25zdCB0YXJnZXRQb3NpdGlvbiA9IHRhcmdldFNlY3Rpb24ub2Zmc2V0VG9wIC0gdG90YWxPZmZzZXQ7XG4gICAgICB3aW5kb3cuc2Nyb2xsVG8oeyB0b3A6IHRhcmdldFBvc2l0aW9uLCBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgICBpZiAod2luZG93LmlubmVyV2lkdGggPCA3NjgpIHtcbiAgICAgICAgY2xvc2VOYXYoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuYXZUb2dnbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGVOYXYpO1xuICBuYXZDbG9zZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNsb3NlTmF2KTtcbiAgbmF2TGlua3MuZm9yRWFjaChsaW5rID0+IGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzbW9vdGhTY3JvbGxUb1NlY3Rpb24pKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgIGlmICghbmF2TWVudS5jb250YWlucyhlLnRhcmdldCkgJiYgIW5hdlRvZ2dsZS5jb250YWlucyhlLnRhcmdldCkpIHtcbiAgICAgIGNsb3NlTmF2KCk7XG4gICAgfVxuICB9KTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChlKSA9PiB7XG4gICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykge1xuICAgICAgY2xvc2VOYXYoKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyAtLS0tLS0tLS0tIENvbGxhcHNpYmxlIHNlY3Rpb25zIC0tLS0tLS0tLS1cbmZ1bmN0aW9uIGluaXRDb2xsYXBzaWJsZVNlY3Rpb25zKCkge1xuICBjb25zdCBzZWN0aW9uVG9nZ2xlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5zZWN0aW9uLXRvZ2dsZScpO1xuICBcbiAgc2VjdGlvblRvZ2dsZXMuZm9yRWFjaCh0b2dnbGUgPT4ge1xuICAgIHRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuZ2V0QXR0cmlidXRlKCdkYXRhLXNlY3Rpb24nKTtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLmNsb3Nlc3QoJ3NlY3Rpb24nKS5xdWVyeVNlbGVjdG9yKCcuc2VjdGlvbi1jb250ZW50Jyk7XG4gICAgICBjb25zdCBjaGV2cm9uID0gdGhpcy5xdWVyeVNlbGVjdG9yKCcuc2VjdGlvbi1jaGV2cm9uJyk7XG4gICAgICBcbiAgICAgIGlmIChjb250ZW50LmNsYXNzTGlzdC5jb250YWlucygnY29sbGFwc2VkJykpIHtcbiAgICAgICAgLy8gRXhwYW5kIHNlY3Rpb25cbiAgICAgICAgY29udGVudC5jbGFzc0xpc3QucmVtb3ZlKCdjb2xsYXBzZWQnKTtcbiAgICAgICAgY2hldnJvbi5jbGFzc0xpc3QucmVtb3ZlKCdyb3RhdGVkJyk7XG4gICAgICAgIHRoaXMuY2xvc2VzdCgnc2VjdGlvbicpLmNsYXNzTGlzdC5yZW1vdmUoJ3NlY3Rpb24tY29sbGFwc2VkJyk7XG4gICAgICAgIFxuICAgICAgICAvLyBSZW1vdmUgaW5saW5lIGhlaWdodCB0byBsZXQgY29udGVudCBleHBhbmQgbmF0dXJhbGx5XG4gICAgICAgIGNvbnRlbnQuc3R5bGUuaGVpZ2h0ID0gJyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDb2xsYXBzZSBzZWN0aW9uXG4gICAgICAgIC8vIEZpcnN0IHNldCB0aGUgY3VycmVudCBoZWlnaHQgdG8gZW5hYmxlIHNtb290aCB0cmFuc2l0aW9uXG4gICAgICAgIGNvbnRlbnQuc3R5bGUuaGVpZ2h0ID0gY29udGVudC5zY3JvbGxIZWlnaHQgKyAncHgnO1xuICAgICAgICBcbiAgICAgICAgLy8gRm9yY2UgYSByZWZsb3cgdG8gZW5zdXJlIHRoZSBoZWlnaHQgaXMgYXBwbGllZFxuICAgICAgICBjb250ZW50Lm9mZnNldEhlaWdodDtcbiAgICAgICAgXG4gICAgICAgIC8vIE5vdyBhbmltYXRlIHRvIGhlaWdodCAwXG4gICAgICAgIGNvbnRlbnQuc3R5bGUuaGVpZ2h0ID0gJzBweCc7XG4gICAgICAgIFxuICAgICAgICAvLyBBZGQgY29sbGFwc2VkIGNsYXNzIGFmdGVyIGFuaW1hdGlvbiBzdGFydHNcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgY29udGVudC5jbGFzc0xpc3QuYWRkKCdjb2xsYXBzZWQnKTtcbiAgICAgICAgICBjaGV2cm9uLmNsYXNzTGlzdC5hZGQoJ3JvdGF0ZWQnKTtcbiAgICAgICAgICB0aGlzLmNsb3Nlc3QoJ3NlY3Rpb24nKS5jbGFzc0xpc3QuYWRkKCdzZWN0aW9uLWNvbGxhcHNlZCcpO1xuICAgICAgICB9LCAxMCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufVxuXG4vLyAtLS0tLS0tLS0tIEFydGljbGUgcmVhZC9jb2xsYXBzZSBpbnRlcmFjdGlvbnMgLS0tLS0tLS0tLVxuZnVuY3Rpb24gaW5pdEFydGljbGVJbnRlcmFjdGlvbnMoKSB7XG4gIGZ1bmN0aW9uIGhhbmRsZVRvZ2dsZShlKSB7XG4gICAgY29uc3QgYnRuID0gZS50YXJnZXQuY2xvc2VzdCgnLmFydGljbGUtdG9nZ2xlJyk7XG4gICAgaWYgKCFidG4pIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgYXJ0aWNsZSA9IGJ0bi5jbG9zZXN0KCcuYXJ0aWNsZScpO1xuICAgIGlmICghYXJ0aWNsZSkgcmV0dXJuO1xuICAgIGNvbnN0IGlkID0gYXJ0aWNsZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKTtcbiAgICBjb25zdCBzb3VyY2UgPSBhcnRpY2xlLmdldEF0dHJpYnV0ZSgnZGF0YS1zb3VyY2UnKTtcbiAgICBjb25zdCBpc01hcmtpbmdSZWFkID0gIWFydGljbGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdjb2xsYXBzZWQnKTtcbiAgICBpZiAoaXNNYXJraW5nUmVhZCkge1xuICAgICAgLy8gTWFyayBhcyByZWFkOiBhbmltYXRlIG91dCwgdGhlbiBtb3ZlIHRvIHJlYWQgbGlzdFxuICAgICAgYXJ0aWNsZS5jbGFzc0xpc3QuYWRkKCdjb2xsYXBzZWQnLCAnZmFkZS1vdXQnKTtcbiAgICAgIG1hcmtSZWFkKHNvdXJjZSwgaWQsIHRydWUpO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGFydGljbGUucmVtb3ZlKCk7XG4gICAgICAgIGFkZFRvUmVhZExpc3Qoc291cmNlLCB7IGlkLCB0aXRsZTogYXJ0aWNsZS5xdWVyeVNlbGVjdG9yKCdoMycpPy50ZXh0Q29udGVudCB8fCAnVW50aXRsZWQnLCBocmVmOiBhcnRpY2xlLnF1ZXJ5U2VsZWN0b3IoJ2EuYXJ0aWNsZS1saW5rJyk/LmdldEF0dHJpYnV0ZSgnaHJlZicpIHx8ICcjJ30pO1xuICAgICAgfSwgMjAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTWFyayBhcyB1bnJlYWQ6IHJlbW92ZSBmcm9tIHJlYWQgbGlzdCBhbmQgcmUtcmVuZGVyIGxpc3RzICh0cmlnZ2VyIHJlbG9hZCBvZiB0aGF0IHNvdXJjZSlcbiAgICAgIG1hcmtSZWFkKHNvdXJjZSwgaWQsIGZhbHNlKTtcbiAgICAgIHJlbW92ZUZyb21SZWFkTGlzdChzb3VyY2UsIGlkKTtcbiAgICB9XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGhhbmRsZUNhcmRDbGljayhlKSB7XG4gICAgLy8gRG9uJ3QgdHJpZ2dlciBpZiBjbGlja2luZyBvbiB0aGUgdG9nZ2xlIGJ1dHRvblxuICAgIGlmIChlLnRhcmdldC5jbG9zZXN0KCcuYXJ0aWNsZS10b2dnbGUnKSkgcmV0dXJuO1xuICAgIFxuICAgIGNvbnN0IGFydGljbGUgPSBlLnRhcmdldC5jbG9zZXN0KCcuYXJ0aWNsZScpO1xuICAgIGlmICghYXJ0aWNsZSkgcmV0dXJuO1xuICAgIFxuICAgIGNvbnN0IHVybCA9IGFydGljbGUuZ2V0QXR0cmlidXRlKCdkYXRhLXVybCcpO1xuICAgIGlmICh1cmwgJiYgdXJsICE9PSAnIycpIHtcbiAgICAgIHdpbmRvdy5vcGVuKHVybCwgJ19ibGFuaycsICdub29wZW5lcixub3JlZmVycmVyJyk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBoYW5kbGVNYXJrVW5yZWFkKGUpIHtcbiAgICBjb25zdCBidG4gPSBlLnRhcmdldC5jbG9zZXN0KCcubWFyay11bnJlYWQnKTtcbiAgICBpZiAoIWJ0bikgcmV0dXJuO1xuICAgIGNvbnN0IGlkID0gYnRuLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuICAgIGNvbnN0IHNvdXJjZSA9IGJ0bi5nZXRBdHRyaWJ1dGUoJ2RhdGEtc291cmNlJyk7XG4gICAgbWFya1JlYWQoc291cmNlLCBpZCwgZmFsc2UpO1xuICAgIHJlbW92ZUZyb21SZWFkTGlzdChzb3VyY2UsIGlkKTtcbiAgICAvLyBSZS1yZW5kZXIgdGhlIG1haW4gbGlzdCB0byBzaG93IHRoZSB1bm1hcmtlZCBpdGVtXG4gICAgaWYgKHNvdXJjZSA9PT0gJ3JlZGRpdCcpIGxvYWRSZWRkaXQoKTtcbiAgICBlbHNlIGlmIChzb3VyY2UgPT09ICd3b3ctY2xhc3NpYycpIGxvYWRXb3dDbGFzc2ljKCk7XG4gICAgZWxzZSBpZiAoc291cmNlID09PSAnZm9ybXVsYTEnKSBsb2FkRm9ybXVsYTEoKTtcbiAgICBlbHNlIGlmIChzb3VyY2UgPT09ICdiYmMnKSBsb2FkQkJDKCk7XG4gIH1cbiAgXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWRkaXRMaXN0Jyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlVG9nZ2xlKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlZGRpdExpc3QnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVDYXJkQ2xpY2spO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd293Q2xhc3NpY0xpc3QnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVUb2dnbGUpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd293Q2xhc3NpY0xpc3QnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVDYXJkQ2xpY2spO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZm9ybXVsYTFMaXN0Jyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlVG9nZ2xlKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Zvcm11bGExTGlzdCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZUNhcmRDbGljayk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYmNMaXN0Jyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlVG9nZ2xlKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JiY0xpc3QnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVDYXJkQ2xpY2spO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVhZFJlZGRpdExpc3QnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVNYXJrVW5yZWFkKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlYWRXb3dDbGFzc2ljTGlzdCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZU1hcmtVbnJlYWQpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVhZEZvcm11bGExTGlzdCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZU1hcmtVbnJlYWQpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVhZEJiY0xpc3QnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVNYXJrVW5yZWFkKTtcbn1cblxuZnVuY3Rpb24gYWRkVG9SZWFkTGlzdChzb3VyY2UsIGl0ZW0pIHtcbiAgbGV0IHRhcmdldDtcbiAgaWYgKHNvdXJjZSA9PT0gJ3JlZGRpdCcpIHtcbiAgICB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVhZFJlZGRpdExpc3QnKTtcbiAgfSBlbHNlIGlmIChzb3VyY2UgPT09ICd3b3ctY2xhc3NpYycpIHtcbiAgICB0YXJnZXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVhZFdvd0NsYXNzaWNMaXN0Jyk7XG4gIH0gZWxzZSBpZiAoc291cmNlID09PSAnZm9ybXVsYTEnKSB7XG4gICAgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlYWRGb3JtdWxhMUxpc3QnKTtcbiAgfSBlbHNlIGlmIChzb3VyY2UgPT09ICdiYmMnKSB7XG4gICAgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlYWRCYmNMaXN0Jyk7XG4gIH1cbiAgaWYgKCF0YXJnZXQpIHJldHVybjtcbiAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICBsaS5kYXRhc2V0LmlkID0gaXRlbS5pZDtcbiAgbGkuY2xhc3NOYW1lID0gJ2ZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBncm91cCc7XG4gIGxpLmlubmVySFRNTCA9IGBcbiAgICA8YSBjbGFzcz1cInVuZGVybGluZSBkZWNvcmF0aW9uLWRvdHRlZCBmbGV4LTFcIiBocmVmPVwiJHtpdGVtLmhyZWZ9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlclwiPiR7aXRlbS50aXRsZS5yZXBsYWNlKC88L2csJyZsdDsnKX08L2E+XG4gICAgPGJ1dHRvbiBjbGFzcz1cIm1hcmstdW5yZWFkIGdsYXNzIHB4LTIgcHktMSByb3VuZGVkIHRleHQteHMgb3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHRyYW5zaXRpb24tb3BhY2l0eVwiIGRhdGEtc291cmNlPVwiJHtzb3VyY2V9XCIgZGF0YS1pZD1cIiR7aXRlbS5pZH1cIj5NYXJrIHVucmVhZDwvYnV0dG9uPlxuICBgO1xuICB0YXJnZXQucHJlcGVuZChsaSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUZyb21SZWFkTGlzdChzb3VyY2UsIGlkKSB7XG4gIGxldCB0YXJnZXQ7XG4gIGlmIChzb3VyY2UgPT09ICdyZWRkaXQnKSB7XG4gICAgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlYWRSZWRkaXRMaXN0Jyk7XG4gIH0gZWxzZSBpZiAoc291cmNlID09PSAnd293LWNsYXNzaWMnKSB7XG4gICAgdGFyZ2V0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlYWRXb3dDbGFzc2ljTGlzdCcpO1xuICB9IGVsc2UgaWYgKHNvdXJjZSA9PT0gJ2Zvcm11bGExJykge1xuICAgIHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWFkRm9ybXVsYTFMaXN0Jyk7XG4gIH0gZWxzZSBpZiAoc291cmNlID09PSAnYmJjJykge1xuICAgIHRhcmdldCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWFkQmJjTGlzdCcpO1xuICB9XG4gIGlmICghdGFyZ2V0KSByZXR1cm47XG4gIGNvbnN0IGVsID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3IoYGxpW2RhdGEtaWQ9XCIke0NTUy5lc2NhcGUoaWQpfVwiXWApO1xuICBpZiAoZWwpIGVsLnJlbW92ZSgpO1xufVxuXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVmcmVzaEJ0bicpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IGxvYWRBbGwoKSk7XG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgbG9hZEFsbCgpO1xuICBzdGFydExpdmVEYXRlVGltZSgpO1xuICBpbml0TmF2aWdhdGlvbigpO1xuICBpbml0Q29sbGFwc2libGVTZWN0aW9ucygpO1xuICBpbml0QXJ0aWNsZUludGVyYWN0aW9ucygpO1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiOztBQUNBLE1BQU0sVUFBVSxDQUFDLEtBQUssS0FBSyxpQkFBaUIsT0FBTyxDQUFDLE1BQU0sSUFBSSxLQUFLLGVBQWUsU0FBUyxFQUFFLE1BQU0sV0FB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

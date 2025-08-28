(() => {
  // src/main.js
  var fmtTime = (iso, tz = "Europe/London", opts = {}) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz, ...opts }).format(new Date(iso));
  var fmtDateTime = (iso, tz = "Europe/London") => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(new Date(iso));
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
    try {
      const res = await fetch("https://www.reddit.com/r/popular/hot.json?limit=20");
      if (!res.ok) throw new Error("Reddit fetch failed");
      const json = await res.json();
      const items = json.data.children.map((c) => c.data);
      document.getElementById("redditUpdated").textContent = `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(/* @__PURE__ */ new Date())}`;
      el.innerHTML = "";
      for (const post of items) {
        const url = `https://www.reddit.com${post.permalink}`;
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
        el.insertAdjacentHTML("beforeend", `
        <a class="glass rounded-2xl p-4 block card-hover" href="${url}" target="_blank" rel="noreferrer">
          ${imageUrl ? `
            <div class="h-32 w-full rounded-lg overflow-hidden mb-3 bg-slate-800/50">
              <img src="${imageUrl}" alt="${post.title}" class="w-full h-full object-cover article-image" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('bg-slate-800/50');">
            </div>
          ` : ""}
          <div class="text-sm text-slate-300/70">r/${post.subreddit} \u2022 \u2B06\uFE0E ${post.ups.toLocaleString("en-GB")}</div>
          <h3 class="mt-1 font-semibold leading-snug">${post.title.replace(/</g, "&lt;")}</h3>
          <div class="mt-3 inline-flex items-center text-xs text-slate-300/80">by u/${post.author}${flair}</div>
        </a>
      `);
      }
    } catch (e) {
      el.innerHTML = `<div class="glass rounded-2xl p-4 text-sm">Failed to load Reddit. ${e.message}</div>`;
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
        if (link.includes("bbc.com")) {
          link = link.replace("bbc.com", "bbc.co.uk");
        }
        let thumbnail = art.thumbnail || ((_a2 = art.enclosure) == null ? void 0 : _a2.thumbnail) || "https://news.bbcimg.co.uk/nol/shared/img/bbc_news_120x60.gif";
        thumbnail = upgradeBBCImageResolution(thumbnail);
        el.insertAdjacentHTML("beforeend", `
        <a class="glass rounded-2xl p-4 block card-hover" href="${link}" target="_blank" rel="noreferrer">
          <div class="h-32 w-full rounded-lg overflow-hidden mb-3 bg-slate-800/50">
            <img src="${thumbnail}" alt="${art.title}" class="w-full h-full object-cover article-image" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('bg-slate-800/50');">
          </div>
          <div class="text-sm text-slate-300/70">${when}</div>
          <h3 class="mt-1 font-semibold leading-snug">${art.title.replace(/</g, "&lt;")}</h3>
        </a>
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
          if (link.includes("bbc.com")) {
            link = link.replace("bbc.com", "bbc.co.uk");
          }
          let thumbnail = upgradeBBCImageResolution(art.thumbnail);
          el.insertAdjacentHTML("beforeend", `
          <a class="glass rounded-2xl p-4 block card-hover" href="${link}" target="_blank" rel="noreferrer">
            <div class="h-32 w-full rounded-lg overflow-hidden mb-3 bg-slate-800/50">
              <img src="${thumbnail}" alt="${art.title}" class="w-full h-full object-cover article-image" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('bg-slate-800/50');">
            </div>
            <div class="text-sm text-slate-300/70">${when}</div>
            <h3 class="mt-1 font-semibold leading-snug">${art.title.replace(/</g, "&lt;")}</h3>
          </a>
        `);
        }
      } catch (fallbackError) {
        el.innerHTML = `<div class="glass rounded-2xl p-4 text-sm">Failed to load BBC. ${e.message} (fallback also failed: ${fallbackError.message})</div>`;
      }
    }
  }
  async function loadAll() {
    document.body.classList.add("loading");
    await Promise.allSettled([loadWeather(), initRadar(), loadReddit(), loadBBC()]);
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
      const isVisible = !navMenu.classList.contains("-translate-y-full");
      if (isVisible) {
        navMenu.classList.add("-translate-y-full", "opacity-0");
      } else {
        navMenu.classList.remove("-translate-y-full", "opacity-0");
      }
    }
    function closeNav() {
      navMenu.classList.add("-translate-y-full", "opacity-0");
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
  var _a;
  (_a = document.getElementById("refreshBtn")) == null ? void 0 : _a.addEventListener("click", () => loadAll());
  window.addEventListener("DOMContentLoaded", () => {
    loadAll();
    startLiveDateTime();
    initNavigation();
  });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIC0tLS0tLS0tLS0gVXRpbGl0aWVzIC0tLS0tLS0tLS1cbmNvbnN0IGZtdFRpbWUgPSAoaXNvLCB0eiA9ICdFdXJvcGUvTG9uZG9uJywgb3B0cyA9IHt9KSA9PiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcsIGhvdXIxMjogZmFsc2UsIHRpbWVab25lOiB0eiwgLi4ub3B0cyB9KS5mb3JtYXQobmV3IERhdGUoaXNvKSk7XG5jb25zdCBmbXREYXRlVGltZSA9IChpc28sIHR6ID0gJ0V1cm9wZS9Mb25kb24nKSA9PiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IHdlZWtkYXk6ICdzaG9ydCcsIGRheTogJzItZGlnaXQnLCBtb250aDogJ3Nob3J0JywgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JywgaG91cjEyOiBmYWxzZSwgdGltZVpvbmU6IHR6IH0pLmZvcm1hdChuZXcgRGF0ZShpc28pKTtcblxuLy8gVXBkYXRlIHBhZ2UgaGVhZGluZyB3aXRoIGxpdmUgZGF0ZSBhbmQgdGltZVxuZnVuY3Rpb24gdXBkYXRlTGl2ZURhdGVUaW1lKCkge1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBkYXRlU3RyID0gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJywge1xuICAgIHdlZWtkYXk6ICdsb25nJyxcbiAgICBkYXk6ICdudW1lcmljJyxcbiAgICBtb250aDogJ2xvbmcnLFxuICAgIHllYXI6ICdudW1lcmljJ1xuICB9KS5mb3JtYXQobm93KTtcbiAgY29uc3QgdGltZVN0ciA9IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicsIHtcbiAgICBob3VyOiAnMi1kaWdpdCcsXG4gICAgbWludXRlOiAnMi1kaWdpdCcsXG4gICAgc2Vjb25kOiAnMi1kaWdpdCcsXG4gICAgaG91cjEyOiBmYWxzZVxuICB9KS5mb3JtYXQobm93KTtcbiAgY29uc3QgbGl2ZURhdGVUaW1lRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGl2ZURhdGVUaW1lJyk7XG4gIGlmIChsaXZlRGF0ZVRpbWVFbCkge1xuICAgIGxpdmVEYXRlVGltZUVsLnRleHRDb250ZW50ID0gYCR7ZGF0ZVN0cn0gYXQgJHt0aW1lU3RyfWA7XG4gIH1cbn1cblxuY29uc3Qgd2VhdGhlckNvZGVNYXAgPSB7IDA6ICdDbGVhciBza3knLCAxOiAnTWFpbmx5IGNsZWFyJywgMjogJ1BhcnRseSBjbG91ZHknLCAzOiAnT3ZlcmNhc3QnLCA0NTogJ0ZvZycsIDQ4OiAnRGVwb3NpdGluZyByaW1lIGZvZycsIDUxOiAnTGlnaHQgZHJpenpsZScsIDUzOiAnTW9kZXJhdGUgZHJpenpsZScsIDU1OiAnRGVuc2UgZHJpenpsZScsIDU2OiAnTGlnaHQgZnJlZXppbmcgZHJpenpsZScsIDU3OiAnRGVuc2UgZnJlZXppbmcgZHJpenpsZScsIDYxOiAnU2xpZ2h0IHJhaW4nLCA2MzogJ01vZGVyYXRlIHJhaW4nLCA2NTogJ0hlYXZ5IHJhaW4nLCA2NjogJ0xpZ2h0IGZyZWV6aW5nIHJhaW4nLCA2NzogJ0hlYXZ5IGZyZWV6aW5nIHJhaW4nLCA3MTogJ1NsaWdodCBzbm93JywgNzM6ICdNb2RlcmF0ZSBzbm93JywgNzU6ICdIZWF2eSBzbm93JywgNzc6ICdTbm93IGdyYWlucycsIDgwOiAnUmFpbiBzaG93ZXJzOiBzbGlnaHQnLCA4MTogJ1JhaW4gc2hvd2VyczogbW9kZXJhdGUnLCA4MjogJ1JhaW4gc2hvd2VyczogdmlvbGVudCcsIDg1OiAnU25vdyBzaG93ZXJzOiBzbGlnaHQnLCA4NjogJ1Nub3cgc2hvd2VyczogaGVhdnknLCA5NTogJ1RodW5kZXJzdG9ybScsIDk2OiAnVGh1bmRlcnN0b3JtIHdpdGggc2xpZ2h0IGhhaWwnLCA5OTogJ1RodW5kZXJzdG9ybSB3aXRoIGhlYXZ5IGhhaWwnIH07XG5cbi8vIEZ1bmN0aW9uIHRvIHVwZ3JhZGUgQkJDIGltYWdlIHJlc29sdXRpb25cbmZ1bmN0aW9uIHVwZ3JhZGVCQkNJbWFnZVJlc29sdXRpb24oaW1hZ2VVcmwpIHtcbiAgaWYgKCFpbWFnZVVybCB8fCAhaW1hZ2VVcmwuaW5jbHVkZXMoJ2ljaGVmLmJiY2kuY28udWsnKSkgcmV0dXJuIGltYWdlVXJsO1xuXG4gIGNvbnN0IHNpemVVcGdyYWRlcyA9IHtcbiAgICAnLzEyMC8nOiAnLzUxMi8nLFxuICAgICcvMjQwLyc6ICcvNTEyLycsXG4gICAgJy80ODAvJzogJy81MTIvJyxcbiAgICAnLzY0MC8nOiAnLzgwMC8nLFxuICAgICcvODAwLyc6ICcvMTAyNC8nXG4gIH07XG5cbiAgZm9yIChjb25zdCBbc21hbGxTaXplLCBsYXJnZVNpemVdIG9mIE9iamVjdC5lbnRyaWVzKHNpemVVcGdyYWRlcykpIHtcbiAgICBpZiAoaW1hZ2VVcmwuaW5jbHVkZXMoc21hbGxTaXplKSkge1xuICAgICAgcmV0dXJuIGltYWdlVXJsLnJlcGxhY2Uoc21hbGxTaXplLCBsYXJnZVNpemUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpbWFnZVVybDtcbn1cblxuLy8gLS0tLS0tLS0tLSBXZWF0aGVyIChPcGVuXHUyMDExTWV0ZW8pIC0tLS0tLS0tLS1cbmNvbnN0IFdFQVRIRVJfRUwgPSB7IHVwZGF0ZWQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3ZWF0aGVyVXBkYXRlZCcpLCBza2VsZXRvbjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dlYXRoZXJTa2VsZXRvbicpLCBjdXJyZW50VGVtcDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N1cnJlbnRUZW1wJyksIHRlbXBSYW5nZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RlbXBSYW5nZScpLCBhdmdSYWluOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXZnUmFpbicpLCBjb25kaXRpb25Ob3c6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb25kaXRpb25Ob3cnKSwgbmV4dFJhaW46IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXh0UmFpbicpLCBuZXh0UmFpbkRldGFpbDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25leHRSYWluRGV0YWlsJykgfTtcblxubGV0IHdlYXRoZXJDaGFydDtcbmFzeW5jIGZ1bmN0aW9uIGxvYWRXZWF0aGVyKCkge1xuICBjb25zdCBsYXQgPSA1NC45NzgzLCBsb24gPSAtMS42MTc4OyAvLyBOZXdjYXN0bGUgdXBvbiBUeW5lXG4gIGNvbnN0IHVybCA9IGBodHRwczovL2FwaS5vcGVuLW1ldGVvLmNvbS92MS9mb3JlY2FzdD9sYXRpdHVkZT0ke2xhdH0mbG9uZ2l0dWRlPSR7bG9ufSZob3VybHk9dGVtcGVyYXR1cmVfMm0scHJlY2lwaXRhdGlvbl9wcm9iYWJpbGl0eSxwcmVjaXBpdGF0aW9uLHdlYXRoZXJjb2RlJnRpbWV6b25lPUV1cm9wZSUyRkxvbmRvbiZmb3JlY2FzdF9kYXlzPTJgO1xuICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKCdXZWF0aGVyIGZldGNoIGZhaWxlZCcpO1xuICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgY29uc3QgeyB0aW1lLCB0ZW1wZXJhdHVyZV8ybSwgcHJlY2lwaXRhdGlvbl9wcm9iYWJpbGl0eSwgcHJlY2lwaXRhdGlvbiwgd2VhdGhlcmNvZGUgfSA9IGRhdGEuaG91cmx5O1xuICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICBsZXQgc3RhcnRJZHggPSB0aW1lLmZpbmRJbmRleCh0ID0+IG5ldyBEYXRlKHQpLmdldFRpbWUoKSA+PSBub3cpO1xuICBpZiAoc3RhcnRJZHggPT09IC0xKSBzdGFydElkeCA9IDA7XG4gIGNvbnN0IHJhbmdlID0gWy4uLkFycmF5KDI0KV0ubWFwKChfLCBpKSA9PiBzdGFydElkeCArIGkpLmZpbHRlcihpID0+IGkgPCB0aW1lLmxlbmd0aCk7XG4gIGNvbnN0IGxhYmVscyA9IHJhbmdlLm1hcChpID0+IGZtdFRpbWUodGltZVtpXSkpO1xuICBjb25zdCB0ZW1wcyA9IHJhbmdlLm1hcChpID0+IHRlbXBlcmF0dXJlXzJtW2ldKTtcbiAgY29uc3QgcHJvYnMgPSByYW5nZS5tYXAoaSA9PiBwcmVjaXBpdGF0aW9uX3Byb2JhYmlsaXR5W2ldKTtcbiAgY29uc3QgcHJlY3MgPSByYW5nZS5tYXAoaSA9PiBwcmVjaXBpdGF0aW9uW2ldKTtcbiAgY29uc3Qgbm93Q29kZSA9IHdlYXRoZXJjb2RlW3N0YXJ0SWR4XTtcbiAgV0VBVEhFUl9FTC5jdXJyZW50VGVtcC50ZXh0Q29udGVudCA9IGAke01hdGgucm91bmQodGVtcGVyYXR1cmVfMm1bc3RhcnRJZHhdID8/IHRlbXBlcmF0dXJlXzJtLmF0KDApKX1cdTAwQjBDYDtcbiAgV0VBVEhFUl9FTC50ZW1wUmFuZ2UudGV4dENvbnRlbnQgPSBgJHtNYXRoLnJvdW5kKE1hdGgubWluKC4uLnRlbXBzKSl9XHUwMEIwQyBcdTIxOTIgJHtNYXRoLnJvdW5kKE1hdGgubWF4KC4uLnRlbXBzKSl9XHUwMEIwQ2A7XG4gIFdFQVRIRVJfRUwuYXZnUmFpbi50ZXh0Q29udGVudCA9IGAke01hdGgucm91bmQocHJvYnMucmVkdWNlKChhLGIpPT5hK2IsMCkgLyBwcm9icy5sZW5ndGgpfSVgO1xuICBXRUFUSEVSX0VMLmNvbmRpdGlvbk5vdy50ZXh0Q29udGVudCA9IHdlYXRoZXJDb2RlTWFwW25vd0NvZGVdIHx8ICdcdTIwMTQnO1xuICBXRUFUSEVSX0VMLnVwZGF0ZWQudGV4dENvbnRlbnQgPSBgVXBkYXRlZCAke25ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicse2hvdXI6JzItZGlnaXQnLG1pbnV0ZTonMi1kaWdpdCd9KS5mb3JtYXQobmV3IERhdGUoKSl9YDtcbiAgbGV0IG5leHRJZHggPSByYW5nZS5maW5kKGkgPT4gKHByZWNpcGl0YXRpb25fcHJvYmFiaWxpdHlbaV0gPj0gNTApIHx8IChwcmVjaXBpdGF0aW9uW2ldID49IDAuMikpO1xuICBpZiAobmV4dElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGV0IGJlc3RJID0gcmFuZ2VbMF07IGxldCBiZXN0UCA9IC0xOyBmb3IgKGNvbnN0IGkgb2YgcmFuZ2UpIHsgaWYgKHByZWNpcGl0YXRpb25fcHJvYmFiaWxpdHlbaV0gPiBiZXN0UCkgeyBiZXN0UCA9IHByZWNpcGl0YXRpb25fcHJvYmFiaWxpdHlbaV07IGJlc3RJID0gaTsgfSB9XG4gICAgbmV4dElkeCA9IGJlc3RJOyBXRUFUSEVSX0VMLm5leHRSYWluLnRleHRDb250ZW50ID0gYE5vIGhpZ2ggY2hhbmNlIHNvb24gXHUyMDE0IGhpZ2hlc3QgaW4gbmV4dCAyNGggYXQgJHtmbXREYXRlVGltZSh0aW1lW25leHRJZHhdKX1gO1xuICB9IGVsc2UgeyBXRUFUSEVSX0VMLm5leHRSYWluLnRleHRDb250ZW50ID0gYExpa2VseSBhcm91bmQgJHtmbXREYXRlVGltZSh0aW1lW25leHRJZHhdKX1gOyB9XG4gIFdFQVRIRVJfRUwubmV4dFJhaW5EZXRhaWwudGV4dENvbnRlbnQgPSBgUHJvYmFiaWxpdHkgJHtwcmVjaXBpdGF0aW9uX3Byb2JhYmlsaXR5W25leHRJZHhdfSUsIGV4cGVjdGVkIHByZWNpcGl0YXRpb24gJHtwcmVjc1tyYW5nZS5pbmRleE9mKG5leHRJZHgpXSA/PyBwcmVjaXBpdGF0aW9uW25leHRJZHhdfSBtbS5gO1xuICBjb25zdCBjdHggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2VhdGhlckNoYXJ0JykuZ2V0Q29udGV4dCgnMmQnKTtcbiAgV0VBVEhFUl9FTC5za2VsZXRvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBpZiAod2VhdGhlckNoYXJ0KSB3ZWF0aGVyQ2hhcnQuZGVzdHJveSgpO1xuICB3ZWF0aGVyQ2hhcnQgPSBuZXcgQ2hhcnQoY3R4LCB7IHR5cGU6ICdiYXInLCBkYXRhOiB7IGxhYmVscywgZGF0YXNldHM6IFsgeyB0eXBlOiAnbGluZScsIGxhYmVsOiAnVGVtcGVyYXR1cmUgKFx1MDBCMEMpJywgZGF0YTogdGVtcHMsIHlBeGlzSUQ6ICd5JywgdGVuc2lvbjogMC4zNSwgYm9yZGVyV2lkdGg6IDIsIHBvaW50UmFkaXVzOiAwIH0sIHsgdHlwZTogJ2JhcicsIGxhYmVsOiAnUHJlY2lwaXRhdGlvbiBQcm9iYWJpbGl0eSAoJSknLCBkYXRhOiBwcm9icywgeUF4aXNJRDogJ3kxJywgYm9yZGVyV2lkdGg6IDAgfSBdIH0sIG9wdGlvbnM6IHsgcmVzcG9uc2l2ZTogdHJ1ZSwgbWFpbnRhaW5Bc3BlY3RSYXRpbzogZmFsc2UsIHNjYWxlczogeyB5OiB7IHBvc2l0aW9uOiAnbGVmdCcsIHRpY2tzOiB7IGNvbG9yOiAnI2NiZDVlMScgfSwgZ3JpZDogeyBjb2xvcjogJ3JnYmEoMTQ4LDE2MywxODQsMC4xNSknIH0gfSwgeTE6IHsgcG9zaXRpb246ICdyaWdodCcsIHRpY2tzOiB7IGNvbG9yOiAnI2NiZDVlMScgfSwgZ3JpZDogeyBkcmF3T25DaGFydEFyZWE6IGZhbHNlIH0gfSwgeDogeyB0aWNrczogeyBjb2xvcjogJyNjYmQ1ZTEnIH0sIGdyaWQ6IHsgY29sb3I6ICdyZ2JhKDE0OCwxNjMsMTg0LDAuMSknIH0gfSB9LCBwbHVnaW5zOiB7IGxlZ2VuZDogeyBsYWJlbHM6IHsgY29sb3I6ICcjZTJlOGYwJyB9IH0sIHRvb2x0aXA6IHsgY2FsbGJhY2tzOiB7IHRpdGxlOiAoaXRlbXMpID0+IGBIb3VyOiAke2l0ZW1zWzBdLmxhYmVsfWAgfSB9IH0sIGFuaW1hdGlvbjogeyBkdXJhdGlvbjogOTAwIH0gfSB9KTtcbn1cblxuLy8gLS0tLS0tLS0tLSBSYWRhciAoUmFpblZpZXdlciBvdmVyIExlYWZsZXQpIC0tLS0tLS0tLS1cbmxldCByYWRhck1hcCwgcmFkYXJGcmFtZXMgPSBbXSwgcmFkYXJMYXllcnMgPSBbXSwgcmFkYXJJbmRleCA9IDAsIHJhZGFyVGltZXIgPSBudWxsO1xuXG5hc3luYyBmdW5jdGlvbiBpbml0UmFkYXIoKSB7XG4gIGNvbnN0IGNlbnRlciA9IFs1NC45NzgzLCAtMS42MTc4XTsgLy8gTmV3Y2FzdGxlIHVwb24gVHluZVxuICByYWRhck1hcCA9IEwubWFwKCdyYWRhck1hcCcsIHsgem9vbUNvbnRyb2w6IHRydWUsIGF0dHJpYnV0aW9uQ29udHJvbDogdHJ1ZSB9KS5zZXRWaWV3KGNlbnRlciwgNyk7XG4gIGNvbnN0IGJhc2UgPSBMLnRpbGVMYXllcignaHR0cHM6Ly97c30udGlsZS5vcGVuc3RyZWV0bWFwLm9yZy97en0ve3h9L3t5fS5wbmcnLCB7IG1heFpvb206IDE4LCBhdHRyaWJ1dGlvbjogJyZjb3B5OyA8YSBocmVmPVwiaHR0cHM6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvY29weXJpZ2h0XCI+T3BlblN0cmVldE1hcDwvYT4gY29udHJpYnV0b3JzJyB9KTtcbiAgYmFzZS5hZGRUbyhyYWRhck1hcCk7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLnJhaW52aWV3ZXIuY29tL3B1YmxpYy93ZWF0aGVyLW1hcHMuanNvbicpO1xuICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ1JhZGFyIG1ldGFkYXRhIGZldGNoIGZhaWxlZCcpO1xuICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXMuanNvbigpO1xuICAgIGNvbnN0IGFsbEZyYW1lcyA9IFsuLi4oanNvbi5yYWRhcj8ucGFzdHx8W10pLCAuLi4oanNvbi5yYWRhcj8ubm93Y2FzdHx8W10pXTtcbiAgICBjb25zdCBjdXRvZmYgPSBEYXRlLm5vdygpIC0gNCo2MCo2MCoxMDAwOyAvLyBsYXN0IDQgaG91cnNcbiAgICByYWRhckZyYW1lcyA9IGFsbEZyYW1lcy5maWx0ZXIoZiA9PiAoZi50aW1lKjEwMDApID49IGN1dG9mZik7XG4gICAgaWYgKHJhZGFyRnJhbWVzLmxlbmd0aCA9PT0gMCkgeyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmFkYXJNYXAnKS5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInAtMyB0ZXh0LXNtXCI+Tm8gcmFkYXIgZnJhbWVzIGF2YWlsYWJsZSByaWdodCBub3cuPC9kaXY+JzsgcmV0dXJuOyB9XG4gICAgcmFkYXJMYXllcnMgPSByYWRhckZyYW1lcy5tYXAoZiA9PiBMLnRpbGVMYXllcihgaHR0cHM6Ly90aWxlY2FjaGUucmFpbnZpZXdlci5jb20vdjIvcmFkYXIvJHtmLnRpbWV9LzI1Ni97en0ve3h9L3t5fS8yLzFfMS5wbmdgLCB7IG9wYWNpdHk6IDAuNywgYXR0cmlidXRpb246ICdSYWRhciBcdTAwQTkgPGEgaHJlZj1cImh0dHBzOi8vcmFpbnZpZXdlci5jb21cIj5SYWluVmlld2VyPC9hPicgfSkpO1xuICAgIHJhZGFySW5kZXggPSByYWRhckxheWVycy5sZW5ndGggLSAxO1xuICAgIHJhZGFyTGF5ZXJzW3JhZGFySW5kZXhdLmFkZFRvKHJhZGFyTWFwKTtcbiAgICB1cGRhdGVSYWRhclRpbWVMYWJlbCgpO1xuICAgIGNvbnN0IHBsYXlCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmFkYXJQbGF5Jyk7XG4gICAgcGxheUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZVJhZGFyKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmFkYXJQcmV2JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBzdGVwUmFkYXIoLTEpKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmFkYXJOZXh0JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBzdGVwUmFkYXIoMSkpO1xuICAgIHRvZ2dsZVJhZGFyKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmFkYXJNYXAnKS5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cInAtMyB0ZXh0LXNtXCI+RmFpbGVkIHRvIGxvYWQgcmFkYXIuICR7ZS5tZXNzYWdlfTwvZGl2PmA7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlUmFkYXJUaW1lTGFiZWwoKSB7XG4gIGNvbnN0IHRzID0gcmFkYXJGcmFtZXNbcmFkYXJJbmRleF0/LnRpbWUqMTAwMDtcbiAgaWYgKCF0cykgcmV0dXJuO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmFkYXJUaW1lJykudGV4dENvbnRlbnQgPSBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcgfSkuZm9ybWF0KG5ldyBEYXRlKHRzKSk7XG59XG5cbmZ1bmN0aW9uIHN0ZXBSYWRhcihkaXIgPSAxKSB7XG4gIGlmICghcmFkYXJMYXllcnMubGVuZ3RoKSByZXR1cm47XG4gIHJhZGFyTGF5ZXJzW3JhZGFySW5kZXhdPy5yZW1vdmUoKTtcbiAgcmFkYXJJbmRleCA9IChyYWRhckluZGV4ICsgZGlyICsgcmFkYXJMYXllcnMubGVuZ3RoKSAlIHJhZGFyTGF5ZXJzLmxlbmd0aDtcbiAgcmFkYXJMYXllcnNbcmFkYXJJbmRleF0uYWRkVG8ocmFkYXJNYXApO1xuICB1cGRhdGVSYWRhclRpbWVMYWJlbCgpO1xufVxuXG5mdW5jdGlvbiB0b2dnbGVSYWRhcigpIHtcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhZGFyUGxheScpO1xuICBpZiAocmFkYXJUaW1lcikgeyBjbGVhckludGVydmFsKHJhZGFyVGltZXIpOyByYWRhclRpbWVyID0gbnVsbDsgYnRuLnRleHRDb250ZW50ID0gJ1BsYXknOyByZXR1cm47IH1cbiAgYnRuLnRleHRDb250ZW50ID0gJ1BhdXNlJztcbiAgcmFkYXJUaW1lciA9IHNldEludGVydmFsKCgpID0+IHN0ZXBSYWRhcigxKSwgNjAwKTtcbn1cblxuLy8gLS0tLS0tLS0tLSBSZWRkaXQgUG9wdWxhciBIb3QgMjAgLS0tLS0tLS0tLVxuYXN5bmMgZnVuY3Rpb24gbG9hZFJlZGRpdCgpIHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVkZGl0TGlzdCcpO1xuICBlbC5pbm5lckhUTUwgPSAnJztcbiAgZWwuaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmVlbmQnLCBBcnJheS5mcm9tKHtsZW5ndGg6IDh9KS5tYXAoKCkgPT4gYFxuICAgIDxkaXYgY2xhc3M9XCJnbGFzcyByb3VuZGVkLTJ4bCBwLTQgY2FyZC1ob3ZlclwiPlxuICAgICAgPGRpdiBjbGFzcz1cImgtMzIgdy1mdWxsIHJvdW5kZWQtbGcgc2tlbGV0b24gYW5pbWF0ZS1zaGltbWVyIG1iLTNcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJoLTUgdy0zLzQgcm91bmRlZC1tZCBza2VsZXRvbiBhbmltYXRlLXNoaW1tZXJcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtdC0zIGgtNCB3LTEvMiByb3VuZGVkLW1kIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lclwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm10LTMgaC04IHctMjQgcm91bmRlZC1sZyBza2VsZXRvbiBhbmltYXRlLXNoaW1tZXJcIj48L2Rpdj5cbiAgICA8L2Rpdj5gKS5qb2luKCcnKSk7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vd3d3LnJlZGRpdC5jb20vci9wb3B1bGFyL2hvdC5qc29uP2xpbWl0PTIwJyk7XG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcignUmVkZGl0IGZldGNoIGZhaWxlZCcpO1xuICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXMuanNvbigpO1xuICAgIGNvbnN0IGl0ZW1zID0ganNvbi5kYXRhLmNoaWxkcmVuLm1hcChjID0+IGMuZGF0YSk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlZGRpdFVwZGF0ZWQnKS50ZXh0Q29udGVudCA9IGBVcGRhdGVkICR7bmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJyx7aG91cjonMi1kaWdpdCcsbWludXRlOicyLWRpZ2l0J30pLmZvcm1hdChuZXcgRGF0ZSgpKX1gO1xuICAgIGVsLmlubmVySFRNTCA9ICcnO1xuICAgIGZvciAoY29uc3QgcG9zdCBvZiBpdGVtcykge1xuICAgICAgY29uc3QgdXJsID0gYGh0dHBzOi8vd3d3LnJlZGRpdC5jb20ke3Bvc3QucGVybWFsaW5rfWA7XG4gICAgICBjb25zdCBmbGFpciA9IHBvc3QubGlua19mbGFpcl90ZXh0ID8gYDxzcGFuIGNsYXNzPSdtbC0yIHRleHQteHMgcHgtMS41IHB5LTAuNSByb3VuZGVkLW1kIGJnLXdoaXRlLzEwIGJvcmRlciBib3JkZXItd2hpdGUvMTAnPiR7cG9zdC5saW5rX2ZsYWlyX3RleHR9PC9zcGFuPmAgOiAnJztcbiAgICAgIGxldCBpbWFnZVVybCA9IG51bGw7XG4gICAgICBsZXQgaW1hZ2VBbHQgPSBwb3N0LnRpdGxlO1xuICAgICAgaWYgKHBvc3QucHJldmlldyAmJiBwb3N0LnByZXZpZXcuaW1hZ2VzICYmIHBvc3QucHJldmlldy5pbWFnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBwcmV2aWV3ID0gcG9zdC5wcmV2aWV3LmltYWdlc1swXTtcbiAgICAgICAgaWYgKHByZXZpZXcudmFyaWFudHMgJiYgcHJldmlldy52YXJpYW50cy5naWYpIHtcbiAgICAgICAgICBpbWFnZVVybCA9IHByZXZpZXcudmFyaWFudHMuZ2lmLnNvdXJjZS51cmw7XG4gICAgICAgIH0gZWxzZSBpZiAocHJldmlldy52YXJpYW50cyAmJiBwcmV2aWV3LnZhcmlhbnRzLm1wNCkge1xuICAgICAgICAgIGltYWdlVXJsID0gcHJldmlldy5zb3VyY2UudXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGltYWdlVXJsID0gcHJldmlldy5zb3VyY2UudXJsO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHBvc3QudGh1bWJuYWlsICYmIHBvc3QudGh1bWJuYWlsICE9PSAnc2VsZicgJiYgcG9zdC50aHVtYm5haWwgIT09ICdkZWZhdWx0JyAmJiBwb3N0LnRodW1ibmFpbCAhPT0gJ25zZncnKSB7XG4gICAgICAgIGltYWdlVXJsID0gcG9zdC50aHVtYm5haWw7XG4gICAgICB9IGVsc2UgaWYgKHBvc3QudXJsICYmIChwb3N0LnVybC5pbmNsdWRlcygnLmpwZycpIHx8IHBvc3QudXJsLmluY2x1ZGVzKCcuanBlZycpIHx8IHBvc3QudXJsLmluY2x1ZGVzKCcucG5nJykgfHwgcG9zdC51cmwuaW5jbHVkZXMoJy5naWYnKSkpIHtcbiAgICAgICAgaW1hZ2VVcmwgPSBwb3N0LnVybDtcbiAgICAgIH1cbiAgICAgIGlmIChpbWFnZVVybCAmJiBpbWFnZVVybC5pbmNsdWRlcygncmVkZGl0LmNvbScpKSB7XG4gICAgICAgIGltYWdlVXJsID0gaW1hZ2VVcmwuc3BsaXQoJz8nKVswXTtcbiAgICAgIH1cbiAgICAgIGVsLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgYFxuICAgICAgICA8YSBjbGFzcz1cImdsYXNzIHJvdW5kZWQtMnhsIHAtNCBibG9jayBjYXJkLWhvdmVyXCIgaHJlZj1cIiR7dXJsfVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAke2ltYWdlVXJsID8gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImgtMzIgdy1mdWxsIHJvdW5kZWQtbGcgb3ZlcmZsb3ctaGlkZGVuIG1iLTMgYmctc2xhdGUtODAwLzUwXCI+XG4gICAgICAgICAgICAgIDxpbWcgc3JjPVwiJHtpbWFnZVVybH1cIiBhbHQ9XCIke3Bvc3QudGl0bGV9XCIgY2xhc3M9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBhcnRpY2xlLWltYWdlXCIgbG9hZGluZz1cImxhenlcIiBvbmVycm9yPVwidGhpcy5zdHlsZS5kaXNwbGF5PSdub25lJzsgdGhpcy5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2JnLXNsYXRlLTgwMC81MCcpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgYCA6ICcnfVxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LXNtIHRleHQtc2xhdGUtMzAwLzcwXCI+ci8ke3Bvc3Quc3VicmVkZGl0fSBcdTIwMjIgXHUyQjA2XHVGRTBFICR7cG9zdC51cHMudG9Mb2NhbGVTdHJpbmcoJ2VuLUdCJyl9PC9kaXY+XG4gICAgICAgICAgPGgzIGNsYXNzPVwibXQtMSBmb250LXNlbWlib2xkIGxlYWRpbmctc251Z1wiPiR7cG9zdC50aXRsZS5yZXBsYWNlKC88L2csJyZsdDsnKX08L2gzPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJtdC0zIGlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciB0ZXh0LXhzIHRleHQtc2xhdGUtMzAwLzgwXCI+YnkgdS8ke3Bvc3QuYXV0aG9yfSR7ZmxhaXJ9PC9kaXY+XG4gICAgICAgIDwvYT5cbiAgICAgIGApO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkgeyBlbC5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImdsYXNzIHJvdW5kZWQtMnhsIHAtNCB0ZXh0LXNtXCI+RmFpbGVkIHRvIGxvYWQgUmVkZGl0LiAke2UubWVzc2FnZX08L2Rpdj5gOyB9XG59XG5cbi8vIC0tLS0tLS0tLS0gQkJDIExhdGVzdCB2aWEgUlNTIChDT1JTXHUyMDExZnJpZW5kbHkgcmVhZGVyKSAtLS0tLS0tLS0tXG5hc3luYyBmdW5jdGlvbiBsb2FkQkJDKCkge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYmNMaXN0Jyk7XG4gIGVsLmlubmVySFRNTCA9IEFycmF5LmZyb20oe2xlbmd0aDogNn0pLm1hcCgoKSA9PiBgXG4gICAgPGRpdiBjbGFzcz1cImdsYXNzIHJvdW5kZWQtMnhsIHAtNCBjYXJkLWhvdmVyXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiaC0zMiB3LWZ1bGwgcm91bmRlZC1sZyBza2VsZXRvbiBhbmltYXRlLXNoaW1tZXIgbWItM1wiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImgtNSB3LTIvMyByb3VuZGVkLW1kIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lclwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm10LTMgaC00IHctMS8yIHJvdW5kZWQtbWQgc2tlbGV0b24gYW5pbWF0ZS1zaGltbWVyXCI+PC9kaXY+XG4gICAgPC9kaXY+YCkuam9pbignJyk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkucnNzMmpzb24uY29tL3YxL2FwaS5qc29uP3Jzc191cmw9aHR0cHM6Ly9mZWVkcy5iYmNpLmNvLnVrL25ld3MvcnNzLnhtbCcpO1xuICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ0JCQyBSU1MgZmV0Y2ggZmFpbGVkJyk7XG4gICAgY29uc3QganNvbiA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgaWYgKGpzb24uc3RhdHVzICE9PSAnb2snIHx8ICFqc29uLml0ZW1zKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgUlNTIHJlc3BvbnNlIGZvcm1hdCcpO1xuICAgIH1cbiAgICBjb25zdCBpdGVtcyA9IGpzb24uaXRlbXMuc2xpY2UoMCwgMTApO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYmNVcGRhdGVkJykudGV4dENvbnRlbnQgPSBgVXBkYXRlZCAke25ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicse2hvdXI6JzItZGlnaXQnLG1pbnV0ZTonMi1kaWdpdCd9KS5mb3JtYXQobmV3IERhdGUoKSl9YDtcbiAgICBlbC5pbm5lckhUTUwgPSAnJztcbiAgICBmb3IgKGNvbnN0IGFydCBvZiBpdGVtcykge1xuICAgICAgY29uc3QgdCA9IG5ldyBEYXRlKGFydC5wdWJEYXRlKTtcbiAgICAgIGNvbnN0IHdoZW4gPSBpc05hTih0KSA/ICcnIDogbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJywgeyBkYXk6JzItZGlnaXQnLCBtb250aDonc2hvcnQnLCBob3VyOicyLWRpZ2l0JywgbWludXRlOicyLWRpZ2l0JyB9KS5mb3JtYXQodCk7XG4gICAgICBsZXQgbGluayA9IGFydC5saW5rO1xuICAgICAgaWYgKGxpbmsuaW5jbHVkZXMoJ2JiYy5jb20nKSkge1xuICAgICAgICBsaW5rID0gbGluay5yZXBsYWNlKCdiYmMuY29tJywgJ2JiYy5jby51aycpO1xuICAgICAgfVxuICAgICAgbGV0IHRodW1ibmFpbCA9IGFydC50aHVtYm5haWwgfHwgYXJ0LmVuY2xvc3VyZT8udGh1bWJuYWlsIHx8ICdodHRwczovL25ld3MuYmJjaW1nLmNvLnVrL25vbC9zaGFyZWQvaW1nL2JiY19uZXdzXzEyMHg2MC5naWYnO1xuICAgICAgdGh1bWJuYWlsID0gdXBncmFkZUJCQ0ltYWdlUmVzb2x1dGlvbih0aHVtYm5haWwpO1xuICAgICAgZWwuaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmVlbmQnLCBgXG4gICAgICAgIDxhIGNsYXNzPVwiZ2xhc3Mgcm91bmRlZC0yeGwgcC00IGJsb2NrIGNhcmQtaG92ZXJcIiBocmVmPVwiJHtsaW5rfVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiaC0zMiB3LWZ1bGwgcm91bmRlZC1sZyBvdmVyZmxvdy1oaWRkZW4gbWItMyBiZy1zbGF0ZS04MDAvNTBcIj5cbiAgICAgICAgICAgIDxpbWcgc3JjPVwiJHt0aHVtYm5haWx9XCIgYWx0PVwiJHthcnQudGl0bGV9XCIgY2xhc3M9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBhcnRpY2xlLWltYWdlXCIgbG9hZGluZz1cImxhenlcIiBvbmVycm9yPVwidGhpcy5zdHlsZS5kaXNwbGF5PSdub25lJzsgdGhpcy5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2JnLXNsYXRlLTgwMC81MCcpO1wiPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LXNtIHRleHQtc2xhdGUtMzAwLzcwXCI+JHt3aGVufTwvZGl2PlxuICAgICAgICAgIDxoMyBjbGFzcz1cIm10LTEgZm9udC1zZW1pYm9sZCBsZWFkaW5nLXNudWdcIj4ke2FydC50aXRsZS5yZXBsYWNlKC88L2csJyZsdDsnKX08L2gzPlxuICAgICAgICA8L2E+XG4gICAgICBgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLmFsbG9yaWdpbnMud2luL3Jhdz91cmw9aHR0cHM6Ly9mZWVkcy5iYmNpLmNvLnVrL25ld3MvcnNzLnhtbCcpO1xuICAgICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcignQkJDIFJTUyBmYWxsYmFjayBmZXRjaCBmYWlsZWQnKTtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCByZXMudGV4dCgpO1xuICAgICAgY29uc3QgeG1sID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyh0ZXh0LCAndGV4dC94bWwnKTtcbiAgICAgIGNvbnN0IGl0ZW1zID0gQXJyYXkuZnJvbSh4bWwucXVlcnlTZWxlY3RvckFsbCgnaXRlbScpKS5zbGljZSgwLCAxMCkubWFwKGl0ZW0gPT4gKHsgXG4gICAgICAgIHRpdGxlOiBpdGVtLnF1ZXJ5U2VsZWN0b3IoJ3RpdGxlJyk/LnRleHRDb250ZW50IHx8ICdVbnRpdGxlZCcsIFxuICAgICAgICBsaW5rOiBpdGVtLnF1ZXJ5U2VsZWN0b3IoJ2xpbmsnKT8udGV4dENvbnRlbnQgfHwgJyMnLCBcbiAgICAgICAgcHViRGF0ZTogaXRlbS5xdWVyeVNlbGVjdG9yKCdwdWJEYXRlJyk/LnRleHRDb250ZW50IHx8ICcnLFxuICAgICAgICB0aHVtYm5haWw6IGl0ZW0ucXVlcnlTZWxlY3RvcignbWVkaWFcXFxcOnRodW1ibmFpbCcpPy5nZXRBdHRyaWJ1dGUoJ3VybCcpIHx8IFxuICAgICAgICAgICAgICAgICAgaXRlbS5xdWVyeVNlbGVjdG9yKCdlbmNsb3N1cmVbdHlwZT1cImltYWdlL2pwZWdcIl0nKT8uZ2V0QXR0cmlidXRlKCd1cmwnKSB8fCBcbiAgICAgICAgICAgICAgICAgIGl0ZW0ucXVlcnlTZWxlY3RvcignZW5jbG9zdXJlW3R5cGU9XCJpbWFnZS9wbmdcIl0nKT8uZ2V0QXR0cmlidXRlKCd1cmwnKSB8fFxuICAgICAgICAgICAgICAgICAgJ2h0dHBzOi8vbmV3cy5iYmNpbWcuY28udWsvbm9sL3NoYXJlZC9pbWcvYmJjX25ld3NfMTIweDYwLmdpZidcbiAgICAgIH0pKTtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYmNVcGRhdGVkJykudGV4dENvbnRlbnQgPSBgVXBkYXRlZCAke25ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicse2hvdXI6JzItZGlnaXQnLG1pbnV0ZTonMi1kaWdpdCd9KS5mb3JtYXQobmV3IERhdGUoKSl9IChmYWxsYmFjaylgO1xuICAgICAgZWwuaW5uZXJIVE1MID0gJyc7XG4gICAgICBmb3IgKGNvbnN0IGFydCBvZiBpdGVtcykge1xuICAgICAgICBjb25zdCB0ID0gbmV3IERhdGUoYXJ0LnB1YkRhdGUpO1xuICAgICAgICBjb25zdCB3aGVuID0gaXNOYU4odCkgPyAnJyA6IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicsIHsgZGF5OicyLWRpZ2l0JywgbW9udGg6J3Nob3J0JywgaG91cjonMi1kaWdpdCcsIG1pbnV0ZTonMi1kaWdpdCcgfSkuZm9ybWF0KHQpO1xuICAgICAgICBsZXQgbGluayA9IGFydC5saW5rO1xuICAgICAgICBpZiAobGluay5pbmNsdWRlcygnYmJjLmNvbScpKSB7XG4gICAgICAgICAgbGluayA9IGxpbmsucmVwbGFjZSgnYmJjLmNvbScsICdiYmMuY28udWsnKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdGh1bWJuYWlsID0gdXBncmFkZUJCQ0ltYWdlUmVzb2x1dGlvbihhcnQudGh1bWJuYWlsKTtcbiAgICAgICAgZWwuaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmVlbmQnLCBgXG4gICAgICAgICAgPGEgY2xhc3M9XCJnbGFzcyByb3VuZGVkLTJ4bCBwLTQgYmxvY2sgY2FyZC1ob3ZlclwiIGhyZWY9XCIke2xpbmt9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImgtMzIgdy1mdWxsIHJvdW5kZWQtbGcgb3ZlcmZsb3ctaGlkZGVuIG1iLTMgYmctc2xhdGUtODAwLzUwXCI+XG4gICAgICAgICAgICAgIDxpbWcgc3JjPVwiJHt0aHVtYm5haWx9XCIgYWx0PVwiJHthcnQudGl0bGV9XCIgY2xhc3M9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBhcnRpY2xlLWltYWdlXCIgbG9hZGluZz1cImxhenlcIiBvbmVycm9yPVwidGhpcy5zdHlsZS5kaXNwbGF5PSdub25lJzsgdGhpcy5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2JnLXNsYXRlLTgwMC81MCcpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGV4dC1zbSB0ZXh0LXNsYXRlLTMwMC83MFwiPiR7d2hlbn08L2Rpdj5cbiAgICAgICAgICAgIDxoMyBjbGFzcz1cIm10LTEgZm9udC1zZW1pYm9sZCBsZWFkaW5nLXNudWdcIj4ke2FydC50aXRsZS5yZXBsYWNlKC88L2csJyZsdDsnKX08L2gzPlxuICAgICAgICAgIDwvYT5cbiAgICAgICAgYCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZmFsbGJhY2tFcnJvcikge1xuICAgICAgZWwuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJnbGFzcyByb3VuZGVkLTJ4bCBwLTQgdGV4dC1zbVwiPkZhaWxlZCB0byBsb2FkIEJCQy4gJHtlLm1lc3NhZ2V9IChmYWxsYmFjayBhbHNvIGZhaWxlZDogJHtmYWxsYmFja0Vycm9yLm1lc3NhZ2V9KTwvZGl2PmA7XG4gICAgfVxuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0gT3JjaGVzdHJhdGUgLS0tLS0tLS0tLVxuYXN5bmMgZnVuY3Rpb24gbG9hZEFsbCgpIHtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdsb2FkaW5nJyk7XG4gIGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChbbG9hZFdlYXRoZXIoKSwgaW5pdFJhZGFyKCksIGxvYWRSZWRkaXQoKSwgbG9hZEJCQygpXSk7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuICBpZiAod2luZG93Lmx1Y2lkZSkgbHVjaWRlLmNyZWF0ZUljb25zKCk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0TGl2ZURhdGVUaW1lKCkge1xuICB1cGRhdGVMaXZlRGF0ZVRpbWUoKTtcbiAgc2V0SW50ZXJ2YWwodXBkYXRlTGl2ZURhdGVUaW1lLCAxMDAwKTtcbn1cblxuLy8gLS0tLS0tLS0tLSBOYXZpZ2F0aW9uIE1lbnUgLS0tLS0tLS0tLVxuZnVuY3Rpb24gaW5pdE5hdmlnYXRpb24oKSB7XG4gIGNvbnN0IG5hdk1lbnUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2TWVudScpO1xuICBjb25zdCBuYXZUb2dnbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2VG9nZ2xlJyk7XG4gIGNvbnN0IG5hdkNsb3NlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdkNsb3NlJyk7XG4gIGNvbnN0IG5hdkxpbmtzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm5hdi1saW5rJyk7XG5cbiAgZnVuY3Rpb24gdG9nZ2xlTmF2KCkge1xuICAgIGNvbnN0IGlzVmlzaWJsZSA9ICFuYXZNZW51LmNsYXNzTGlzdC5jb250YWlucygnLXRyYW5zbGF0ZS15LWZ1bGwnKTtcbiAgICBpZiAoaXNWaXNpYmxlKSB7XG4gICAgICBuYXZNZW51LmNsYXNzTGlzdC5hZGQoJy10cmFuc2xhdGUteS1mdWxsJywgJ29wYWNpdHktMCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYXZNZW51LmNsYXNzTGlzdC5yZW1vdmUoJy10cmFuc2xhdGUteS1mdWxsJywgJ29wYWNpdHktMCcpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb3NlTmF2KCkge1xuICAgIG5hdk1lbnUuY2xhc3NMaXN0LmFkZCgnLXRyYW5zbGF0ZS15LWZ1bGwnLCAnb3BhY2l0eS0wJyk7XG4gIH1cblxuICBmdW5jdGlvbiBzbW9vdGhTY3JvbGxUb1NlY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCB0YXJnZXRJZCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykuc3Vic3RyaW5nKDEpO1xuICAgIGNvbnN0IHRhcmdldFNlY3Rpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YXJnZXRJZCk7XG4gICAgaWYgKHRhcmdldFNlY3Rpb24pIHtcbiAgICAgIGNvbnN0IGhlYWRlckhlaWdodCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2hlYWRlcicpLm9mZnNldEhlaWdodDtcbiAgICAgIGNvbnN0IG5hdkhlaWdodCA9IG5hdk1lbnUub2Zmc2V0SGVpZ2h0O1xuICAgICAgY29uc3QgdG90YWxPZmZzZXQgPSBoZWFkZXJIZWlnaHQgKyBuYXZIZWlnaHQgKyAyMDtcbiAgICAgIGNvbnN0IHRhcmdldFBvc2l0aW9uID0gdGFyZ2V0U2VjdGlvbi5vZmZzZXRUb3AgLSB0b3RhbE9mZnNldDtcbiAgICAgIHdpbmRvdy5zY3JvbGxUbyh7IHRvcDogdGFyZ2V0UG9zaXRpb24sIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICAgIGlmICh3aW5kb3cuaW5uZXJXaWR0aCA8IDc2OCkge1xuICAgICAgICBjbG9zZU5hdigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG5hdlRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZU5hdik7XG4gIG5hdkNsb3NlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xvc2VOYXYpO1xuICBuYXZMaW5rcy5mb3JFYWNoKGxpbmsgPT4gbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNtb290aFNjcm9sbFRvU2VjdGlvbikpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgaWYgKCFuYXZNZW51LmNvbnRhaW5zKGUudGFyZ2V0KSAmJiAhbmF2VG9nZ2xlLmNvbnRhaW5zKGUudGFyZ2V0KSkge1xuICAgICAgY2xvc2VOYXYoKTtcbiAgICB9XG4gIH0pO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHtcbiAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgICBjbG9zZU5hdigpO1xuICAgIH1cbiAgfSk7XG59XG5cbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWZyZXNoQnRuJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gbG9hZEFsbCgpKTtcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICBsb2FkQWxsKCk7XG4gIHN0YXJ0TGl2ZURhdGVUaW1lKCk7XG4gIGluaXROYXZpZ2F0aW9uKCk7XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7O0FBQ0EsTUFBTSxVQUFVLENBQUMsS0FBSyxLQUFLLGlCQUFpQixPQUFPLENBQUMsTUFBTSxJQUFJLEtBQUssZUFBZSxTQUFTLEVBQUUsTUFBTSxXQUFXLFFBQVEsV0FBVyxRQUFRLE9BQU8sVUFBVSxJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUUsT0FBTyxJQUFJLEtBQUssR0FBRyxDQUFDO0FBQzdMLE1BQU0sY0FBYyxDQUFDLEtBQUssS0FBSyxvQkFBb0IsSUFBSSxLQUFLLGVBQWUsU0FBUyxFQUFFLFNBQVMsU0FBUyxLQUFLLFdBQVcsT0FBTyxTQUFTLE1BQU0sV0FBVyxRQUFRLFdBQVcsUUFBUSxPQUFPLFVBQVUsR0FBRyxDQUFDLEVBQUUsT0FBTyxJQUFJLEtBQUssR0FBRyxDQUFDO0FBRy9OLFdBQVMscUJBQXFCO0FBQzVCLFVBQU0sTUFBTSxvQkFBSSxLQUFLO0FBQ3JCLFVBQU0sVUFBVSxJQUFJLEtBQUssZUFBZSxTQUFTO0FBQUEsTUFDL0MsU0FBUztBQUFBLE1BQ1QsS0FBSztBQUFBLE1BQ0wsT0FBTztBQUFBLE1BQ1AsTUFBTTtBQUFBLElBQ1IsQ0FBQyxFQUFFLE9BQU8sR0FBRztBQUNiLFVBQU0sVUFBVSxJQUFJLEtBQUssZUFBZSxTQUFTO0FBQUEsTUFDL0MsTUFBTTtBQUFBLE1BQ04sUUFBUTtBQUFBLE1BQ1IsUUFBUTtBQUFBLE1BQ1IsUUFBUTtBQUFBLElBQ1YsQ0FBQyxFQUFFLE9BQU8sR0FBRztBQUNiLFVBQU0saUJBQWlCLFNBQVMsZUFBZSxjQUFjO0FBQzdELFFBQUksZ0JBQWdCO0FBQ2xCLHFCQUFlLGNBQWMsR0FBRyxPQUFPLE9BQU8sT0FBTztBQUFBLElBQ3ZEO0FBQUEsRUFDRjtBQUVBLE1BQU0saUJBQWlCLEVBQUUsR0FBRyxhQUFhLEdBQUcsZ0JBQWdCLEdBQUcsaUJBQWlCLEdBQUcsWUFBWSxJQUFJLE9BQU8sSUFBSSx1QkFBdUIsSUFBSSxpQkFBaUIsSUFBSSxvQkFBb0IsSUFBSSxpQkFBaUIsSUFBSSwwQkFBMEIsSUFBSSwwQkFBMEIsSUFBSSxlQUFlLElBQUksaUJBQWlCLElBQUksY0FBYyxJQUFJLHVCQUF1QixJQUFJLHVCQUF1QixJQUFJLGVBQWUsSUFBSSxpQkFBaUIsSUFBSSxjQUFjLElBQUksZUFBZSxJQUFJLHdCQUF3QixJQUFJLDBCQUEwQixJQUFJLHlCQUF5QixJQUFJLHdCQUF3QixJQUFJLHVCQUF1QixJQUFJLGdCQUFnQixJQUFJLGlDQUFpQyxJQUFJLCtCQUErQjtBQUcxcUIsV0FBUywwQkFBMEIsVUFBVTtBQUMzQyxRQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsU0FBUyxrQkFBa0IsRUFBRyxRQUFPO0FBRWhFLFVBQU0sZUFBZTtBQUFBLE1BQ25CLFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxJQUNYO0FBRUEsZUFBVyxDQUFDLFdBQVcsU0FBUyxLQUFLLE9BQU8sUUFBUSxZQUFZLEdBQUc7QUFDakUsVUFBSSxTQUFTLFNBQVMsU0FBUyxHQUFHO0FBQ2hDLGVBQU8sU0FBUyxRQUFRLFdBQVcsU0FBUztBQUFBLE1BQzlDO0FBQUEsSUFDRjtBQUVBLFdBQU87QUFBQSxFQUNUO0FBR0EsTUFBTSxhQUFhLEVBQUUsU0FBUyxTQUFTLGVBQWUsZ0JBQWdCLEdBQUcsVUFBVSxTQUFTLGVBQWUsaUJBQWlCLEdBQUcsYUFBYSxTQUFTLGVBQWUsYUFBYSxHQUFHLFdBQVcsU0FBUyxlQUFlLFdBQVcsR0FBRyxTQUFTLFNBQVMsZUFBZSxTQUFTLEdBQUcsY0FBYyxTQUFTLGVBQWUsY0FBYyxHQUFHLFVBQVUsU0FBUyxlQUFlLFVBQVUsR0FBRyxnQkFBZ0IsU0FBUyxlQUFlLGdCQUFnQixFQUFFO0FBRWxiLE1BQUk7QUFDSixpQkFBZSxjQUFjO0FBcEQ3QixRQUFBQSxLQUFBO0FBcURFLFVBQU0sTUFBTSxTQUFTLE1BQU07QUFDM0IsVUFBTSxNQUFNLG1EQUFtRCxHQUFHLGNBQWMsR0FBRztBQUNuRixVQUFNLE1BQU0sTUFBTSxNQUFNLEdBQUc7QUFDM0IsUUFBSSxDQUFDLElBQUksR0FBSSxPQUFNLElBQUksTUFBTSxzQkFBc0I7QUFDbkQsVUFBTSxPQUFPLE1BQU0sSUFBSSxLQUFLO0FBQzVCLFVBQU0sRUFBRSxNQUFNLGdCQUFnQiwyQkFBMkIsZUFBZSxZQUFZLElBQUksS0FBSztBQUM3RixVQUFNLE1BQU0sS0FBSyxJQUFJO0FBQ3JCLFFBQUksV0FBVyxLQUFLLFVBQVUsT0FBSyxJQUFJLEtBQUssQ0FBQyxFQUFFLFFBQVEsS0FBSyxHQUFHO0FBQy9ELFFBQUksYUFBYSxHQUFJLFlBQVc7QUFDaEMsVUFBTSxRQUFRLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLE1BQU0sV0FBVyxDQUFDLEVBQUUsT0FBTyxPQUFLLElBQUksS0FBSyxNQUFNO0FBQ3BGLFVBQU0sU0FBUyxNQUFNLElBQUksT0FBSyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDOUMsVUFBTSxRQUFRLE1BQU0sSUFBSSxPQUFLLGVBQWUsQ0FBQyxDQUFDO0FBQzlDLFVBQU0sUUFBUSxNQUFNLElBQUksT0FBSywwQkFBMEIsQ0FBQyxDQUFDO0FBQ3pELFVBQU0sUUFBUSxNQUFNLElBQUksT0FBSyxjQUFjLENBQUMsQ0FBQztBQUM3QyxVQUFNLFVBQVUsWUFBWSxRQUFRO0FBQ3BDLGVBQVcsWUFBWSxjQUFjLEdBQUcsS0FBSyxPQUFNQSxNQUFBLGVBQWUsUUFBUSxNQUF2QixPQUFBQSxNQUE0QixlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDcEcsZUFBVyxVQUFVLGNBQWMsR0FBRyxLQUFLLE1BQU0sS0FBSyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsZ0JBQVEsS0FBSyxNQUFNLEtBQUssSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQzFHLGVBQVcsUUFBUSxjQUFjLEdBQUcsS0FBSyxNQUFNLE1BQU0sT0FBTyxDQUFDLEdBQUUsTUFBSSxJQUFFLEdBQUUsQ0FBQyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3pGLGVBQVcsYUFBYSxjQUFjLGVBQWUsT0FBTyxLQUFLO0FBQ2pFLGVBQVcsUUFBUSxjQUFjLFdBQVcsSUFBSSxLQUFLLGVBQWUsU0FBUSxFQUFDLE1BQUssV0FBVSxRQUFPLFVBQVMsQ0FBQyxFQUFFLE9BQU8sb0JBQUksS0FBSyxDQUFDLENBQUM7QUFDakksUUFBSSxVQUFVLE1BQU0sS0FBSyxPQUFNLDBCQUEwQixDQUFDLEtBQUssTUFBUSxjQUFjLENBQUMsS0FBSyxHQUFJO0FBQy9GLFFBQUksWUFBWSxRQUFXO0FBQ3pCLFVBQUksUUFBUSxNQUFNLENBQUM7QUFBRyxVQUFJLFFBQVE7QUFBSSxpQkFBVyxLQUFLLE9BQU87QUFBRSxZQUFJLDBCQUEwQixDQUFDLElBQUksT0FBTztBQUFFLGtCQUFRLDBCQUEwQixDQUFDO0FBQUcsa0JBQVE7QUFBQSxRQUFHO0FBQUEsTUFBRTtBQUM5SixnQkFBVTtBQUFPLGlCQUFXLFNBQVMsY0FBYyxxREFBZ0QsWUFBWSxLQUFLLE9BQU8sQ0FBQyxDQUFDO0FBQUEsSUFDL0gsT0FBTztBQUFFLGlCQUFXLFNBQVMsY0FBYyxpQkFBaUIsWUFBWSxLQUFLLE9BQU8sQ0FBQyxDQUFDO0FBQUEsSUFBSTtBQUMxRixlQUFXLGVBQWUsY0FBYyxlQUFlLDBCQUEwQixPQUFPLENBQUMsOEJBQTZCLFdBQU0sTUFBTSxRQUFRLE9BQU8sQ0FBQyxNQUE1QixZQUFpQyxjQUFjLE9BQU8sQ0FBQztBQUM3SyxVQUFNLE1BQU0sU0FBUyxlQUFlLGNBQWMsRUFBRSxXQUFXLElBQUk7QUFDbkUsZUFBVyxTQUFTLE1BQU0sVUFBVTtBQUNwQyxRQUFJLGFBQWMsY0FBYSxRQUFRO0FBQ3ZDLG1CQUFlLElBQUksTUFBTSxLQUFLLEVBQUUsTUFBTSxPQUFPLE1BQU0sRUFBRSxRQUFRLFVBQVUsQ0FBRSxFQUFFLE1BQU0sUUFBUSxPQUFPLHVCQUFvQixNQUFNLE9BQU8sU0FBUyxLQUFLLFNBQVMsTUFBTSxhQUFhLEdBQUcsYUFBYSxFQUFFLEdBQUcsRUFBRSxNQUFNLE9BQU8sT0FBTyxpQ0FBaUMsTUFBTSxPQUFPLFNBQVMsTUFBTSxhQUFhLEVBQUUsQ0FBRSxFQUFFLEdBQUcsU0FBUyxFQUFFLFlBQVksTUFBTSxxQkFBcUIsT0FBTyxRQUFRLEVBQUUsR0FBRyxFQUFFLFVBQVUsUUFBUSxPQUFPLEVBQUUsT0FBTyxVQUFVLEdBQUcsTUFBTSxFQUFFLE9BQU8seUJBQXlCLEVBQUUsR0FBRyxJQUFJLEVBQUUsVUFBVSxTQUFTLE9BQU8sRUFBRSxPQUFPLFVBQVUsR0FBRyxNQUFNLEVBQUUsaUJBQWlCLE1BQU0sRUFBRSxHQUFHLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxVQUFVLEdBQUcsTUFBTSxFQUFFLE9BQU8sd0JBQXdCLEVBQUUsRUFBRSxHQUFHLFNBQVMsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sVUFBVSxFQUFFLEdBQUcsU0FBUyxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsVUFBVSxTQUFTLE1BQU0sQ0FBQyxFQUFFLEtBQUssR0FBRyxFQUFFLEVBQUUsR0FBRyxXQUFXLEVBQUUsVUFBVSxJQUFJLEVBQUUsRUFBRSxDQUFDO0FBQUEsRUFDenhCO0FBR0EsTUFBSTtBQUFKLE1BQWMsY0FBYyxDQUFDO0FBQTdCLE1BQWdDLGNBQWMsQ0FBQztBQUEvQyxNQUFrRCxhQUFhO0FBQS9ELE1BQWtFLGFBQWE7QUFFL0UsaUJBQWUsWUFBWTtBQXhGM0IsUUFBQUEsS0FBQTtBQXlGRSxVQUFNLFNBQVMsQ0FBQyxTQUFTLE9BQU87QUFDaEMsZUFBVyxFQUFFLElBQUksWUFBWSxFQUFFLGFBQWEsTUFBTSxvQkFBb0IsS0FBSyxDQUFDLEVBQUUsUUFBUSxRQUFRLENBQUM7QUFDL0YsVUFBTSxPQUFPLEVBQUUsVUFBVSxzREFBc0QsRUFBRSxTQUFTLElBQUksYUFBYSwwRkFBMEYsQ0FBQztBQUN0TSxTQUFLLE1BQU0sUUFBUTtBQUNuQixRQUFJO0FBQ0YsWUFBTSxNQUFNLE1BQU0sTUFBTSxxREFBcUQ7QUFDN0UsVUFBSSxDQUFDLElBQUksR0FBSSxPQUFNLElBQUksTUFBTSw2QkFBNkI7QUFDMUQsWUFBTSxPQUFPLE1BQU0sSUFBSSxLQUFLO0FBQzVCLFlBQU0sWUFBWSxDQUFDLEtBQUlBLE1BQUEsS0FBSyxVQUFMLGdCQUFBQSxJQUFZLFNBQU0sQ0FBQyxHQUFJLEtBQUksVUFBSyxVQUFMLG1CQUFZLFlBQVMsQ0FBQyxDQUFFO0FBQzFFLFlBQU0sU0FBUyxLQUFLLElBQUksSUFBSSxJQUFFLEtBQUcsS0FBRztBQUNwQyxvQkFBYyxVQUFVLE9BQU8sT0FBTSxFQUFFLE9BQUssT0FBUyxNQUFNO0FBQzNELFVBQUksWUFBWSxXQUFXLEdBQUc7QUFBRSxpQkFBUyxlQUFlLFVBQVUsRUFBRSxZQUFZO0FBQXVFO0FBQUEsTUFBUTtBQUMvSixvQkFBYyxZQUFZLElBQUksT0FBSyxFQUFFLFVBQVUsNkNBQTZDLEVBQUUsSUFBSSw4QkFBOEIsRUFBRSxTQUFTLEtBQUssYUFBYSw2REFBMEQsQ0FBQyxDQUFDO0FBQ3pOLG1CQUFhLFlBQVksU0FBUztBQUNsQyxrQkFBWSxVQUFVLEVBQUUsTUFBTSxRQUFRO0FBQ3RDLDJCQUFxQjtBQUNyQixZQUFNLFVBQVUsU0FBUyxlQUFlLFdBQVc7QUFDbkQsY0FBUSxpQkFBaUIsU0FBUyxXQUFXO0FBQzdDLGVBQVMsZUFBZSxXQUFXLEVBQUUsaUJBQWlCLFNBQVMsTUFBTSxVQUFVLEVBQUUsQ0FBQztBQUNsRixlQUFTLGVBQWUsV0FBVyxFQUFFLGlCQUFpQixTQUFTLE1BQU0sVUFBVSxDQUFDLENBQUM7QUFDakYsa0JBQVk7QUFBQSxJQUNkLFNBQVMsR0FBRztBQUNWLGVBQVMsZUFBZSxVQUFVLEVBQUUsWUFBWSxrREFBa0QsRUFBRSxPQUFPO0FBQUEsSUFDN0c7QUFBQSxFQUNGO0FBRUEsV0FBUyx1QkFBdUI7QUFuSGhDLFFBQUFBO0FBb0hFLFVBQU0sT0FBS0EsTUFBQSxZQUFZLFVBQVUsTUFBdEIsZ0JBQUFBLElBQXlCLFFBQUs7QUFDekMsUUFBSSxDQUFDLEdBQUk7QUFDVCxhQUFTLGVBQWUsV0FBVyxFQUFFLGNBQWMsSUFBSSxLQUFLLGVBQWUsU0FBUyxFQUFFLE1BQU0sV0FBVyxRQUFRLFVBQVUsQ0FBQyxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUFBLEVBQ2pKO0FBRUEsV0FBUyxVQUFVLE1BQU0sR0FBRztBQXpINUIsUUFBQUE7QUEwSEUsUUFBSSxDQUFDLFlBQVksT0FBUTtBQUN6QixLQUFBQSxNQUFBLFlBQVksVUFBVSxNQUF0QixnQkFBQUEsSUFBeUI7QUFDekIsa0JBQWMsYUFBYSxNQUFNLFlBQVksVUFBVSxZQUFZO0FBQ25FLGdCQUFZLFVBQVUsRUFBRSxNQUFNLFFBQVE7QUFDdEMseUJBQXFCO0FBQUEsRUFDdkI7QUFFQSxXQUFTLGNBQWM7QUFDckIsVUFBTSxNQUFNLFNBQVMsZUFBZSxXQUFXO0FBQy9DLFFBQUksWUFBWTtBQUFFLG9CQUFjLFVBQVU7QUFBRyxtQkFBYTtBQUFNLFVBQUksY0FBYztBQUFRO0FBQUEsSUFBUTtBQUNsRyxRQUFJLGNBQWM7QUFDbEIsaUJBQWEsWUFBWSxNQUFNLFVBQVUsQ0FBQyxHQUFHLEdBQUc7QUFBQSxFQUNsRDtBQUdBLGlCQUFlLGFBQWE7QUFDMUIsVUFBTSxLQUFLLFNBQVMsZUFBZSxZQUFZO0FBQy9DLE9BQUcsWUFBWTtBQUNmLE9BQUcsbUJBQW1CLGFBQWEsTUFBTSxLQUFLLEVBQUMsUUFBUSxFQUFDLENBQUMsRUFBRSxJQUFJLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FNNUQsRUFBRSxLQUFLLEVBQUUsQ0FBQztBQUNuQixRQUFJO0FBQ0YsWUFBTSxNQUFNLE1BQU0sTUFBTSxvREFBb0Q7QUFDNUUsVUFBSSxDQUFDLElBQUksR0FBSSxPQUFNLElBQUksTUFBTSxxQkFBcUI7QUFDbEQsWUFBTSxPQUFPLE1BQU0sSUFBSSxLQUFLO0FBQzVCLFlBQU0sUUFBUSxLQUFLLEtBQUssU0FBUyxJQUFJLE9BQUssRUFBRSxJQUFJO0FBQ2hELGVBQVMsZUFBZSxlQUFlLEVBQUUsY0FBYyxXQUFXLElBQUksS0FBSyxlQUFlLFNBQVEsRUFBQyxNQUFLLFdBQVUsUUFBTyxVQUFTLENBQUMsRUFBRSxPQUFPLG9CQUFJLEtBQUssQ0FBQyxDQUFDO0FBQ3ZKLFNBQUcsWUFBWTtBQUNmLGlCQUFXLFFBQVEsT0FBTztBQUN4QixjQUFNLE1BQU0seUJBQXlCLEtBQUssU0FBUztBQUNuRCxjQUFNLFFBQVEsS0FBSyxrQkFBa0IsMEZBQTBGLEtBQUssZUFBZSxZQUFZO0FBQy9KLFlBQUksV0FBVztBQUNmLFlBQUksV0FBVyxLQUFLO0FBQ3BCLFlBQUksS0FBSyxXQUFXLEtBQUssUUFBUSxVQUFVLEtBQUssUUFBUSxPQUFPLFNBQVMsR0FBRztBQUN6RSxnQkFBTSxVQUFVLEtBQUssUUFBUSxPQUFPLENBQUM7QUFDckMsY0FBSSxRQUFRLFlBQVksUUFBUSxTQUFTLEtBQUs7QUFDNUMsdUJBQVcsUUFBUSxTQUFTLElBQUksT0FBTztBQUFBLFVBQ3pDLFdBQVcsUUFBUSxZQUFZLFFBQVEsU0FBUyxLQUFLO0FBQ25ELHVCQUFXLFFBQVEsT0FBTztBQUFBLFVBQzVCLE9BQU87QUFDTCx1QkFBVyxRQUFRLE9BQU87QUFBQSxVQUM1QjtBQUFBLFFBQ0YsV0FBVyxLQUFLLGFBQWEsS0FBSyxjQUFjLFVBQVUsS0FBSyxjQUFjLGFBQWEsS0FBSyxjQUFjLFFBQVE7QUFDbkgscUJBQVcsS0FBSztBQUFBLFFBQ2xCLFdBQVcsS0FBSyxRQUFRLEtBQUssSUFBSSxTQUFTLE1BQU0sS0FBSyxLQUFLLElBQUksU0FBUyxPQUFPLEtBQUssS0FBSyxJQUFJLFNBQVMsTUFBTSxLQUFLLEtBQUssSUFBSSxTQUFTLE1BQU0sSUFBSTtBQUMxSSxxQkFBVyxLQUFLO0FBQUEsUUFDbEI7QUFDQSxZQUFJLFlBQVksU0FBUyxTQUFTLFlBQVksR0FBRztBQUMvQyxxQkFBVyxTQUFTLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFBQSxRQUNsQztBQUNBLFdBQUcsbUJBQW1CLGFBQWE7QUFBQSxrRUFDeUIsR0FBRztBQUFBLFlBQ3pELFdBQVc7QUFBQTtBQUFBLDBCQUVHLFFBQVEsVUFBVSxLQUFLLEtBQUs7QUFBQTtBQUFBLGNBRXhDLEVBQUU7QUFBQSxxREFDcUMsS0FBSyxTQUFTLHdCQUFTLEtBQUssSUFBSSxlQUFlLE9BQU8sQ0FBQztBQUFBLHdEQUNwRCxLQUFLLE1BQU0sUUFBUSxNQUFLLE1BQU0sQ0FBQztBQUFBLHNGQUNELEtBQUssTUFBTSxHQUFHLEtBQUs7QUFBQTtBQUFBLE9BRWxHO0FBQUEsTUFDSDtBQUFBLElBQ0YsU0FBUyxHQUFHO0FBQUUsU0FBRyxZQUFZLHFFQUFxRSxFQUFFLE9BQU87QUFBQSxJQUFVO0FBQUEsRUFDdkg7QUFHQSxpQkFBZSxVQUFVO0FBak16QixRQUFBQTtBQWtNRSxVQUFNLEtBQUssU0FBUyxlQUFlLFNBQVM7QUFDNUMsT0FBRyxZQUFZLE1BQU0sS0FBSyxFQUFDLFFBQVEsRUFBQyxDQUFDLEVBQUUsSUFBSSxNQUFNO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUt4QyxFQUFFLEtBQUssRUFBRTtBQUVsQixRQUFJO0FBQ0YsWUFBTSxNQUFNLE1BQU0sTUFBTSxvRkFBb0Y7QUFDNUcsVUFBSSxDQUFDLElBQUksR0FBSSxPQUFNLElBQUksTUFBTSxzQkFBc0I7QUFDbkQsWUFBTSxPQUFPLE1BQU0sSUFBSSxLQUFLO0FBQzVCLFVBQUksS0FBSyxXQUFXLFFBQVEsQ0FBQyxLQUFLLE9BQU87QUFDdkMsY0FBTSxJQUFJLE1BQU0sNkJBQTZCO0FBQUEsTUFDL0M7QUFDQSxZQUFNLFFBQVEsS0FBSyxNQUFNLE1BQU0sR0FBRyxFQUFFO0FBQ3BDLGVBQVMsZUFBZSxZQUFZLEVBQUUsY0FBYyxXQUFXLElBQUksS0FBSyxlQUFlLFNBQVEsRUFBQyxNQUFLLFdBQVUsUUFBTyxVQUFTLENBQUMsRUFBRSxPQUFPLG9CQUFJLEtBQUssQ0FBQyxDQUFDO0FBQ3BKLFNBQUcsWUFBWTtBQUNmLGlCQUFXLE9BQU8sT0FBTztBQUN2QixjQUFNLElBQUksSUFBSSxLQUFLLElBQUksT0FBTztBQUM5QixjQUFNLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxJQUFJLEtBQUssZUFBZSxTQUFTLEVBQUUsS0FBSSxXQUFXLE9BQU0sU0FBUyxNQUFLLFdBQVcsUUFBTyxVQUFVLENBQUMsRUFBRSxPQUFPLENBQUM7QUFDMUksWUFBSSxPQUFPLElBQUk7QUFDZixZQUFJLEtBQUssU0FBUyxTQUFTLEdBQUc7QUFDNUIsaUJBQU8sS0FBSyxRQUFRLFdBQVcsV0FBVztBQUFBLFFBQzVDO0FBQ0EsWUFBSSxZQUFZLElBQUksZUFBYUEsTUFBQSxJQUFJLGNBQUosZ0JBQUFBLElBQWUsY0FBYTtBQUM3RCxvQkFBWSwwQkFBMEIsU0FBUztBQUMvQyxXQUFHLG1CQUFtQixhQUFhO0FBQUEsa0VBQ3lCLElBQUk7QUFBQTtBQUFBLHdCQUU5QyxTQUFTLFVBQVUsSUFBSSxLQUFLO0FBQUE7QUFBQSxtREFFRCxJQUFJO0FBQUEsd0RBQ0MsSUFBSSxNQUFNLFFBQVEsTUFBSyxNQUFNLENBQUM7QUFBQTtBQUFBLE9BRS9FO0FBQUEsTUFDSDtBQUFBLElBQ0YsU0FBUyxHQUFHO0FBQ1YsVUFBSTtBQUNGLGNBQU0sTUFBTSxNQUFNLE1BQU0sMEVBQTBFO0FBQ2xHLFlBQUksQ0FBQyxJQUFJLEdBQUksT0FBTSxJQUFJLE1BQU0sK0JBQStCO0FBQzVELGNBQU0sT0FBTyxNQUFNLElBQUksS0FBSztBQUM1QixjQUFNLE1BQU0sSUFBSSxVQUFVLEVBQUUsZ0JBQWdCLE1BQU0sVUFBVTtBQUM1RCxjQUFNLFFBQVEsTUFBTSxLQUFLLElBQUksaUJBQWlCLE1BQU0sQ0FBQyxFQUFFLE1BQU0sR0FBRyxFQUFFLEVBQUUsSUFBSSxVQUFLO0FBN09uRixjQUFBQSxLQUFBO0FBNk91RjtBQUFBLFlBQy9FLFNBQU9BLE1BQUEsS0FBSyxjQUFjLE9BQU8sTUFBMUIsZ0JBQUFBLElBQTZCLGdCQUFlO0FBQUEsWUFDbkQsUUFBTSxVQUFLLGNBQWMsTUFBTSxNQUF6QixtQkFBNEIsZ0JBQWU7QUFBQSxZQUNqRCxXQUFTLFVBQUssY0FBYyxTQUFTLE1BQTVCLG1CQUErQixnQkFBZTtBQUFBLFlBQ3ZELGFBQVcsVUFBSyxjQUFjLG1CQUFtQixNQUF0QyxtQkFBeUMsYUFBYSxhQUN2RCxVQUFLLGNBQWMsOEJBQThCLE1BQWpELG1CQUFvRCxhQUFhLGFBQ2pFLFVBQUssY0FBYyw2QkFBNkIsTUFBaEQsbUJBQW1ELGFBQWEsV0FDaEU7QUFBQSxVQUNaO0FBQUEsU0FBRTtBQUNGLGlCQUFTLGVBQWUsWUFBWSxFQUFFLGNBQWMsV0FBVyxJQUFJLEtBQUssZUFBZSxTQUFRLEVBQUMsTUFBSyxXQUFVLFFBQU8sVUFBUyxDQUFDLEVBQUUsT0FBTyxvQkFBSSxLQUFLLENBQUMsQ0FBQztBQUNwSixXQUFHLFlBQVk7QUFDZixtQkFBVyxPQUFPLE9BQU87QUFDdkIsZ0JBQU0sSUFBSSxJQUFJLEtBQUssSUFBSSxPQUFPO0FBQzlCLGdCQUFNLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxJQUFJLEtBQUssZUFBZSxTQUFTLEVBQUUsS0FBSSxXQUFXLE9BQU0sU0FBUyxNQUFLLFdBQVcsUUFBTyxVQUFVLENBQUMsRUFBRSxPQUFPLENBQUM7QUFDMUksY0FBSSxPQUFPLElBQUk7QUFDZixjQUFJLEtBQUssU0FBUyxTQUFTLEdBQUc7QUFDNUIsbUJBQU8sS0FBSyxRQUFRLFdBQVcsV0FBVztBQUFBLFVBQzVDO0FBQ0EsY0FBSSxZQUFZLDBCQUEwQixJQUFJLFNBQVM7QUFDdkQsYUFBRyxtQkFBbUIsYUFBYTtBQUFBLG9FQUN5QixJQUFJO0FBQUE7QUFBQSwwQkFFOUMsU0FBUyxVQUFVLElBQUksS0FBSztBQUFBO0FBQUEscURBRUQsSUFBSTtBQUFBLDBEQUNDLElBQUksTUFBTSxRQUFRLE1BQUssTUFBTSxDQUFDO0FBQUE7QUFBQSxTQUUvRTtBQUFBLFFBQ0g7QUFBQSxNQUNGLFNBQVMsZUFBZTtBQUN0QixXQUFHLFlBQVksa0VBQWtFLEVBQUUsT0FBTywyQkFBMkIsY0FBYyxPQUFPO0FBQUEsTUFDNUk7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUdBLGlCQUFlLFVBQVU7QUFDdkIsYUFBUyxLQUFLLFVBQVUsSUFBSSxTQUFTO0FBQ3JDLFVBQU0sUUFBUSxXQUFXLENBQUMsWUFBWSxHQUFHLFVBQVUsR0FBRyxXQUFXLEdBQUcsUUFBUSxDQUFDLENBQUM7QUFDOUUsYUFBUyxLQUFLLFVBQVUsT0FBTyxTQUFTO0FBQ3hDLFFBQUksT0FBTyxPQUFRLFFBQU8sWUFBWTtBQUFBLEVBQ3hDO0FBRUEsV0FBUyxvQkFBb0I7QUFDM0IsdUJBQW1CO0FBQ25CLGdCQUFZLG9CQUFvQixHQUFJO0FBQUEsRUFDdEM7QUFHQSxXQUFTLGlCQUFpQjtBQUN4QixVQUFNLFVBQVUsU0FBUyxlQUFlLFNBQVM7QUFDakQsVUFBTSxZQUFZLFNBQVMsZUFBZSxXQUFXO0FBQ3JELFVBQU0sV0FBVyxTQUFTLGVBQWUsVUFBVTtBQUNuRCxVQUFNLFdBQVcsU0FBUyxpQkFBaUIsV0FBVztBQUV0RCxhQUFTLFlBQVk7QUFDbkIsWUFBTSxZQUFZLENBQUMsUUFBUSxVQUFVLFNBQVMsbUJBQW1CO0FBQ2pFLFVBQUksV0FBVztBQUNiLGdCQUFRLFVBQVUsSUFBSSxxQkFBcUIsV0FBVztBQUFBLE1BQ3hELE9BQU87QUFDTCxnQkFBUSxVQUFVLE9BQU8scUJBQXFCLFdBQVc7QUFBQSxNQUMzRDtBQUFBLElBQ0Y7QUFFQSxhQUFTLFdBQVc7QUFDbEIsY0FBUSxVQUFVLElBQUkscUJBQXFCLFdBQVc7QUFBQSxJQUN4RDtBQUVBLGFBQVMsc0JBQXNCLEdBQUc7QUFDaEMsUUFBRSxlQUFlO0FBQ2pCLFlBQU0sV0FBVyxLQUFLLGFBQWEsTUFBTSxFQUFFLFVBQVUsQ0FBQztBQUN0RCxZQUFNLGdCQUFnQixTQUFTLGVBQWUsUUFBUTtBQUN0RCxVQUFJLGVBQWU7QUFDakIsY0FBTSxlQUFlLFNBQVMsY0FBYyxRQUFRLEVBQUU7QUFDdEQsY0FBTSxZQUFZLFFBQVE7QUFDMUIsY0FBTSxjQUFjLGVBQWUsWUFBWTtBQUMvQyxjQUFNLGlCQUFpQixjQUFjLFlBQVk7QUFDakQsZUFBTyxTQUFTLEVBQUUsS0FBSyxnQkFBZ0IsVUFBVSxTQUFTLENBQUM7QUFDM0QsWUFBSSxPQUFPLGFBQWEsS0FBSztBQUMzQixtQkFBUztBQUFBLFFBQ1g7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLGNBQVUsaUJBQWlCLFNBQVMsU0FBUztBQUM3QyxhQUFTLGlCQUFpQixTQUFTLFFBQVE7QUFDM0MsYUFBUyxRQUFRLFVBQVEsS0FBSyxpQkFBaUIsU0FBUyxxQkFBcUIsQ0FBQztBQUM5RSxhQUFTLGlCQUFpQixTQUFTLENBQUMsTUFBTTtBQUN4QyxVQUFJLENBQUMsUUFBUSxTQUFTLEVBQUUsTUFBTSxLQUFLLENBQUMsVUFBVSxTQUFTLEVBQUUsTUFBTSxHQUFHO0FBQ2hFLGlCQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0YsQ0FBQztBQUNELGFBQVMsaUJBQWlCLFdBQVcsQ0FBQyxNQUFNO0FBQzFDLFVBQUksRUFBRSxRQUFRLFVBQVU7QUFDdEIsaUJBQVM7QUFBQSxNQUNYO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQTlVQTtBQWdWQSxpQkFBUyxlQUFlLFlBQVksTUFBcEMsbUJBQXVDLGlCQUFpQixTQUFTLE1BQU0sUUFBUTtBQUMvRSxTQUFPLGlCQUFpQixvQkFBb0IsTUFBTTtBQUNoRCxZQUFRO0FBQ1Isc0JBQWtCO0FBQ2xCLG1CQUFlO0FBQUEsRUFDakIsQ0FBQzsiLAogICJuYW1lcyI6IFsiX2EiXQp9Cg==

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
    try {
      const res = await fetch("https://www.reddit.com/r/popular/hot.json?limit=20");
      if (!res.ok) throw new Error("Reddit fetch failed");
      const json = await res.json();
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
            <div class="text-sm text-slate-300/70 article-meta">r/${post.subreddit} \u2022 \u2B06\uFE0E ${post.ups.toLocaleString("en-GB")}</div>
            <h3 class="mt-1 font-semibold leading-snug">${post.title.replace(/</g, "&lt;")}</h3>
            <div class="mt-3 inline-flex items-center text-xs text-slate-300/80 article-meta">by u/${post.author}${flair}</div>
          </a>
          <button class="article-toggle glass px-2 py-1 rounded-md text-xs" type="button" aria-label="Toggle read">${collapsed ? "Mark unread" : "Mark read"}</button>
        </div>
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
    var _a2, _b, _c, _d, _e, _f;
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
      else if (source === "bbc") loadBBC();
    }
    (_a2 = document.getElementById("redditList")) == null ? void 0 : _a2.addEventListener("click", handleToggle);
    (_b = document.getElementById("redditList")) == null ? void 0 : _b.addEventListener("click", handleCardClick);
    (_c = document.getElementById("bbcList")) == null ? void 0 : _c.addEventListener("click", handleToggle);
    (_d = document.getElementById("bbcList")) == null ? void 0 : _d.addEventListener("click", handleCardClick);
    (_e = document.getElementById("readRedditList")) == null ? void 0 : _e.addEventListener("click", handleMarkUnread);
    (_f = document.getElementById("readBbcList")) == null ? void 0 : _f.addEventListener("click", handleMarkUnread);
  }
  function addToReadList(source, item) {
    const target = source === "reddit" ? document.getElementById("readRedditList") : document.getElementById("readBbcList");
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
    const target = source === "reddit" ? document.getElementById("readRedditList") : document.getElementById("readBbcList");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIC0tLS0tLS0tLS0gVXRpbGl0aWVzIC0tLS0tLS0tLS1cbmNvbnN0IGZtdFRpbWUgPSAoaXNvLCB0eiA9ICdFdXJvcGUvTG9uZG9uJywgb3B0cyA9IHt9KSA9PiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcsIGhvdXIxMjogZmFsc2UsIHRpbWVab25lOiB0eiwgLi4ub3B0cyB9KS5mb3JtYXQobmV3IERhdGUoaXNvKSk7XG5jb25zdCBmbXREYXRlVGltZSA9IChpc28sIHR6ID0gJ0V1cm9wZS9Mb25kb24nKSA9PiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IHdlZWtkYXk6ICdzaG9ydCcsIGRheTogJzItZGlnaXQnLCBtb250aDogJ3Nob3J0JywgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JywgaG91cjEyOiBmYWxzZSwgdGltZVpvbmU6IHR6IH0pLmZvcm1hdChuZXcgRGF0ZShpc28pKTtcblxuLy8gU2FmZSBsb2NhbFN0b3JhZ2UgaGVscGVycyB3aXRoIGdyYWNlZnVsIGZhbGxiYWNrXG5jb25zdCBfbWVtb3J5U3RvcmUgPSBuZXcgTWFwKCk7XG5mdW5jdGlvbiBzdG9yYWdlQXZhaWxhYmxlKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHggPSAnX19kYXNoX3Rlc3RfXyc7XG4gICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHgsIHgpO1xuICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh4KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoXykgeyByZXR1cm4gZmFsc2U7IH1cbn1cbmNvbnN0IGNhblBlcnNpc3QgPSBzdG9yYWdlQXZhaWxhYmxlKCk7XG5mdW5jdGlvbiBsb2FkUmVhZFNldChzb3VyY2UpIHtcbiAgY29uc3Qga2V5ID0gYHJlYWQ6JHtzb3VyY2V9YDtcbiAgaWYgKGNhblBlcnNpc3QpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmF3ID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XG4gICAgICByZXR1cm4gbmV3IFNldChyYXcgPyBKU09OLnBhcnNlKHJhdykgOiBbXSk7XG4gICAgfSBjYXRjaCAoXykgeyAvKiBpZ25vcmUgKi8gfVxuICB9XG4gIHJldHVybiBuZXcgU2V0KF9tZW1vcnlTdG9yZS5nZXQoa2V5KSB8fCBbXSk7XG59XG5mdW5jdGlvbiBzYXZlUmVhZFNldChzb3VyY2UsIHNldCkge1xuICBjb25zdCBrZXkgPSBgcmVhZDoke3NvdXJjZX1gO1xuICBjb25zdCBhcnIgPSBBcnJheS5mcm9tKHNldCk7XG4gIGlmIChjYW5QZXJzaXN0KSB7XG4gICAgdHJ5IHsgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkoYXJyKSk7IH0gY2F0Y2ggKF8pIHsgLyogaWdub3JlICovIH1cbiAgfSBlbHNlIHtcbiAgICBfbWVtb3J5U3RvcmUuc2V0KGtleSwgYXJyKTtcbiAgfVxufVxuZnVuY3Rpb24gbWFya1JlYWQoc291cmNlLCBpZCwgaXNSZWFkKSB7XG4gIGNvbnN0IHNldCA9IGxvYWRSZWFkU2V0KHNvdXJjZSk7XG4gIGlmIChpc1JlYWQpIHNldC5hZGQoaWQpOyBlbHNlIHNldC5kZWxldGUoaWQpO1xuICBzYXZlUmVhZFNldChzb3VyY2UsIHNldCk7XG59XG5mdW5jdGlvbiBpc1JlYWQoc291cmNlLCBpZCkge1xuICByZXR1cm4gbG9hZFJlYWRTZXQoc291cmNlKS5oYXMoaWQpO1xufVxuXG4vLyBVcGRhdGUgcGFnZSBoZWFkaW5nIHdpdGggbGl2ZSBkYXRlIGFuZCB0aW1lXG5mdW5jdGlvbiB1cGRhdGVMaXZlRGF0ZVRpbWUoKSB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGRhdGVTdHIgPSBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7XG4gICAgd2Vla2RheTogJ2xvbmcnLFxuICAgIGRheTogJ251bWVyaWMnLFxuICAgIG1vbnRoOiAnbG9uZycsXG4gICAgeWVhcjogJ251bWVyaWMnXG4gIH0pLmZvcm1hdChub3cpO1xuICBjb25zdCB0aW1lU3RyID0gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJywge1xuICAgIGhvdXI6ICcyLWRpZ2l0JyxcbiAgICBtaW51dGU6ICcyLWRpZ2l0JyxcbiAgICBzZWNvbmQ6ICcyLWRpZ2l0JyxcbiAgICBob3VyMTI6IGZhbHNlXG4gIH0pLmZvcm1hdChub3cpO1xuICBjb25zdCBsaXZlRGF0ZVRpbWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXZlRGF0ZVRpbWUnKTtcbiAgaWYgKGxpdmVEYXRlVGltZUVsKSB7XG4gICAgbGl2ZURhdGVUaW1lRWwudGV4dENvbnRlbnQgPSBgJHtkYXRlU3RyfSBhdCAke3RpbWVTdHJ9YDtcbiAgfVxufVxuXG5jb25zdCB3ZWF0aGVyQ29kZU1hcCA9IHsgMDogJ0NsZWFyIHNreScsIDE6ICdNYWlubHkgY2xlYXInLCAyOiAnUGFydGx5IGNsb3VkeScsIDM6ICdPdmVyY2FzdCcsIDQ1OiAnRm9nJywgNDg6ICdEZXBvc2l0aW5nIHJpbWUgZm9nJywgNTE6ICdMaWdodCBkcml6emxlJywgNTM6ICdNb2RlcmF0ZSBkcml6emxlJywgNTU6ICdEZW5zZSBkcml6emxlJywgNTY6ICdMaWdodCBmcmVlemluZyBkcml6emxlJywgNTc6ICdEZW5zZSBmcmVlemluZyBkcml6emxlJywgNjE6ICdTbGlnaHQgcmFpbicsIDYzOiAnTW9kZXJhdGUgcmFpbicsIDY1OiAnSGVhdnkgcmFpbicsIDY2OiAnTGlnaHQgZnJlZXppbmcgcmFpbicsIDY3OiAnSGVhdnkgZnJlZXppbmcgcmFpbicsIDcxOiAnU2xpZ2h0IHNub3cnLCA3MzogJ01vZGVyYXRlIHNub3cnLCA3NTogJ0hlYXZ5IHNub3cnLCA3NzogJ1Nub3cgZ3JhaW5zJywgODA6ICdSYWluIHNob3dlcnM6IHNsaWdodCcsIDgxOiAnUmFpbiBzaG93ZXJzOiBtb2RlcmF0ZScsIDgyOiAnUmFpbiBzaG93ZXJzOiB2aW9sZW50JywgODU6ICdTbm93IHNob3dlcnM6IHNsaWdodCcsIDg2OiAnU25vdyBzaG93ZXJzOiBoZWF2eScsIDk1OiAnVGh1bmRlcnN0b3JtJywgOTY6ICdUaHVuZGVyc3Rvcm0gd2l0aCBzbGlnaHQgaGFpbCcsIDk5OiAnVGh1bmRlcnN0b3JtIHdpdGggaGVhdnkgaGFpbCcgfTtcblxuLy8gRnVuY3Rpb24gdG8gdXBncmFkZSBCQkMgaW1hZ2UgcmVzb2x1dGlvblxuZnVuY3Rpb24gdXBncmFkZUJCQ0ltYWdlUmVzb2x1dGlvbihpbWFnZVVybCkge1xuICBpZiAoIWltYWdlVXJsIHx8ICFpbWFnZVVybC5pbmNsdWRlcygnaWNoZWYuYmJjaS5jby51aycpKSByZXR1cm4gaW1hZ2VVcmw7XG5cbiAgY29uc3Qgc2l6ZVVwZ3JhZGVzID0ge1xuICAgICcvMTIwLyc6ICcvNTEyLycsXG4gICAgJy8yNDAvJzogJy81MTIvJyxcbiAgICAnLzQ4MC8nOiAnLzUxMi8nLFxuICAgICcvNjQwLyc6ICcvODAwLycsXG4gICAgJy84MDAvJzogJy8xMDI0LydcbiAgfTtcblxuICBmb3IgKGNvbnN0IFtzbWFsbFNpemUsIGxhcmdlU2l6ZV0gb2YgT2JqZWN0LmVudHJpZXMoc2l6ZVVwZ3JhZGVzKSkge1xuICAgIGlmIChpbWFnZVVybC5pbmNsdWRlcyhzbWFsbFNpemUpKSB7XG4gICAgICByZXR1cm4gaW1hZ2VVcmwucmVwbGFjZShzbWFsbFNpemUsIGxhcmdlU2l6ZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGltYWdlVXJsO1xufVxuXG4vLyAtLS0tLS0tLS0tIFdlYXRoZXIgKE9wZW5cdTIwMTFNZXRlbykgLS0tLS0tLS0tLVxuY29uc3QgV0VBVEhFUl9FTCA9IHsgdXBkYXRlZDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dlYXRoZXJVcGRhdGVkJyksIHNrZWxldG9uOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2VhdGhlclNrZWxldG9uJyksIGN1cnJlbnRUZW1wOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VycmVudFRlbXAnKSwgdGVtcFJhbmdlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGVtcFJhbmdlJyksIGF2Z1JhaW46IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdmdSYWluJyksIGNvbmRpdGlvbk5vdzogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmRpdGlvbk5vdycpLCBuZXh0UmFpbjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25leHRSYWluJyksIG5leHRSYWluRGV0YWlsOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV4dFJhaW5EZXRhaWwnKSB9O1xuXG5sZXQgd2VhdGhlckNoYXJ0O1xuYXN5bmMgZnVuY3Rpb24gbG9hZFdlYXRoZXIoKSB7XG4gIGNvbnN0IGxhdCA9IDU0Ljk3ODMsIGxvbiA9IC0xLjYxNzg7IC8vIE5ld2Nhc3RsZSB1cG9uIFR5bmVcbiAgY29uc3QgdXJsID0gYGh0dHBzOi8vYXBpLm9wZW4tbWV0ZW8uY29tL3YxL2ZvcmVjYXN0P2xhdGl0dWRlPSR7bGF0fSZsb25naXR1ZGU9JHtsb259JmhvdXJseT10ZW1wZXJhdHVyZV8ybSxwcmVjaXBpdGF0aW9uX3Byb2JhYmlsaXR5LHByZWNpcGl0YXRpb24sd2VhdGhlcmNvZGUmdGltZXpvbmU9RXVyb3BlJTJGTG9uZG9uJmZvcmVjYXN0X2RheXM9MmA7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ1dlYXRoZXIgZmV0Y2ggZmFpbGVkJyk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICBjb25zdCB7IHRpbWUsIHRlbXBlcmF0dXJlXzJtLCBwcmVjaXBpdGF0aW9uX3Byb2JhYmlsaXR5LCBwcmVjaXBpdGF0aW9uLCB3ZWF0aGVyY29kZSB9ID0gZGF0YS5ob3VybHk7XG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gIGxldCBzdGFydElkeCA9IHRpbWUuZmluZEluZGV4KHQgPT4gbmV3IERhdGUodCkuZ2V0VGltZSgpID49IG5vdyk7XG4gIGlmIChzdGFydElkeCA9PT0gLTEpIHN0YXJ0SWR4ID0gMDtcbiAgY29uc3QgcmFuZ2UgPSBbLi4uQXJyYXkoMjQpXS5tYXAoKF8sIGkpID0+IHN0YXJ0SWR4ICsgaSkuZmlsdGVyKGkgPT4gaSA8IHRpbWUubGVuZ3RoKTtcbiAgY29uc3QgbGFiZWxzID0gcmFuZ2UubWFwKGkgPT4gZm10VGltZSh0aW1lW2ldKSk7XG4gIGNvbnN0IHRlbXBzID0gcmFuZ2UubWFwKGkgPT4gdGVtcGVyYXR1cmVfMm1baV0pO1xuICBjb25zdCBwcm9icyA9IHJhbmdlLm1hcChpID0+IHByZWNpcGl0YXRpb25fcHJvYmFiaWxpdHlbaV0pO1xuICBjb25zdCBwcmVjcyA9IHJhbmdlLm1hcChpID0+IHByZWNpcGl0YXRpb25baV0pO1xuICBjb25zdCBub3dDb2RlID0gd2VhdGhlcmNvZGVbc3RhcnRJZHhdO1xuICBXRUFUSEVSX0VMLmN1cnJlbnRUZW1wLnRleHRDb250ZW50ID0gYCR7TWF0aC5yb3VuZCh0ZW1wZXJhdHVyZV8ybVtzdGFydElkeF0gPz8gdGVtcGVyYXR1cmVfMm0uYXQoMCkpfVx1MDBCMENgO1xuICBXRUFUSEVSX0VMLnRlbXBSYW5nZS50ZXh0Q29udGVudCA9IGAke01hdGgucm91bmQoTWF0aC5taW4oLi4udGVtcHMpKX1cdTAwQjBDIFx1MjE5MiAke01hdGgucm91bmQoTWF0aC5tYXgoLi4udGVtcHMpKX1cdTAwQjBDYDtcbiAgV0VBVEhFUl9FTC5hdmdSYWluLnRleHRDb250ZW50ID0gYCR7TWF0aC5yb3VuZChwcm9icy5yZWR1Y2UoKGEsYik9PmErYiwwKSAvIHByb2JzLmxlbmd0aCl9JWA7XG4gIFdFQVRIRVJfRUwuY29uZGl0aW9uTm93LnRleHRDb250ZW50ID0gd2VhdGhlckNvZGVNYXBbbm93Q29kZV0gfHwgJ1x1MjAxNCc7XG4gIFdFQVRIRVJfRUwudXBkYXRlZC50ZXh0Q29udGVudCA9IGBVcGRhdGVkICR7bmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJyx7aG91cjonMi1kaWdpdCcsbWludXRlOicyLWRpZ2l0J30pLmZvcm1hdChuZXcgRGF0ZSgpKX1gO1xuICBsZXQgbmV4dElkeCA9IHJhbmdlLmZpbmQoaSA9PiAocHJlY2lwaXRhdGlvbl9wcm9iYWJpbGl0eVtpXSA+PSA1MCkgfHwgKHByZWNpcGl0YXRpb25baV0gPj0gMC4yKSk7XG4gIGlmIChuZXh0SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICBsZXQgYmVzdEkgPSByYW5nZVswXTsgbGV0IGJlc3RQID0gLTE7IGZvciAoY29uc3QgaSBvZiByYW5nZSkgeyBpZiAocHJlY2lwaXRhdGlvbl9wcm9iYWJpbGl0eVtpXSA+IGJlc3RQKSB7IGJlc3RQID0gcHJlY2lwaXRhdGlvbl9wcm9iYWJpbGl0eVtpXTsgYmVzdEkgPSBpOyB9IH1cbiAgICBuZXh0SWR4ID0gYmVzdEk7IFdFQVRIRVJfRUwubmV4dFJhaW4udGV4dENvbnRlbnQgPSBgTm8gaGlnaCBjaGFuY2Ugc29vbiBcdTIwMTQgaGlnaGVzdCBpbiBuZXh0IDI0aCBhdCAke2ZtdERhdGVUaW1lKHRpbWVbbmV4dElkeF0pfWA7XG4gIH0gZWxzZSB7IFdFQVRIRVJfRUwubmV4dFJhaW4udGV4dENvbnRlbnQgPSBgTGlrZWx5IGFyb3VuZCAke2ZtdERhdGVUaW1lKHRpbWVbbmV4dElkeF0pfWA7IH1cbiAgV0VBVEhFUl9FTC5uZXh0UmFpbkRldGFpbC50ZXh0Q29udGVudCA9IGBQcm9iYWJpbGl0eSAke3ByZWNpcGl0YXRpb25fcHJvYmFiaWxpdHlbbmV4dElkeF19JSwgZXhwZWN0ZWQgcHJlY2lwaXRhdGlvbiAke3ByZWNzW3JhbmdlLmluZGV4T2YobmV4dElkeCldID8/IHByZWNpcGl0YXRpb25bbmV4dElkeF19IG1tLmA7XG4gIGNvbnN0IGN0eCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3ZWF0aGVyQ2hhcnQnKS5nZXRDb250ZXh0KCcyZCcpO1xuICBXRUFUSEVSX0VMLnNrZWxldG9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGlmICh3ZWF0aGVyQ2hhcnQpIHdlYXRoZXJDaGFydC5kZXN0cm95KCk7XG4gIHdlYXRoZXJDaGFydCA9IG5ldyBDaGFydChjdHgsIHsgdHlwZTogJ2JhcicsIGRhdGE6IHsgbGFiZWxzLCBkYXRhc2V0czogWyB7IHR5cGU6ICdsaW5lJywgbGFiZWw6ICdUZW1wZXJhdHVyZSAoXHUwMEIwQyknLCBkYXRhOiB0ZW1wcywgeUF4aXNJRDogJ3knLCB0ZW5zaW9uOiAwLjM1LCBib3JkZXJXaWR0aDogMiwgcG9pbnRSYWRpdXM6IDAgfSwgeyB0eXBlOiAnYmFyJywgbGFiZWw6ICdQcmVjaXBpdGF0aW9uIFByb2JhYmlsaXR5ICglKScsIGRhdGE6IHByb2JzLCB5QXhpc0lEOiAneTEnLCBib3JkZXJXaWR0aDogMCB9IF0gfSwgb3B0aW9uczogeyByZXNwb25zaXZlOiB0cnVlLCBtYWludGFpbkFzcGVjdFJhdGlvOiBmYWxzZSwgc2NhbGVzOiB7IHk6IHsgcG9zaXRpb246ICdsZWZ0JywgdGlja3M6IHsgY29sb3I6ICcjY2JkNWUxJyB9LCBncmlkOiB7IGNvbG9yOiAncmdiYSgxNDgsMTYzLDE4NCwwLjE1KScgfSB9LCB5MTogeyBwb3NpdGlvbjogJ3JpZ2h0JywgdGlja3M6IHsgY29sb3I6ICcjY2JkNWUxJyB9LCBncmlkOiB7IGRyYXdPbkNoYXJ0QXJlYTogZmFsc2UgfSB9LCB4OiB7IHRpY2tzOiB7IGNvbG9yOiAnI2NiZDVlMScgfSwgZ3JpZDogeyBjb2xvcjogJ3JnYmEoMTQ4LDE2MywxODQsMC4xKScgfSB9IH0sIHBsdWdpbnM6IHsgbGVnZW5kOiB7IGxhYmVsczogeyBjb2xvcjogJyNlMmU4ZjAnIH0gfSwgdG9vbHRpcDogeyBjYWxsYmFja3M6IHsgdGl0bGU6IChpdGVtcykgPT4gYEhvdXI6ICR7aXRlbXNbMF0ubGFiZWx9YCB9IH0gfSwgYW5pbWF0aW9uOiB7IGR1cmF0aW9uOiA5MDAgfSB9IH0pO1xufVxuXG4vLyAtLS0tLS0tLS0tIFJhZGFyIChSYWluVmlld2VyIG92ZXIgTGVhZmxldCkgLS0tLS0tLS0tLVxubGV0IHJhZGFyTWFwLCByYWRhckZyYW1lcyA9IFtdLCByYWRhckxheWVycyA9IFtdLCByYWRhckluZGV4ID0gMCwgcmFkYXJUaW1lciA9IG51bGw7XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRSYWRhcigpIHtcbiAgY29uc3QgY2VudGVyID0gWzU0Ljk3ODMsIC0xLjYxNzhdOyAvLyBOZXdjYXN0bGUgdXBvbiBUeW5lXG4gIHJhZGFyTWFwID0gTC5tYXAoJ3JhZGFyTWFwJywgeyB6b29tQ29udHJvbDogdHJ1ZSwgYXR0cmlidXRpb25Db250cm9sOiB0cnVlIH0pLnNldFZpZXcoY2VudGVyLCA3KTtcbiAgY29uc3QgYmFzZSA9IEwudGlsZUxheWVyKCdodHRwczovL3tzfS50aWxlLm9wZW5zdHJlZXRtYXAub3JnL3t6fS97eH0ve3l9LnBuZycsIHsgbWF4Wm9vbTogMTgsIGF0dHJpYnV0aW9uOiAnJmNvcHk7IDxhIGhyZWY9XCJodHRwczovL3d3dy5vcGVuc3RyZWV0bWFwLm9yZy9jb3B5cmlnaHRcIj5PcGVuU3RyZWV0TWFwPC9hPiBjb250cmlidXRvcnMnIH0pO1xuICBiYXNlLmFkZFRvKHJhZGFyTWFwKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkucmFpbnZpZXdlci5jb20vcHVibGljL3dlYXRoZXItbWFwcy5qc29uJyk7XG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcignUmFkYXIgbWV0YWRhdGEgZmV0Y2ggZmFpbGVkJyk7XG4gICAgY29uc3QganNvbiA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgY29uc3QgYWxsRnJhbWVzID0gWy4uLihqc29uLnJhZGFyPy5wYXN0fHxbXSksIC4uLihqc29uLnJhZGFyPy5ub3djYXN0fHxbXSldO1xuICAgIGNvbnN0IGN1dG9mZiA9IERhdGUubm93KCkgLSA0KjYwKjYwKjEwMDA7IC8vIGxhc3QgNCBob3Vyc1xuICAgIHJhZGFyRnJhbWVzID0gYWxsRnJhbWVzLmZpbHRlcihmID0+IChmLnRpbWUqMTAwMCkgPj0gY3V0b2ZmKTtcbiAgICBpZiAocmFkYXJGcmFtZXMubGVuZ3RoID09PSAwKSB7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhck1hcCcpLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicC0zIHRleHQtc21cIj5ObyByYWRhciBmcmFtZXMgYXZhaWxhYmxlIHJpZ2h0IG5vdy48L2Rpdj4nOyByZXR1cm47IH1cbiAgICByYWRhckxheWVycyA9IHJhZGFyRnJhbWVzLm1hcChmID0+IEwudGlsZUxheWVyKGBodHRwczovL3RpbGVjYWNoZS5yYWludmlld2VyLmNvbS92Mi9yYWRhci8ke2YudGltZX0vMjU2L3t6fS97eH0ve3l9LzIvMV8xLnBuZ2AsIHsgb3BhY2l0eTogMC43LCBhdHRyaWJ1dGlvbjogJ1JhZGFyIFx1MDBBOSA8YSBocmVmPVwiaHR0cHM6Ly9yYWludmlld2VyLmNvbVwiPlJhaW5WaWV3ZXI8L2E+JyB9KSk7XG4gICAgcmFkYXJJbmRleCA9IHJhZGFyTGF5ZXJzLmxlbmd0aCAtIDE7XG4gICAgcmFkYXJMYXllcnNbcmFkYXJJbmRleF0uYWRkVG8ocmFkYXJNYXApO1xuICAgIHVwZGF0ZVJhZGFyVGltZUxhYmVsKCk7XG4gICAgY29uc3QgcGxheUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhclBsYXknKTtcbiAgICBwbGF5QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdG9nZ2xlUmFkYXIpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhclByZXYnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHN0ZXBSYWRhcigtMSkpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhck5leHQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHN0ZXBSYWRhcigxKSk7XG4gICAgdG9nZ2xlUmFkYXIoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhck1hcCcpLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwicC0zIHRleHQtc21cIj5GYWlsZWQgdG8gbG9hZCByYWRhci4gJHtlLm1lc3NhZ2V9PC9kaXY+YDtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVSYWRhclRpbWVMYWJlbCgpIHtcbiAgY29uc3QgdHMgPSByYWRhckZyYW1lc1tyYWRhckluZGV4XT8udGltZSoxMDAwO1xuICBpZiAoIXRzKSByZXR1cm47XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhclRpbWUnKS50ZXh0Q29udGVudCA9IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicsIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KS5mb3JtYXQobmV3IERhdGUodHMpKTtcbn1cblxuZnVuY3Rpb24gc3RlcFJhZGFyKGRpciA9IDEpIHtcbiAgaWYgKCFyYWRhckxheWVycy5sZW5ndGgpIHJldHVybjtcbiAgcmFkYXJMYXllcnNbcmFkYXJJbmRleF0/LnJlbW92ZSgpO1xuICByYWRhckluZGV4ID0gKHJhZGFySW5kZXggKyBkaXIgKyByYWRhckxheWVycy5sZW5ndGgpICUgcmFkYXJMYXllcnMubGVuZ3RoO1xuICByYWRhckxheWVyc1tyYWRhckluZGV4XS5hZGRUbyhyYWRhck1hcCk7XG4gIHVwZGF0ZVJhZGFyVGltZUxhYmVsKCk7XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZVJhZGFyKCkge1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmFkYXJQbGF5Jyk7XG4gIGlmIChyYWRhclRpbWVyKSB7IGNsZWFySW50ZXJ2YWwocmFkYXJUaW1lcik7IHJhZGFyVGltZXIgPSBudWxsOyBidG4udGV4dENvbnRlbnQgPSAnUGxheSc7IHJldHVybjsgfVxuICBidG4udGV4dENvbnRlbnQgPSAnUGF1c2UnO1xuICByYWRhclRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4gc3RlcFJhZGFyKDEpLCA2MDApO1xufVxuXG4vLyAtLS0tLS0tLS0tIFJlZGRpdCBQb3B1bGFyIEhvdCAyMCAtLS0tLS0tLS0tXG5hc3luYyBmdW5jdGlvbiBsb2FkUmVkZGl0KCkge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWRkaXRMaXN0Jyk7XG4gIGVsLmlubmVySFRNTCA9ICcnO1xuICBlbC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIEFycmF5LmZyb20oe2xlbmd0aDogOH0pLm1hcCgoKSA9PiBgXG4gICAgPGRpdiBjbGFzcz1cImdsYXNzIHJvdW5kZWQtMnhsIHAtNCBjYXJkLWhvdmVyXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiaC0zMiB3LWZ1bGwgcm91bmRlZC1sZyBza2VsZXRvbiBhbmltYXRlLXNoaW1tZXIgbWItM1wiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImgtNSB3LTMvNCByb3VuZGVkLW1kIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lclwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm10LTMgaC00IHctMS8yIHJvdW5kZWQtbWQgc2tlbGV0b24gYW5pbWF0ZS1zaGltbWVyXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibXQtMyBoLTggdy0yNCByb3VuZGVkLWxnIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lclwiPjwvZGl2PlxuICAgIDwvZGl2PmApLmpvaW4oJycpKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly93d3cucmVkZGl0LmNvbS9yL3BvcHVsYXIvaG90Lmpzb24/bGltaXQ9MjAnKTtcbiAgICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKCdSZWRkaXQgZmV0Y2ggZmFpbGVkJyk7XG4gICAgY29uc3QganNvbiA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgY29uc3QgaXRlbXMgPSBqc29uLmRhdGEuY2hpbGRyZW4ubWFwKGMgPT4gYy5kYXRhKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVkZGl0VXBkYXRlZCcpLnRleHRDb250ZW50ID0gYFVwZGF0ZWQgJHtuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLHtob3VyOicyLWRpZ2l0JyxtaW51dGU6JzItZGlnaXQnfSkuZm9ybWF0KG5ldyBEYXRlKCkpfWA7XG4gICAgZWwuaW5uZXJIVE1MID0gJyc7XG4gICAgZm9yIChjb25zdCBwb3N0IG9mIGl0ZW1zKSB7XG4gICAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly93d3cucmVkZGl0LmNvbSR7cG9zdC5wZXJtYWxpbmt9YDtcbiAgICAgIGNvbnN0IGlkID0gcG9zdC5pZCB8fCBwb3N0LnBlcm1hbGluaztcbiAgICAgIGNvbnN0IGZsYWlyID0gcG9zdC5saW5rX2ZsYWlyX3RleHQgPyBgPHNwYW4gY2xhc3M9J21sLTIgdGV4dC14cyBweC0xLjUgcHktMC41IHJvdW5kZWQtbWQgYmctd2hpdGUvMTAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCc+JHtwb3N0LmxpbmtfZmxhaXJfdGV4dH08L3NwYW4+YCA6ICcnO1xuICAgICAgbGV0IGltYWdlVXJsID0gbnVsbDtcbiAgICAgIGxldCBpbWFnZUFsdCA9IHBvc3QudGl0bGU7XG4gICAgICBpZiAocG9zdC5wcmV2aWV3ICYmIHBvc3QucHJldmlldy5pbWFnZXMgJiYgcG9zdC5wcmV2aWV3LmltYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IHByZXZpZXcgPSBwb3N0LnByZXZpZXcuaW1hZ2VzWzBdO1xuICAgICAgICBpZiAocHJldmlldy52YXJpYW50cyAmJiBwcmV2aWV3LnZhcmlhbnRzLmdpZikge1xuICAgICAgICAgIGltYWdlVXJsID0gcHJldmlldy52YXJpYW50cy5naWYuc291cmNlLnVybDtcbiAgICAgICAgfSBlbHNlIGlmIChwcmV2aWV3LnZhcmlhbnRzICYmIHByZXZpZXcudmFyaWFudHMubXA0KSB7XG4gICAgICAgICAgaW1hZ2VVcmwgPSBwcmV2aWV3LnNvdXJjZS51cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW1hZ2VVcmwgPSBwcmV2aWV3LnNvdXJjZS51cmw7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAocG9zdC50aHVtYm5haWwgJiYgcG9zdC50aHVtYm5haWwgIT09ICdzZWxmJyAmJiBwb3N0LnRodW1ibmFpbCAhPT0gJ2RlZmF1bHQnICYmIHBvc3QudGh1bWJuYWlsICE9PSAnbnNmdycpIHtcbiAgICAgICAgaW1hZ2VVcmwgPSBwb3N0LnRodW1ibmFpbDtcbiAgICAgIH0gZWxzZSBpZiAocG9zdC51cmwgJiYgKHBvc3QudXJsLmluY2x1ZGVzKCcuanBnJykgfHwgcG9zdC51cmwuaW5jbHVkZXMoJy5qcGVnJykgfHwgcG9zdC51cmwuaW5jbHVkZXMoJy5wbmcnKSB8fCBwb3N0LnVybC5pbmNsdWRlcygnLmdpZicpKSkge1xuICAgICAgICBpbWFnZVVybCA9IHBvc3QudXJsO1xuICAgICAgfVxuICAgICAgaWYgKGltYWdlVXJsICYmIGltYWdlVXJsLmluY2x1ZGVzKCdyZWRkaXQuY29tJykpIHtcbiAgICAgICAgaW1hZ2VVcmwgPSBpbWFnZVVybC5zcGxpdCgnPycpWzBdO1xuICAgICAgfVxuICAgICAgY29uc3QgY29sbGFwc2VkID0gaXNSZWFkKCdyZWRkaXQnLCBpZCk7XG4gICAgICBpZiAoY29sbGFwc2VkKSB7IGFkZFRvUmVhZExpc3QoJ3JlZGRpdCcsIHsgaWQsIHRpdGxlOiBwb3N0LnRpdGxlLCBocmVmOiB1cmwgfSk7IGNvbnRpbnVlOyB9XG4gICAgICBlbC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIGBcbiAgICAgICAgPGRpdiBjbGFzcz1cImFydGljbGUgZ2xhc3Mgcm91bmRlZC0yeGwgcC00IGNhcmQtaG92ZXIke2NvbGxhcHNlZCA/ICcgY29sbGFwc2VkJyA6ICcnfVwiIGRhdGEtc291cmNlPVwicmVkZGl0XCIgZGF0YS1pZD1cIiR7aWR9XCIgZGF0YS11cmw9XCIke3VybH1cIj5cbiAgICAgICAgICA8YSBjbGFzcz1cImFydGljbGUtbGluayBibG9ja1wiIGhyZWY9XCIke3VybH1cIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAke2ltYWdlVXJsID8gYFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaC0zMiB3LWZ1bGwgcm91bmRlZC1sZyBvdmVyZmxvdy1oaWRkZW4gbWItMyBiZy1zbGF0ZS04MDAvNTBcIj5cbiAgICAgICAgICAgICAgICA8aW1nIHNyYz1cIiR7aW1hZ2VVcmx9XCIgYWx0PVwiJHtwb3N0LnRpdGxlfVwiIGNsYXNzPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXIgYXJ0aWNsZS1pbWFnZVwiIGxvYWRpbmc9XCJsYXp5XCIgb25lcnJvcj1cInRoaXMuc3R5bGUuZGlzcGxheT0nbm9uZSc7IHRoaXMucGFyZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdiZy1zbGF0ZS04MDAvNTAnKTtcIj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBgIDogJyd9XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGV4dC1zbSB0ZXh0LXNsYXRlLTMwMC83MCBhcnRpY2xlLW1ldGFcIj5yLyR7cG9zdC5zdWJyZWRkaXR9IFx1MjAyMiBcdTJCMDZcdUZFMEUgJHtwb3N0LnVwcy50b0xvY2FsZVN0cmluZygnZW4tR0InKX08L2Rpdj5cbiAgICAgICAgICAgIDxoMyBjbGFzcz1cIm10LTEgZm9udC1zZW1pYm9sZCBsZWFkaW5nLXNudWdcIj4ke3Bvc3QudGl0bGUucmVwbGFjZSgvPC9nLCcmbHQ7Jyl9PC9oMz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtdC0zIGlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciB0ZXh0LXhzIHRleHQtc2xhdGUtMzAwLzgwIGFydGljbGUtbWV0YVwiPmJ5IHUvJHtwb3N0LmF1dGhvcn0ke2ZsYWlyfTwvZGl2PlxuICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwiYXJ0aWNsZS10b2dnbGUgZ2xhc3MgcHgtMiBweS0xIHJvdW5kZWQtbWQgdGV4dC14c1wiIHR5cGU9XCJidXR0b25cIiBhcmlhLWxhYmVsPVwiVG9nZ2xlIHJlYWRcIj4ke2NvbGxhcHNlZCA/ICdNYXJrIHVucmVhZCcgOiAnTWFyayByZWFkJ308L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHsgZWwuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJnbGFzcyByb3VuZGVkLTJ4bCBwLTQgdGV4dC1zbVwiPkZhaWxlZCB0byBsb2FkIFJlZGRpdC4gJHtlLm1lc3NhZ2V9PC9kaXY+YDsgfVxufVxuXG4vLyAtLS0tLS0tLS0tIEJCQyBMYXRlc3QgdmlhIFJTUyAoQ09SU1x1MjAxMWZyaWVuZGx5IHJlYWRlcikgLS0tLS0tLS0tLVxuYXN5bmMgZnVuY3Rpb24gbG9hZEJCQygpIHtcbiAgY29uc3QgZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmJjTGlzdCcpO1xuICBlbC5pbm5lckhUTUwgPSBBcnJheS5mcm9tKHtsZW5ndGg6IDZ9KS5tYXAoKCkgPT4gYFxuICAgIDxkaXYgY2xhc3M9XCJnbGFzcyByb3VuZGVkLTJ4bCBwLTQgY2FyZC1ob3ZlclwiPlxuICAgICAgPGRpdiBjbGFzcz1cImgtMzIgdy1mdWxsIHJvdW5kZWQtbGcgc2tlbGV0b24gYW5pbWF0ZS1zaGltbWVyIG1iLTNcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJoLTUgdy0yLzMgcm91bmRlZC1tZCBza2VsZXRvbiBhbmltYXRlLXNoaW1tZXJcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtdC0zIGgtNCB3LTEvMiByb3VuZGVkLW1kIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lclwiPjwvZGl2PlxuICAgIDwvZGl2PmApLmpvaW4oJycpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLnJzczJqc29uLmNvbS92MS9hcGkuanNvbj9yc3NfdXJsPWh0dHBzOi8vZmVlZHMuYmJjaS5jby51ay9uZXdzL3Jzcy54bWwnKTtcbiAgICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKCdCQkMgUlNTIGZldGNoIGZhaWxlZCcpO1xuICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXMuanNvbigpO1xuICAgIGlmIChqc29uLnN0YXR1cyAhPT0gJ29rJyB8fCAhanNvbi5pdGVtcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFJTUyByZXNwb25zZSBmb3JtYXQnKTtcbiAgICB9XG4gICAgY29uc3QgaXRlbXMgPSBqc29uLml0ZW1zLnNsaWNlKDAsIDEwKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmJjVXBkYXRlZCcpLnRleHRDb250ZW50ID0gYFVwZGF0ZWQgJHtuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLHtob3VyOicyLWRpZ2l0JyxtaW51dGU6JzItZGlnaXQnfSkuZm9ybWF0KG5ldyBEYXRlKCkpfWA7XG4gICAgZWwuaW5uZXJIVE1MID0gJyc7XG4gICAgZm9yIChjb25zdCBhcnQgb2YgaXRlbXMpIHtcbiAgICAgIGNvbnN0IHQgPSBuZXcgRGF0ZShhcnQucHViRGF0ZSk7XG4gICAgICBjb25zdCB3aGVuID0gaXNOYU4odCkgPyAnJyA6IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicsIHsgZGF5OicyLWRpZ2l0JywgbW9udGg6J3Nob3J0JywgaG91cjonMi1kaWdpdCcsIG1pbnV0ZTonMi1kaWdpdCcgfSkuZm9ybWF0KHQpO1xuICAgICAgbGV0IGxpbmsgPSBhcnQubGluaztcbiAgICAgIGNvbnN0IGlkID0gbGluayB8fCBhcnQuZ3VpZCB8fCBhcnQudGl0bGU7XG4gICAgICBpZiAobGluay5pbmNsdWRlcygnYmJjLmNvbScpKSB7XG4gICAgICAgIGxpbmsgPSBsaW5rLnJlcGxhY2UoJ2JiYy5jb20nLCAnYmJjLmNvLnVrJyk7XG4gICAgICB9XG4gICAgICBsZXQgdGh1bWJuYWlsID0gYXJ0LnRodW1ibmFpbCB8fCBhcnQuZW5jbG9zdXJlPy50aHVtYm5haWwgfHwgJ2h0dHBzOi8vbmV3cy5iYmNpbWcuY28udWsvbm9sL3NoYXJlZC9pbWcvYmJjX25ld3NfMTIweDYwLmdpZic7XG4gICAgICB0aHVtYm5haWwgPSB1cGdyYWRlQkJDSW1hZ2VSZXNvbHV0aW9uKHRodW1ibmFpbCk7XG4gICAgICBjb25zdCBjb2xsYXBzZWQgPSBpc1JlYWQoJ2JiYycsIGlkKTtcbiAgICAgIGlmIChjb2xsYXBzZWQpIHsgYWRkVG9SZWFkTGlzdCgnYmJjJywgeyBpZCwgdGl0bGU6IGFydC50aXRsZSwgaHJlZjogbGluayB9KTsgY29udGludWU7IH1cbiAgICAgIGVsLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgYFxuICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aWNsZSBnbGFzcyByb3VuZGVkLTJ4bCBwLTQgY2FyZC1ob3ZlciR7Y29sbGFwc2VkID8gJyBjb2xsYXBzZWQnIDogJyd9XCIgZGF0YS1zb3VyY2U9XCJiYmNcIiBkYXRhLWlkPVwiJHtpZH1cIiBkYXRhLXVybD1cIiR7bGlua31cIj5cbiAgICAgICAgICA8YSBjbGFzcz1cImFydGljbGUtbGluayBibG9ja1wiIGhyZWY9XCIke2xpbmt9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImgtMzIgdy1mdWxsIHJvdW5kZWQtbGcgb3ZlcmZsb3ctaGlkZGVuIG1iLTMgYmctc2xhdGUtODAwLzUwXCI+XG4gICAgICAgICAgICAgIDxpbWcgc3JjPVwiJHt0aHVtYm5haWx9XCIgYWx0PVwiJHthcnQudGl0bGV9XCIgY2xhc3M9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBhcnRpY2xlLWltYWdlXCIgbG9hZGluZz1cImxhenlcIiBvbmVycm9yPVwidGhpcy5zdHlsZS5kaXNwbGF5PSdub25lJzsgdGhpcy5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2JnLXNsYXRlLTgwMC81MCcpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGV4dC1zbSB0ZXh0LXNsYXRlLTMwMC83MCBhcnRpY2xlLW1ldGFcIj4ke3doZW59PC9kaXY+XG4gICAgICAgICAgICA8aDMgY2xhc3M9XCJtdC0xIGZvbnQtc2VtaWJvbGQgbGVhZGluZy1zbnVnXCI+JHthcnQudGl0bGUucmVwbGFjZSgvPC9nLCcmbHQ7Jyl9PC9oMz5cbiAgICAgICAgICA8L2E+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImFydGljbGUtdG9nZ2xlIGdsYXNzIHB4LTIgcHktMSByb3VuZGVkLW1kIHRleHQteHNcIiB0eXBlPVwiYnV0dG9uXCIgYXJpYS1sYWJlbD1cIlRvZ2dsZSByZWFkXCI+JHtjb2xsYXBzZWQgPyAnTWFyayB1bnJlYWQnIDogJ01hcmsgcmVhZCd9PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS5hbGxvcmlnaW5zLndpbi9yYXc/dXJsPWh0dHBzOi8vZmVlZHMuYmJjaS5jby51ay9uZXdzL3Jzcy54bWwnKTtcbiAgICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ0JCQyBSU1MgZmFsbGJhY2sgZmV0Y2ggZmFpbGVkJyk7XG4gICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVzLnRleHQoKTtcbiAgICAgIGNvbnN0IHhtbCA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcodGV4dCwgJ3RleHQveG1sJyk7XG4gICAgICBjb25zdCBpdGVtcyA9IEFycmF5LmZyb20oeG1sLnF1ZXJ5U2VsZWN0b3JBbGwoJ2l0ZW0nKSkuc2xpY2UoMCwgMTApLm1hcChpdGVtID0+ICh7IFxuICAgICAgICB0aXRsZTogaXRlbS5xdWVyeVNlbGVjdG9yKCd0aXRsZScpPy50ZXh0Q29udGVudCB8fCAnVW50aXRsZWQnLCBcbiAgICAgICAgbGluazogaXRlbS5xdWVyeVNlbGVjdG9yKCdsaW5rJyk/LnRleHRDb250ZW50IHx8ICcjJywgXG4gICAgICAgIHB1YkRhdGU6IGl0ZW0ucXVlcnlTZWxlY3RvcigncHViRGF0ZScpPy50ZXh0Q29udGVudCB8fCAnJyxcbiAgICAgICAgdGh1bWJuYWlsOiBpdGVtLnF1ZXJ5U2VsZWN0b3IoJ21lZGlhXFxcXDp0aHVtYm5haWwnKT8uZ2V0QXR0cmlidXRlKCd1cmwnKSB8fCBcbiAgICAgICAgICAgICAgICAgIGl0ZW0ucXVlcnlTZWxlY3RvcignZW5jbG9zdXJlW3R5cGU9XCJpbWFnZS9qcGVnXCJdJyk/LmdldEF0dHJpYnV0ZSgndXJsJykgfHwgXG4gICAgICAgICAgICAgICAgICBpdGVtLnF1ZXJ5U2VsZWN0b3IoJ2VuY2xvc3VyZVt0eXBlPVwiaW1hZ2UvcG5nXCJdJyk/LmdldEF0dHJpYnV0ZSgndXJsJykgfHxcbiAgICAgICAgICAgICAgICAgICdodHRwczovL25ld3MuYmJjaW1nLmNvLnVrL25vbC9zaGFyZWQvaW1nL2JiY19uZXdzXzEyMHg2MC5naWYnXG4gICAgICB9KSk7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmJjVXBkYXRlZCcpLnRleHRDb250ZW50ID0gYFVwZGF0ZWQgJHtuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLHtob3VyOicyLWRpZ2l0JyxtaW51dGU6JzItZGlnaXQnfSkuZm9ybWF0KG5ldyBEYXRlKCkpfSAoZmFsbGJhY2spYDtcbiAgICAgIGVsLmlubmVySFRNTCA9ICcnO1xuICAgICAgZm9yIChjb25zdCBhcnQgb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgdCA9IG5ldyBEYXRlKGFydC5wdWJEYXRlKTtcbiAgICAgICAgY29uc3Qgd2hlbiA9IGlzTmFOKHQpID8gJycgOiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IGRheTonMi1kaWdpdCcsIG1vbnRoOidzaG9ydCcsIGhvdXI6JzItZGlnaXQnLCBtaW51dGU6JzItZGlnaXQnIH0pLmZvcm1hdCh0KTtcbiAgICAgICAgbGV0IGxpbmsgPSBhcnQubGluaztcbiAgICAgICAgY29uc3QgaWQgPSBsaW5rIHx8IGFydC5ndWlkIHx8IGFydC50aXRsZTtcbiAgICAgICAgaWYgKGxpbmsuaW5jbHVkZXMoJ2JiYy5jb20nKSkge1xuICAgICAgICAgIGxpbmsgPSBsaW5rLnJlcGxhY2UoJ2JiYy5jb20nLCAnYmJjLmNvLnVrJyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRodW1ibmFpbCA9IHVwZ3JhZGVCQkNJbWFnZVJlc29sdXRpb24oYXJ0LnRodW1ibmFpbCk7XG4gICAgICAgIGNvbnN0IGNvbGxhcHNlZCA9IGlzUmVhZCgnYmJjJywgaWQpO1xuICAgICAgICBpZiAoY29sbGFwc2VkKSB7IGFkZFRvUmVhZExpc3QoJ2JiYycsIHsgaWQsIHRpdGxlOiBhcnQudGl0bGUsIGhyZWY6IGxpbmsgfSk7IGNvbnRpbnVlOyB9XG4gICAgICAgIGVsLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgYFxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpY2xlIGdsYXNzIHJvdW5kZWQtMnhsIHAtNCBjYXJkLWhvdmVyJHtjb2xsYXBzZWQgPyAnIGNvbGxhcHNlZCcgOiAnJ31cIiBkYXRhLXNvdXJjZT1cImJiY1wiIGRhdGEtaWQ9XCIke2lkfVwiIGRhdGEtdXJsPVwiJHtsaW5rfVwiPlxuICAgICAgICAgICAgPGEgY2xhc3M9XCJhcnRpY2xlLWxpbmsgYmxvY2tcIiBocmVmPVwiJHtsaW5rfVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImgtMzIgdy1mdWxsIHJvdW5kZWQtbGcgb3ZlcmZsb3ctaGlkZGVuIG1iLTMgYmctc2xhdGUtODAwLzUwXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCIke3RodW1ibmFpbH1cIiBhbHQ9XCIke2FydC50aXRsZX1cIiBjbGFzcz1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyIGFydGljbGUtaW1hZ2VcIiBsb2FkaW5nPVwibGF6eVwiIG9uZXJyb3I9XCJ0aGlzLnN0eWxlLmRpc3BsYXk9J25vbmUnOyB0aGlzLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYmctc2xhdGUtODAwLzUwJyk7XCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGV4dC1zbSB0ZXh0LXNsYXRlLTMwMC83MCBhcnRpY2xlLW1ldGFcIj4ke3doZW59PC9kaXY+XG4gICAgICAgICAgICAgIDxoMyBjbGFzcz1cIm10LTEgZm9udC1zZW1pYm9sZCBsZWFkaW5nLXNudWdcIj4ke2FydC50aXRsZS5yZXBsYWNlKC88L2csJyZsdDsnKX08L2gzPlxuICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImFydGljbGUtdG9nZ2xlIGdsYXNzIHB4LTIgcHktMSByb3VuZGVkLW1kIHRleHQteHNcIiB0eXBlPVwiYnV0dG9uXCIgYXJpYS1sYWJlbD1cIlRvZ2dsZSByZWFkXCI+JHtjb2xsYXBzZWQgPyAnTWFyayB1bnJlYWQnIDogJ01hcmsgcmVhZCd9PC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIGApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGZhbGxiYWNrRXJyb3IpIHtcbiAgICAgIGVsLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwiZ2xhc3Mgcm91bmRlZC0yeGwgcC00IHRleHQtc21cIj5GYWlsZWQgdG8gbG9hZCBCQkMuICR7ZS5tZXNzYWdlfSAoZmFsbGJhY2sgYWxzbyBmYWlsZWQ6ICR7ZmFsbGJhY2tFcnJvci5tZXNzYWdlfSk8L2Rpdj5gO1xuICAgIH1cbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tIE9yY2hlc3RyYXRlIC0tLS0tLS0tLS1cbmFzeW5jIGZ1bmN0aW9uIGxvYWRBbGwoKSB7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbG9hZGluZycpO1xuICBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQoW2xvYWRXZWF0aGVyKCksIGluaXRSYWRhcigpLCBsb2FkUmVkZGl0KCksIGxvYWRCQkMoKV0pO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcbiAgaWYgKHdpbmRvdy5sdWNpZGUpIGx1Y2lkZS5jcmVhdGVJY29ucygpO1xufVxuXG5mdW5jdGlvbiBzdGFydExpdmVEYXRlVGltZSgpIHtcbiAgdXBkYXRlTGl2ZURhdGVUaW1lKCk7XG4gIHNldEludGVydmFsKHVwZGF0ZUxpdmVEYXRlVGltZSwgMTAwMCk7XG59XG5cbi8vIC0tLS0tLS0tLS0gTmF2aWdhdGlvbiBNZW51IC0tLS0tLS0tLS1cbmZ1bmN0aW9uIGluaXROYXZpZ2F0aW9uKCkge1xuICBjb25zdCBuYXZNZW51ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdk1lbnUnKTtcbiAgY29uc3QgbmF2VG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdlRvZ2dsZScpO1xuICBjb25zdCBuYXZDbG9zZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZDbG9zZScpO1xuICBjb25zdCBuYXZMaW5rcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5uYXYtbGluaycpO1xuXG4gIGZ1bmN0aW9uIHRvZ2dsZU5hdigpIHtcbiAgICBjb25zdCBpc1Zpc2libGUgPSBuYXZNZW51LmNsYXNzTGlzdC5jb250YWlucygnc2hvdycpO1xuICAgIGlmIChpc1Zpc2libGUpIHtcbiAgICAgIG5hdk1lbnUuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYXZNZW51LmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbG9zZU5hdigpIHtcbiAgICBuYXZNZW51LmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNtb290aFNjcm9sbFRvU2VjdGlvbihlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHRhcmdldElkID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5zdWJzdHJpbmcoMSk7XG4gICAgY29uc3QgdGFyZ2V0U2VjdGlvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRhcmdldElkKTtcbiAgICBpZiAodGFyZ2V0U2VjdGlvbikge1xuICAgICAgY29uc3QgaGVhZGVySGVpZ2h0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaGVhZGVyJykub2Zmc2V0SGVpZ2h0O1xuICAgICAgY29uc3QgbmF2SGVpZ2h0ID0gbmF2TWVudS5vZmZzZXRIZWlnaHQ7XG4gICAgICBjb25zdCB0b3RhbE9mZnNldCA9IGhlYWRlckhlaWdodCArIG5hdkhlaWdodCArIDIwO1xuICAgICAgY29uc3QgdGFyZ2V0UG9zaXRpb24gPSB0YXJnZXRTZWN0aW9uLm9mZnNldFRvcCAtIHRvdGFsT2Zmc2V0O1xuICAgICAgd2luZG93LnNjcm9sbFRvKHsgdG9wOiB0YXJnZXRQb3NpdGlvbiwgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xuICAgICAgaWYgKHdpbmRvdy5pbm5lcldpZHRoIDwgNzY4KSB7XG4gICAgICAgIGNsb3NlTmF2KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbmF2VG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdG9nZ2xlTmF2KTtcbiAgbmF2Q2xvc2UuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjbG9zZU5hdik7XG4gIG5hdkxpbmtzLmZvckVhY2gobGluayA9PiBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc21vb3RoU2Nyb2xsVG9TZWN0aW9uKSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICBpZiAoIW5hdk1lbnUuY29udGFpbnMoZS50YXJnZXQpICYmICFuYXZUb2dnbGUuY29udGFpbnMoZS50YXJnZXQpKSB7XG4gICAgICBjbG9zZU5hdigpO1xuICAgIH1cbiAgfSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZSkgPT4ge1xuICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICAgIGNsb3NlTmF2KCk7XG4gICAgfVxuICB9KTtcbn1cblxuLy8gLS0tLS0tLS0tLSBDb2xsYXBzaWJsZSBzZWN0aW9ucyAtLS0tLS0tLS0tXG5mdW5jdGlvbiBpbml0Q29sbGFwc2libGVTZWN0aW9ucygpIHtcbiAgY29uc3Qgc2VjdGlvblRvZ2dsZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuc2VjdGlvbi10b2dnbGUnKTtcbiAgXG4gIHNlY3Rpb25Ub2dnbGVzLmZvckVhY2godG9nZ2xlID0+IHtcbiAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLmdldEF0dHJpYnV0ZSgnZGF0YS1zZWN0aW9uJyk7XG4gICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5jbG9zZXN0KCdzZWN0aW9uJykucXVlcnlTZWxlY3RvcignLnNlY3Rpb24tY29udGVudCcpO1xuICAgICAgY29uc3QgY2hldnJvbiA9IHRoaXMucXVlcnlTZWxlY3RvcignLnNlY3Rpb24tY2hldnJvbicpO1xuICAgICAgXG4gICAgICBpZiAoY29udGVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2NvbGxhcHNlZCcpKSB7XG4gICAgICAgIC8vIEV4cGFuZCBzZWN0aW9uXG4gICAgICAgIGNvbnRlbnQuY2xhc3NMaXN0LnJlbW92ZSgnY29sbGFwc2VkJyk7XG4gICAgICAgIGNoZXZyb24uY2xhc3NMaXN0LnJlbW92ZSgncm90YXRlZCcpO1xuICAgICAgICB0aGlzLmNsb3Nlc3QoJ3NlY3Rpb24nKS5jbGFzc0xpc3QucmVtb3ZlKCdzZWN0aW9uLWNvbGxhcHNlZCcpO1xuICAgICAgICBcbiAgICAgICAgLy8gUmVtb3ZlIGlubGluZSBoZWlnaHQgdG8gbGV0IGNvbnRlbnQgZXhwYW5kIG5hdHVyYWxseVxuICAgICAgICBjb250ZW50LnN0eWxlLmhlaWdodCA9ICcnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQ29sbGFwc2Ugc2VjdGlvblxuICAgICAgICAvLyBGaXJzdCBzZXQgdGhlIGN1cnJlbnQgaGVpZ2h0IHRvIGVuYWJsZSBzbW9vdGggdHJhbnNpdGlvblxuICAgICAgICBjb250ZW50LnN0eWxlLmhlaWdodCA9IGNvbnRlbnQuc2Nyb2xsSGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgXG4gICAgICAgIC8vIEZvcmNlIGEgcmVmbG93IHRvIGVuc3VyZSB0aGUgaGVpZ2h0IGlzIGFwcGxpZWRcbiAgICAgICAgY29udGVudC5vZmZzZXRIZWlnaHQ7XG4gICAgICAgIFxuICAgICAgICAvLyBOb3cgYW5pbWF0ZSB0byBoZWlnaHQgMFxuICAgICAgICBjb250ZW50LnN0eWxlLmhlaWdodCA9ICcwcHgnO1xuICAgICAgICBcbiAgICAgICAgLy8gQWRkIGNvbGxhcHNlZCBjbGFzcyBhZnRlciBhbmltYXRpb24gc3RhcnRzXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGNvbnRlbnQuY2xhc3NMaXN0LmFkZCgnY29sbGFwc2VkJyk7XG4gICAgICAgICAgY2hldnJvbi5jbGFzc0xpc3QuYWRkKCdyb3RhdGVkJyk7XG4gICAgICAgICAgdGhpcy5jbG9zZXN0KCdzZWN0aW9uJykuY2xhc3NMaXN0LmFkZCgnc2VjdGlvbi1jb2xsYXBzZWQnKTtcbiAgICAgICAgfSwgMTApO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn1cblxuLy8gLS0tLS0tLS0tLSBBcnRpY2xlIHJlYWQvY29sbGFwc2UgaW50ZXJhY3Rpb25zIC0tLS0tLS0tLS1cbmZ1bmN0aW9uIGluaXRBcnRpY2xlSW50ZXJhY3Rpb25zKCkge1xuICBmdW5jdGlvbiBoYW5kbGVUb2dnbGUoZSkge1xuICAgIGNvbnN0IGJ0biA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5hcnRpY2xlLXRvZ2dsZScpO1xuICAgIGlmICghYnRuKSByZXR1cm47XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IGFydGljbGUgPSBidG4uY2xvc2VzdCgnLmFydGljbGUnKTtcbiAgICBpZiAoIWFydGljbGUpIHJldHVybjtcbiAgICBjb25zdCBpZCA9IGFydGljbGUuZ2V0QXR0cmlidXRlKCdkYXRhLWlkJyk7XG4gICAgY29uc3Qgc291cmNlID0gYXJ0aWNsZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtc291cmNlJyk7XG4gICAgY29uc3QgaXNNYXJraW5nUmVhZCA9ICFhcnRpY2xlLmNsYXNzTGlzdC5jb250YWlucygnY29sbGFwc2VkJyk7XG4gICAgaWYgKGlzTWFya2luZ1JlYWQpIHtcbiAgICAgIC8vIE1hcmsgYXMgcmVhZDogYW5pbWF0ZSBvdXQsIHRoZW4gbW92ZSB0byByZWFkIGxpc3RcbiAgICAgIGFydGljbGUuY2xhc3NMaXN0LmFkZCgnY29sbGFwc2VkJywgJ2ZhZGUtb3V0Jyk7XG4gICAgICBtYXJrUmVhZChzb3VyY2UsIGlkLCB0cnVlKTtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBhcnRpY2xlLnJlbW92ZSgpO1xuICAgICAgICBhZGRUb1JlYWRMaXN0KHNvdXJjZSwgeyBpZCwgdGl0bGU6IGFydGljbGUucXVlcnlTZWxlY3RvcignaDMnKT8udGV4dENvbnRlbnQgfHwgJ1VudGl0bGVkJywgaHJlZjogYXJ0aWNsZS5xdWVyeVNlbGVjdG9yKCdhLmFydGljbGUtbGluaycpPy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSB8fCAnIyd9KTtcbiAgICAgIH0sIDIwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE1hcmsgYXMgdW5yZWFkOiByZW1vdmUgZnJvbSByZWFkIGxpc3QgYW5kIHJlLXJlbmRlciBsaXN0cyAodHJpZ2dlciByZWxvYWQgb2YgdGhhdCBzb3VyY2UpXG4gICAgICBtYXJrUmVhZChzb3VyY2UsIGlkLCBmYWxzZSk7XG4gICAgICByZW1vdmVGcm9tUmVhZExpc3Qoc291cmNlLCBpZCk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiBoYW5kbGVDYXJkQ2xpY2soZSkge1xuICAgIC8vIERvbid0IHRyaWdnZXIgaWYgY2xpY2tpbmcgb24gdGhlIHRvZ2dsZSBidXR0b25cbiAgICBpZiAoZS50YXJnZXQuY2xvc2VzdCgnLmFydGljbGUtdG9nZ2xlJykpIHJldHVybjtcbiAgICBcbiAgICBjb25zdCBhcnRpY2xlID0gZS50YXJnZXQuY2xvc2VzdCgnLmFydGljbGUnKTtcbiAgICBpZiAoIWFydGljbGUpIHJldHVybjtcbiAgICBcbiAgICBjb25zdCB1cmwgPSBhcnRpY2xlLmdldEF0dHJpYnV0ZSgnZGF0YS11cmwnKTtcbiAgICBpZiAodXJsICYmIHVybCAhPT0gJyMnKSB7XG4gICAgICB3aW5kb3cub3Blbih1cmwsICdfYmxhbmsnLCAnbm9vcGVuZXIsbm9yZWZlcnJlcicpO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gaGFuZGxlTWFya1VucmVhZChlKSB7XG4gICAgY29uc3QgYnRuID0gZS50YXJnZXQuY2xvc2VzdCgnLm1hcmstdW5yZWFkJyk7XG4gICAgaWYgKCFidG4pIHJldHVybjtcbiAgICBjb25zdCBpZCA9IGJ0bi5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKTtcbiAgICBjb25zdCBzb3VyY2UgPSBidG4uZ2V0QXR0cmlidXRlKCdkYXRhLXNvdXJjZScpO1xuICAgIG1hcmtSZWFkKHNvdXJjZSwgaWQsIGZhbHNlKTtcbiAgICByZW1vdmVGcm9tUmVhZExpc3Qoc291cmNlLCBpZCk7XG4gICAgLy8gUmUtcmVuZGVyIHRoZSBtYWluIGxpc3QgdG8gc2hvdyB0aGUgdW5tYXJrZWQgaXRlbVxuICAgIGlmIChzb3VyY2UgPT09ICdyZWRkaXQnKSBsb2FkUmVkZGl0KCk7XG4gICAgZWxzZSBpZiAoc291cmNlID09PSAnYmJjJykgbG9hZEJCQygpO1xuICB9XG4gIFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVkZGl0TGlzdCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZVRvZ2dsZSk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWRkaXRMaXN0Jyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlQ2FyZENsaWNrKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JiY0xpc3QnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVUb2dnbGUpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmJjTGlzdCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZUNhcmRDbGljayk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWFkUmVkZGl0TGlzdCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZU1hcmtVbnJlYWQpO1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVhZEJiY0xpc3QnKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVNYXJrVW5yZWFkKTtcbn1cblxuZnVuY3Rpb24gYWRkVG9SZWFkTGlzdChzb3VyY2UsIGl0ZW0pIHtcbiAgY29uc3QgdGFyZ2V0ID0gc291cmNlID09PSAncmVkZGl0JyA/IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWFkUmVkZGl0TGlzdCcpIDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlYWRCYmNMaXN0Jyk7XG4gIGlmICghdGFyZ2V0KSByZXR1cm47XG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgbGkuZGF0YXNldC5pZCA9IGl0ZW0uaWQ7XG4gIGxpLmNsYXNzTmFtZSA9ICdmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ3JvdXAnO1xuICBsaS5pbm5lckhUTUwgPSBgXG4gICAgPGEgY2xhc3M9XCJ1bmRlcmxpbmUgZGVjb3JhdGlvbi1kb3R0ZWQgZmxleC0xXCIgaHJlZj1cIiR7aXRlbS5ocmVmfVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXJcIj4ke2l0ZW0udGl0bGUucmVwbGFjZSgvPC9nLCcmbHQ7Jyl9PC9hPlxuICAgIDxidXR0b24gY2xhc3M9XCJtYXJrLXVucmVhZCBnbGFzcyBweC0yIHB5LTEgcm91bmRlZCB0ZXh0LXhzIG9wYWNpdHktMCBncm91cC1ob3ZlcjpvcGFjaXR5LTEwMCB0cmFuc2l0aW9uLW9wYWNpdHlcIiBkYXRhLXNvdXJjZT1cIiR7c291cmNlfVwiIGRhdGEtaWQ9XCIke2l0ZW0uaWR9XCI+TWFyayB1bnJlYWQ8L2J1dHRvbj5cbiAgYDtcbiAgdGFyZ2V0LnByZXBlbmQobGkpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVGcm9tUmVhZExpc3Qoc291cmNlLCBpZCkge1xuICBjb25zdCB0YXJnZXQgPSBzb3VyY2UgPT09ICdyZWRkaXQnID8gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlYWRSZWRkaXRMaXN0JykgOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVhZEJiY0xpc3QnKTtcbiAgaWYgKCF0YXJnZXQpIHJldHVybjtcbiAgY29uc3QgZWwgPSB0YXJnZXQucXVlcnlTZWxlY3RvcihgbGlbZGF0YS1pZD1cIiR7Q1NTLmVzY2FwZShpZCl9XCJdYCk7XG4gIGlmIChlbCkgZWwucmVtb3ZlKCk7XG59XG5cbmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWZyZXNoQnRuJyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gbG9hZEFsbCgpKTtcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICBsb2FkQWxsKCk7XG4gIHN0YXJ0TGl2ZURhdGVUaW1lKCk7XG4gIGluaXROYXZpZ2F0aW9uKCk7XG4gIGluaXRDb2xsYXBzaWJsZVNlY3Rpb25zKCk7XG4gIGluaXRBcnRpY2xlSW50ZXJhY3Rpb25zKCk7XG59KTtcbiJdLAog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QUFTO0FBQ3JDLFlBQU0sU0FBUyxJQUFJLGFBQWEsYUFBYTtBQUM3QyxlQUFTLFFBQVEsSUFBSSxLQUFLO0FBQzFCLHlCQUFtQixRQUFRLEVBQUU7QUFFN0IsVUFBSSxXQUFXLFNBQVUsWUFBVztBQUFBLGVBQzNCLFdBQVcsTUFBTyxTQUFRO0FBQUEsSUFDckM7QUFFQSxLQUFBRCxNQUFBLFNBQVMsZUFBZSxZQUFZLE1BQXBDLGdCQUFBQSxJQUF1QyxpQkFBaUIsU0FBUztBQUNqRSxtQkFBUyxlQUFlLFlBQVksTUFBcEMsbUJBQXVDLGlCQUFpQixTQUFTO0FBQ2pFLG1CQUFTLGVBQWUsU0FBUyxNQUFqQyxtQkFBb0MsaUJBQWlCLFNBQVM7QUFDOUQsbUJBQVMsZUFBZSxTQUFTLE1BQWpDLG1CQUFvQyxpQkFBaUIsU0FBUztBQUM5RCxtQkFBUyxlQUFlLGdCQUFnQixNQUF4QyxtQkFBMkMsaUJBQWlCLFNBQVM7QUFDckUsbUJBQVMsZUFBZSxhQUFhLE1BQXJDLG1CQUF3QyxpQkFBaUIsU0FBUztBQUFBLEVBQ3BFO0FBRUEsV0FBUyxjQUFjLFFBQVEsTUFBTTtBQUNuQyxVQUFNLFNBQVMsV0FBVyxXQUFXLFNBQVMsZUFBZSxnQkFBZ0IsSUFBSSxTQUFTLGVBQWUsYUFBYTtBQUN0SCxRQUFJLENBQUMsT0FBUTtBQUNiLFVBQU0sS0FBSyxTQUFTLGNBQWMsSUFBSTtBQUN0QyxPQUFHLFFBQVEsS0FBSyxLQUFLO0FBQ3JCLE9BQUcsWUFBWTtBQUNmLE9BQUcsWUFBWTtBQUFBLDBEQUN5QyxLQUFLLElBQUksc0NBQXNDLEtBQUssTUFBTSxRQUFRLE1BQUssTUFBTSxDQUFDO0FBQUEsb0lBQ0osTUFBTSxjQUFjLEtBQUssRUFBRTtBQUFBO0FBRTdKLFdBQU8sUUFBUSxFQUFFO0FBQUEsRUFDbkI7QUFFQSxXQUFTLG1CQUFtQixRQUFRLElBQUk7QUFDdEMsVUFBTSxTQUFTLFdBQVcsV0FBVyxTQUFTLGVBQWUsZ0JBQWdCLElBQUksU0FBUyxlQUFlLGFBQWE7QUFDdEgsUUFBSSxDQUFDLE9BQVE7QUFDYixVQUFNLEtBQUssT0FBTyxjQUFjLGVBQWUsSUFBSSxPQUFPLEVBQUUsQ0FBQyxJQUFJO0FBQ2pFLFFBQUksR0FBSSxJQUFHLE9BQU87QUFBQSxFQUNwQjtBQTlmQTtBQWdnQkEsaUJBQVMsZUFBZSxZQUFZLE1BQXBDLG1CQUF1QyxpQkFBaUIsU0FBUyxNQUFNLFFBQVE7QUFDL0UsU0FBTyxpQkFBaUIsb0JBQW9CLE1BQU07QUFDaEQsWUFBUTtBQUNSLHNCQUFrQjtBQUNsQixtQkFBZTtBQUNmLDRCQUF3QjtBQUN4Qiw0QkFBd0I7QUFBQSxFQUMxQixDQUFDOyIsCiAgIm5hbWVzIjogWyJpc1JlYWQiLCAiX2EiLCAiX2IiXQp9Cg==

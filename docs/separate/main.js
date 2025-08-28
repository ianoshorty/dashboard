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
        <div class="article glass rounded-2xl p-4 card-hover${collapsed ? " collapsed" : ""}" data-source="reddit" data-id="${id}">
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
        <div class="article glass rounded-2xl p-4 card-hover${collapsed ? " collapsed" : ""}" data-source="bbc" data-id="${id}">
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
          <div class="article glass rounded-2xl p-4 card-hover${collapsed ? " collapsed" : ""}" data-source="bbc" data-id="${id}">
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
  function initArticleInteractions() {
    var _a2, _b, _c, _d;
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
    (_b = document.getElementById("bbcList")) == null ? void 0 : _b.addEventListener("click", handleToggle);
    (_c = document.getElementById("readRedditList")) == null ? void 0 : _c.addEventListener("click", handleMarkUnread);
    (_d = document.getElementById("readBbcList")) == null ? void 0 : _d.addEventListener("click", handleMarkUnread);
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
    initArticleInteractions();
  });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIC0tLS0tLS0tLS0gVXRpbGl0aWVzIC0tLS0tLS0tLS1cbmNvbnN0IGZtdFRpbWUgPSAoaXNvLCB0eiA9ICdFdXJvcGUvTG9uZG9uJywgb3B0cyA9IHt9KSA9PiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IGhvdXI6ICcyLWRpZ2l0JywgbWludXRlOiAnMi1kaWdpdCcsIGhvdXIxMjogZmFsc2UsIHRpbWVab25lOiB0eiwgLi4ub3B0cyB9KS5mb3JtYXQobmV3IERhdGUoaXNvKSk7XG5jb25zdCBmbXREYXRlVGltZSA9IChpc28sIHR6ID0gJ0V1cm9wZS9Mb25kb24nKSA9PiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IHdlZWtkYXk6ICdzaG9ydCcsIGRheTogJzItZGlnaXQnLCBtb250aDogJ3Nob3J0JywgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JywgaG91cjEyOiBmYWxzZSwgdGltZVpvbmU6IHR6IH0pLmZvcm1hdChuZXcgRGF0ZShpc28pKTtcblxuLy8gU2FmZSBsb2NhbFN0b3JhZ2UgaGVscGVycyB3aXRoIGdyYWNlZnVsIGZhbGxiYWNrXG5jb25zdCBfbWVtb3J5U3RvcmUgPSBuZXcgTWFwKCk7XG5mdW5jdGlvbiBzdG9yYWdlQXZhaWxhYmxlKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHggPSAnX19kYXNoX3Rlc3RfXyc7XG4gICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKHgsIHgpO1xuICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh4KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoXykgeyByZXR1cm4gZmFsc2U7IH1cbn1cbmNvbnN0IGNhblBlcnNpc3QgPSBzdG9yYWdlQXZhaWxhYmxlKCk7XG5mdW5jdGlvbiBsb2FkUmVhZFNldChzb3VyY2UpIHtcbiAgY29uc3Qga2V5ID0gYHJlYWQ6JHtzb3VyY2V9YDtcbiAgaWYgKGNhblBlcnNpc3QpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmF3ID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XG4gICAgICByZXR1cm4gbmV3IFNldChyYXcgPyBKU09OLnBhcnNlKHJhdykgOiBbXSk7XG4gICAgfSBjYXRjaCAoXykgeyAvKiBpZ25vcmUgKi8gfVxuICB9XG4gIHJldHVybiBuZXcgU2V0KF9tZW1vcnlTdG9yZS5nZXQoa2V5KSB8fCBbXSk7XG59XG5mdW5jdGlvbiBzYXZlUmVhZFNldChzb3VyY2UsIHNldCkge1xuICBjb25zdCBrZXkgPSBgcmVhZDoke3NvdXJjZX1gO1xuICBjb25zdCBhcnIgPSBBcnJheS5mcm9tKHNldCk7XG4gIGlmIChjYW5QZXJzaXN0KSB7XG4gICAgdHJ5IHsgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkoYXJyKSk7IH0gY2F0Y2ggKF8pIHsgLyogaWdub3JlICovIH1cbiAgfSBlbHNlIHtcbiAgICBfbWVtb3J5U3RvcmUuc2V0KGtleSwgYXJyKTtcbiAgfVxufVxuZnVuY3Rpb24gbWFya1JlYWQoc291cmNlLCBpZCwgaXNSZWFkKSB7XG4gIGNvbnN0IHNldCA9IGxvYWRSZWFkU2V0KHNvdXJjZSk7XG4gIGlmIChpc1JlYWQpIHNldC5hZGQoaWQpOyBlbHNlIHNldC5kZWxldGUoaWQpO1xuICBzYXZlUmVhZFNldChzb3VyY2UsIHNldCk7XG59XG5mdW5jdGlvbiBpc1JlYWQoc291cmNlLCBpZCkge1xuICByZXR1cm4gbG9hZFJlYWRTZXQoc291cmNlKS5oYXMoaWQpO1xufVxuXG4vLyBVcGRhdGUgcGFnZSBoZWFkaW5nIHdpdGggbGl2ZSBkYXRlIGFuZCB0aW1lXG5mdW5jdGlvbiB1cGRhdGVMaXZlRGF0ZVRpbWUoKSB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGRhdGVTdHIgPSBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7XG4gICAgd2Vla2RheTogJ2xvbmcnLFxuICAgIGRheTogJ251bWVyaWMnLFxuICAgIG1vbnRoOiAnbG9uZycsXG4gICAgeWVhcjogJ251bWVyaWMnXG4gIH0pLmZvcm1hdChub3cpO1xuICBjb25zdCB0aW1lU3RyID0gbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJywge1xuICAgIGhvdXI6ICcyLWRpZ2l0JyxcbiAgICBtaW51dGU6ICcyLWRpZ2l0JyxcbiAgICBzZWNvbmQ6ICcyLWRpZ2l0JyxcbiAgICBob3VyMTI6IGZhbHNlXG4gIH0pLmZvcm1hdChub3cpO1xuICBjb25zdCBsaXZlRGF0ZVRpbWVFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaXZlRGF0ZVRpbWUnKTtcbiAgaWYgKGxpdmVEYXRlVGltZUVsKSB7XG4gICAgbGl2ZURhdGVUaW1lRWwudGV4dENvbnRlbnQgPSBgJHtkYXRlU3RyfSBhdCAke3RpbWVTdHJ9YDtcbiAgfVxufVxuXG5jb25zdCB3ZWF0aGVyQ29kZU1hcCA9IHsgMDogJ0NsZWFyIHNreScsIDE6ICdNYWlubHkgY2xlYXInLCAyOiAnUGFydGx5IGNsb3VkeScsIDM6ICdPdmVyY2FzdCcsIDQ1OiAnRm9nJywgNDg6ICdEZXBvc2l0aW5nIHJpbWUgZm9nJywgNTE6ICdMaWdodCBkcml6emxlJywgNTM6ICdNb2RlcmF0ZSBkcml6emxlJywgNTU6ICdEZW5zZSBkcml6emxlJywgNTY6ICdMaWdodCBmcmVlemluZyBkcml6emxlJywgNTc6ICdEZW5zZSBmcmVlemluZyBkcml6emxlJywgNjE6ICdTbGlnaHQgcmFpbicsIDYzOiAnTW9kZXJhdGUgcmFpbicsIDY1OiAnSGVhdnkgcmFpbicsIDY2OiAnTGlnaHQgZnJlZXppbmcgcmFpbicsIDY3OiAnSGVhdnkgZnJlZXppbmcgcmFpbicsIDcxOiAnU2xpZ2h0IHNub3cnLCA3MzogJ01vZGVyYXRlIHNub3cnLCA3NTogJ0hlYXZ5IHNub3cnLCA3NzogJ1Nub3cgZ3JhaW5zJywgODA6ICdSYWluIHNob3dlcnM6IHNsaWdodCcsIDgxOiAnUmFpbiBzaG93ZXJzOiBtb2RlcmF0ZScsIDgyOiAnUmFpbiBzaG93ZXJzOiB2aW9sZW50JywgODU6ICdTbm93IHNob3dlcnM6IHNsaWdodCcsIDg2OiAnU25vdyBzaG93ZXJzOiBoZWF2eScsIDk1OiAnVGh1bmRlcnN0b3JtJywgOTY6ICdUaHVuZGVyc3Rvcm0gd2l0aCBzbGlnaHQgaGFpbCcsIDk5OiAnVGh1bmRlcnN0b3JtIHdpdGggaGVhdnkgaGFpbCcgfTtcblxuLy8gRnVuY3Rpb24gdG8gdXBncmFkZSBCQkMgaW1hZ2UgcmVzb2x1dGlvblxuZnVuY3Rpb24gdXBncmFkZUJCQ0ltYWdlUmVzb2x1dGlvbihpbWFnZVVybCkge1xuICBpZiAoIWltYWdlVXJsIHx8ICFpbWFnZVVybC5pbmNsdWRlcygnaWNoZWYuYmJjaS5jby51aycpKSByZXR1cm4gaW1hZ2VVcmw7XG5cbiAgY29uc3Qgc2l6ZVVwZ3JhZGVzID0ge1xuICAgICcvMTIwLyc6ICcvNTEyLycsXG4gICAgJy8yNDAvJzogJy81MTIvJyxcbiAgICAnLzQ4MC8nOiAnLzUxMi8nLFxuICAgICcvNjQwLyc6ICcvODAwLycsXG4gICAgJy84MDAvJzogJy8xMDI0LydcbiAgfTtcblxuICBmb3IgKGNvbnN0IFtzbWFsbFNpemUsIGxhcmdlU2l6ZV0gb2YgT2JqZWN0LmVudHJpZXMoc2l6ZVVwZ3JhZGVzKSkge1xuICAgIGlmIChpbWFnZVVybC5pbmNsdWRlcyhzbWFsbFNpemUpKSB7XG4gICAgICByZXR1cm4gaW1hZ2VVcmwucmVwbGFjZShzbWFsbFNpemUsIGxhcmdlU2l6ZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGltYWdlVXJsO1xufVxuXG4vLyAtLS0tLS0tLS0tIFdlYXRoZXIgKE9wZW5cdTIwMTFNZXRlbykgLS0tLS0tLS0tLVxuY29uc3QgV0VBVEhFUl9FTCA9IHsgdXBkYXRlZDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3dlYXRoZXJVcGRhdGVkJyksIHNrZWxldG9uOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnd2VhdGhlclNrZWxldG9uJyksIGN1cnJlbnRUZW1wOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VycmVudFRlbXAnKSwgdGVtcFJhbmdlOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGVtcFJhbmdlJyksIGF2Z1JhaW46IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdmdSYWluJyksIGNvbmRpdGlvbk5vdzogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbmRpdGlvbk5vdycpLCBuZXh0UmFpbjogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25leHRSYWluJyksIG5leHRSYWluRGV0YWlsOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV4dFJhaW5EZXRhaWwnKSB9O1xuXG5sZXQgd2VhdGhlckNoYXJ0O1xuYXN5bmMgZnVuY3Rpb24gbG9hZFdlYXRoZXIoKSB7XG4gIGNvbnN0IGxhdCA9IDU0Ljk3ODMsIGxvbiA9IC0xLjYxNzg7IC8vIE5ld2Nhc3RsZSB1cG9uIFR5bmVcbiAgY29uc3QgdXJsID0gYGh0dHBzOi8vYXBpLm9wZW4tbWV0ZW8uY29tL3YxL2ZvcmVjYXN0P2xhdGl0dWRlPSR7bGF0fSZsb25naXR1ZGU9JHtsb259JmhvdXJseT10ZW1wZXJhdHVyZV8ybSxwcmVjaXBpdGF0aW9uX3Byb2JhYmlsaXR5LHByZWNpcGl0YXRpb24sd2VhdGhlcmNvZGUmdGltZXpvbmU9RXVyb3BlJTJGTG9uZG9uJmZvcmVjYXN0X2RheXM9MmA7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoJ1dlYXRoZXIgZmV0Y2ggZmFpbGVkJyk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICBjb25zdCB7IHRpbWUsIHRlbXBlcmF0dXJlXzJtLCBwcmVjaXBpdGF0aW9uX3Byb2JhYmlsaXR5LCBwcmVjaXBpdGF0aW9uLCB3ZWF0aGVyY29kZSB9ID0gZGF0YS5ob3VybHk7XG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gIGxldCBzdGFydElkeCA9IHRpbWUuZmluZEluZGV4KHQgPT4gbmV3IERhdGUodCkuZ2V0VGltZSgpID49IG5vdyk7XG4gIGlmIChzdGFydElkeCA9PT0gLTEpIHN0YXJ0SWR4ID0gMDtcbiAgY29uc3QgcmFuZ2UgPSBbLi4uQXJyYXkoMjQpXS5tYXAoKF8sIGkpID0+IHN0YXJ0SWR4ICsgaSkuZmlsdGVyKGkgPT4gaSA8IHRpbWUubGVuZ3RoKTtcbiAgY29uc3QgbGFiZWxzID0gcmFuZ2UubWFwKGkgPT4gZm10VGltZSh0aW1lW2ldKSk7XG4gIGNvbnN0IHRlbXBzID0gcmFuZ2UubWFwKGkgPT4gdGVtcGVyYXR1cmVfMm1baV0pO1xuICBjb25zdCBwcm9icyA9IHJhbmdlLm1hcChpID0+IHByZWNpcGl0YXRpb25fcHJvYmFiaWxpdHlbaV0pO1xuICBjb25zdCBwcmVjcyA9IHJhbmdlLm1hcChpID0+IHByZWNpcGl0YXRpb25baV0pO1xuICBjb25zdCBub3dDb2RlID0gd2VhdGhlcmNvZGVbc3RhcnRJZHhdO1xuICBXRUFUSEVSX0VMLmN1cnJlbnRUZW1wLnRleHRDb250ZW50ID0gYCR7TWF0aC5yb3VuZCh0ZW1wZXJhdHVyZV8ybVtzdGFydElkeF0gPz8gdGVtcGVyYXR1cmVfMm0uYXQoMCkpfVx1MDBCMENgO1xuICBXRUFUSEVSX0VMLnRlbXBSYW5nZS50ZXh0Q29udGVudCA9IGAke01hdGgucm91bmQoTWF0aC5taW4oLi4udGVtcHMpKX1cdTAwQjBDIFx1MjE5MiAke01hdGgucm91bmQoTWF0aC5tYXgoLi4udGVtcHMpKX1cdTAwQjBDYDtcbiAgV0VBVEhFUl9FTC5hdmdSYWluLnRleHRDb250ZW50ID0gYCR7TWF0aC5yb3VuZChwcm9icy5yZWR1Y2UoKGEsYik9PmErYiwwKSAvIHByb2JzLmxlbmd0aCl9JWA7XG4gIFdFQVRIRVJfRUwuY29uZGl0aW9uTm93LnRleHRDb250ZW50ID0gd2VhdGhlckNvZGVNYXBbbm93Q29kZV0gfHwgJ1x1MjAxNCc7XG4gIFdFQVRIRVJfRUwudXBkYXRlZC50ZXh0Q29udGVudCA9IGBVcGRhdGVkICR7bmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJyx7aG91cjonMi1kaWdpdCcsbWludXRlOicyLWRpZ2l0J30pLmZvcm1hdChuZXcgRGF0ZSgpKX1gO1xuICBsZXQgbmV4dElkeCA9IHJhbmdlLmZpbmQoaSA9PiAocHJlY2lwaXRhdGlvbl9wcm9iYWJpbGl0eVtpXSA+PSA1MCkgfHwgKHByZWNpcGl0YXRpb25baV0gPj0gMC4yKSk7XG4gIGlmIChuZXh0SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICBsZXQgYmVzdEkgPSByYW5nZVswXTsgbGV0IGJlc3RQID0gLTE7IGZvciAoY29uc3QgaSBvZiByYW5nZSkgeyBpZiAocHJlY2lwaXRhdGlvbl9wcm9iYWJpbGl0eVtpXSA+IGJlc3RQKSB7IGJlc3RQID0gcHJlY2lwaXRhdGlvbl9wcm9iYWJpbGl0eVtpXTsgYmVzdEkgPSBpOyB9IH1cbiAgICBuZXh0SWR4ID0gYmVzdEk7IFdFQVRIRVJfRUwubmV4dFJhaW4udGV4dENvbnRlbnQgPSBgTm8gaGlnaCBjaGFuY2Ugc29vbiBcdTIwMTQgaGlnaGVzdCBpbiBuZXh0IDI0aCBhdCAke2ZtdERhdGVUaW1lKHRpbWVbbmV4dElkeF0pfWA7XG4gIH0gZWxzZSB7IFdFQVRIRVJfRUwubmV4dFJhaW4udGV4dENvbnRlbnQgPSBgTGlrZWx5IGFyb3VuZCAke2ZtdERhdGVUaW1lKHRpbWVbbmV4dElkeF0pfWA7IH1cbiAgV0VBVEhFUl9FTC5uZXh0UmFpbkRldGFpbC50ZXh0Q29udGVudCA9IGBQcm9iYWJpbGl0eSAke3ByZWNpcGl0YXRpb25fcHJvYmFiaWxpdHlbbmV4dElkeF19JSwgZXhwZWN0ZWQgcHJlY2lwaXRhdGlvbiAke3ByZWNzW3JhbmdlLmluZGV4T2YobmV4dElkeCldID8/IHByZWNpcGl0YXRpb25bbmV4dElkeF19IG1tLmA7XG4gIGNvbnN0IGN0eCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd3ZWF0aGVyQ2hhcnQnKS5nZXRDb250ZXh0KCcyZCcpO1xuICBXRUFUSEVSX0VMLnNrZWxldG9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIGlmICh3ZWF0aGVyQ2hhcnQpIHdlYXRoZXJDaGFydC5kZXN0cm95KCk7XG4gIHdlYXRoZXJDaGFydCA9IG5ldyBDaGFydChjdHgsIHsgdHlwZTogJ2JhcicsIGRhdGE6IHsgbGFiZWxzLCBkYXRhc2V0czogWyB7IHR5cGU6ICdsaW5lJywgbGFiZWw6ICdUZW1wZXJhdHVyZSAoXHUwMEIwQyknLCBkYXRhOiB0ZW1wcywgeUF4aXNJRDogJ3knLCB0ZW5zaW9uOiAwLjM1LCBib3JkZXJXaWR0aDogMiwgcG9pbnRSYWRpdXM6IDAgfSwgeyB0eXBlOiAnYmFyJywgbGFiZWw6ICdQcmVjaXBpdGF0aW9uIFByb2JhYmlsaXR5ICglKScsIGRhdGE6IHByb2JzLCB5QXhpc0lEOiAneTEnLCBib3JkZXJXaWR0aDogMCB9IF0gfSwgb3B0aW9uczogeyByZXNwb25zaXZlOiB0cnVlLCBtYWludGFpbkFzcGVjdFJhdGlvOiBmYWxzZSwgc2NhbGVzOiB7IHk6IHsgcG9zaXRpb246ICdsZWZ0JywgdGlja3M6IHsgY29sb3I6ICcjY2JkNWUxJyB9LCBncmlkOiB7IGNvbG9yOiAncmdiYSgxNDgsMTYzLDE4NCwwLjE1KScgfSB9LCB5MTogeyBwb3NpdGlvbjogJ3JpZ2h0JywgdGlja3M6IHsgY29sb3I6ICcjY2JkNWUxJyB9LCBncmlkOiB7IGRyYXdPbkNoYXJ0QXJlYTogZmFsc2UgfSB9LCB4OiB7IHRpY2tzOiB7IGNvbG9yOiAnI2NiZDVlMScgfSwgZ3JpZDogeyBjb2xvcjogJ3JnYmEoMTQ4LDE2MywxODQsMC4xKScgfSB9IH0sIHBsdWdpbnM6IHsgbGVnZW5kOiB7IGxhYmVsczogeyBjb2xvcjogJyNlMmU4ZjAnIH0gfSwgdG9vbHRpcDogeyBjYWxsYmFja3M6IHsgdGl0bGU6IChpdGVtcykgPT4gYEhvdXI6ICR7aXRlbXNbMF0ubGFiZWx9YCB9IH0gfSwgYW5pbWF0aW9uOiB7IGR1cmF0aW9uOiA5MDAgfSB9IH0pO1xufVxuXG4vLyAtLS0tLS0tLS0tIFJhZGFyIChSYWluVmlld2VyIG92ZXIgTGVhZmxldCkgLS0tLS0tLS0tLVxubGV0IHJhZGFyTWFwLCByYWRhckZyYW1lcyA9IFtdLCByYWRhckxheWVycyA9IFtdLCByYWRhckluZGV4ID0gMCwgcmFkYXJUaW1lciA9IG51bGw7XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRSYWRhcigpIHtcbiAgY29uc3QgY2VudGVyID0gWzU0Ljk3ODMsIC0xLjYxNzhdOyAvLyBOZXdjYXN0bGUgdXBvbiBUeW5lXG4gIHJhZGFyTWFwID0gTC5tYXAoJ3JhZGFyTWFwJywgeyB6b29tQ29udHJvbDogdHJ1ZSwgYXR0cmlidXRpb25Db250cm9sOiB0cnVlIH0pLnNldFZpZXcoY2VudGVyLCA3KTtcbiAgY29uc3QgYmFzZSA9IEwudGlsZUxheWVyKCdodHRwczovL3tzfS50aWxlLm9wZW5zdHJlZXRtYXAub3JnL3t6fS97eH0ve3l9LnBuZycsIHsgbWF4Wm9vbTogMTgsIGF0dHJpYnV0aW9uOiAnJmNvcHk7IDxhIGhyZWY9XCJodHRwczovL3d3dy5vcGVuc3RyZWV0bWFwLm9yZy9jb3B5cmlnaHRcIj5PcGVuU3RyZWV0TWFwPC9hPiBjb250cmlidXRvcnMnIH0pO1xuICBiYXNlLmFkZFRvKHJhZGFyTWFwKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkucmFpbnZpZXdlci5jb20vcHVibGljL3dlYXRoZXItbWFwcy5qc29uJyk7XG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcignUmFkYXIgbWV0YWRhdGEgZmV0Y2ggZmFpbGVkJyk7XG4gICAgY29uc3QganNvbiA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgY29uc3QgYWxsRnJhbWVzID0gWy4uLihqc29uLnJhZGFyPy5wYXN0fHxbXSksIC4uLihqc29uLnJhZGFyPy5ub3djYXN0fHxbXSldO1xuICAgIGNvbnN0IGN1dG9mZiA9IERhdGUubm93KCkgLSA0KjYwKjYwKjEwMDA7IC8vIGxhc3QgNCBob3Vyc1xuICAgIHJhZGFyRnJhbWVzID0gYWxsRnJhbWVzLmZpbHRlcihmID0+IChmLnRpbWUqMTAwMCkgPj0gY3V0b2ZmKTtcbiAgICBpZiAocmFkYXJGcmFtZXMubGVuZ3RoID09PSAwKSB7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhck1hcCcpLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicC0zIHRleHQtc21cIj5ObyByYWRhciBmcmFtZXMgYXZhaWxhYmxlIHJpZ2h0IG5vdy48L2Rpdj4nOyByZXR1cm47IH1cbiAgICByYWRhckxheWVycyA9IHJhZGFyRnJhbWVzLm1hcChmID0+IEwudGlsZUxheWVyKGBodHRwczovL3RpbGVjYWNoZS5yYWludmlld2VyLmNvbS92Mi9yYWRhci8ke2YudGltZX0vMjU2L3t6fS97eH0ve3l9LzIvMV8xLnBuZ2AsIHsgb3BhY2l0eTogMC43LCBhdHRyaWJ1dGlvbjogJ1JhZGFyIFx1MDBBOSA8YSBocmVmPVwiaHR0cHM6Ly9yYWludmlld2VyLmNvbVwiPlJhaW5WaWV3ZXI8L2E+JyB9KSk7XG4gICAgcmFkYXJJbmRleCA9IHJhZGFyTGF5ZXJzLmxlbmd0aCAtIDE7XG4gICAgcmFkYXJMYXllcnNbcmFkYXJJbmRleF0uYWRkVG8ocmFkYXJNYXApO1xuICAgIHVwZGF0ZVJhZGFyVGltZUxhYmVsKCk7XG4gICAgY29uc3QgcGxheUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhclBsYXknKTtcbiAgICBwbGF5QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdG9nZ2xlUmFkYXIpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhclByZXYnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHN0ZXBSYWRhcigtMSkpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhck5leHQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHN0ZXBSYWRhcigxKSk7XG4gICAgdG9nZ2xlUmFkYXIoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhck1hcCcpLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwicC0zIHRleHQtc21cIj5GYWlsZWQgdG8gbG9hZCByYWRhci4gJHtlLm1lc3NhZ2V9PC9kaXY+YDtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVSYWRhclRpbWVMYWJlbCgpIHtcbiAgY29uc3QgdHMgPSByYWRhckZyYW1lc1tyYWRhckluZGV4XT8udGltZSoxMDAwO1xuICBpZiAoIXRzKSByZXR1cm47XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyYWRhclRpbWUnKS50ZXh0Q29udGVudCA9IG5ldyBJbnRsLkRhdGVUaW1lRm9ybWF0KCdlbi1HQicsIHsgaG91cjogJzItZGlnaXQnLCBtaW51dGU6ICcyLWRpZ2l0JyB9KS5mb3JtYXQobmV3IERhdGUodHMpKTtcbn1cblxuZnVuY3Rpb24gc3RlcFJhZGFyKGRpciA9IDEpIHtcbiAgaWYgKCFyYWRhckxheWVycy5sZW5ndGgpIHJldHVybjtcbiAgcmFkYXJMYXllcnNbcmFkYXJJbmRleF0/LnJlbW92ZSgpO1xuICByYWRhckluZGV4ID0gKHJhZGFySW5kZXggKyBkaXIgKyByYWRhckxheWVycy5sZW5ndGgpICUgcmFkYXJMYXllcnMubGVuZ3RoO1xuICByYWRhckxheWVyc1tyYWRhckluZGV4XS5hZGRUbyhyYWRhck1hcCk7XG4gIHVwZGF0ZVJhZGFyVGltZUxhYmVsKCk7XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZVJhZGFyKCkge1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmFkYXJQbGF5Jyk7XG4gIGlmIChyYWRhclRpbWVyKSB7IGNsZWFySW50ZXJ2YWwocmFkYXJUaW1lcik7IHJhZGFyVGltZXIgPSBudWxsOyBidG4udGV4dENvbnRlbnQgPSAnUGxheSc7IHJldHVybjsgfVxuICBidG4udGV4dENvbnRlbnQgPSAnUGF1c2UnO1xuICByYWRhclRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4gc3RlcFJhZGFyKDEpLCA2MDApO1xufVxuXG4vLyAtLS0tLS0tLS0tIFJlZGRpdCBQb3B1bGFyIEhvdCAyMCAtLS0tLS0tLS0tXG5hc3luYyBmdW5jdGlvbiBsb2FkUmVkZGl0KCkge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWRkaXRMaXN0Jyk7XG4gIGVsLmlubmVySFRNTCA9ICcnO1xuICBlbC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIEFycmF5LmZyb20oe2xlbmd0aDogOH0pLm1hcCgoKSA9PiBgXG4gICAgPGRpdiBjbGFzcz1cImdsYXNzIHJvdW5kZWQtMnhsIHAtNCBjYXJkLWhvdmVyXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiaC0zMiB3LWZ1bGwgcm91bmRlZC1sZyBza2VsZXRvbiBhbmltYXRlLXNoaW1tZXIgbWItM1wiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImgtNSB3LTMvNCByb3VuZGVkLW1kIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lclwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm10LTMgaC00IHctMS8yIHJvdW5kZWQtbWQgc2tlbGV0b24gYW5pbWF0ZS1zaGltbWVyXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibXQtMyBoLTggdy0yNCByb3VuZGVkLWxnIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lclwiPjwvZGl2PlxuICAgIDwvZGl2PmApLmpvaW4oJycpKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly93d3cucmVkZGl0LmNvbS9yL3BvcHVsYXIvaG90Lmpzb24/bGltaXQ9MjAnKTtcbiAgICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKCdSZWRkaXQgZmV0Y2ggZmFpbGVkJyk7XG4gICAgY29uc3QganNvbiA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgY29uc3QgaXRlbXMgPSBqc29uLmRhdGEuY2hpbGRyZW4ubWFwKGMgPT4gYy5kYXRhKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVkZGl0VXBkYXRlZCcpLnRleHRDb250ZW50ID0gYFVwZGF0ZWQgJHtuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLHtob3VyOicyLWRpZ2l0JyxtaW51dGU6JzItZGlnaXQnfSkuZm9ybWF0KG5ldyBEYXRlKCkpfWA7XG4gICAgZWwuaW5uZXJIVE1MID0gJyc7XG4gICAgZm9yIChjb25zdCBwb3N0IG9mIGl0ZW1zKSB7XG4gICAgICBjb25zdCB1cmwgPSBgaHR0cHM6Ly93d3cucmVkZGl0LmNvbSR7cG9zdC5wZXJtYWxpbmt9YDtcbiAgICAgIGNvbnN0IGlkID0gcG9zdC5pZCB8fCBwb3N0LnBlcm1hbGluaztcbiAgICAgIGNvbnN0IGZsYWlyID0gcG9zdC5saW5rX2ZsYWlyX3RleHQgPyBgPHNwYW4gY2xhc3M9J21sLTIgdGV4dC14cyBweC0xLjUgcHktMC41IHJvdW5kZWQtbWQgYmctd2hpdGUvMTAgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCc+JHtwb3N0LmxpbmtfZmxhaXJfdGV4dH08L3NwYW4+YCA6ICcnO1xuICAgICAgbGV0IGltYWdlVXJsID0gbnVsbDtcbiAgICAgIGxldCBpbWFnZUFsdCA9IHBvc3QudGl0bGU7XG4gICAgICBpZiAocG9zdC5wcmV2aWV3ICYmIHBvc3QucHJldmlldy5pbWFnZXMgJiYgcG9zdC5wcmV2aWV3LmltYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IHByZXZpZXcgPSBwb3N0LnByZXZpZXcuaW1hZ2VzWzBdO1xuICAgICAgICBpZiAocHJldmlldy52YXJpYW50cyAmJiBwcmV2aWV3LnZhcmlhbnRzLmdpZikge1xuICAgICAgICAgIGltYWdlVXJsID0gcHJldmlldy52YXJpYW50cy5naWYuc291cmNlLnVybDtcbiAgICAgICAgfSBlbHNlIGlmIChwcmV2aWV3LnZhcmlhbnRzICYmIHByZXZpZXcudmFyaWFudHMubXA0KSB7XG4gICAgICAgICAgaW1hZ2VVcmwgPSBwcmV2aWV3LnNvdXJjZS51cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW1hZ2VVcmwgPSBwcmV2aWV3LnNvdXJjZS51cmw7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAocG9zdC50aHVtYm5haWwgJiYgcG9zdC50aHVtYm5haWwgIT09ICdzZWxmJyAmJiBwb3N0LnRodW1ibmFpbCAhPT0gJ2RlZmF1bHQnICYmIHBvc3QudGh1bWJuYWlsICE9PSAnbnNmdycpIHtcbiAgICAgICAgaW1hZ2VVcmwgPSBwb3N0LnRodW1ibmFpbDtcbiAgICAgIH0gZWxzZSBpZiAocG9zdC51cmwgJiYgKHBvc3QudXJsLmluY2x1ZGVzKCcuanBnJykgfHwgcG9zdC51cmwuaW5jbHVkZXMoJy5qcGVnJykgfHwgcG9zdC51cmwuaW5jbHVkZXMoJy5wbmcnKSB8fCBwb3N0LnVybC5pbmNsdWRlcygnLmdpZicpKSkge1xuICAgICAgICBpbWFnZVVybCA9IHBvc3QudXJsO1xuICAgICAgfVxuICAgICAgaWYgKGltYWdlVXJsICYmIGltYWdlVXJsLmluY2x1ZGVzKCdyZWRkaXQuY29tJykpIHtcbiAgICAgICAgaW1hZ2VVcmwgPSBpbWFnZVVybC5zcGxpdCgnPycpWzBdO1xuICAgICAgfVxuICAgICAgY29uc3QgY29sbGFwc2VkID0gaXNSZWFkKCdyZWRkaXQnLCBpZCk7XG4gICAgICBpZiAoY29sbGFwc2VkKSB7IGFkZFRvUmVhZExpc3QoJ3JlZGRpdCcsIHsgaWQsIHRpdGxlOiBwb3N0LnRpdGxlLCBocmVmOiB1cmwgfSk7IGNvbnRpbnVlOyB9XG4gICAgICBlbC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIGBcbiAgICAgICAgPGRpdiBjbGFzcz1cImFydGljbGUgZ2xhc3Mgcm91bmRlZC0yeGwgcC00IGNhcmQtaG92ZXIke2NvbGxhcHNlZCA/ICcgY29sbGFwc2VkJyA6ICcnfVwiIGRhdGEtc291cmNlPVwicmVkZGl0XCIgZGF0YS1pZD1cIiR7aWR9XCI+XG4gICAgICAgICAgPGEgY2xhc3M9XCJhcnRpY2xlLWxpbmsgYmxvY2tcIiBocmVmPVwiJHt1cmx9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlclwiPlxuICAgICAgICAgICAgJHtpbWFnZVVybCA/IGBcbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImgtMzIgdy1mdWxsIHJvdW5kZWQtbGcgb3ZlcmZsb3ctaGlkZGVuIG1iLTMgYmctc2xhdGUtODAwLzUwXCI+XG4gICAgICAgICAgICAgICAgPGltZyBzcmM9XCIke2ltYWdlVXJsfVwiIGFsdD1cIiR7cG9zdC50aXRsZX1cIiBjbGFzcz1cInctZnVsbCBoLWZ1bGwgb2JqZWN0LWNvdmVyIGFydGljbGUtaW1hZ2VcIiBsb2FkaW5nPVwibGF6eVwiIG9uZXJyb3I9XCJ0aGlzLnN0eWxlLmRpc3BsYXk9J25vbmUnOyB0aGlzLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYmctc2xhdGUtODAwLzUwJyk7XCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgYCA6ICcnfVxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRleHQtc20gdGV4dC1zbGF0ZS0zMDAvNzAgYXJ0aWNsZS1tZXRhXCI+ci8ke3Bvc3Quc3VicmVkZGl0fSBcdTIwMjIgXHUyQjA2XHVGRTBFICR7cG9zdC51cHMudG9Mb2NhbGVTdHJpbmcoJ2VuLUdCJyl9PC9kaXY+XG4gICAgICAgICAgICA8aDMgY2xhc3M9XCJtdC0xIGZvbnQtc2VtaWJvbGQgbGVhZGluZy1zbnVnXCI+JHtwb3N0LnRpdGxlLnJlcGxhY2UoLzwvZywnJmx0OycpfTwvaDM+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibXQtMyBpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgdGV4dC14cyB0ZXh0LXNsYXRlLTMwMC84MCBhcnRpY2xlLW1ldGFcIj5ieSB1LyR7cG9zdC5hdXRob3J9JHtmbGFpcn08L2Rpdj5cbiAgICAgICAgICA8L2E+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImFydGljbGUtdG9nZ2xlIGdsYXNzIHB4LTIgcHktMSByb3VuZGVkLW1kIHRleHQteHNcIiB0eXBlPVwiYnV0dG9uXCIgYXJpYS1sYWJlbD1cIlRvZ2dsZSByZWFkXCI+JHtjb2xsYXBzZWQgPyAnTWFyayB1bnJlYWQnIDogJ01hcmsgcmVhZCd9PC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7IGVsLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwiZ2xhc3Mgcm91bmRlZC0yeGwgcC00IHRleHQtc21cIj5GYWlsZWQgdG8gbG9hZCBSZWRkaXQuICR7ZS5tZXNzYWdlfTwvZGl2PmA7IH1cbn1cblxuLy8gLS0tLS0tLS0tLSBCQkMgTGF0ZXN0IHZpYSBSU1MgKENPUlNcdTIwMTFmcmllbmRseSByZWFkZXIpIC0tLS0tLS0tLS1cbmFzeW5jIGZ1bmN0aW9uIGxvYWRCQkMoKSB7XG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JiY0xpc3QnKTtcbiAgZWwuaW5uZXJIVE1MID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiA2fSkubWFwKCgpID0+IGBcbiAgICA8ZGl2IGNsYXNzPVwiZ2xhc3Mgcm91bmRlZC0yeGwgcC00IGNhcmQtaG92ZXJcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJoLTMyIHctZnVsbCByb3VuZGVkLWxnIHNrZWxldG9uIGFuaW1hdGUtc2hpbW1lciBtYi0zXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiaC01IHctMi8zIHJvdW5kZWQtbWQgc2tlbGV0b24gYW5pbWF0ZS1zaGltbWVyXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibXQtMyBoLTQgdy0xLzIgcm91bmRlZC1tZCBza2VsZXRvbiBhbmltYXRlLXNoaW1tZXJcIj48L2Rpdj5cbiAgICA8L2Rpdj5gKS5qb2luKCcnKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS5yc3MyanNvbi5jb20vdjEvYXBpLmpzb24/cnNzX3VybD1odHRwczovL2ZlZWRzLmJiY2kuY28udWsvbmV3cy9yc3MueG1sJyk7XG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcignQkJDIFJTUyBmZXRjaCBmYWlsZWQnKTtcbiAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICBpZiAoanNvbi5zdGF0dXMgIT09ICdvaycgfHwgIWpzb24uaXRlbXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBSU1MgcmVzcG9uc2UgZm9ybWF0Jyk7XG4gICAgfVxuICAgIGNvbnN0IGl0ZW1zID0ganNvbi5pdGVtcy5zbGljZSgwLCAxMCk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JiY1VwZGF0ZWQnKS50ZXh0Q29udGVudCA9IGBVcGRhdGVkICR7bmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJyx7aG91cjonMi1kaWdpdCcsbWludXRlOicyLWRpZ2l0J30pLmZvcm1hdChuZXcgRGF0ZSgpKX1gO1xuICAgIGVsLmlubmVySFRNTCA9ICcnO1xuICAgIGZvciAoY29uc3QgYXJ0IG9mIGl0ZW1zKSB7XG4gICAgICBjb25zdCB0ID0gbmV3IERhdGUoYXJ0LnB1YkRhdGUpO1xuICAgICAgY29uc3Qgd2hlbiA9IGlzTmFOKHQpID8gJycgOiBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tR0InLCB7IGRheTonMi1kaWdpdCcsIG1vbnRoOidzaG9ydCcsIGhvdXI6JzItZGlnaXQnLCBtaW51dGU6JzItZGlnaXQnIH0pLmZvcm1hdCh0KTtcbiAgICAgIGxldCBsaW5rID0gYXJ0Lmxpbms7XG4gICAgICBjb25zdCBpZCA9IGxpbmsgfHwgYXJ0Lmd1aWQgfHwgYXJ0LnRpdGxlO1xuICAgICAgaWYgKGxpbmsuaW5jbHVkZXMoJ2JiYy5jb20nKSkge1xuICAgICAgICBsaW5rID0gbGluay5yZXBsYWNlKCdiYmMuY29tJywgJ2JiYy5jby51aycpO1xuICAgICAgfVxuICAgICAgbGV0IHRodW1ibmFpbCA9IGFydC50aHVtYm5haWwgfHwgYXJ0LmVuY2xvc3VyZT8udGh1bWJuYWlsIHx8ICdodHRwczovL25ld3MuYmJjaW1nLmNvLnVrL25vbC9zaGFyZWQvaW1nL2JiY19uZXdzXzEyMHg2MC5naWYnO1xuICAgICAgdGh1bWJuYWlsID0gdXBncmFkZUJCQ0ltYWdlUmVzb2x1dGlvbih0aHVtYm5haWwpO1xuICAgICAgY29uc3QgY29sbGFwc2VkID0gaXNSZWFkKCdiYmMnLCBpZCk7XG4gICAgICBpZiAoY29sbGFwc2VkKSB7IGFkZFRvUmVhZExpc3QoJ2JiYycsIHsgaWQsIHRpdGxlOiBhcnQudGl0bGUsIGhyZWY6IGxpbmsgfSk7IGNvbnRpbnVlOyB9XG4gICAgICBlbC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIGBcbiAgICAgICAgPGRpdiBjbGFzcz1cImFydGljbGUgZ2xhc3Mgcm91bmRlZC0yeGwgcC00IGNhcmQtaG92ZXIke2NvbGxhcHNlZCA/ICcgY29sbGFwc2VkJyA6ICcnfVwiIGRhdGEtc291cmNlPVwiYmJjXCIgZGF0YS1pZD1cIiR7aWR9XCI+XG4gICAgICAgICAgPGEgY2xhc3M9XCJhcnRpY2xlLWxpbmsgYmxvY2tcIiBocmVmPVwiJHtsaW5rfVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vcmVmZXJyZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoLTMyIHctZnVsbCByb3VuZGVkLWxnIG92ZXJmbG93LWhpZGRlbiBtYi0zIGJnLXNsYXRlLTgwMC81MFwiPlxuICAgICAgICAgICAgICA8aW1nIHNyYz1cIiR7dGh1bWJuYWlsfVwiIGFsdD1cIiR7YXJ0LnRpdGxlfVwiIGNsYXNzPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXIgYXJ0aWNsZS1pbWFnZVwiIGxvYWRpbmc9XCJsYXp5XCIgb25lcnJvcj1cInRoaXMuc3R5bGUuZGlzcGxheT0nbm9uZSc7IHRoaXMucGFyZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdiZy1zbGF0ZS04MDAvNTAnKTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRleHQtc20gdGV4dC1zbGF0ZS0zMDAvNzAgYXJ0aWNsZS1tZXRhXCI+JHt3aGVufTwvZGl2PlxuICAgICAgICAgICAgPGgzIGNsYXNzPVwibXQtMSBmb250LXNlbWlib2xkIGxlYWRpbmctc251Z1wiPiR7YXJ0LnRpdGxlLnJlcGxhY2UoLzwvZywnJmx0OycpfTwvaDM+XG4gICAgICAgICAgPC9hPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJhcnRpY2xlLXRvZ2dsZSBnbGFzcyBweC0yIHB5LTEgcm91bmRlZC1tZCB0ZXh0LXhzXCIgdHlwZT1cImJ1dHRvblwiIGFyaWEtbGFiZWw9XCJUb2dnbGUgcmVhZFwiPiR7Y29sbGFwc2VkID8gJ01hcmsgdW5yZWFkJyA6ICdNYXJrIHJlYWQnfTwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGApO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkuYWxsb3JpZ2lucy53aW4vcmF3P3VybD1odHRwczovL2ZlZWRzLmJiY2kuY28udWsvbmV3cy9yc3MueG1sJyk7XG4gICAgICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKCdCQkMgUlNTIGZhbGxiYWNrIGZldGNoIGZhaWxlZCcpO1xuICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlcy50ZXh0KCk7XG4gICAgICBjb25zdCB4bWwgPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKHRleHQsICd0ZXh0L3htbCcpO1xuICAgICAgY29uc3QgaXRlbXMgPSBBcnJheS5mcm9tKHhtbC5xdWVyeVNlbGVjdG9yQWxsKCdpdGVtJykpLnNsaWNlKDAsIDEwKS5tYXAoaXRlbSA9PiAoeyBcbiAgICAgICAgdGl0bGU6IGl0ZW0ucXVlcnlTZWxlY3RvcigndGl0bGUnKT8udGV4dENvbnRlbnQgfHwgJ1VudGl0bGVkJywgXG4gICAgICAgIGxpbms6IGl0ZW0ucXVlcnlTZWxlY3RvcignbGluaycpPy50ZXh0Q29udGVudCB8fCAnIycsIFxuICAgICAgICBwdWJEYXRlOiBpdGVtLnF1ZXJ5U2VsZWN0b3IoJ3B1YkRhdGUnKT8udGV4dENvbnRlbnQgfHwgJycsXG4gICAgICAgIHRodW1ibmFpbDogaXRlbS5xdWVyeVNlbGVjdG9yKCdtZWRpYVxcXFw6dGh1bWJuYWlsJyk/LmdldEF0dHJpYnV0ZSgndXJsJykgfHwgXG4gICAgICAgICAgICAgICAgICBpdGVtLnF1ZXJ5U2VsZWN0b3IoJ2VuY2xvc3VyZVt0eXBlPVwiaW1hZ2UvanBlZ1wiXScpPy5nZXRBdHRyaWJ1dGUoJ3VybCcpIHx8IFxuICAgICAgICAgICAgICAgICAgaXRlbS5xdWVyeVNlbGVjdG9yKCdlbmNsb3N1cmVbdHlwZT1cImltYWdlL3BuZ1wiXScpPy5nZXRBdHRyaWJ1dGUoJ3VybCcpIHx8XG4gICAgICAgICAgICAgICAgICAnaHR0cHM6Ly9uZXdzLmJiY2ltZy5jby51ay9ub2wvc2hhcmVkL2ltZy9iYmNfbmV3c18xMjB4NjAuZ2lmJ1xuICAgICAgfSkpO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JiY1VwZGF0ZWQnKS50ZXh0Q29udGVudCA9IGBVcGRhdGVkICR7bmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJyx7aG91cjonMi1kaWdpdCcsbWludXRlOicyLWRpZ2l0J30pLmZvcm1hdChuZXcgRGF0ZSgpKX0gKGZhbGxiYWNrKWA7XG4gICAgICBlbC5pbm5lckhUTUwgPSAnJztcbiAgICAgIGZvciAoY29uc3QgYXJ0IG9mIGl0ZW1zKSB7XG4gICAgICAgIGNvbnN0IHQgPSBuZXcgRGF0ZShhcnQucHViRGF0ZSk7XG4gICAgICAgIGNvbnN0IHdoZW4gPSBpc05hTih0KSA/ICcnIDogbmV3IEludGwuRGF0ZVRpbWVGb3JtYXQoJ2VuLUdCJywgeyBkYXk6JzItZGlnaXQnLCBtb250aDonc2hvcnQnLCBob3VyOicyLWRpZ2l0JywgbWludXRlOicyLWRpZ2l0JyB9KS5mb3JtYXQodCk7XG4gICAgICAgIGxldCBsaW5rID0gYXJ0Lmxpbms7XG4gICAgICAgIGNvbnN0IGlkID0gbGluayB8fCBhcnQuZ3VpZCB8fCBhcnQudGl0bGU7XG4gICAgICAgIGlmIChsaW5rLmluY2x1ZGVzKCdiYmMuY29tJykpIHtcbiAgICAgICAgICBsaW5rID0gbGluay5yZXBsYWNlKCdiYmMuY29tJywgJ2JiYy5jby51aycpO1xuICAgICAgICB9XG4gICAgICAgIGxldCB0aHVtYm5haWwgPSB1cGdyYWRlQkJDSW1hZ2VSZXNvbHV0aW9uKGFydC50aHVtYm5haWwpO1xuICAgICAgICBjb25zdCBjb2xsYXBzZWQgPSBpc1JlYWQoJ2JiYycsIGlkKTtcbiAgICAgICAgaWYgKGNvbGxhcHNlZCkgeyBhZGRUb1JlYWRMaXN0KCdiYmMnLCB7IGlkLCB0aXRsZTogYXJ0LnRpdGxlLCBocmVmOiBsaW5rIH0pOyBjb250aW51ZTsgfVxuICAgICAgICBlbC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIGBcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aWNsZSBnbGFzcyByb3VuZGVkLTJ4bCBwLTQgY2FyZC1ob3ZlciR7Y29sbGFwc2VkID8gJyBjb2xsYXBzZWQnIDogJyd9XCIgZGF0YS1zb3VyY2U9XCJiYmNcIiBkYXRhLWlkPVwiJHtpZH1cIj5cbiAgICAgICAgICAgIDxhIGNsYXNzPVwiYXJ0aWNsZS1saW5rIGJsb2NrXCIgaHJlZj1cIiR7bGlua31cIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub3JlZmVycmVyXCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoLTMyIHctZnVsbCByb3VuZGVkLWxnIG92ZXJmbG93LWhpZGRlbiBtYi0zIGJnLXNsYXRlLTgwMC81MFwiPlxuICAgICAgICAgICAgICAgIDxpbWcgc3JjPVwiJHt0aHVtYm5haWx9XCIgYWx0PVwiJHthcnQudGl0bGV9XCIgY2xhc3M9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlciBhcnRpY2xlLWltYWdlXCIgbG9hZGluZz1cImxhenlcIiBvbmVycm9yPVwidGhpcy5zdHlsZS5kaXNwbGF5PSdub25lJzsgdGhpcy5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2JnLXNsYXRlLTgwMC81MCcpO1wiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRleHQtc20gdGV4dC1zbGF0ZS0zMDAvNzAgYXJ0aWNsZS1tZXRhXCI+JHt3aGVufTwvZGl2PlxuICAgICAgICAgICAgICA8aDMgY2xhc3M9XCJtdC0xIGZvbnQtc2VtaWJvbGQgbGVhZGluZy1zbnVnXCI+JHthcnQudGl0bGUucmVwbGFjZSgvPC9nLCcmbHQ7Jyl9PC9oMz5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJhcnRpY2xlLXRvZ2dsZSBnbGFzcyBweC0yIHB5LTEgcm91bmRlZC1tZCB0ZXh0LXhzXCIgdHlwZT1cImJ1dHRvblwiIGFyaWEtbGFiZWw9XCJUb2dnbGUgcmVhZFwiPiR7Y29sbGFwc2VkID8gJ01hcmsgdW5yZWFkJyA6ICdNYXJrIHJlYWQnfTwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChmYWxsYmFja0Vycm9yKSB7XG4gICAgICBlbC5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cImdsYXNzIHJvdW5kZWQtMnhsIHAtNCB0ZXh0LXNtXCI+RmFpbGVkIHRvIGxvYWQgQkJDLiAke2UubWVzc2FnZX0gKGZhbGxiYWNrIGFsc28gZmFpbGVkOiAke2ZhbGxiYWNrRXJyb3IubWVzc2FnZX0pPC9kaXY+YDtcbiAgICB9XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLSBPcmNoZXN0cmF0ZSAtLS0tLS0tLS0tXG5hc3luYyBmdW5jdGlvbiBsb2FkQWxsKCkge1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2xvYWRpbmcnKTtcbiAgYXdhaXQgUHJvbWlzZS5hbGxTZXR0bGVkKFtsb2FkV2VhdGhlcigpLCBpbml0UmFkYXIoKSwgbG9hZFJlZGRpdCgpLCBsb2FkQkJDKCldKTtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gIGlmICh3aW5kb3cubHVjaWRlKSBsdWNpZGUuY3JlYXRlSWNvbnMoKTtcbn1cblxuZnVuY3Rpb24gc3RhcnRMaXZlRGF0ZVRpbWUoKSB7XG4gIHVwZGF0ZUxpdmVEYXRlVGltZSgpO1xuICBzZXRJbnRlcnZhbCh1cGRhdGVMaXZlRGF0ZVRpbWUsIDEwMDApO1xufVxuXG4vLyAtLS0tLS0tLS0tIE5hdmlnYXRpb24gTWVudSAtLS0tLS0tLS0tXG5mdW5jdGlvbiBpbml0TmF2aWdhdGlvbigpIHtcbiAgY29uc3QgbmF2TWVudSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZNZW51Jyk7XG4gIGNvbnN0IG5hdlRvZ2dsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXZUb2dnbGUnKTtcbiAgY29uc3QgbmF2Q2xvc2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF2Q2xvc2UnKTtcbiAgY29uc3QgbmF2TGlua3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubmF2LWxpbmsnKTtcblxuICBmdW5jdGlvbiB0b2dnbGVOYXYoKSB7XG4gICAgY29uc3QgaXNWaXNpYmxlID0gbmF2TWVudS5jbGFzc0xpc3QuY29udGFpbnMoJ3Nob3cnKTtcbiAgICBpZiAoaXNWaXNpYmxlKSB7XG4gICAgICBuYXZNZW51LmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF2TWVudS5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xvc2VOYXYoKSB7XG4gICAgbmF2TWVudS5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gIH1cblxuICBmdW5jdGlvbiBzbW9vdGhTY3JvbGxUb1NlY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCB0YXJnZXRJZCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykuc3Vic3RyaW5nKDEpO1xuICAgIGNvbnN0IHRhcmdldFNlY3Rpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YXJnZXRJZCk7XG4gICAgaWYgKHRhcmdldFNlY3Rpb24pIHtcbiAgICAgIGNvbnN0IGhlYWRlckhlaWdodCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2hlYWRlcicpLm9mZnNldEhlaWdodDtcbiAgICAgIGNvbnN0IG5hdkhlaWdodCA9IG5hdk1lbnUub2Zmc2V0SGVpZ2h0O1xuICAgICAgY29uc3QgdG90YWxPZmZzZXQgPSBoZWFkZXJIZWlnaHQgKyBuYXZIZWlnaHQgKyAyMDtcbiAgICAgIGNvbnN0IHRhcmdldFBvc2l0aW9uID0gdGFyZ2V0U2VjdGlvbi5vZmZzZXRUb3AgLSB0b3RhbE9mZnNldDtcbiAgICAgIHdpbmRvdy5zY3JvbGxUbyh7IHRvcDogdGFyZ2V0UG9zaXRpb24sIGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgICAgIGlmICh3aW5kb3cuaW5uZXJXaWR0aCA8IDc2OCkge1xuICAgICAgICBjbG9zZU5hdigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG5hdlRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZU5hdik7XG4gIG5hdkNsb3NlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xvc2VOYXYpO1xuICBuYXZMaW5rcy5mb3JFYWNoKGxpbmsgPT4gbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNtb290aFNjcm9sbFRvU2VjdGlvbikpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgaWYgKCFuYXZNZW51LmNvbnRhaW5zKGUudGFyZ2V0KSAmJiAhbmF2VG9nZ2xlLmNvbnRhaW5zKGUudGFyZ2V0KSkge1xuICAgICAgY2xvc2VOYXYoKTtcbiAgICB9XG4gIH0pO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHtcbiAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgICBjbG9zZU5hdigpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8vIC0tLS0tLS0tLS0gQXJ0aWNsZSByZWFkL2NvbGxhcHNlIGludGVyYWN0aW9ucyAtLS0tLS0tLS0tXG5mdW5jdGlvbiBpbml0QXJ0aWNsZUludGVyYWN0aW9ucygpIHtcbiAgZnVuY3Rpb24gaGFuZGxlVG9nZ2xlKGUpIHtcbiAgICBjb25zdCBidG4gPSBlLnRhcmdldC5jbG9zZXN0KCcuYXJ0aWNsZS10b2dnbGUnKTtcbiAgICBpZiAoIWJ0bikgcmV0dXJuO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBhcnRpY2xlID0gYnRuLmNsb3Nlc3QoJy5hcnRpY2xlJyk7XG4gICAgaWYgKCFhcnRpY2xlKSByZXR1cm47XG4gICAgY29uc3QgaWQgPSBhcnRpY2xlLmdldEF0dHJpYnV0ZSgnZGF0YS1pZCcpO1xuICAgIGNvbnN0IHNvdXJjZSA9IGFydGljbGUuZ2V0QXR0cmlidXRlKCdkYXRhLXNvdXJjZScpO1xuICAgIGNvbnN0IGlzTWFya2luZ1JlYWQgPSAhYXJ0aWNsZS5jbGFzc0xpc3QuY29udGFpbnMoJ2NvbGxhcHNlZCcpO1xuICAgIGlmIChpc01hcmtpbmdSZWFkKSB7XG4gICAgICAvLyBNYXJrIGFzIHJlYWQ6IGFuaW1hdGUgb3V0LCB0aGVuIG1vdmUgdG8gcmVhZCBsaXN0XG4gICAgICBhcnRpY2xlLmNsYXNzTGlzdC5hZGQoJ2NvbGxhcHNlZCcsICdmYWRlLW91dCcpO1xuICAgICAgbWFya1JlYWQoc291cmNlLCBpZCwgdHJ1ZSk7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgYXJ0aWNsZS5yZW1vdmUoKTtcbiAgICAgICAgYWRkVG9SZWFkTGlzdChzb3VyY2UsIHsgaWQsIHRpdGxlOiBhcnRpY2xlLnF1ZXJ5U2VsZWN0b3IoJ2gzJyk/LnRleHRDb250ZW50IHx8ICdVbnRpdGxlZCcsIGhyZWY6IGFydGljbGUucXVlcnlTZWxlY3RvcignYS5hcnRpY2xlLWxpbmsnKT8uZ2V0QXR0cmlidXRlKCdocmVmJykgfHwgJyMnfSk7XG4gICAgICB9LCAyMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBNYXJrIGFzIHVucmVhZDogcmVtb3ZlIGZyb20gcmVhZCBsaXN0IGFuZCByZS1yZW5kZXIgbGlzdHMgKHRyaWdnZXIgcmVsb2FkIG9mIHRoYXQgc291cmNlKVxuICAgICAgbWFya1JlYWQoc291cmNlLCBpZCwgZmFsc2UpO1xuICAgICAgcmVtb3ZlRnJvbVJlYWRMaXN0KHNvdXJjZSwgaWQpO1xuICAgIH1cbiAgfVxuICBcbiAgZnVuY3Rpb24gaGFuZGxlTWFya1VucmVhZChlKSB7XG4gICAgY29uc3QgYnRuID0gZS50YXJnZXQuY2xvc2VzdCgnLm1hcmstdW5yZWFkJyk7XG4gICAgaWYgKCFidG4pIHJldHVybjtcbiAgICBjb25zdCBpZCA9IGJ0bi5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWQnKTtcbiAgICBjb25zdCBzb3VyY2UgPSBidG4uZ2V0QXR0cmlidXRlKCdkYXRhLXNvdXJjZScpO1xuICAgIG1hcmtSZWFkKHNvdXJjZSwgaWQsIGZhbHNlKTtcbiAgICByZW1vdmVGcm9tUmVhZExpc3Qoc291cmNlLCBpZCk7XG4gICAgLy8gUmUtcmVuZGVyIHRoZSBtYWluIGxpc3QgdG8gc2hvdyB0aGUgdW5tYXJrZWQgaXRlbVxuICAgIGlmIChzb3VyY2UgPT09ICdyZWRkaXQnKSBsb2FkUmVkZGl0KCk7XG4gICAgZWxzZSBpZiAoc291cmNlID09PSAnYmJjJykgbG9hZEJCQygpO1xuICB9XG4gIFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVkZGl0TGlzdCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZVRvZ2dsZSk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiYmNMaXN0Jyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlVG9nZ2xlKTtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlYWRSZWRkaXRMaXN0Jyk/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlTWFya1VucmVhZCk7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWFkQmJjTGlzdCcpPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZU1hcmtVbnJlYWQpO1xufVxuXG5mdW5jdGlvbiBhZGRUb1JlYWRMaXN0KHNvdXJjZSwgaXRlbSkge1xuICBjb25zdCB0YXJnZXQgPSBzb3VyY2UgPT09ICdyZWRkaXQnID8gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlYWRSZWRkaXRMaXN0JykgOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVhZEJiY0xpc3QnKTtcbiAgaWYgKCF0YXJnZXQpIHJldHVybjtcbiAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICBsaS5kYXRhc2V0LmlkID0gaXRlbS5pZDtcbiAgbGkuY2xhc3NOYW1lID0gJ2ZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBncm91cCc7XG4gIGxpLmlubmVySFRNTCA9IGBcbiAgICA8YSBjbGFzcz1cInVuZGVybGluZSBkZWNvcmF0aW9uLWRvdHRlZCBmbGV4LTFcIiBocmVmPVwiJHtpdGVtLmhyZWZ9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9yZWZlcnJlclwiPiR7aXRlbS50aXRsZS5yZXBsYWNlKC88L2csJyZsdDsnKX08L2E+XG4gICAgPGJ1dHRvbiBjbGFzcz1cIm1hcmstdW5yZWFkIGdsYXNzIHB4LTIgcHktMSByb3VuZGVkIHRleHQteHMgb3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHRyYW5zaXRpb24tb3BhY2l0eVwiIGRhdGEtc291cmNlPVwiJHtzb3VyY2V9XCIgZGF0YS1pZD1cIiR7aXRlbS5pZH1cIj5NYXJrIHVucmVhZDwvYnV0dG9uPlxuICBgO1xuICB0YXJnZXQucHJlcGVuZChsaSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUZyb21SZWFkTGlzdChzb3VyY2UsIGlkKSB7XG4gIGNvbnN0IHRhcmdldCA9IHNvdXJjZSA9PT0gJ3JlZGRpdCcgPyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVhZFJlZGRpdExpc3QnKSA6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWFkQmJjTGlzdCcpO1xuICBpZiAoIXRhcmdldCkgcmV0dXJuO1xuICBjb25zdCBlbCA9IHRhcmdldC5xdWVyeVNlbGVjdG9yKGBsaVtkYXRhLWlkPVwiJHtDU1MuZXNjYXBlKGlkKX1cIl1gKTtcbiAgaWYgKGVsKSBlbC5yZW1vdmUoKTtcbn1cblxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlZnJlc2hCdG4nKT8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBsb2FkQWxsKCkpO1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG4gIGxvYWRBbGwoKTtcbiAgc3RhcnRMaXZlRGF0ZVRpbWUoKTtcbiAgaW5pdE5hdmlnYXRpb24oKTtcbiAgaW5pdEFydGljbGVJbnRlcmFjdGlvbnMoKTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7QUFDQSxNQUFNLFVBQVUsQ0FBQyxLQUFLLEtBQUssaUJBQWlCLE9BQU8sQ0FBQyxNQUFNLElBQUksS0FBSyxlQUFlLFNBQVMsRUFBRSxNQUFNLFdBQVcsUUFBUSxXQUFXLFFBQVEsT0FBTyxVQUFVLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxPQUFPLElBQUksS0FBSyxHQUFHLENBQUM7QUFDN0wsTUFBTSxjQUFjLENBQUMsS0FBSyxLQUFLLG9CQUFvQixJQUFJLEtBQUssZUFBZSxTQUFTLEVBQUUsU0FBUyxTQUFTLEtBQUssV0FBVyxPQUFPLFNBQVMsTUFBTSxXQUFXLFFBQVEsV0FBVyxRQUFRLE9BQU8sVUFBVSxHQUFHLENBQUMsRUFBRSxPQUFPLElBQUks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

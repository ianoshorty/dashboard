// ---------- Utilities ----------
const fmtTime = (iso, tz = 'Europe/London', opts = {}) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz, ...opts }).format(new Date(iso));
const fmtDateTime = (iso, tz = 'Europe/London') => new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date(iso));

// Safe localStorage helpers with graceful fallback
const _memoryStore = new Map();
function storageAvailable() {
  try {
    const x = '__dash_test__';
    window.localStorage.setItem(x, x);
    window.localStorage.removeItem(x);
    return true;
  } catch (_) { return false; }
}
const canPersist = storageAvailable();
function loadReadSet(source) {
  const key = `read:${source}`;
  if (canPersist) {
    try {
      const raw = window.localStorage.getItem(key);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (_) { /* ignore */ }
  }
  return new Set(_memoryStore.get(key) || []);
}
function saveReadSet(source, set) {
  const key = `read:${source}`;
  const arr = Array.from(set);
  if (canPersist) {
    try { window.localStorage.setItem(key, JSON.stringify(arr)); } catch (_) { /* ignore */ }
  } else {
    _memoryStore.set(key, arr);
  }
}
function markRead(source, id, isRead) {
  const set = loadReadSet(source);
  if (isRead) set.add(id); else set.delete(id);
  saveReadSet(source, set);
}
function isRead(source, id) {
  return loadReadSet(source).has(id);
}

// Update page heading with live date and time
function updateLiveDateTime() {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
  const liveDateTimeEl = document.getElementById('liveDateTime');
  if (liveDateTimeEl) {
    liveDateTimeEl.textContent = `${dateStr} at ${timeStr}`;
  }
}

const weatherCodeMap = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle', 56: 'Light freezing drizzle', 57: 'Dense freezing drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain', 66: 'Light freezing rain', 67: 'Heavy freezing rain', 71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Rain showers: slight', 81: 'Rain showers: moderate', 82: 'Rain showers: violent', 85: 'Snow showers: slight', 86: 'Snow showers: heavy', 95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail' };

// Function to upgrade BBC image resolution
function upgradeBBCImageResolution(imageUrl) {
  if (!imageUrl || !imageUrl.includes('ichef.bbci.co.uk')) return imageUrl;

  const sizeUpgrades = {
    '/120/': '/512/',
    '/240/': '/512/',
    '/480/': '/512/',
    '/640/': '/800/',
    '/800/': '/1024/'
  };

  for (const [smallSize, largeSize] of Object.entries(sizeUpgrades)) {
    if (imageUrl.includes(smallSize)) {
      return imageUrl.replace(smallSize, largeSize);
    }
  }

  return imageUrl;
}

// ---------- Weather (Open‑Meteo) ----------
const WEATHER_EL = { updated: document.getElementById('weatherUpdated'), skeleton: document.getElementById('weatherSkeleton'), currentTemp: document.getElementById('currentTemp'), tempRange: document.getElementById('tempRange'), avgRain: document.getElementById('avgRain'), conditionNow: document.getElementById('conditionNow'), nextRain: document.getElementById('nextRain'), nextRainDetail: document.getElementById('nextRainDetail') };

let weatherChart;
async function loadWeather() {
  const lat = 54.9783, lon = -1.6178; // Newcastle upon Tyne
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&timezone=Europe%2FLondon&forecast_days=2`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();
  const { time, temperature_2m, precipitation_probability, precipitation, weathercode } = data.hourly;
  const now = Date.now();
  let startIdx = time.findIndex(t => new Date(t).getTime() >= now);
  if (startIdx === -1) startIdx = 0;
  const range = [...Array(24)].map((_, i) => startIdx + i).filter(i => i < time.length);
  const labels = range.map(i => fmtTime(time[i]));
  const temps = range.map(i => temperature_2m[i]);
  const probs = range.map(i => precipitation_probability[i]);
  const precs = range.map(i => precipitation[i]);
  const nowCode = weathercode[startIdx];
  WEATHER_EL.currentTemp.textContent = `${Math.round(temperature_2m[startIdx] ?? temperature_2m.at(0))}°C`;
  WEATHER_EL.tempRange.textContent = `${Math.round(Math.min(...temps))}°C → ${Math.round(Math.max(...temps))}°C`;
  WEATHER_EL.avgRain.textContent = `${Math.round(probs.reduce((a,b)=>a+b,0) / probs.length)}%`;
  WEATHER_EL.conditionNow.textContent = weatherCodeMap[nowCode] || '—';
  WEATHER_EL.updated.textContent = `Updated ${new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
  let nextIdx = range.find(i => (precipitation_probability[i] >= 50) || (precipitation[i] >= 0.2));
  if (nextIdx === undefined) {
    let bestI = range[0]; let bestP = -1; for (const i of range) { if (precipitation_probability[i] > bestP) { bestP = precipitation_probability[i]; bestI = i; } }
    nextIdx = bestI; WEATHER_EL.nextRain.textContent = `No high chance soon — highest in next 24h at ${fmtDateTime(time[nextIdx])}`;
  } else { WEATHER_EL.nextRain.textContent = `Likely around ${fmtDateTime(time[nextIdx])}`; }
  WEATHER_EL.nextRainDetail.textContent = `Probability ${precipitation_probability[nextIdx]}%, expected precipitation ${precs[range.indexOf(nextIdx)] ?? precipitation[nextIdx]} mm.`;
  const ctx = document.getElementById('weatherChart').getContext('2d');
  WEATHER_EL.skeleton.style.display = 'none';
  if (weatherChart) weatherChart.destroy();
  weatherChart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [ { type: 'line', label: 'Temperature (°C)', data: temps, yAxisID: 'y', tension: 0.35, borderWidth: 2, pointRadius: 0 }, { type: 'bar', label: 'Precipitation Probability (%)', data: probs, yAxisID: 'y1', borderWidth: 0 } ] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { position: 'left', ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(148,163,184,0.15)' } }, y1: { position: 'right', ticks: { color: '#cbd5e1' }, grid: { drawOnChartArea: false } }, x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(148,163,184,0.1)' } } }, plugins: { legend: { labels: { color: '#e2e8f0' } }, tooltip: { callbacks: { title: (items) => `Hour: ${items[0].label}` } } }, animation: { duration: 900 } } });
}

// ---------- Radar (RainViewer over Leaflet) ----------
let radarMap, radarFrames = [], radarLayers = [], radarIndex = 0, radarTimer = null;

async function initRadar() {
  const center = [54.9783, -1.6178]; // Newcastle upon Tyne
  radarMap = L.map('radarMap', { zoomControl: true, attributionControl: true }).setView(center, 7);
  const base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' });
  base.addTo(radarMap);
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!res.ok) throw new Error('Radar metadata fetch failed');
    const json = await res.json();
    const allFrames = [...(json.radar?.past||[]), ...(json.radar?.nowcast||[])];
    const cutoff = Date.now() - 4*60*60*1000; // last 4 hours
    radarFrames = allFrames.filter(f => (f.time*1000) >= cutoff);
    if (radarFrames.length === 0) { document.getElementById('radarMap').innerHTML = '<div class="p-3 text-sm">No radar frames available right now.</div>'; return; }
    radarLayers = radarFrames.map(f => L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${f.time}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: 0.7, attribution: 'Radar © <a href="https://rainviewer.com">RainViewer</a>' }));
    radarIndex = radarLayers.length - 1;
    radarLayers[radarIndex].addTo(radarMap);
    updateRadarTimeLabel();
    const playBtn = document.getElementById('radarPlay');
    playBtn.addEventListener('click', toggleRadar);
    document.getElementById('radarPrev').addEventListener('click', () => stepRadar(-1));
    document.getElementById('radarNext').addEventListener('click', () => stepRadar(1));
    toggleRadar();
  } catch (e) {
    document.getElementById('radarMap').innerHTML = `<div class="p-3 text-sm">Failed to load radar. ${e.message}</div>`;
  }
}

function updateRadarTimeLabel() {
  const ts = radarFrames[radarIndex]?.time*1000;
  if (!ts) return;
  document.getElementById('radarTime').textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
}

function stepRadar(dir = 1) {
  if (!radarLayers.length) return;
  radarLayers[radarIndex]?.remove();
  radarIndex = (radarIndex + dir + radarLayers.length) % radarLayers.length;
  radarLayers[radarIndex].addTo(radarMap);
  updateRadarTimeLabel();
}

function toggleRadar() {
  const btn = document.getElementById('radarPlay');
  if (radarTimer) { clearInterval(radarTimer); radarTimer = null; btn.textContent = 'Play'; return; }
  btn.textContent = 'Pause';
  radarTimer = setInterval(() => stepRadar(1), 600);
}

// ---------- Reddit Popular Hot 20 ----------
async function loadReddit() {
  const el = document.getElementById('redditList');
  el.innerHTML = '';
  el.insertAdjacentHTML('beforeend', Array.from({length: 8}).map(() => `
    <div class="glass rounded-2xl p-4 card-hover">
      <div class="h-32 w-full rounded-lg skeleton animate-shimmer mb-3"></div>
      <div class="h-5 w-3/4 rounded-md skeleton animate-shimmer"></div>
      <div class="mt-3 h-4 w-1/2 rounded-md skeleton animate-shimmer"></div>
      <div class="mt-3 h-8 w-24 rounded-lg skeleton animate-shimmer"></div>
    </div>`).join(''));
  try {
    const res = await fetch('https://www.reddit.com/r/popular/hot.json?limit=20');
    if (!res.ok) throw new Error('Reddit fetch failed');
    const json = await res.json();
    const items = json.data.children.map(c => c.data);
    document.getElementById('redditUpdated').textContent = `Updated ${new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
    el.innerHTML = '';
    for (const post of items) {
      const url = `https://www.reddit.com${post.permalink}`;
      const id = post.id || post.permalink;
      const flair = post.link_flair_text ? `<span class='ml-2 text-xs px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10'>${post.link_flair_text}</span>` : '';
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
      } else if (post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default' && post.thumbnail !== 'nsfw') {
        imageUrl = post.thumbnail;
      } else if (post.url && (post.url.includes('.jpg') || post.url.includes('.jpeg') || post.url.includes('.png') || post.url.includes('.gif'))) {
        imageUrl = post.url;
      }
      if (imageUrl && imageUrl.includes('reddit.com')) {
        imageUrl = imageUrl.split('?')[0];
      }
      const collapsed = isRead('reddit', id);
      el.insertAdjacentHTML('beforeend', `
        <div class="article glass rounded-2xl p-4 card-hover${collapsed ? ' collapsed' : ''}" data-source="reddit" data-id="${id}">
          <a class="article-link block" href="${url}" target="_blank" rel="noreferrer">
            ${imageUrl ? `
              <div class="h-32 w-full rounded-lg overflow-hidden mb-3 bg-slate-800/50">
                <img src="${imageUrl}" alt="${post.title}" class="w-full h-full object-cover article-image" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('bg-slate-800/50');">
              </div>
            ` : ''}
            <div class="text-sm text-slate-300/70 article-meta">r/${post.subreddit} • ⬆︎ ${post.ups.toLocaleString('en-GB')}</div>
            <h3 class="mt-1 font-semibold leading-snug">${post.title.replace(/</g,'&lt;')}</h3>
            <div class="mt-3 inline-flex items-center text-xs text-slate-300/80 article-meta">by u/${post.author}${flair}</div>
          </a>
          <button class="article-toggle glass px-2 py-1 rounded-md text-xs" type="button" aria-label="Toggle read">${collapsed ? 'Mark unread' : 'Mark read'}</button>
        </div>
      `);
    }
  } catch (e) { el.innerHTML = `<div class="glass rounded-2xl p-4 text-sm">Failed to load Reddit. ${e.message}</div>`; }
}

// ---------- BBC Latest via RSS (CORS‑friendly reader) ----------
async function loadBBC() {
  const el = document.getElementById('bbcList');
  el.innerHTML = Array.from({length: 6}).map(() => `
    <div class="glass rounded-2xl p-4 card-hover">
      <div class="h-32 w-full rounded-lg skeleton animate-shimmer mb-3"></div>
      <div class="h-5 w-2/3 rounded-md skeleton animate-shimmer"></div>
      <div class="mt-3 h-4 w-1/2 rounded-md skeleton animate-shimmer"></div>
    </div>`).join('');

  try {
    const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/rss.xml');
    if (!res.ok) throw new Error('BBC RSS fetch failed');
    const json = await res.json();
    if (json.status !== 'ok' || !json.items) {
      throw new Error('Invalid RSS response format');
    }
    const items = json.items.slice(0, 10);
    document.getElementById('bbcUpdated').textContent = `Updated ${new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
    el.innerHTML = '';
    for (const art of items) {
      const t = new Date(art.pubDate);
      const when = isNaN(t) ? '' : new Intl.DateTimeFormat('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }).format(t);
      let link = art.link;
      const id = link || art.guid || art.title;
      if (link.includes('bbc.com')) {
        link = link.replace('bbc.com', 'bbc.co.uk');
      }
      let thumbnail = art.thumbnail || art.enclosure?.thumbnail || 'https://news.bbcimg.co.uk/nol/shared/img/bbc_news_120x60.gif';
      thumbnail = upgradeBBCImageResolution(thumbnail);
      const collapsed = isRead('bbc', id);
      el.insertAdjacentHTML('beforeend', `
        <div class="article glass rounded-2xl p-4 card-hover${collapsed ? ' collapsed' : ''}" data-source="bbc" data-id="${id}">
          <a class="article-link block" href="${link}" target="_blank" rel="noreferrer">
            <div class="h-32 w-full rounded-lg overflow-hidden mb-3 bg-slate-800/50">
              <img src="${thumbnail}" alt="${art.title}" class="w-full h-full object-cover article-image" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('bg-slate-800/50');">
            </div>
            <div class="text-sm text-slate-300/70 article-meta">${when}</div>
            <h3 class="mt-1 font-semibold leading-snug">${art.title.replace(/</g,'&lt;')}</h3>
          </a>
          <button class="article-toggle glass px-2 py-1 rounded-md text-xs" type="button" aria-label="Toggle read">${collapsed ? 'Mark unread' : 'Mark read'}</button>
        </div>
      `);
    }
  } catch (e) {
    try {
      const res = await fetch('https://api.allorigins.win/raw?url=https://feeds.bbci.co.uk/news/rss.xml');
      if (!res.ok) throw new Error('BBC RSS fallback fetch failed');
      const text = await res.text();
      const xml = new DOMParser().parseFromString(text, 'text/xml');
      const items = Array.from(xml.querySelectorAll('item')).slice(0, 10).map(item => ({ 
        title: item.querySelector('title')?.textContent || 'Untitled', 
        link: item.querySelector('link')?.textContent || '#', 
        pubDate: item.querySelector('pubDate')?.textContent || '',
        thumbnail: item.querySelector('media\\:thumbnail')?.getAttribute('url') || 
                  item.querySelector('enclosure[type="image/jpeg"]')?.getAttribute('url') || 
                  item.querySelector('enclosure[type="image/png"]')?.getAttribute('url') ||
                  'https://news.bbcimg.co.uk/nol/shared/img/bbc_news_120x60.gif'
      }));
      document.getElementById('bbcUpdated').textContent = `Updated ${new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date())} (fallback)`;
      el.innerHTML = '';
      for (const art of items) {
        const t = new Date(art.pubDate);
        const when = isNaN(t) ? '' : new Intl.DateTimeFormat('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }).format(t);
        let link = art.link;
        const id = link || art.guid || art.title;
        if (link.includes('bbc.com')) {
          link = link.replace('bbc.com', 'bbc.co.uk');
        }
        let thumbnail = upgradeBBCImageResolution(art.thumbnail);
        const collapsed = isRead('bbc', id);
        el.insertAdjacentHTML('beforeend', `
          <div class="article glass rounded-2xl p-4 card-hover${collapsed ? ' collapsed' : ''}" data-source="bbc" data-id="${id}">
            <a class="article-link block" href="${link}" target="_blank" rel="noreferrer">
              <div class="h-32 w-full rounded-lg overflow-hidden mb-3 bg-slate-800/50">
                <img src="${thumbnail}" alt="${art.title}" class="w-full h-full object-cover article-image" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('bg-slate-800/50');">
              </div>
              <div class="text-sm text-slate-300/70 article-meta">${when}</div>
              <h3 class="mt-1 font-semibold leading-snug">${art.title.replace(/</g,'&lt;')}</h3>
            </a>
            <button class="article-toggle glass px-2 py-1 rounded-md text-xs" type="button" aria-label="Toggle read">${collapsed ? 'Mark unread' : 'Mark read'}</button>
          </div>
        `);
      }
    } catch (fallbackError) {
      el.innerHTML = `<div class="glass rounded-2xl p-4 text-sm">Failed to load BBC. ${e.message} (fallback also failed: ${fallbackError.message})</div>`;
    }
  }
}

// ---------- Orchestrate ----------
async function loadAll() {
  document.body.classList.add('loading');
  await Promise.allSettled([loadWeather(), initRadar(), loadReddit(), loadBBC()]);
  document.body.classList.remove('loading');
  if (window.lucide) lucide.createIcons();
}

function startLiveDateTime() {
  updateLiveDateTime();
  setInterval(updateLiveDateTime, 1000);
}

// ---------- Navigation Menu ----------
function initNavigation() {
  const navMenu = document.getElementById('navMenu');
  const navToggle = document.getElementById('navToggle');
  const navClose = document.getElementById('navClose');
  const navLinks = document.querySelectorAll('.nav-link');

  function toggleNav() {
    const isVisible = !navMenu.classList.contains('-translate-y-full');
    if (isVisible) {
      navMenu.classList.add('-translate-y-full', 'opacity-0');
    } else {
      navMenu.classList.remove('-translate-y-full', 'opacity-0');
    }
  }

  function closeNav() {
    navMenu.classList.add('-translate-y-full', 'opacity-0');
  }

  function smoothScrollToSection(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href').substring(1);
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      const headerHeight = document.querySelector('header').offsetHeight;
      const navHeight = navMenu.offsetHeight;
      const totalOffset = headerHeight + navHeight + 20;
      const targetPosition = targetSection.offsetTop - totalOffset;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      if (window.innerWidth < 768) {
        closeNav();
      }
    }
  }

  navToggle.addEventListener('click', toggleNav);
  navClose.addEventListener('click', closeNav);
  navLinks.forEach(link => link.addEventListener('click', smoothScrollToSection));
  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      closeNav();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNav();
    }
  });
}

// ---------- Article read/collapse interactions ----------
function initArticleInteractions() {
  function handleToggle(e) {
    const btn = e.target.closest('.article-toggle');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const article = btn.closest('.article');
    if (!article) return;
    const id = article.getAttribute('data-id');
    const source = article.getAttribute('data-source');
    const nowCollapsed = !article.classList.contains('collapsed');
    article.classList.toggle('collapsed', nowCollapsed);
    btn.textContent = nowCollapsed ? 'Mark unread' : 'Mark read';
    markRead(source, id, nowCollapsed);
  }
  document.getElementById('redditList')?.addEventListener('click', handleToggle);
  document.getElementById('bbcList')?.addEventListener('click', handleToggle);
}

document.getElementById('refreshBtn')?.addEventListener('click', () => loadAll());
window.addEventListener('DOMContentLoaded', () => {
  loadAll();
  startLiveDateTime();
  initNavigation();
  initArticleInteractions();
});

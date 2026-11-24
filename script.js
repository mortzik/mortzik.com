// Hero: full-screen slideshow of installation photos, with a short glitch as each photo arrives
(() => {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const slides = [...hero.querySelectorAll(".slide")];
  const count = hero.querySelector(".slide-count");
  const cap = hero.querySelector(".slide-cap");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const INTERVAL = 6500;
  const pad = n => String(n).padStart(2, "0");
  let i = 0, timer = 0;

  // load the remaining photos once the page is ready
  window.addEventListener("load", () => {
    slides.forEach(s => {
      const img = s.querySelector("img[data-src]");
      if (img) { img.src = img.dataset.src; img.removeAttribute("data-src"); }
    });
  });

  function show(n) {
    slides[i].classList.remove("is-active", "glitch");
    i = (n + slides.length) % slides.length;
    const s = slides[i];
    void s.offsetWidth; // restart the drift animation
    s.classList.add("is-active");
    if (!reduced) s.classList.add("glitch");
    if (count) count.textContent = `${pad(i + 1)} / ${pad(slides.length)}`;
    if (cap) cap.textContent = s.dataset.caption || "";
  }
  const start = () => { clearInterval(timer); if (slides.length > 1) timer = setInterval(() => show(i + 1), INTERVAL); };
  document.addEventListener("visibilitychange", () => { clearInterval(timer); if (!document.hidden) start(); });
  start();
})();

// Lightbox for the gallery
(() => {
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  const img = lb.querySelector("img"), cap = lb.querySelector(".lb-cap");
  const close = () => { lb.hidden = true; img.src = ""; };
  document.querySelectorAll(".shot").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    img.src = a.href; img.alt = a.dataset.caption; cap.textContent = a.dataset.caption;
    lb.hidden = false;
  }));
  lb.addEventListener("click", e => { if (e.target !== img) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
})();

// YouTube player: a playlist link, or a list of single video links
(() => {
  const box = document.querySelector(".video");
  if (!box) return;
  const frame = box.querySelector("iframe");
  const base = "https://www.youtube-nocookie.com/embed/";
  const idFrom = url => {
    const m = String(url).match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : (/^[\w-]{11}$/.test(url) ? url : null);
  };
  const listFrom = url => {
    const m = String(url).match(/[?&]list=([\w-]+)/);
    return m ? m[1] : (/^(PL|UU|OL|FL|RD)[\w-]+$/.test(url) ? url : null);
  };
  const params = "rel=0&modestbranding=1&color=white";

  const pl = listFrom(box.dataset.playlist || "");
  if (pl) { frame.src = `${base}videoseries?list=${pl}&${params}`; return; }

  const buttons = [...box.querySelectorAll(".video-list button")];
  const ids = buttons.map(b => idFrom(b.dataset.url));
  const play = (i, autoplay) => {
    const id = ids[i];
    if (!id) return;
    // YouTube plays the "playlist" queue from its first entry, so the chosen
    // video must lead the queue, followed by the rest of the list in order.
    const queue = [id].concat(ids.slice(i + 1), ids.slice(0, i)).filter(Boolean).join(",");
    frame.src = `${base}${id}?${params}&playlist=${queue}${autoplay ? "&autoplay=1" : ""}`;
    buttons.forEach((b, j) => b.setAttribute("aria-current", String(j === i)));
  };
  buttons.forEach((b, i) => b.addEventListener("click", () => play(i, true)));
  const first = ids.findIndex(Boolean);
  if (first >= 0) play(first, false);
  else {
    // a single video link with no list shown
    const one = idFrom(box.dataset.playlist || "");
    if (one) frame.src = `${base}${one}?${params}`;
  }
})();

// Turn @handles in project text and credits into Instagram links
(() => {
  const RE = /(^|[\s(,·])@([A-Za-z0-9_](?:[A-Za-z0-9_.]{0,28}[A-Za-z0-9_])?)/g;
  document.querySelectorAll(".work .desc, .work .credit, .releases .c").forEach(root => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (!walker.currentNode.parentElement.closest("a")) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const text = node.nodeValue;
      if (!RE.test(text)) return;
      RE.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0, m;
      while ((m = RE.exec(text))) {
        const start = m.index + m[1].length;
        frag.append(text.slice(last, start));
        const a = document.createElement("a");
        a.href = `https://www.instagram.com/${m[2]}/`;
        a.target = "_blank"; a.rel = "noopener";
        a.textContent = "@" + m[2];
        frag.append(a);
        last = start + 1 + m[2].length;
      }
      frag.append(text.slice(last));
      node.replaceWith(frag);
    });
  });
})();

// Phone menu
(() => {
  const nav = document.querySelector(".nav");
  const btn = nav && nav.querySelector(".menu-toggle");
  if (!btn) return;
  const set = open => {
    nav.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
  };
  btn.addEventListener("click", () => set(!nav.classList.contains("open")));
  nav.querySelectorAll("nav a").forEach(a => a.addEventListener("click", () => set(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 760) set(false); });
})();

// Always start at the top after a refresh, and keep section links out of the address bar
(() => {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  const isReload = nav ? nav.type === "reload" : (performance.navigation && performance.navigation.type === 1);
  if (isReload || !location.hash) {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo(0, 0);
    window.addEventListener("load", () => window.scrollTo(0, 0));
  }
  // in-page links scroll smoothly without adding #section to the URL
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const id = a.getAttribute("href").slice(1);
    const target = id === "top" ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (id === "top") window.scrollTo({ top: 0, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  }));
})();

// SoundCloud player: SoundCloud's widget plays the audio in a hidden frame;
// this draws our own dark controls, the track's waveform and the track list.
(() => {
  const box = document.querySelector(".sc");
  if (!box) return;
  const url = box.dataset.url;
  const $ = s => box.querySelector(s);
  const engine = $(".sc-engine"), art = $(".sc-art"), title = $(".sc-title"), link = $(".sc-link");
  const playBtn = $(".sc-play"), wave = $(".sc-wave"), canvas = wave.querySelector("canvas");
  const cur = $(".sc-cur"), dur = $(".sc-dur"), list = $(".sc-list");
  const ctx = canvas.getContext("2d");
  let widget = null, sounds = [], index = 0, shown = -1, progress = 0, duration = 0, peaks = null, started = false;

  const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const bigArt = u => (u || "").replace("-large.", "-t300x300.");

  // ----- waveform -----
  function loadPeaks(sound) {
    peaks = null; draw();
    const w = sound && sound.waveform_url;
    if (!w) return;
    const jsonUrl = w.replace(/\.png(\?.*)?$/, ".json");
    fetch(jsonUrl).then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const s = d.samples || [], max = d.height || Math.max(...s, 1);
        peaks = s.map(v => v / max);
        draw();
      }).catch(() => { peaks = null; draw(); });
  }
  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = wave.clientWidth, H = wave.clientHeight;
    if (!W) return;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const split = W * progress;
    if (!peaks) {
      // no waveform available: a plain progress line
      ctx.fillStyle = "#3a3a3a"; ctx.fillRect(0, H / 2 - 1, W, 2);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, H / 2 - 1, split, 2);
      return;
    }
    const bar = 2, gap = 1, n = Math.floor(W / (bar + gap));
    for (let i = 0; i < n; i++) {
      const a = Math.floor(i * peaks.length / n), b = Math.max(a + 1, Math.floor((i + 1) * peaks.length / n));
      let v = 0; for (let j = a; j < b; j++) v = Math.max(v, peaks[j] || 0);
      const h = Math.max(2, v * H), x = i * (bar + gap);
      ctx.fillStyle = x < split ? "#ffffff" : "#3a3a3a";
      ctx.fillRect(x, (H - h) / 2, bar, h);
    }
  }
  window.addEventListener("resize", draw);

  // ----- now playing + list -----
  function showSound(i) {
    const s = sounds[i];
    if (!s) return;
    index = i; shown = i;
    title.textContent = s.title || `Track ${i + 1}`;
    if (s.permalink_url) link.href = s.permalink_url;
    if (s.artwork_url) { art.src = bigArt(s.artwork_url); art.hidden = false; }
    duration = s.duration || duration;
    dur.textContent = fmt(duration);
    [...list.querySelectorAll("button")].forEach((b, j) => b.setAttribute("aria-current", String(j === i)));
    loadPeaks(s);
  }
  function renderList() {
    list.innerHTML = "";
    sounds.forEach((s, i) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = `<span class="sc-n">${String(i + 1).padStart(2, "0")}</span><span class="sc-t"></span><span class="sc-d">${s.duration ? fmt(s.duration) : ""}</span>`;
      b.querySelector(".sc-t").textContent = s.title || `Track ${i + 1}`;
      b.setAttribute("aria-current", String(i === index));
      b.addEventListener("click", () => { started = true; widget.skip(i); });
      li.append(b); list.append(li);
    });
  }
  // the widget fills in track details in batches; refresh until every track has a title
  function refreshSounds(tries) {
    widget.getSounds(list2 => {
      if (!list2 || !list2.length) return;
      const changed = list2.length !== sounds.length || list2.some((s, i) => (s.title || "") !== ((sounds[i] && sounds[i].title) || ""));
      sounds = list2;
      if (changed) { renderList(); if (!started) { shown = -1; showSound(index); } }
      if (tries > 0 && sounds.some(s => !s.title)) setTimeout(() => refreshSounds(tries - 1), 1500);
    });
  }

  // ----- controls -----
  playBtn.addEventListener("click", () => { if (!widget) return; started = true; widget.toggle(); });
  function seekTo(frac) {
    if (!widget || !duration) return;
    frac = Math.min(1, Math.max(0, frac));
    progress = frac; draw();
    widget.seekTo(frac * duration);
  }
  wave.addEventListener("click", e => { const r = wave.getBoundingClientRect(); seekTo((e.clientX - r.left) / r.width); });
  wave.addEventListener("keydown", e => {
    if (!duration) return;
    const step = 5000 / duration;
    if (e.key === "ArrowRight") { e.preventDefault(); seekTo(progress + step); }
    if (e.key === "ArrowLeft") { e.preventDefault(); seekTo(progress - step); }
  });

  function fail() {
    if (widget) return;
    box.querySelector(".sc-now").hidden = true;
    wave.hidden = true; $(".sc-time").hidden = true;
    list.outerHTML = `<p class="sc-error">The SoundCloud player could not load. <a href="${url}" target="_blank" rel="noopener">Listen on SoundCloud ↗</a></p>`;
  }

  // ----- start: load the widget API when the Music section comes near the screen -----
  function boot() {
    const iframe = document.createElement("iframe");
    iframe.title = "SoundCloud audio engine";
    iframe.allow = "autoplay";
    iframe.tabIndex = -1;
    iframe.src = "https://w.soundcloud.com/player/?url=" + encodeURIComponent(url) +
      "&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false";
    engine.append(iframe);
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.onerror = fail;
    script.onload = () => {
      const w = window.SC && window.SC.Widget(iframe);
      if (!w) return fail();
      const E = window.SC.Widget.Events;
      w.bind(E.READY, () => {
        widget = w;
        playBtn.disabled = false;
        refreshSounds(8);
      });
      w.bind(E.PLAY, () => {
        box.classList.add("playing"); playBtn.setAttribute("aria-label", "Pause");
        w.getCurrentSoundIndex(i => { if (i !== shown) showSound(i); });
        w.getDuration(d => { duration = d; dur.textContent = fmt(d); });
      });
      w.bind(E.PAUSE, () => { box.classList.remove("playing"); playBtn.setAttribute("aria-label", "Play"); });
      w.bind(E.FINISH, () => { box.classList.remove("playing"); playBtn.setAttribute("aria-label", "Play"); });
      w.bind(E.PLAY_PROGRESS, e => {
        progress = e.relativePosition || 0;
        cur.textContent = fmt(e.currentPosition);
        wave.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
        draw();
      });
    };
    document.head.append(script);
    setTimeout(fail, 12000);
  }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); boot(); } }, { rootMargin: "600px" });
    io.observe(box);
  } else boot();
  draw();
})();

// Hero background: five switchable styles.
//   photos   – cross-fading installation photos (HTML slides)
//   grid     – step-sequencer squares playing polyrhythms
//   karbandi – rotating star polygons (Iranian geometry)
//   ink      – particles drifting along a slow current
// The default comes from data-motion on .hero ("random" = new pick each visit).
(() => {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const MODES = ["photos", "grid", "karbandi", "ink"];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = n => String(n).padStart(2, "0");

  /* ---------- photo slideshow ---------- */
  const slides = [...hero.querySelectorAll(".slide")];
  const count = hero.querySelector(".slide-count");
  const cap = hero.querySelector(".slide-cap");
  let si = 0, slideTimer = 0;

  function loadAllSlides() {
    slides.forEach(s => {
      const img = s.querySelector("img[data-src]");
      if (img) { img.src = img.dataset.src; img.removeAttribute("data-src"); }
    });
  }
  function showSlide(n) {
    if (!slides.length) return;
    slides[si].classList.remove("is-active", "glitch");
    si = (n + slides.length) % slides.length;
    const s = slides[si];
    void s.offsetWidth;
    s.classList.add("is-active");
    if (!reduced) s.classList.add("glitch");
    if (count) count.textContent = `${pad(si + 1)} / ${pad(slides.length)}`;
    if (cap) cap.textContent = s.dataset.caption || "";
  }
  function startSlides() {
    clearInterval(slideTimer);
    if (slides.length > 1) slideTimer = setInterval(() => showSlide(si + 1), 6500);
  }

  /* ---------- canvas styles ---------- */
  const cv = hero.querySelector(".hero-canvas");
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1, raf = 0, st = {}, mode = "photos", visible = true;
  const BG = "#07070a", PAPER = "242,240,234", ACCENT = "230,255,58";

  function size() {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (init[mode]) init[mode]();
  }
  const init = {}, draw = {};

  // grid: each row is a lane with its own division of the bar
  init.grid = () => {
    const cell = W < 600 ? 22 : 28, gap = 6;
    const cols = Math.floor((W + gap) / (cell + gap)), rows = Math.floor((H + gap) / (cell + gap));
    const ox = (W - (cols * (cell + gap) - gap)) / 2, oy = (H - (rows * (cell + gap) - gap)) / 2;
    const divs = [3, 4, 5, 7, 4, 9, 5, 11, 3, 7, 6, 5];
    const lanes = Array.from({ length: rows }, (_, r) => {
      const d = divs[r % divs.length];
      return new Set(Array.from({ length: d }, (_, k) => Math.round(k * cols / d)));
    });
    st = { cell, gap, cols, rows, ox, oy, lanes, glow: new Float32Array(cols * rows), hot: new Uint8Array(cols * rows), last: -1, bar: 6000 };
  };
  draw.grid = t => {
    const s = st;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    const col = Math.floor(((t % s.bar) / s.bar) * s.cols);
    if (col !== s.last) {
      let n = 0;
      for (let r = 0; r < s.rows; r++) if (s.lanes[r].has(col)) n++;
      for (let r = 0; r < s.rows; r++) if (s.lanes[r].has(col)) { const i = r * s.cols + col; s.glow[i] = 1; s.hot[i] = n >= 6 ? 1 : 0; }
      s.last = col;
    }
    for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) {
      const i = r * s.cols + c, g = s.glow[i];
      const x = s.ox + c * (s.cell + s.gap), y = s.oy + r * (s.cell + s.gap);
      if (g > 0.01) {
        ctx.fillStyle = s.hot[i] ? `rgba(${ACCENT},${g})` : `rgba(${PAPER},${g * 0.85})`;
        ctx.fillRect(x, y, s.cell, s.cell);
        s.glow[i] *= 0.955;
      } else {
        ctx.strokeStyle = c === col ? `rgba(${PAPER},.16)` : `rgba(${PAPER},.05)`;
        ctx.strokeRect(x + .5, y + .5, s.cell - 1, s.cell - 1);
      }
    }
  };

  // karbandi: ten {10/3} star polygons turning at slightly different speeds
  init.karbandi = () => { st = {}; };
  draw.karbandi = t => {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    const narrow = W < 700;
    const cx = narrow ? W / 2 : W * 0.62, cy = H * (narrow ? 0.4 : 0.46);
    const R = Math.min(W, H) * (narrow ? 0.55 : 0.62), s = t / 1000;
    ctx.lineWidth = 1;
    for (let L = 0; L < 10; L++) {
      const rot = L * Math.PI / 25 + s * 0.05 * (L % 2 ? 1 : -1) * (1 + L * 0.08);
      const rr = R * (0.55 + 0.45 * (L / 9)) * (1 + 0.03 * Math.sin(s * 0.3 + L));
      ctx.strokeStyle = L === 9 ? `rgba(${ACCENT},.16)` : `rgba(${PAPER},${0.07 + 0.02 * (L % 3)})`;
      ctx.beginPath();
      for (let k = 0; k <= 10; k++) {
        const a = rot + (k * 3 % 10) * 2 * Math.PI / 10;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  };

  // ink: particles following a slowly changing current, leaving trails
  init.ink = () => {
    const N = W < 600 ? 900 : 2200;
    st = { p: Array.from({ length: N }, () => ({ x: Math.random() * W, y: Math.random() * H, a: Math.random() < 0.03 })) };
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  };
  draw.ink = t => {
    const s = t / 1000;
    ctx.fillStyle = "rgba(7,7,10,0.06)"; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1;
    for (const q of st.p) {
      const ang = Math.sin(q.x * 0.0032 + s * 0.15) * 2.2 + Math.cos(q.y * 0.0041 - s * 0.11) * 2.2 + Math.sin((q.x + q.y) * 0.0013 + s * 0.05);
      const nx = q.x + Math.cos(ang) * 1.1, ny = q.y + Math.sin(ang) * 1.1;
      ctx.strokeStyle = q.a ? `rgba(${ACCENT},.5)` : `rgba(${PAPER},.16)`;
      ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(nx, ny); ctx.stroke();
      q.x = nx; q.y = ny;
      if (q.x < 0 || q.x > W || q.y < 0 || q.y > H || Math.random() < 0.002) { q.x = Math.random() * W; q.y = Math.random() * H; }
    }
  };

  function loop(t) {
    if (!visible || mode === "photos") { raf = 0; return; }
    draw[mode](t);
    raf = requestAnimationFrame(loop);
  }
  function run() {
    cancelAnimationFrame(raf); raf = 0;
    if (mode === "photos") return;
    size();
    if (reduced) { for (let i = 0; i < 240; i++) draw[mode](i * 33); return; }
    raf = requestAnimationFrame(loop);
  }

  /* ---------- switching ---------- */
  const buttons = [...hero.querySelectorAll(".motion-switch button")];
  function setMode(m) {
    mode = m;
    hero.dataset.active = m;
    buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
    if (m === "photos") { startSlides(); } else { clearInterval(slideTimer); }
    run();
  }
  function randomMode(exclude) {
    const pool = MODES.filter(m => m !== exclude);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  buttons.forEach(b => b.addEventListener("click", () => {
    setMode(b.dataset.mode === "shuffle" ? randomMode(mode) : b.dataset.mode);
  }));

  // pause when the hero is off screen or the tab is hidden
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf && mode !== "photos" && !reduced) raf = requestAnimationFrame(loop);
  }).observe(hero);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { clearInterval(slideTimer); }
    else if (mode === "photos") { startSlides(); }
  });
  let rt = 0;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (mode !== "photos") size(); }, 150); });

  window.addEventListener("load", loadAllSlides);
  const pref = hero.dataset.motion;
  setMode(MODES.includes(pref) ? pref : randomMode());
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

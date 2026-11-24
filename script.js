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

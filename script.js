// Hero slideshow: cross-fades installation photos with a short scan-line glitch.
(() => {
  const slides = [...document.querySelectorAll(".hero-media .slide")];
  if (slides.length < 2) return;
  const count = document.querySelector(".slide-count");
  const cap = document.querySelector(".slide-cap");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const INTERVAL = 6500;
  const pad = n => String(n).padStart(2, "0");
  let i = 0;

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
    // restart the drift animation
    s.classList.remove("glitch");
    void s.offsetWidth;
    s.classList.add("is-active");
    if (!reduced) s.classList.add("glitch");
    if (count) count.textContent = `${pad(i + 1)} / ${pad(slides.length)}`;
    if (cap) cap.textContent = s.dataset.caption || "";
  }

  let timer = setInterval(() => show(i + 1), INTERVAL);
  document.addEventListener("visibilitychange", () => {
    clearInterval(timer);
    if (!document.hidden) timer = setInterval(() => show(i + 1), INTERVAL);
  });
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

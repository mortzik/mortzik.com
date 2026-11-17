// Polyrhythm field: concentric rings, each divided into a different number of
// beats (3, 4, 5, 7, 9, 11). A sweep rotates once per cycle; each beat flashes
// when the sweep passes it, so the rings "play" against each other.
(() => {
  const canvas = document.getElementById("field");
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const RINGS = [3, 4, 5, 7, 9, 11];
  const CYCLE = 9000; // ms per full rotation
  const COLORS = ["#e6ff3a", "#05d9e8", "#ff2a6d"];

  let w, h, cx, cy, maxR, dpr;
  let mx = 0, my = 0, tx = 0, ty = 0; // parallax
  const flashes = RINGS.map(n => new Array(n).fill(0));
  let lastPhase = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2; cy = h / 2;
    maxR = Math.min(Math.hypot(w, h) * 0.42, 720);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", e => {
    tx = (e.clientX / w - 0.5) * 30;
    ty = (e.clientY / h - 0.5) * 30;
  });

  function frame(t) {
    mx += (tx - mx) * 0.05;
    my += (ty - my) * 0.05;

    const phase = (t % CYCLE) / CYCLE; // 0..1
    const scroll = Math.min(window.scrollY / h, 1);

    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1 - scroll * 0.6;

    const ox = cx + mx, oy = cy + my;

    RINGS.forEach((n, i) => {
      const r = maxR * (0.25 + (i / (RINGS.length - 1)) * 0.75);
      const color = COLORS[i % COLORS.length];

      // ring
      ctx.beginPath();
      ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // beats
      for (let k = 0; k < n; k++) {
        const bp = k / n;
        // trigger when sweep crosses this beat
        const crossed = lastPhase <= phase
          ? bp > lastPhase && bp <= phase
          : bp > lastPhase || bp <= phase;
        if (crossed) flashes[i][k] = 1;
        flashes[i][k] *= 0.94;

        const a = bp * Math.PI * 2 - Math.PI / 2;
        const x = ox + Math.cos(a) * r, y = oy + Math.sin(a) * r;
        const f = flashes[i][k];

        ctx.beginPath();
        ctx.arc(x, y, 2 + f * 5, 0, Math.PI * 2);
        ctx.fillStyle = f > 0.02 ? color : "rgba(255,255,255,0.18)";
        ctx.globalAlpha = (0.25 + f * 0.75) * (1 - scroll * 0.6);
        ctx.fill();

        if (f > 0.05) {
          ctx.beginPath();
          ctx.arc(ox, oy, r, a - 0.25 * f, a + 0.01);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.globalAlpha = 1 - scroll * 0.6;
      }
    });

    // sweep line
    const sa = phase * Math.PI * 2 - Math.PI / 2;
    const grad = ctx.createLinearGradient(ox, oy, ox + Math.cos(sa) * maxR, oy + Math.sin(sa) * maxR);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(1, "rgba(255,255,255,0.25)");
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(sa) * maxR, oy + Math.sin(sa) * maxR);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.stroke();

    // occasional glitch: shift a horizontal slice of the canvas
    if (Math.random() < 0.03) {
      const sh = 4 + Math.random() * 40;
      const sy = Math.random() * h;
      const dx = (Math.random() - 0.5) * 60;
      ctx.drawImage(canvas, 0, sy * dpr, w * dpr, sh * dpr, dx, sy, w, sh);
    }

    ctx.globalAlpha = 1;
    lastPhase = phase;
    if (!reduced) requestAnimationFrame(frame);
  }

  resize();
  if (reduced) {
    frame(CYCLE * 0.3);
  } else {
    requestAnimationFrame(frame);
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();

// InEgypt site script (Plan 47 §8.6, §10.3: ≤ 8 KB, deferred; the page works without it).
(() => {
  const doc = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveal on scroll: content is visible by default; only hide it once this script runs.
  const items = document.querySelectorAll("[data-reveal]");
  if (!reduce && "IntersectionObserver" in window && items.length) {
    doc.classList.add("js-reveal");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));
  }

  // Ribbon arrows: scroll by one card, honouring RTL.
  document.querySelectorAll("[data-ribbon]").forEach((r) => {
    const track = r.querySelector(".ribbon__track");
    r.querySelectorAll("button[data-dir]").forEach((b) => b.addEventListener("click", () => {
      const card = track.firstElementChild;
      const step = card ? card.getBoundingClientRect().width + 24 : 300;
      const rtl = getComputedStyle(track).direction === "rtl";
      track.scrollBy({ left: Number(b.dataset.dir) * step * (rtl ? -1 : 1), behavior: reduce ? "auto" : "smooth" });
    }));
  });

  // Gallery tabs: mark the tab whose screen is in view.
  document.querySelectorAll("[data-gallery]").forEach((g) => {
    const tabs = [...g.querySelectorAll(".gallery__tabs a")];
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) {
        tabs.forEach((t) => t.setAttribute("aria-current", t.hash === "#" + e.target.id ? "true" : "false"));
      }
    }, { root: g.querySelector(".snap"), threshold: 0.6 });
    g.querySelectorAll(".snap > figure").forEach((f) => io.observe(f));
    tabs.forEach((t) => t.addEventListener("click", (ev) => {
      const target = g.querySelector(t.hash);
      if (!target) return;
      ev.preventDefault();
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "start" });
    }));
  });

  // Share row: Web Share where present, else copy the link.
  document.querySelectorAll("[data-share]").forEach((s) => {
    const a = s.querySelector("[data-share-url]");
    const status = s.querySelector(".share__status");
    a.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const url = new URL(a.dataset.shareUrl, location.href).href;
      try {
        if (navigator.share && matchMedia("(pointer: coarse)").matches) { await navigator.share({ url, title: document.title }); return; }
        await navigator.clipboard.writeText(url);
        status.textContent = s.dataset.copied;
        setTimeout(() => { status.textContent = ""; }, 2500);
      } catch { /* user cancelled */ }
    });
  });

  // Mobile menu: close with Escape or a click outside.
  const menu = document.querySelector(".nav__menu");
  if (menu) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); }
    });
    document.addEventListener("click", (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  }
})();

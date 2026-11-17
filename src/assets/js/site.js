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

  // Floating nav: tighten while scrolling down, open again on the way up (CSS animates; reduced motion has no transitions).
  const nav = document.querySelector("[data-nav]");
  if (nav) {
    let lastY = scrollY, ticking = false;
    addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY, d = y - lastY;
        if (y < 80) nav.classList.remove("is-compact");
        else if (d > 6) nav.classList.add("is-compact");
        else if (d < -6) nav.classList.remove("is-compact");
        if (Math.abs(d) > 6 || y < 80) lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  // Tabs (Pro page plan switch): shown only when this runs; panels stay visible without it.
  document.querySelectorAll("[data-tabs]").forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    const select = (i, focus) => tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; panels[j].hidden = !on;
      if (on && focus) t.focus();
    });
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        const rtl = getComputedStyle(list).direction === "rtl";
        const k = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
        if (k) { e.preventDefault(); select((i + k + tabs.length) % tabs.length, true); }
        if (e.key === "Home") { e.preventDefault(); select(0, true); }
        if (e.key === "End") { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
    list.hidden = false; list.closest("section").classList.add("has-tabs"); select(0);
  });

  // Ribbon arrows: scroll by one card, honouring RTL.
  document.querySelectorAll("[data-ribbon]").forEach((r) => {
    const track = r.querySelector(".ribbon__track");
    r.querySelectorAll("button[data-dir]").forEach((b) => b.addEventListener("click", () => {
      const card = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = card ? card.getBoundingClientRect().width + gap : 300;
      const rtl = getComputedStyle(track).direction === "rtl";
      track.scrollBy({ left: Number(b.dataset.dir) * step * (rtl ? -1 : 1), behavior: reduce ? "auto" : "smooth" });
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

  // FAQ: always open on desktop (§4 section 18); native <details> on phones.
  if (matchMedia("(min-width: 1024px)").matches) document.querySelectorAll(".faq--cols details").forEach((d) => { d.open = true; });

  // Mobile menu: close with Escape or a click outside.
  const menu = document.querySelector(".nav__menu");
  if (menu) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); }
    });
    document.addEventListener("click", (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  }
})();

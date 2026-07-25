(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const shell = document.querySelector(".phone-shell");
  const menuItems = document.querySelectorAll(".menu-item");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const clamp = (min, value, max) => Math.min(Math.max(value, min), max);

  // Keep every menu title on one line, including after the custom font loads.
  const fitMenuTitles = () => {
    document.querySelectorAll(".menu-item__row").forEach((row) => {
      const title = row.querySelector("h2");
      const price = row.querySelector(".price");
      if (!title || !price) return;

      title.style.removeProperty("font-size");

      const rowStyle = window.getComputedStyle(row);
      const gap = Number.parseFloat(rowStyle.columnGap || rowStyle.gap) || 0;
      const availableWidth = Math.max(0, row.clientWidth - price.getBoundingClientRect().width - gap);
      const naturalWidth = title.scrollWidth;

      if (naturalWidth <= availableWidth || naturalWidth === 0) return;

      const currentSize = Number.parseFloat(window.getComputedStyle(title).fontSize);
      const fittedSize = Math.max(18, currentSize * (availableWidth / naturalWidth));
      title.style.fontSize = `${fittedSize.toFixed(2)}px`;
    });
  };

  if (document.fonts?.ready) {
    document.fonts.ready.then(fitMenuTitles);
  } else {
    window.addEventListener("load", fitMenuTitles, { once: true });
  }

  const titleResizeObserver = new ResizeObserver(fitMenuTitles);
  if (shell) titleResizeObserver.observe(shell);
  window.addEventListener("orientationchange", fitMenuTitles, { passive: true });

  const showPage = () => {
    window.setTimeout(() => body.classList.add("is-loaded"), 280);
  };

  if (document.readyState === "complete") {
    showPage();
  } else {
    window.addEventListener("load", showPage, { once: true });
  }

  // Smooth, dependency-free reveal animation.
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -7% 0px",
    }
  );

  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

  let lastScrollY = window.scrollY;
  let velocity = 0;
  let rafId = 0;

  const renderScrollEffects = () => {
    rafId = 0;

    const currentY = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = clamp(0, currentY / maxScroll, 1);

    velocity = velocity * 0.82 + (currentY - lastScrollY) * 0.18;
    lastScrollY = currentY;

    const shellTop = shell.getBoundingClientRect().top;
    const localScroll = Math.max(0, -shellTop);

    root.style.setProperty("--scroll-progress", progress.toFixed(4));
    root.style.setProperty("--hero-parallax", `${clamp(0, localScroll * 0.075, 42).toFixed(2)}px`);
    root.style.setProperty("--drawing-parallax", `${clamp(0, localScroll * 0.045, 34).toFixed(2)}px`);
    root.style.setProperty("--cupid-shift", `${clamp(-14, velocity * 0.34, 14).toFixed(2)}px`);
    root.style.setProperty("--cupid-rotate", `${clamp(-1.6, velocity * 0.035, 1.6).toFixed(2)}deg`);
  };

  const requestScrollRender = () => {
    if (reduceMotion.matches || rafId) return;
    rafId = window.requestAnimationFrame(renderScrollEffects);
  };

  window.addEventListener("scroll", requestScrollRender, { passive: true });
  window.addEventListener("resize", requestScrollRender, { passive: true });
  requestScrollRender();

  // Small tactile response for touch devices and keyboard users.
  menuItems.forEach((item) => {
    const activate = () => {
      item.classList.add("is-active");
      window.setTimeout(() => item.classList.remove("is-active"), 420);
    };

    item.addEventListener("pointerdown", activate, { passive: true });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") activate();
    });
  });

  // Gracefully hide missing local artwork while the real assets are being added.
  document.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => {
      image.hidden = true;
      image.setAttribute("aria-hidden", "true");
    }, { once: true });
  });
})();

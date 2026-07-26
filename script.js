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

  const motionNodes = [];

  const registerMotionNode = (element, options = {}) => {
    if (!element) return;

    element.classList.add("scroll-motion");
    motionNodes.push({
      element,
      strength: options.strength ?? 1,
      stiffness: options.stiffness ?? 0.12,
      damping: options.damping ?? 0.74,
      y: 0,
      yVelocity: 0,
      targetY: 0,
      skew: 0,
      skewVelocity: 0,
      targetSkew: 0,
    });
  };

  registerMotionNode(document.querySelector(".hero__title"), {
    strength: 0.54,
    stiffness: 0.105,
    damping: 0.77,
  });

  document.querySelectorAll(".menu-item").forEach((item, index) => {
    registerMotionNode(item.querySelector(".menu-item__row"), {
      strength: 0.86 + index * 0.07,
      stiffness: 0.112 + index * 0.004,
      damping: 0.75,
    });

    registerMotionNode(item.querySelector(".menu-item__meta"), {
      strength: 0.58 + index * 0.055,
      stiffness: 0.096 + index * 0.004,
      damping: 0.78,
    });
  });

  document.querySelectorAll(".footer-brand-line > *, .footer-social-block .socials").forEach((element, index) => {
    registerMotionNode(element, {
      strength: 0.42 + index * 0.06,
      stiffness: 0.09,
      damping: 0.8,
    });
  });

  let lastScrollY = window.scrollY;
  let lastScrollTime = performance.now();
  let lastFrameTime = performance.now();
  let lastScrollInput = performance.now();
  let smoothedPageVelocity = 0;
  let rafId = 0;

  const updateStaticScrollEffects = (currentY) => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = clamp(0, currentY / maxScroll, 1);
    const shellTop = shell ? shell.getBoundingClientRect().top : 0;
    const localScroll = Math.max(0, -shellTop);

    root.style.setProperty("--scroll-progress", progress.toFixed(4));
    root.style.setProperty("--hero-parallax", `${clamp(0, localScroll * 0.075, 42).toFixed(2)}px`);
    root.style.setProperty("--drawing-parallax", `${clamp(0, localScroll * 0.045, 34).toFixed(2)}px`);
  };

  const setMotionTargets = (pageVelocity) => {
    // Positive scrolling makes the type lag a few pixels behind the page.
    const baseY = clamp(-6.4, pageVelocity * 0.0032, 6.4);
    const baseSkew = clamp(-0.28, -pageVelocity * 0.00014, 0.28);

    motionNodes.forEach((node) => {
      node.targetY = baseY * node.strength;
      node.targetSkew = baseSkew * node.strength;
    });

    root.style.setProperty("--cupid-shift", `${clamp(-5, pageVelocity * 0.0018, 5).toFixed(2)}px`);
    root.style.setProperty("--cupid-rotate", `${clamp(-0.72, pageVelocity * 0.0003, 0.72).toFixed(2)}deg`);
  };

  const resetMotion = () => {
    motionNodes.forEach((node) => {
      node.y = 0;
      node.yVelocity = 0;
      node.targetY = 0;
      node.skew = 0;
      node.skewVelocity = 0;
      node.targetSkew = 0;
      node.element.style.setProperty("--motion-y", "0px");
      node.element.style.setProperty("--motion-skew", "0deg");
    });

    root.style.setProperty("--cupid-shift", "0px");
    root.style.setProperty("--cupid-rotate", "0deg");
  };

  const renderScrollMotion = (now) => {
    rafId = 0;

    const frameScale = Math.min(2, Math.max(0.5, (now - lastFrameTime) / 16.667));
    lastFrameTime = now;
    const idleTime = now - lastScrollInput;

    if (idleTime > 54) {
      const targetDecay = Math.pow(0.76, frameScale);
      const velocityDecay = Math.pow(0.84, frameScale);

      smoothedPageVelocity *= velocityDecay;
      motionNodes.forEach((node) => {
        node.targetY *= targetDecay;
        node.targetSkew *= targetDecay;
      });

      root.style.setProperty(
        "--cupid-shift",
        `${clamp(-5, smoothedPageVelocity * 0.0018, 5).toFixed(2)}px`
      );
      root.style.setProperty(
        "--cupid-rotate",
        `${clamp(-0.72, smoothedPageVelocity * 0.0003, 0.72).toFixed(2)}deg`
      );
    }

    let isMoving = Math.abs(smoothedPageVelocity) > 0.5;

    motionNodes.forEach((node) => {
      const springForceY = (node.targetY - node.y) * node.stiffness * frameScale;
      node.yVelocity = (node.yVelocity + springForceY) * Math.pow(node.damping, frameScale);
      node.y += node.yVelocity * frameScale;

      const springForceSkew = (node.targetSkew - node.skew) * (node.stiffness * 0.84) * frameScale;
      node.skewVelocity = (node.skewVelocity + springForceSkew) * Math.pow(node.damping + 0.035, frameScale);
      node.skew += node.skewVelocity * frameScale;

      if (Math.abs(node.y) < 0.003 && Math.abs(node.targetY) < 0.003) node.y = 0;
      if (Math.abs(node.skew) < 0.002 && Math.abs(node.targetSkew) < 0.002) node.skew = 0;

      node.element.style.setProperty("--motion-y", `${node.y.toFixed(3)}px`);
      node.element.style.setProperty("--motion-skew", `${node.skew.toFixed(3)}deg`);

      isMoving ||=
        Math.abs(node.y) > 0.008 ||
        Math.abs(node.yVelocity) > 0.008 ||
        Math.abs(node.targetY) > 0.008 ||
        Math.abs(node.skew) > 0.004 ||
        Math.abs(node.skewVelocity) > 0.004 ||
        Math.abs(node.targetSkew) > 0.004;
    });

    if (isMoving) rafId = window.requestAnimationFrame(renderScrollMotion);
  };

  const startMotionLoop = () => {
    if (rafId || reduceMotion.matches) return;
    lastFrameTime = performance.now();
    rafId = window.requestAnimationFrame(renderScrollMotion);
  };

  const handleScroll = () => {
    const currentY = window.scrollY;
    updateStaticScrollEffects(currentY);

    if (reduceMotion.matches) {
      lastScrollY = currentY;
      return;
    }

    const now = performance.now();
    const elapsed = Math.max(8, now - lastScrollTime);
    const delta = currentY - lastScrollY;
    const instantVelocity = (delta / elapsed) * 1000;

    lastScrollY = currentY;
    lastScrollTime = now;
    lastScrollInput = now;

    // Smooth touchpad, wheel and touch scrolling into one stable velocity signal.
    smoothedPageVelocity = smoothedPageVelocity * 0.68 + instantVelocity * 0.32;
    setMotionTargets(smoothedPageVelocity);
    startMotionLoop();
  };

  const handleResize = () => {
    updateStaticScrollEffects(window.scrollY);
    fitMenuTitles();
  };

  const handleReducedMotionChange = () => {
    if (!reduceMotion.matches) return;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    resetMotion();
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize, { passive: true });
  reduceMotion.addEventListener?.("change", handleReducedMotionChange);
  updateStaticScrollEffects(window.scrollY);

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

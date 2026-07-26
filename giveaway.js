(() => {
  "use strict";

  const body = document.body;
  const form = document.querySelector("#giveaway-form");
  const status = document.querySelector("#form-status");
  const entryPanel = document.querySelector(".entry-panel");
  const successState = document.querySelector("#success-state");
  const fields = [...document.querySelectorAll(".field input")];

  const showPage = () => window.setTimeout(() => body.classList.add("is-ready"), 120);
  if (document.readyState === "complete") showPage();
  else window.addEventListener("load", showPage, { once: true });

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

  const errorElementFor = (input) =>
    document.querySelector(`[data-error-for="${input.id}"]`);

  const validateField = (input) => {
    const wrapper = input.closest(".field");
    const error = errorElementFor(input);
    let message = "";

    if (input.validity.valueMissing) {
      message = input.type === "email" ? "Please enter your email address." : "Please enter your name.";
    } else if (input.validity.typeMismatch) {
      message = "Please enter a valid email address.";
    } else if (input.validity.tooShort) {
      message = "Please enter at least 2 characters.";
    }

    wrapper?.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
    return !message;
  };

  fields.forEach((input) => {
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => {
      if (input.closest(".field")?.classList.contains("is-invalid")) validateField(input);
      status.textContent = "";
      status.className = "form-status";
    });
  });

  const showSuccess = () => {
    entryPanel?.classList.add("is-success");
    successState?.setAttribute("aria-hidden", "false");
    form?.setAttribute("aria-hidden", "true");
    form?.reset();

    window.setTimeout(() => {
      entryPanel?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };

  // Patrick can call window.showGiveawaySuccess() after a successful
  // WordPress/Mailchimp submission when the live integration is connected.
  window.showGiveawaySuccess = showSuccess;

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const isValid = fields.map(validateField).every(Boolean);

    if (!isValid) {
      status.textContent = "Please check the highlighted fields.";
      status.className = "form-status is-error";
      fields.find((input) => input.getAttribute("aria-invalid") === "true")?.focus();
      return;
    }

    // Front-end success state for the design preview. When the live
    // WordPress/Mailchimp connection is added, trigger showSuccess() only
    // after the server confirms that the entry was stored successfully.
    showSuccess();
  });
})();

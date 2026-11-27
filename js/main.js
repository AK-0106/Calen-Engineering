/* ==========================================================================
   Calen Engineering — Main JavaScript
   Vanilla JS, no dependencies. Handles:
   1. Header state & mobile menu
   2. Smooth scrolling & active navigation
   3. Scroll reveal animations
   4. Project category filtering
   5. Project detail modal (click, keyboard, backdrop, Escape, focus trap)
   6. Quote form validation & inline confirmation
   7. Dynamic footer year
   ========================================================================== */

(function () {
  "use strict";

  // Enable reveal animations only when JS runs (progressive enhancement).
  document.documentElement.classList.add("js");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = document.getElementById("site-header");
  const menuToggle = document.getElementById("menu-toggle");
  const primaryNav = document.getElementById("primary-nav");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));


  /* ------------------------------------------------------------------------
     1. HEADER STATE & MOBILE MENU
     ------------------------------------------------------------------------ */

  function closeMenu() {
    if (!menuToggle || !primaryNav) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    primaryNav.classList.remove("is-open");
  }

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", function () {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
      primaryNav.classList.toggle("is-open", !isOpen);
    });

    // Close the menu if the viewport grows back to desktop size.
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }


  /* ------------------------------------------------------------------------
     2. SMOOTH SCROLLING & ACTIVE NAVIGATION
     ------------------------------------------------------------------------ */

  const scrollSections = navLinks
    .map(function (link) {
      const id = link.getAttribute("href");
      return id && id.length > 1 ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  // Intercept in-page links; ignore bare "#" links (e.g. social placeholders).
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    link.addEventListener("click", function (event) {
      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      closeMenu();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start"
      });
    });
  });

  // Throttle scroll work with requestAnimationFrame.
  let scrollQueued = false;

  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;

    window.requestAnimationFrame(function () {
      if (header) {
        header.classList.toggle("is-scrolled", window.scrollY > 10);
      }

      // Highlight the last section whose top has passed just below the header.
      const marker = (header ? header.offsetHeight : 70) + 90;
      let activeId = "home";

      scrollSections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= marker) activeId = section.id;
      });

      navLinks.forEach(function (link) {
        link.classList.toggle("is-active", link.getAttribute("href") === "#" + activeId);
      });

      scrollQueued = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();


  /* ------------------------------------------------------------------------
     3. SCROLL REVEAL ANIMATIONS
     ------------------------------------------------------------------------ */

  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  }


  /* ------------------------------------------------------------------------
     4. PROJECT CATEGORY FILTERING
     ------------------------------------------------------------------------ */

  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
  const projectCards = Array.from(document.querySelectorAll(".project-card"));
  const projectsCount = document.getElementById("projects-count");

  function applyFilter(filter) {
    let visible = 0;

    projectCards.forEach(function (card) {
      const categories = (card.dataset.category || "").trim().split(/\s+/);
      const show = filter === "all" || categories.indexOf(filter) !== -1;

      card.classList.toggle("is-hidden", !show);
      card.setAttribute("aria-hidden", String(!show));
      card.tabIndex = show ? 0 : -1;

      if (show) visible += 1;
    });

    if (projectsCount) {
      projectsCount.textContent = "Showing " + visible + " project" + (visible === 1 ? "" : "s");
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      filterButtons.forEach(function (other) {
        const active = other === button;
        other.classList.toggle("is-active", active);
        other.setAttribute("aria-pressed", String(active));
      });
      applyFilter(button.dataset.filter);
    });
  });


  /* ------------------------------------------------------------------------
     5. PROJECT DETAIL MODAL
     ------------------------------------------------------------------------ */

  const modal = document.getElementById("project-modal");
  const modalDialog = modal ? modal.querySelector(".modal__dialog") : null;
  const closeModalElements = modal ? Array.from(modal.querySelectorAll("[data-close-modal]")) : [];
  let modalTrigger = null;

  function openModal(card) {
    if (!modal || !modalDialog) return;

    const data = card.dataset;
    const setText = function (id, value) {
      const element = document.getElementById(id);
      if (element) element.textContent = value || "";
    };

    setText("modal-title", data.title);
    setText("modal-category", data.categoryLabel);
    setText("modal-location", data.location);
    setText("modal-scope", data.scope);
    setText("modal-year", data.year);
    setText("modal-description", data.description);

    const modalImage = document.getElementById("modal-image");
    if (modalImage) {
      modalImage.src = data.image || "";
      modalImage.alt = data.alt || "";
    }

    modalTrigger = card;
    modal.hidden = false;
    modalDialog.scrollTop = 0;
    document.body.classList.add("is-locked");

    const closeButton = modal.querySelector(".modal__close");
    if (closeButton) closeButton.focus();
  }

  function closeModal(restoreFocus) {
    if (!modal || modal.hidden) return;

    modal.hidden = true;
    document.body.classList.remove("is-locked");

    if (restoreFocus !== false && modalTrigger) {
      modalTrigger.focus();
    }
    modalTrigger = null;
  }

  projectCards.forEach(function (card) {
    card.addEventListener("click", function () { openModal(card); });

    // Cards use role="button", so support Enter and Space explicitly.
    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(card);
      }
    });
  });

  closeModalElements.forEach(function (element) {
    element.addEventListener("click", function () {
      // Links that navigate to another section should not pull focus back.
      closeModal(element.tagName !== "A");
    });
  });

  // Click on the dark backdrop (outside the dialog) closes the modal.
  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });
  }

  // Keep keyboard focus inside the dialog while it is open.
  if (modalDialog) {
    modalDialog.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;

      const focusable = Array.from(modalDialog.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(function (element) { return element.offsetParent !== null; });

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  // Escape closes the modal first, otherwise the mobile menu.
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (modal && !modal.hidden) closeModal();
    else closeMenu();
  });


  /* ------------------------------------------------------------------------
     6. QUOTE FORM VALIDATION & INLINE CONFIRMATION
     ------------------------------------------------------------------------ */

  const form = document.getElementById("quote-form");
  const confirmation = document.getElementById("form-confirmation");

  if (form) {
    // Each validator returns true when valid, otherwise an error message.
    const validators = {
      fullName: function (value) {
        return value.trim().length >= 2 || "Please enter your full name (at least 2 characters).";
      },
      email: function (value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) || "Please enter a valid email address.";
      },
      phone: function (value) {
        const digits = value.replace(/\D/g, "");
        return (digits.length >= 8 && digits.length <= 15) || "Please enter a valid phone number.";
      },
      projectType: function (value) {
        return Boolean(value) || "Please select a project type.";
      },
      message: function (value) {
        return value.trim().length >= 10 || "Please add a little more detail (at least 10 characters).";
      }
    };

    function validateField(input) {
      const validator = validators[input.name];
      if (!validator) return true;

      const result = validator(input.value);
      const valid = result === true;
      const errorElement = document.getElementById(input.id + "-error");

      input.classList.toggle("is-invalid", !valid);
      input.setAttribute("aria-invalid", String(!valid));
      if (errorElement) errorElement.textContent = valid ? "" : result;

      return valid;
    }

    Object.keys(validators).forEach(function (name) {
      const input = form.elements[name];
      if (!input) return;

      // Validate on blur once the user has interacted with the field.
      input.addEventListener("blur", function () {
        if (input.value.trim() !== "" || input.classList.contains("is-invalid")) {
          validateField(input);
        }
      });

      // Clear an error as soon as the user corrects the field.
      input.addEventListener("input", function () {
        if (input.classList.contains("is-invalid")) validateField(input);
      });
      input.addEventListener("change", function () {
        if (input.classList.contains("is-invalid")) validateField(input);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      let firstInvalid = null;
      let allValid = true;

      Object.keys(validators).forEach(function (name) {
        const input = form.elements[name];
        if (!input) return;

        if (!validateField(input)) {
          allValid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });

      if (!allValid) {
        if (confirmation) confirmation.hidden = true;
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (confirmation) {
        confirmation.hidden = false;
        confirmation.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center"
        });
      }

      form.reset();
    });

    // Hide the success message when the user begins a new inquiry.
    form.addEventListener("input", function () {
      if (confirmation && !confirmation.hidden) confirmation.hidden = true;
    });
  }


  /* ------------------------------------------------------------------------
     7. DYNAMIC FOOTER YEAR
     ------------------------------------------------------------------------ */

  const yearElement = document.getElementById("current-year");
  if (yearElement) yearElement.textContent = String(new Date().getFullYear());

})();

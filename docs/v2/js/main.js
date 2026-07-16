/* AUN Corporate Site V2 */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* header state */
  var header = document.getElementById("site-header");
  var heroEl = document.querySelector(".fv, .page-hero");
  function headerState() {
    var y = window.scrollY || 0;
    var solidAt = heroEl ? Math.min(heroEl.offsetHeight * 0.25, 160) : 40;
    header.classList.toggle("is-solid", y > solidAt);
  }
  headerState();
  window.addEventListener("scroll", headerState, { passive: true });

  /* mobile menu */
  var toggle = document.getElementById("menu-toggle");
  var menu = document.getElementById("mobile-menu");
  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    menu.hidden = true;
    document.body.style.overflow = "";
  }
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    if (open) { closeMenu(); return; }
    toggle.setAttribute("aria-expanded", "true");
    menu.hidden = false;
    document.body.style.overflow = "hidden";
  });
  menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeMenu();
  });

  /* hero elements: reveal on load (clipped lines never intersect, so no IO) */
  var heroFx = document.querySelectorAll(".fv .fx, .page-hero .fx");
  heroFx.forEach(function (el, i) {
    if (reduced) { el.classList.add("on"); return; }
    setTimeout(function () { el.classList.add("on"); }, 160 + i * 130);
  });

  /* reveal */
  var targets = Array.prototype.filter.call(document.querySelectorAll(".fx"), function (el) {
    return !el.closest(".fv, .page-hero");
  });
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("on"); });
  } else {
    var stagger = 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = 0;
        var group = el.closest(".fv-copy, .action-grid, .jigyo-fields, .values, .flow");
        if (group) {
          var idx = Array.prototype.indexOf.call(group.querySelectorAll(".fx"), el);
          delay = Math.max(0, idx) * 110;
        }
        setTimeout(function () { el.classList.add("on"); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* route spine draw */
  var route = document.querySelector(".route");
  if (route && "IntersectionObserver" in window && !reduced) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { route.classList.add("on"); rio.disconnect(); }
      });
    }, { threshold: 0.3 });
    rio.observe(route);
  } else if (route) {
    route.classList.add("on");
  }

  /* orb parallax */
  var orbs = document.querySelectorAll("[data-parallax]");
  if (orbs.length && !reduced) {
    var ticking = false;
    function parallax() {
      var y = window.scrollY || 0;
      orbs.forEach(function (el) {
        var f = parseFloat(el.getAttribute("data-parallax")) || 0;
        el.style.transform = "translateY(" + (y * f * -1) + "px)";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(parallax); ticking = true; }
    }, { passive: true });
  }

  /* demo forms */
  document.querySelectorAll("form[data-demo]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var done = form.querySelector(".form-done");
      if (done) {
        done.classList.add("show");
        done.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      }
      form.querySelectorAll("input, select, textarea, button").forEach(function (el) { el.disabled = true; });
    });
  });
})();

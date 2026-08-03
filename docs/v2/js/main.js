/* AUN Corporate Site V2.1 */
(function () {
  "use strict";
  // JavaScript が読み込めない環境では、内容を隠さずそのまま読める状態を保つ。
  document.documentElement.classList.add("js");

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
  var menuTrigger = null;
  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    menu.hidden = true;
    document.body.style.overflow = "";
    if (menuTrigger) menuTrigger.focus();
  }
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    if (open) { closeMenu(); return; }
    menuTrigger = document.activeElement;
    toggle.setAttribute("aria-expanded", "true");
    menu.hidden = false;
    document.body.style.overflow = "hidden";
    var firstMenuLink = menu.querySelector("a");
    if (firstMenuLink) firstMenuLink.focus();
  });
  menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") closeMenu();
  });

  /* FV：コピーのあと、琵琶湖を起点に写真がひろがり、外周を巡る。 */
  var fvNew = document.querySelector(".fv-new");
  var fvPhotoField = fvNew && fvNew.querySelector(".fv-photo-field");
  var fvPhotos = fvPhotoField ? Array.prototype.slice.call(fvPhotoField.querySelectorAll(".fv-photo")) : [];
  var orbitFrame = null;
  var orbitStartedAt = 0;
  var orbitPausedAt = 0;
  var orbitPhases = [-140, -98, -56, -18, 30, 72, 112, 150].map(function (degree) { return degree * Math.PI / 180; });
  var orbitDuration = 21000;

  function orbitMetrics() {
    var rect = fvPhotoField.getBoundingClientRect();
    return {
      x: rect.width * 0.42,
      y: Math.min(rect.height * 0.37, rect.height / 2 - 96)
    };
  }

  function setOrbitOrigins() {
    if (!fvPhotoField || window.innerWidth <= 900) return;
    var metrics = orbitMetrics();
    fvPhotos.forEach(function (photo, index) {
      photo.style.setProperty("--orbit-x", (Math.cos(orbitPhases[index]) * metrics.x).toFixed(2) + "px");
      photo.style.setProperty("--orbit-y", (Math.sin(orbitPhases[index]) * metrics.y).toFixed(2) + "px");
    });
  }

  function drawOrbit(now) {
    if (!fvPhotoField || document.hidden || window.innerWidth <= 900) return;
    var metrics = orbitMetrics();
    var turn = ((now - orbitStartedAt) % orbitDuration) / orbitDuration * Math.PI * 2;
    fvPhotos.forEach(function (photo, index) {
      var angle = orbitPhases[index] + turn;
      var x = Math.cos(angle) * metrics.x;
      var y = Math.sin(angle) * metrics.y;
      var depth = (Math.sin(angle) + 1) / 2;
      var scale = 0.87 + depth * 0.17;
      photo.style.transform = "translate3d(calc(-50% + " + x.toFixed(2) + "px), calc(-50% + " + y.toFixed(2) + "px), 0) scale(" + scale.toFixed(3) + ")";
      photo.style.opacity = (0.52 + depth * 0.48).toFixed(3);
      photo.style.zIndex = String(10 + Math.round(depth * 10));
    });
    orbitFrame = requestAnimationFrame(drawOrbit);
  }

  function startOrbit() {
    if (!fvNew || !fvPhotoField || reduced || window.innerWidth <= 900) return;
    setOrbitOrigins();
    fvNew.classList.add("is-orbiting");
    orbitStartedAt = performance.now();
    if (orbitFrame) cancelAnimationFrame(orbitFrame);
    orbitFrame = requestAnimationFrame(drawOrbit);
  }

  function stopOrbit() {
    if (orbitFrame) cancelAnimationFrame(orbitFrame);
    orbitFrame = null;
    if (fvNew) fvNew.classList.remove("is-orbiting");
    fvPhotos.forEach(function (photo) {
      photo.style.removeProperty("transform");
      photo.style.removeProperty("opacity");
      photo.style.removeProperty("z-index");
    });
  }

  if (fvNew) setOrbitOrigins();
  if (fvNew && reduced) {
    fvNew.classList.add("is-expanded");
  }

  /* hero: reveal on load (クリップされた行はIOに映らないため直接発火) */
  var heroFx = document.querySelectorAll(".fv .fx, .page-hero .fx");
  heroFx.forEach(function (el, i) {
    if (reduced) { el.classList.add("on"); return; }
    setTimeout(function () { el.classList.add("on"); }, 160 + i * 115);
  });

  if (fvNew && !reduced) {
    setTimeout(function () { fvNew.classList.add("is-expanded"); }, 630);
    setTimeout(function () { fvNew.classList.add("is-settled"); }, 2320);
    setTimeout(startOrbit, 2400);
    window.addEventListener("resize", function () {
      if (window.innerWidth <= 900) { stopOrbit(); return; }
      setOrbitOrigins();
      if (fvNew.classList.contains("is-settled")) startOrbit();
    }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        orbitPausedAt = performance.now();
        if (orbitFrame) cancelAnimationFrame(orbitFrame);
        orbitFrame = null;
      } else if (fvNew.classList.contains("is-orbiting")) {
        orbitStartedAt += performance.now() - orbitPausedAt;
        orbitFrame = requestAnimationFrame(drawOrbit);
      }
    });
  }

  /* manifesto: セクション交差でまとめて発火（行が切り抜きのため） */
  var mani = document.querySelector(".manifesto");
  if (mani) {
    var maniFx = mani.querySelectorAll(".fx");
    var maniReveal = function () {
      maniFx.forEach(function (el, i) {
        setTimeout(function () { el.classList.add("on"); }, i * 170);
      });
    };
    if (reduced || !("IntersectionObserver" in window)) {
      maniFx.forEach(function (el) { el.classList.add("on"); });
    } else {
      var mio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { maniReveal(); mio.disconnect(); }
        });
      }, { threshold: 0.25 });
      mio.observe(mani);
    }
  }

  /* generic reveal */
  var targets = Array.prototype.filter.call(document.querySelectorAll(".fx"), function (el) {
    return !el.closest(".fv, .page-hero, .manifesto");
  });
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("on"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = 0;
        var group = el.closest(".action-grid, .field-rows, .values, .flow");
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

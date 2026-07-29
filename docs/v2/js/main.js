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

  /* hero: reveal on load (クリップされた行はIOに映らないため直接発火) */
  var heroFx = document.querySelectorAll(".fv .fx, .page-hero .fx");
  heroFx.forEach(function (el, i) {
    if (reduced) { el.classList.add("on"); return; }
    setTimeout(function () { el.classList.add("on"); }, 160 + i * 130);
  });

  /* FV：琵琶湖を起点に写真が外へひろがる。コピーが落ち着いてから動かす。 */
  var fvNew = document.querySelector(".fv-new");
  if (fvNew) {
    if (reduced) {
      fvNew.classList.add("is-expanded");
    } else {
      setTimeout(function () { fvNew.classList.add("is-expanded"); }, 260);
    }
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

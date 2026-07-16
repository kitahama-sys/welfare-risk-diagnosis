/* AUN Corporate Site Prototype — minimal behaviour */
(function () {
  "use strict";

  /* mobile menu */
  var toggle = document.getElementById("menu-toggle");
  var menu = document.getElementById("mobile-menu");

  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "メニューを開く");
    menu.hidden = true;
    document.body.style.overflow = "";
  }

  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    if (open) {
      closeMenu();
    } else {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "メニューを閉じる");
      menu.hidden = false;
      document.body.style.overflow = "hidden";
    }
  });

  menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeMenu();
  });

  /* reveal on scroll */
  var targets = document.querySelectorAll(
    ".section-head, .sodatsu-item, .jigyo-field, .kyoten-area, .hataraku-body, .chiiki-list li, .action-card, .sec-cta, .fv-copy, .fv-photo"
  );
  targets.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("on");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add("on"); });
  }
})();

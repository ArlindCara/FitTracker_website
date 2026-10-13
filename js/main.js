/* FitTracker website — vanilla JS, no dependencies */
(function () {
  "use strict";

  /* ---------- Navbar: scroll state + mobile menu ---------- */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");

  function onScroll() {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.innerHTML = open
        ? '<i class="fas fa-times" aria-hidden="true"></i>'
        : '<i class="fas fa-bars" aria-hidden="true"></i>';
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a") && nav.classList.contains("is-open")) toggle.click();
    });
  }

  /* ---------- Active nav link on scroll ---------- */
  var navAnchors = links ? links.querySelectorAll('a[href^="#"]:not(.btn)') : [];
  if ("IntersectionObserver" in window && navAnchors.length) {
    var map = {};
    navAnchors.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          navAnchors.forEach(function (a) { a.classList.remove("is-active"); });
          map[en.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal, #weights");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Plan Wizard demo (mirrors WorkoutSplit.forDays in the app) ---------- */
  var SPLITS = {
    1: { name: "Full Body", days: ["Full Body"] },
    2: { name: "Upper / Lower", days: ["Upper", "Lower"] },
    3: { name: "Push / Pull / Legs", days: ["Push", "Pull", "Legs"] },
    4: { name: "Upper / Lower ×2", days: ["Upper", "Lower", "Upper", "Lower"] },
    5: { name: "PPL + Upper / Lower", days: ["Push", "Pull", "Legs", "Upper", "Lower"] },
    6: { name: "Push / Pull / Legs ×2", days: ["Push", "Pull", "Legs", "Push", "Pull", "Legs"] },
    7: { name: "PPL + Upper / Lower + Full Body", days: ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Full Body"] }
  };
  var dayButtons = document.getElementById("dayButtons");
  var splitName = document.getElementById("splitName");
  var splitDays = document.getElementById("splitDays");

  function renderSplit(n) {
    var s = SPLITS[n];
    splitName.textContent = s.name;
    splitDays.innerHTML = "";
    s.days.forEach(function (d, i) {
      var el = document.createElement("div");
      el.style.animationDelay = i * 60 + "ms";
      el.innerHTML = "<small>Day " + (i + 1) + "</small><strong>" + d + "</strong>";
      splitDays.appendChild(el);
    });
    dayButtons.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(Number(b.dataset.days) === n));
    });
  }
  if (dayButtons && splitName && splitDays) {
    for (var d = 1; d <= 7; d++) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.days = d;
      b.textContent = d;
      b.setAttribute("aria-label", d + (d === 1 ? " day" : " days") + " per week");
      dayButtons.appendChild(b);
    }
    dayButtons.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (btn) renderSplit(Number(btn.dataset.days));
    });
    renderSplit(3);
  }

  /* ---------- Exercise library (data mirrors the app's exercise entities) ---------- */
  // 4th field: base exercise whose AI movement model is reused (same mechanics), or null.
  var EXERCISES = [
    ["Back Delt Row", "back_delt_row", "Pull", null],
    ["Back Deltoids Openings", "back_deltoids_openings", "Pull", null],
    ["Barbell Curl", "curl_barbell", "Pull", null],
    ["Bench Press", "bench_press", "Push", null],
    ["Bent-Over Row", "bent_over_row", "Pull", null],
    ["Chin-Up", "chin_up", "Pull", null],
    ["Concentration Curl", "concentration_curl", "Pull", null],
    ["Deadlift", "deadlift", "Legs", null],
    ["Dips", "dips", "Push", null],
    ["Flies", "flies", "Push", null],
    ["Front Squat", "front_squat", "Legs", "Squat"],
    ["Goblet Squat", "goblet_squat", "Legs", "Squat"],
    ["Hip Thrust", "hip_thrust", "Legs", null],
    ["Hyperextension", "hyperextension", "Legs", null],
    ["Inclined Bench Press", "inclined_bench_press", "Push", "Bench Press"],
    ["Lat Pulldown", "lat_pulldown", "Pull", "Pull-Up"],
    ["Lateral Raises", "lateral_raises", "Push", null],
    ["Lateral Squat", "lateral_squat", "Legs", null],
    ["Leg Extension", "leg_extension", "Legs", null],
    ["Leg Press", "leg_press", "Legs", null],
    ["Muscle-Up", "muscle_up", "Pull", null],
    ["Pull-Up", "pull_up", "Pull", null],
    ["Pullover", "pullover", "Pull", null],
    ["Push-Up", "push_up", "Push", null],
    ["Shoulder Press", "shoulder_press", "Push", null],
    ["Split Squat", "split_squat", "Legs", null],
    ["Squat", "squat", "Legs", null],
    ["Strict Curl", "strict_curl", "Pull", null],
    ["Triceps Push-Down", "triceps_push_down", "Push", null]
  ];
  var grid = document.getElementById("exerciseGrid");
  var filters = document.getElementById("filters");

  if (grid && filters) {
    var frag = document.createDocumentFragment();
    EXERCISES.forEach(function (ex) {
      var card = document.createElement("article");
      card.className = "exercise";
      card.dataset.cat = ex[2];
      card.innerHTML =
        '<figure><img src="img/exercises/' + ex[1] + '.gif" alt="Animated demo of ' + ex[0] + '" loading="lazy" width="200" height="200"></figure>' +
        "<figcaption><h3>" + ex[0] + "</h3></figcaption>" +
        '<div class="meta"><span>' + ex[2] + "</span>" + '<span class="ai">AI form score</span>' + (ex[3] ? '<span title="Same mechanics: reuses the ' + ex[3] + ' movement model">via ' + ex[3] + '</span>' : '') + "</div>";
      frag.appendChild(card);
    });
    grid.appendChild(frag);

    ["All", "Legs", "Push", "Pull"].forEach(function (cat) {
      var count = cat === "All" ? EXERCISES.length : EXERCISES.filter(function (e) { return e[2] === cat; }).length;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.cat = cat;
      btn.setAttribute("aria-pressed", String(cat === "All"));
      btn.innerHTML = cat + "<span>" + count + "</span>";
      filters.appendChild(btn);
    });
    filters.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var cat = btn.dataset.cat;
      filters.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      grid.querySelectorAll(".exercise").forEach(function (c) { c.hidden = cat !== "All" && c.dataset.cat !== cat; });
    });
  }

  /* ---------- Screenshot gallery arrows ---------- */
  var gallery = document.getElementById("gallery");
  document.querySelectorAll("[data-gallery]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (gallery) gallery.scrollBy({ left: Number(btn.dataset.gallery) * 264, behavior: "smooth" });
    });
  });

  /* ---------- Video modal (iframe loaded only on open) ---------- */
  var modal = document.getElementById("videoModal");
  var frame = document.getElementById("videoFrame");
  var lastFocus = null;
  function openVideo() {
    lastFocus = document.activeElement;
    frame.src = frame.dataset.src;
    modal.classList.add("is-open");
    modal.querySelector("[data-video-close]").focus();
  }
  function closeVideo() {
    modal.classList.remove("is-open");
    frame.src = "";
    if (lastFocus) lastFocus.focus();
  }
  if (modal && frame) {
    document.querySelectorAll("[data-video-open]").forEach(function (b) { b.addEventListener("click", openVideo); });
    modal.querySelector("[data-video-close]").addEventListener("click", closeVideo);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeVideo(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeVideo();
    });
  }

  /* ---------- Contact form: static site, so compose a mailto ---------- */
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = document.getElementById("formNote");
      if (!form.checkValidity()) {
        note.textContent = "Please fill in all fields with a valid email address.";
        form.reportValidity();
        return;
      }
      var name = form.name.value.trim();
      var body = form.message.value.trim() + "\n\n— " + name + " (" + form.email.value.trim() + ")";
      window.location.href = "mailto:cararlind@gmail.com?subject=" +
        encodeURIComponent("[FitTracker] " + form.subject.value.trim()) +
        "&body=" + encodeURIComponent(body);
      note.textContent = "Thanks " + name + "! Your email app should open now.";
    });
  }

  /* ---------- Hero video: pause/play button, respects reduced motion ---------- */
  var heroVideo = document.getElementById("heroVideo");
  var heroToggle = document.getElementById("heroVideoToggle");
  if (heroVideo && heroToggle) {
    var setToggle = function () {
      var paused = heroVideo.paused;
      heroToggle.setAttribute("aria-label", paused ? "Play video" : "Pause video");
      heroToggle.innerHTML = '<i class="fas fa-' + (paused ? "play" : "pause") + '" aria-hidden="true"></i>';
    };
    heroToggle.addEventListener("click", function () {
      if (heroVideo.paused) heroVideo.play(); else heroVideo.pause();
    });
    heroVideo.addEventListener("play", setToggle);
    heroVideo.addEventListener("pause", setToggle);
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      heroVideo.removeAttribute("autoplay");
      heroVideo.pause();
    }
    setToggle();
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

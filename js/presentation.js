// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

// Custom Cursor
const cursor = document.querySelector(".cursor");
const links = document.querySelectorAll("a, .explore-btn");

document.addEventListener("mousemove", (e) => {
  gsap.to(cursor, {
    x: e.clientX,
    y: e.clientY,
    duration: 0.1,
    ease: "power2.out",
  });
});

links.forEach((link) => {
  link.addEventListener("mouseenter", () => cursor.classList.add("active"));
  link.addEventListener("mouseleave", () => cursor.classList.remove("active"));
});

// Loader Sequence
const tlLoader = gsap.timeline();

tlLoader
  .to(".progress", {
    width: "100%",
    duration: 2,
    ease: "power3.inOut",
  })
  .to(
    ".loader-wrap",
    {
      yPercent: -100,
      duration: 1,
      ease: "expo.inOut",
    },
    "+=0.2",
  )
  .from(
    ".pres-header",
    {
      y: -50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    },
    "-=0.5",
  )
  .from(
    ".panel-1 .subtitle",
    {
      y: 20,
      opacity: 0,
      duration: 0.8,
    },
    "-=0.5",
  )
  .from(
    ".panel-1 .title",
    {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power4.out",
    },
    "-=0.6",
  )
  .from(
    ".panel-1 .desc",
    {
      y: 20,
      opacity: 0,
      duration: 0.8,
    },
    "-=0.6",
  )
  .from(
    ".abstract-shape",
    {
      scale: 0.8,
      opacity: 0,
      rotation: 45,
      duration: 1.5,
      ease: "back.out(1.7)",
    },
    "-=1",
  );

// Theme Toggle Logic
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  const isLight =
    document.documentElement.getAttribute("data-theme") === "light";
  if (isLight) {
    document.documentElement.removeAttribute("data-theme");
    themeToggle.textContent = "Светлая тема";
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    themeToggle.textContent = "Темная тема";
  }
});

// Horizontal Scroll and Pagination
const scrollContainer = document.querySelector(".scroll-container");
const panels = gsap.utils.toArray(".panel");
const dots = document.querySelectorAll(".pagination .dot");

let activeIndex = 0;

const st = gsap.to(panels, {
  xPercent: -100 * (panels.length - 1),
  ease: "none",
  scrollTrigger: {
    trigger: scrollContainer,
    pin: true,
    scrub: 1,
    snap: 1 / (panels.length - 1),
    end: () => "+=" + scrollContainer.offsetWidth,
    onUpdate: (self) => {
      const progress = self.progress;
      const exactIndex = progress * (panels.length - 1);
      activeIndex = Math.round(exactIndex);

      dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === activeIndex);
      });

      // Toggle arrows opacity based on ends
      document.getElementById("nav-prev").style.opacity =
        activeIndex === 0 ? "0.3" : "1";
      document.getElementById("nav-prev").style.pointerEvents =
        activeIndex === 0 ? "none" : "auto";

      document.getElementById("nav-next").style.opacity =
        activeIndex === panels.length - 1 ? "0.3" : "1";
      document.getElementById("nav-next").style.pointerEvents =
        activeIndex === panels.length - 1 ? "none" : "auto";
    },
  },
});

// Arrow Navigation
const btnPrev = document.getElementById("nav-prev");
const btnNext = document.getElementById("nav-next");

function goToSlide(index) {
  if (index < 0 || index >= panels.length) return;
  const trigger = st.scrollTrigger;
  const maxScroll = trigger.end - trigger.start;
  const targetY = trigger.start + maxScroll * (index / (panels.length - 1));
  window.scrollTo({ top: targetY, behavior: "smooth" });
}

btnPrev.addEventListener("click", () => goToSlide(activeIndex - 1));
btnNext.addEventListener("click", () => goToSlide(activeIndex + 1));

// Animations for Panel 3 Data Stream
const dataItems = gsap.utils.toArray(".data-stream div");
dataItems.forEach((item, i) => {
  gsap.to(item, {
    scrollTrigger: {
      trigger: ".panel-3",
      containerAnimation: gsap.getById(scrollContainer),
      start: "left center",
      toggleActions: "play reverse play reverse",
    },
    x: 0,
    opacity: 1,
    duration: 0.5,
    delay: i * 0.2,
  });
});

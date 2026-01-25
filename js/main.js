const pages = document.querySelectorAll(".page");
const dots = document.querySelectorAll(".dot");
let current = 0;

/* INIT */
pages[0].classList.add("active");

/* LOCK SCROLL */
window.addEventListener("wheel", e => e.preventDefault(), { passive: false });
window.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

function goTo(index) {
  pages[current].classList.remove("active");
  dots[current]?.classList.remove("active");

  current = index;

  pages[current].classList.add("active");
  dots[current]?.classList.add("active");

  pages[current].scrollIntoView({ behavior: "smooth" });
}

/* CTA */
document.querySelectorAll(".go-next").forEach(btn => {
  btn.addEventListener("click", () => {
    goTo(Math.min(current + 1, pages.length - 1));
  });
});

/* DOT NAV */
dots.forEach(dot => {
  dot.addEventListener("click", () => {
    goTo(parseInt(dot.dataset.index));
  });
});

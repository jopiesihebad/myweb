const pages = document.querySelectorAll(".page");
let current = 0;

document.querySelectorAll(".go-next").forEach(btn => {
  btn.addEventListener("click", () => {
    current = Math.min(current + 1, pages.length - 1);
    pages[current].scrollIntoView({ behavior: "smooth" });
  });
});

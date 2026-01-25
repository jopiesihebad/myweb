document.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 25;
  const y = (e.clientY / window.innerHeight - 0.5) * 25;

  const mesh = document.querySelector(".mesh-bg");
  if (mesh) {
    mesh.style.transform = `translate(${x}px, ${y}px)`;
  }
});

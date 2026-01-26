/* ======================================================
   LAZY VIDEO + SUBTLE ENTRANCE ANIMATION
====================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ===============================
     LAZY VIDEO (PLAY / PAUSE)
  =============================== */

  const videos = document.querySelectorAll('[data-lazy-video]');

  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const video = entry.target;

          if (entry.isIntersecting) {
            // play video when visible
            if (video.paused) {
              video.play().catch(() => {});
            }
          } else {
            // pause when offscreen
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      {
        threshold: 0.25
      }
    );

    videos.forEach(video => {
      // SAFETY: ensure muted for mobile autoplay
      video.muted = true;
      videoObserver.observe(video);
    });
  }

  /* ===============================
     SUBTLE ENTRANCE ANIMATION
  =============================== */

  const animatedElements = document.querySelectorAll('.animate');

  if ('IntersectionObserver' in window) {
    const animationObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2
      }
    );

    animatedElements.forEach(el => animationObserver.observe(el));
  }

});

// ================= PAYMENT HANDLER =================
document.querySelectorAll('.pay-xendit').forEach(btn => {
  btn.addEventListener('click', () => {

    // TODO: ganti dengan payment link Xendit lo
    const XENDIT_PAYMENT_URL = 'https://checkout.xendit.co/your-link';

    // commitment signal
    btn.disabled = true;
    btn.textContent = 'Redirecting to secure payment…';

    setTimeout(() => {
      window.location.href = XENDIT_PAYMENT_URL;
    }, 500);
  });
});

// auto update year
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}


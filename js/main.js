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
// ================= TESTIMONIAL AVATAR INITIAL =================
document.addEventListener('DOMContentLoaded', () => {

  const avatars = document.querySelectorAll('.testimonial-avatar');

  const colorPairs = [
    ['#1f2937', '#111827'], // slate
    ['#111827', '#020617'], // deep dark
    ['#312e81', '#1e1b4b'], // indigo
    ['#0f172a', '#020617'], // navy
  ];

  avatars.forEach((avatar, index) => {
    const name = avatar.dataset.name || '';
    const parts = name.trim().split(' ');

    let initials = '';
    if (parts.length >= 2) {
      initials = parts[0][0] + parts[1][0];
    } else if (parts.length === 1) {
      initials = parts[0][0];
    }

    initials = initials.toUpperCase();
    avatar.textContent = initials;

    // deterministic color (biar konsisten)
    const pair = colorPairs[index % colorPairs.length];
    avatar.style.background = `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
  });

});

// ================= DEMO MODAL =================

const demoModal = document.getElementById('demoModal');
const demoVideo = document.getElementById('demoVideo');
const demoTriggers = document.querySelectorAll('.demo-trigger');
const demoClose = document.querySelector('.demo-close');
const demoBackdrop = document.querySelector('.demo-backdrop');

function openDemo() {
  demoModal.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  if (demoVideo) {
    demoVideo.currentTime = 0;
    demoVideo.play().catch(() => {});
  }
}

function closeDemo() {
  demoModal.classList.remove('is-open');
  document.body.style.overflow = '';

  if (demoVideo) {
    demoVideo.pause();
  }
}

demoTriggers.forEach(btn =>
  btn.addEventListener('click', openDemo)
);

demoClose.addEventListener('click', closeDemo);
demoBackdrop.addEventListener('click', closeDemo);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && demoModal.classList.contains('is-open')) {
    closeDemo();
  }
});



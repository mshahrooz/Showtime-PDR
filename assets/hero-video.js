/* Showtime PDR: one reliable, mobile-friendly hero video for all three text slides. */
(() => {
  'use strict';
  const init = () => {
    const hero = document.querySelector('section.hero[data-hero]');
    const video = hero && hero.querySelector('video.showtime-hero-video');
    const button = hero && hero.querySelector('[data-hero-video-toggle]');
    if (!hero || !video || !button) return;

    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const primary = video.getAttribute(mobile ? 'data-mobile-src' : 'data-desktop-src');
    const desktop = video.getAttribute('data-desktop-src');
    if (!primary || !desktop) return;

    const iconPause = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M9 5v14m6-14v14"/></svg>';
    const iconPlay = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>';
    let userPaused = false;
    let playingRequest = false;
    let fallbackUsed = false;
    let currentSource = primary;
    let errorRetryCount = 0;

    const paintButton = () => {
      const playing = !video.paused && !video.ended;
      button.innerHTML = playing ? iconPause : iconPlay;
      const text = playing ? 'Pause background video' : 'Play background video';
      button.setAttribute('aria-label', text);
      button.removeAttribute('title');
      button.setAttribute('aria-pressed', String(playing));
      button.classList.toggle('needs-play', !playing);
    };

    const play = () => {
      if (userPaused || document.hidden || playingRequest) return;
      // Muting and inline playback are essential for mobile autoplay policies.
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      try {
        const result = video.play();
        if (result && typeof result.then === 'function') {
          playingRequest = true;
          result.then(() => {
            playingRequest = false;
            paintButton();
          }).catch(() => {
            // In Low Power Mode or when autoplay is blocked, the user can press Play.
            playingRequest = false;
            paintButton();
          });
        } else {
          paintButton();
        }
      } catch (_) {
        paintButton();
      }
    };

    const switchTo = (src) => {
      if (!src || currentSource === src && video.getAttribute('src') === src) return;
      currentSource = src;
      video.setAttribute('src', src);
      video.load(); // Performed once at startup, or once if the mobile file fails.
    };

    video.addEventListener('playing', paintButton);
    video.addEventListener('pause', paintButton);
    video.addEventListener('loadedmetadata', () => { if (!userPaused) play(); });
    video.addEventListener('canplay', () => { if (!userPaused && video.paused) play(); });
    video.addEventListener('error', () => {
      if (!fallbackUsed && mobile && currentSource !== desktop) {
        fallbackUsed = true;
        switchTo(desktop);
        play();
      } else {
        // Avoid an endless retry loop if the visitor is offline.
        if (++errorRetryCount <= 1 && !userPaused) {
          video.load();
          play();
        } else {
          button.removeAttribute('title');
          paintButton();
        }
      }
    });

    button.addEventListener('click', () => {
      if (!video.paused) {
        userPaused = true;
        video.pause();
        paintButton();
        return;
      }
      userPaused = false;
      if (video.error) {
        errorRetryCount = 0;
        video.load();
      }
      play(); // Triggered by a real tap/click, so it satisfies browser policies.
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !userPaused && video.paused) play();
    });
    window.addEventListener('pageshow', () => {
      if (!userPaused && video.paused) play();
    });

    paintButton();
    // Choose the right optimized file explicitly instead of relying on <source media>,
    // which can differ across browser versions. No slide callback modifies the video.
    switchTo(primary);
    play();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
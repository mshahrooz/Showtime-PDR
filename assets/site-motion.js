/* Showtime PDR | shared animation engine across six published pages. */
(() => {
  'use strict';

  const boot = () => {
    const main = document.querySelector('main');
    if (!main) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canAnimate = typeof Element.prototype.animate === 'function';
    const motionReady = canAnimate && 'IntersectionObserver' in window && !prefersReduced.matches;

    // Use one shared system for generic sections. The homepage's existing
    // slideshow text animation is left untouched to preserve continuous video.
    const selectors = [
      '.reveal',
      '.section-head',
      '.sec-head',
      '.intro-grid > *',
      '.service-grid > *',
      '.method-grid > *',
      '.meet-grid > *',
      '.contact-grid > *',
      '.proof-card > *',
      '.recent-work .work-card',
      '.recent-work .sec-head',
      '.review-grid > *',
      '.reviews-grid > *',
      '.work-grid > *',
      '.gal-grid > *',
      '.value-grid > *',
      '.values-grid > *',
      '.process-grid > *',
      '.begin-grid > *',
      '.steps-grid > *',
      '.steps-flow > *',
      '.page-banner h1',
      '.page-banner .breadcrumb',
      '.page-banner .sec-eyebrow',
      '.page-banner .subtitle',
      '.contact-left > *',
      '.intro-copy > *',
      '.story-media',
      '.story-copy',
      '.svc-d-media',
      '.svc-d-content'
    ].join(',');

    const candidates = Array.from(main.querySelectorAll(selectors));
    const nodes = [];
    const seen = new Set();
    candidates.forEach(node => {
      if (seen.has(node)) return;
      // One animation per parent: nested transforms could disturb sliders,
      // hover states, or interactive controls.
      const parent = node.parentElement;
      if (parent && parent.closest('.st-motion-target')) return;
      // Never animate hidden dialogs or controls, or duplicate the existing
      // hero slide transition with a second animation.
      if (node.closest('.hero, dialog, [hidden], [aria-hidden="true"]')) return;
      if (node.classList.contains('showtime-reveal')) return;
      if (node.matches('button, input, select, textarea, .ba, [data-repair-slider]')) return;
      seen.add(node);
      node.classList.add('st-motion-target');
      nodes.push(node);
    });

    const revealImmediately = node => {
      node.classList.add('st-motion-visible');
      if (node.classList.contains('reveal')) node.classList.add('visible');
      if (node.classList.contains('showtime-reveal')) node.classList.add('showtime-visible');
      node.classList.remove('st-motion-pending');
    };

    if (!motionReady) {
      nodes.forEach(revealImmediately);
      return;
    }

    const staggerCount = new Map();
    const delays = new WeakMap();
    nodes.forEach(node => {
      let group = node.closest(
        '.gal-grid, .review-grid, .reviews-grid, .service-grid, ' +
        '.values-grid, .value-grid, .process-grid, .method-grid, ' +
        '.steps-grid, .begin-grid, .proof-card, .intro-grid, .meet-grid'
      );
      group = group || node.closest('section, article') || main;
      const count = staggerCount.get(group) || 0;
      staggerCount.set(group, count + 1);
      delays.set(node, Math.min(count % 5, 4) * 75);
      node.classList.add('st-motion-pending');
    });
    document.documentElement.classList.add('st-motion-ready');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const node = entry.target;
        observer.unobserve(node);
        // Unlock original page CSS before adding a temporary WAAPI layer.
        revealImmediately(node);
        const reverse = node.matches('.reverse, .right, .svc-detail.reverse');
        const media = node.matches(
          'figure, img, .story-media, .svc-d-media, .gal-item, .gcard, .work-card'
        );
        const distance = media ? 22 : 30;
        const offset = reverse ? -distance : distance;
        const delay = delays.get(node) || 0;
        let animation;
        try {
          animation = node.animate([
            { opacity: 0, transform: 'translate3d(0,' + offset + 'px,0) scale(' + (media ? '.975' : '.988') + ')' },
            { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
          ], {
            duration: media ? 820 : 680,
            delay,
            easing: 'cubic-bezier(.2,.72,.2,1)',
            fill: 'both'
          });
          // Removing fill after completion restores native hover transforms,
          // gallery drag handles, and carousels exactly as before.
          animation.finished.then(() => animation.cancel()).catch(() => {});
        } catch (_) {
          revealImmediately(node);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -30px 0px' });

    nodes.forEach(node => observer.observe(node));

    // Never leave content hidden if the user changes the OS motion preference.
    const onPreference = event => {
      if (!event.matches) return;
      observer.disconnect();
      nodes.forEach(revealImmediately);
    };
    if (prefersReduced.addEventListener) {
      prefersReduced.addEventListener('change', onPreference);
    }
    window.addEventListener('pagehide', () => {
      observer.disconnect();
      nodes.forEach(revealImmediately);
    }, { once: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

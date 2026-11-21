/* Showtime PDR: unified scroll and entrance animation for every page.
   The inline !important styles deliberately outrank imported page CSS. */
(() => {
  'use strict';

  const pick = [
    'header .brand',
    'header .desktop-nav',
    'header .header-actions',
    'main .page-banner .breadcrumb',
    'main .page-banner h1',
    'main .page-banner .lead',
    'main .page-banner .subtitle',
    'main .page-banner .est-badge',
    'main .page-banner .sec-eyebrow',
    'main .page-banner p',
    'main .google-card',
    'main .sec-head',
    'main .section-head',
    'main .reveal',
    'main .intro-grid > *',
    'main .intro-copy > *',
    'main .proof-card > *',
    'main .service-grid > *',
    'main .service-card',
    'main .story-media',
    'main .story-copy',
    'main .value-card',
    'main .owner-card',
    'main .owners-duo > *',
    'main .meet-grid > *',
    'main .svc-d-media',
    'main .svc-d-content',
    'main .svc-feats',
    'main .gal-item',
    'main .spotlight .sp-media',
    'main .spotlight .sp-info',
    'main .sp-info',
    'main .sp-media',
    'main .review-grid > *',
    'main .rev-grid > *',
    'main .rev-card',
    'main .gcard',
    'main .recent-work .gcard',
    'main .process-card',
    'main .steps-grid > *',
    'main .step-card',
    'main .contact-left',
    'main .form-card',
    'main .biz-info',
    'main .biz-map',
    'main .photo-panel',
    'main .contact-grid > *',
    'main .section-action',
    'main .cta-img .inner',
    'main .rev-band .fs-container > *',
    'main .review-cta .shell',
    'footer .footer-grid > *'
  ].join(',');

  function boot() {
    const main = document.querySelector('main');
    if (!main || document.documentElement.dataset.stMotionInitialized === '1') return;
    const root = document.documentElement;
    root.dataset.stMotionInitialized = '1';

    const reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 420 : 770;
    const distance = reduced ? 0 : 30;
    const easing = 'cubic-bezier(.17,.72,.24,1)';
    const staged = [];
    const selected = new Set();
    const sequence = new Map();
    const delays = new WeakMap();
    let observer = null;

    // DOM-order processing makes parent animation surfaces take precedence over
    // nested headings and controls. Each card animates once, as a unit.
    document.querySelectorAll(pick).forEach(node => {
      if (selected.has(node)) return;
      if (node.closest('dialog, [hidden], [inert], [aria-hidden="true"]')) return;
      if (node.closest('.hero, .showtime-hero-video, .st-theme-customizer')) return;
      if (node.matches('button, input, textarea, select, video, .ba, [data-repair-slider]')) return;
      if (staged.some(parent => parent.contains(node))) return;
      if (getComputedStyle(node).display === 'none') return;
      selected.add(node);

      const group = node.closest(
        '.review-grid, .rev-grid, .gal-grid, .values-grid, ' +
        '.service-grid, .steps-grid, .intro-grid, .meet-grid, ' +
        '.footer-grid, .proof-card, .owners-duo, .contact-grid'
      ) || node.closest('section') || node.parentElement;
      const index = sequence.get(group) || 0;
      sequence.set(group, index + 1);
      delays.set(node, Math.min(index % 5, 4) * 80);
      staged.push(node);

      // Establish an explicit initial state that cannot be cancelled by
      // old .reveal, .visible, !important, or @media stylesheet declarations.
      node.style.setProperty('transition', 'none', 'important');
      node.style.setProperty('opacity', '0', 'important');
      node.style.setProperty('translate', '0 ' + distance + 'px', 'important');
      node.classList.add('st-force-staged');
      // The original page scripts can no longer leave legacy reveals hidden.
      if (node.classList.contains('reveal')) node.classList.add('visible');
      if (node.classList.contains('showtime-reveal')) node.classList.add('showtime-visible');
    });
    root.classList.add('st-force-motion');
    root.dataset.stMotionTargets = String(staged.length);

    // Commit the initial opacity/offset in a single layout pass.
    void root.offsetHeight;
    staged.forEach(node => node.style.setProperty(
      'transition',
      'opacity ' + duration + 'ms ease, translate ' + duration + 'ms ' + easing,
      'important'
    ));

    function reveal(node) {
      if (!node || node.dataset.stMotionEntered === '1') return;
      node.dataset.stMotionEntered = '1';
      if (observer) observer.unobserve(node);
      const delay = delays.get(node) || 0;
      const finish = () => {
        node.classList.add('st-force-complete');
        node.classList.remove('st-force-staged');
        node.style.removeProperty('opacity');
        node.style.removeProperty('translate');
        node.style.removeProperty('transition');
        node.style.removeProperty('will-change');
      };
      // Two paint frames are deliberate: they guarantee a visible starting
      // frame, even on fast connections and on in-view elements at page load.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        node.style.setProperty('will-change', 'opacity, translate', 'important');
        node.style.setProperty('transition-delay', delay + 'ms', 'important');
        node.style.setProperty('opacity', '1', 'important');
        node.style.setProperty('translate', '0 0', 'important');
        node.classList.add('st-force-visible');
        setTimeout(() => {
          node.style.removeProperty('transition-delay');
          finish();
        }, duration + delay + 150);
      }));
    }

    function scan() {
      // Fallback for delayed/missing IntersectionObserver callbacks.
      // Also handles pages restored from the browser back/forward cache.
      const height = window.innerHeight || document.documentElement.clientHeight || 800;
      staged.forEach(node => {
        if (node.dataset.stMotionEntered === '1') return;
        const rect = node.getBoundingClientRect();
        if (rect.top <= height * .94 && rect.bottom >= 0) reveal(node);
      });
    }

    let scheduled = false;
    function requestScan() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; scan(); });
    }

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) reveal(entry.target);
        });
      }, { root: null, rootMargin: '0px 0px -5% 0px', threshold: .01 });
      staged.forEach(node => observer.observe(node));
    }

    window.addEventListener('scroll', requestScan, { passive: true });
    window.addEventListener('resize', requestScan, { passive: true });
    window.addEventListener('pageshow', requestScan);
    window.addEventListener('load', requestScan, { once: true });
    requestScan();
    setTimeout(requestScan, 190);

    // No permanent hidden content if navigating away during a transition.
    window.addEventListener('pagehide', () => {
      if (observer) observer.disconnect();
      staged.forEach(node => {
        node.style.removeProperty('opacity');
        node.style.removeProperty('translate');
        node.style.removeProperty('transition');
        node.style.removeProperty('transition-delay');
        node.style.removeProperty('will-change');
        node.classList.add('st-force-complete');
      });
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

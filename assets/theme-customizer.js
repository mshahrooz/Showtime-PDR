/* Showtime PDR - site-wide theme color customizer. No dependencies. */
(function () {
  'use strict';

  // Change this one value if the business wants a different default for ALL visitors.
  var DEFAULT = '#1A6AA0';
  var KEY = 'showtime-pdr-theme-color-v1';
  var root = document.documentElement;
  var current = DEFAULT;

  function normalize(value) {
    if (typeof value !== 'string') return null;
    var hex = value.trim().replace(/^#/, '').toUpperCase();
    if (/^[0-9A-F]{3}$/.test(hex)) hex = hex.split('').map(function (c) { return c + c; }).join('');
    return /^[0-9A-F]{6}$/.test(hex) ? '#' + hex : null;
  }

  function rgb(hex) {
    return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); });
  }

  function toHex(parts) {
    return '#' + parts.map(function (n) {
      return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    }).join('').toUpperCase();
  }

  function shade(hex, factor) {
    return toHex(rgb(hex).map(function (c) { return c * factor; }));
  }

  function mix(hex, other, amount) {
    var a = rgb(hex), b = rgb(other);
    return toHex(a.map(function (n, i) { return n * (1 - amount) + b[i] * amount; }));
  }

  function hslParts(hex) {
    var a = rgb(hex).map(function (v) { return v / 255; });
    var r = a[0], g = a[1], b = a[2];
    var max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    var h = 0, s = 0, l = (max + min) / 2;
    if (delta) {
      s = delta / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = ((g - b) / delta) % 6; break;
        case g: h = (b - r) / delta + 2; break;
        default: h = (r - g) / delta + 4;
      }
      h *= 60;
    }
    return { h: (h + 360) % 360, s: isFinite(s) ? s * 100 : 0, l: l * 100 };
  }

  function hsl(h, s, l) {
    return 'hsl(' + Math.round(h) + ' ' + Math.round(Math.max(0, Math.min(100, s))) +
      '% ' + Math.round(Math.max(0, Math.min(100, l))) + '%)';
  }

  function luminance(hex) {
    var vals = rgb(hex).map(function (value) {
      value = value / 255;
      return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2];
  }

  function textOn(hex) {
    // Choose text according to WCAG contrast against the chosen background.
    var l = luminance(hex);
    return 1.05 / (l + 0.05) >= (l + 0.05) / 0.05 ? '#FFFFFF' : '#17203A';
  }

  function read() {
    try { return normalize(localStorage.getItem(KEY)) || DEFAULT; }
    catch (error) { return DEFAULT; }
  }

  function save(value) {
    try {
      if (value === DEFAULT) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, value);
    } catch (error) { /* Previews and private browsing may block storage. */ }
  }

  function apply(value, remember) {
    var color = normalize(value);
    if (!color) return false;
    current = color;
    var c = hslParts(color);
    var saturation = Math.max(38, Math.min(78, c.s));
    var hover = shade(color, 0.79);
    var vars = {
      '--theme-primary': color,
      '--theme-hover': hover,
      '--theme-navy': hsl(c.h, saturation * 0.65, 16),
      '--theme-navy-light': hsl(c.h, saturation * 0.8, 29),
      '--theme-950': hsl(c.h, saturation * 0.7, 12),
      '--theme-900': hsl(c.h, saturation * 0.75, 18),
      '--theme-800': hsl(c.h, saturation * 0.83, 26),
      '--theme-600': mix(color, '#FFFFFF', 0.12),
      '--theme-sky': hsl(c.h, Math.max(45, saturation), 83),
      '--theme-sky-secondary': hsl(c.h, Math.max(45, saturation), 78),
      '--theme-mid': hsl(c.h, Math.max(40, saturation * 0.72), 69),
      '--theme-line': hsl(c.h, 39, 82),
      '--theme-line-strong': hsl(c.h, 38, 78),
      '--theme-pale': hsl(c.h, 60, 95),
      '--theme-100': hsl(c.h, 56, 89),
      '--theme-50': hsl(c.h, 59, 97),
      '--theme-on-primary': textOn(color),
      '--theme-on-hover': textOn(hover)
    };
    // Preserve the exact existing Showtime palette until a different color is chosen.
    if (color === DEFAULT) {
      Object.assign(vars, {
        '--theme-hover': '#135783',
        '--theme-navy': '#092D45',
        '--theme-navy-light': '#144E72',
        '--theme-950': '#072A41',
        '--theme-900': '#0E3A58',
        '--theme-800': '#14527B',
        '--theme-600': '#2083C6',
        '--theme-sky': '#A0D2F3',
        '--theme-sky-secondary': '#8FC8EF',
        '--theme-mid': '#7DB8DF',
        '--theme-line': '#AECBE3',
        '--theme-line-strong': '#C3D8EA',
        '--theme-pale': '#E9F3FA',
        '--theme-100': '#D6E9F5',
        '--theme-50': '#EFF6FB'
      });
    }
    Object.keys(vars).forEach(function (name) { root.style.setProperty(name, vars[name]); });
    root.classList.toggle('st-theme--light', textOn(color) !== '#FFFFFF');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
    if (remember) save(color);
    return true;
  }

  // Apply before the page becomes visible: no white/blue flash between pages.
  apply(read(), false);

  function setup() {
    var host = document.querySelector('[data-theme-customizer]');
    if (!host) return;
    var toggle = host.querySelector('[data-theme-toggle]');
    var panel = host.querySelector('[data-theme-panel]');
    var close = host.querySelector('[data-theme-close]');
    var picker = host.querySelector('[data-theme-picker]');
    var hexField = host.querySelector('[data-theme-hex]');
    var reset = host.querySelector('[data-theme-reset]');
    var feedback = host.querySelector('[data-theme-feedback]');
    var presets = Array.prototype.slice.call(host.querySelectorAll('[data-theme-preset]'));
    if (!toggle || !panel || !picker || !hexField || !reset) return;

    function refresh(message) {
      picker.value = current.toLowerCase();
      hexField.value = current;
      hexField.setAttribute('aria-invalid', 'false');
      presets.forEach(function (b) {
        b.setAttribute('aria-pressed', String(normalize(b.dataset.themePreset) === current));
      });
      feedback.textContent = message || 'Color saved for this browser.';
    }

    function setOpen(open) {
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) picker.focus();
      else toggle.focus();
    }

    toggle.addEventListener('click', function () { setOpen(panel.hidden); });
    close.addEventListener('click', function () { setOpen(false); });

    presets.forEach(function (b) {
      b.addEventListener('click', function () {
        if (apply(b.dataset.themePreset, true)) refresh();
      });
    });

    picker.addEventListener('input', function () {
      if (apply(picker.value, true)) refresh();
    });

    function acceptHex() {
      var color = normalize(hexField.value);
      if (color && apply(color, true)) refresh();
      else {
        hexField.setAttribute('aria-invalid', 'true');
        feedback.textContent = 'Enter a valid hex color, for example #673AB7.';
      }
    }
    hexField.addEventListener('change', acceptHex);
    hexField.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') { event.preventDefault(); acceptHex(); }
    });

    reset.addEventListener('click', function () {
      apply(DEFAULT, true);
      refresh('Original Showtime blue restored.');
    });

    document.addEventListener('pointerdown', function (event) {
      if (!panel.hidden && !host.contains(event.target)) {
        panel.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) setOpen(false);
    });
    window.addEventListener('storage', function (event) {
      if (event.key === KEY) { apply(read(), false); refresh('Color updated in another tab.'); }
    });
    refresh('Pick a color to preview it instantly. Saved in this browser.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();
})();
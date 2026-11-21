"""Build Showtime PDR pages using a shared navigation and footer.

Only _site/ is generated. The source HTML files are never overwritten.
Run: python3 scripts/build_site.py
"""
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / '_site'
NAV = (ROOT / 'components' / 'navigation.html').read_text(encoding='utf-8')
FOOTER = (ROOT / 'components' / 'footer.html').read_text(encoding='utf-8')
PAGES = ('index.html', 'about.html', 'services.html', 'gallery.html', 'reviews.html', 'contact.html')
THEME_COMPONENT = (ROOT / 'components' / 'theme-customizer.html').read_text(encoding='utf-8')
THEME_COLORS = {
    '#1a6aa0': '--theme-primary',
    '#135783': '--theme-hover',
    '#092d45': '--theme-navy',
    '#144e72': '--theme-navy-light',
    '#072a41': '--theme-950',
    '#0e3a58': '--theme-900',
    '#14527b': '--theme-800',
    '#14547e': '--theme-800',
    '#0c2b43': '--theme-950',
    '#2083c6': '--theme-600',
    '#a0d2f3': '--theme-sky',
    '#8fc8ef': '--theme-sky-secondary',
    '#7db8df': '--theme-mid',
    '#aecbe3': '--theme-line',
    '#c3d8ea': '--theme-line-strong',
    '#e9f3fa': '--theme-pale',
    '#d6e9f5': '--theme-100',
    '#e1edf5': '--theme-100',
    '#eff6fb': '--theme-50',
    '#e7f2fb': '--theme-50',
}

def theme_css(html):
    """Convert only CSS color literals, never image/font data or page copy."""
    def map_block(match):
        def map_hex(color_match):
            color = color_match.group(0)
            token = THEME_COLORS.get(color.lower())
            return 'var(' + token + ',' + color + ')' if token else color
        css = re.sub(r'#[0-9a-fA-F]{6}(?![0-9a-fA-F])', map_hex, match.group(2))
        return match.group(1) + css + match.group(3)
    return re.sub(r'(<style\b[^>]*>)(.*?)(</style>)', map_block, html, flags=re.I | re.S)



# Hero media is added to the generated site; editable source HTML is preserved.
import json

def add_homepage_video(html):
    if html.count('<div class="hero-visuals">') != 1:
        raise ValueError('Home: hero visual container not found')
    start = html.index('<div class="hero-visuals">')
    end = html.index('<div class="shell hero-inner">', start)
    visual = '''<div class="hero-visuals">
    <video class="showtime-hero-video" autoplay muted loop playsinline webkit-playsinline preload="metadata"
           poster="assets/hero-media/hero-poster.jpg" aria-hidden="true" tabindex="-1">
      <source src="assets/hero-media/hero-mobile.mp4" type="video/mp4" media="(max-width: 700px)">
      <source src="assets/hero-media/hero-desktop.mp4" type="video/mp4">
    </video>
    <div class="hero-photo current" data-hero-image aria-hidden="true"></div>
    <div class="hero-photo" data-hero-image aria-hidden="true"></div>
    <div class="hero-photo" data-hero-image aria-hidden="true"></div>
  </div>
  '''
    html = html[:start] + visual + html[end:]
    html = html.replace('<strong>Actual Showtime repair</strong>', '<strong>Showtime PDR</strong>', 1)
    # The slide buttons keep changing text, but no handler touches/restarts the video.
    pattern = r'(<script\s+type="application/json"\s+data-hero-data>)(.*?)(</script>)'
    def update_slides(match):
        slides = json.loads(match.group(2))
        links = {'#services':'services.html', '#contact':'contact.html#estimate',
                 '#results':'gallery.html'}
        for slide in slides:
            for key in ('aHref', 'bHref'):
                slide[key] = links.get(slide.get(key), slide.get(key))
        return match.group(1) + json.dumps(slides, ensure_ascii=False) + match.group(3)
    html, count = re.subn(pattern, update_slides, html, count=1, flags=re.S)
    if count != 1:
        raise ValueError('Home: hero slide data missing')
    # Homepage cards now open their exact service detail on services.html.
    for service in ('door-dings','dents-creases','hail-damage','minor-impact'):
        pattern = r'<a\b[^>]*\bdata-estimate-kind="' + service + r'"[^>]*>'
        def change_link(match):
            tag, count = re.subn(r'href="#estimate-form"', 'href="services.html#' + service + '"', match.group(0), count=1)
            if count != 1:
                raise ValueError(f'Home: missing href in Learn More for {service}')
            return tag
        html, count = re.subn(pattern, change_link, html, count=1)
        if count != 1:
            raise ValueError(f'Home: missing Learn More for {service}')
    # Original homepage calls to action remain functional after navigation changes.
    return html


def navigation_for(page):
    nav = re.sub(r'\saria-current="page"', '', NAV)
    key = Path(page).stem
    pattern = r'(<a\b[^>]*\bdata-nav-key="' + re.escape(key) + r'"[^>]*)(>)'
    nav, count = re.subn(pattern, r'\1 aria-current="page"\2', nav)
    if count != 2:
        raise ValueError(f'{page}: expected two desktop/mobile nav matches; got {count}')
    return nav

if DEST.exists():
    shutil.rmtree(DEST)
DEST.mkdir(parents=True)

for filename in PAGES:
    html = (ROOT / filename).read_text(encoding='utf-8')
    start = html.find('<div class="topbar" id="top">')
    end = html.find('<main id="main"', start)
    if start < 0 or end < 0:
        raise ValueError(f'{filename}: topbar and main markers not found')
    html = html[:start] + navigation_for(filename) + '\n' + html[end:]
    start = html.find('<footer class="footer">')
    end = html.find('</footer>', start)
    if start < 0 or end < 0:
        raise ValueError(f'{filename}: footer markers not found')
    html = html[:start] + FOOTER + html[end + len('</footer>'):]
    if html.count('<header class="header">') != 1 or html.count('<footer class="footer">') != 1:
        raise ValueError(f'{filename}: duplicate/missing shared layout')
    # Main content, image data, animations and existing source files stay intact.
    # The generated site has one shared, interactive color picker on every page.
    html = theme_css(html)
    if html.count('</head>') != 1 or html.count('</body>') != 1:
        raise ValueError(f'{filename}: document head/body structure not found')
    html = html.replace('</head>', '  <link rel="stylesheet" href="assets/theme-customizer.css">\n  <script src="assets/theme-customizer.js"></script>\n</head>', 1)
    html = html.replace('</body>', THEME_COMPONENT + '\n</body>', 1)
    if filename == 'index.html':
        html = add_homepage_video(html)
        html = html.replace('</head>', '  <link rel="stylesheet" href="assets/hero-video.css">\n</head>', 1)
    if html.count('</head>') != 1:
        raise ValueError(f'{filename}: head closing tag missing')
    html = html.replace('</head>', '  <link rel="stylesheet" href="assets/logo.css">\n</head>', 1)
    (DEST / filename).write_text(html, encoding='utf-8')
    print('Built', filename)

# Every published build must contain the responsive hero video files.
for required in ('hero-desktop.mp4', 'hero-mobile.mp4', 'hero-poster.jpg'):
    media = ROOT / 'assets' / 'hero-media' / required
    if not media.is_file() or not media.stat().st_size:
        raise ValueError('Missing responsive hero media: ' + str(media))

for item in ROOT.iterdir():
    if item.is_dir() and item.name in ('assets', 'css', 'js'):
        shutil.copytree(item, DEST / item.name, dirs_exist_ok=True)
    elif item.is_file() and item.name in ('robots.txt', 'sitemap.xml', 'favicon.ico', 'CNAME'):
        shutil.copy2(item, DEST / item.name)
(DEST / '.nojekyll').touch()

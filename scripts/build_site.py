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
    (DEST / filename).write_text(html, encoding='utf-8')
    print('Built', filename)

for item in ROOT.iterdir():
    if item.is_dir() and item.name in ('assets', 'css', 'js'):
        shutil.copytree(item, DEST / item.name, dirs_exist_ok=True)
    elif item.is_file() and item.name in ('robots.txt', 'sitemap.xml', 'favicon.ico', 'CNAME'):
        shutil.copy2(item, DEST / item.name)
(DEST / '.nojekyll').touch()

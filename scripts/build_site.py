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
    (DEST / filename).write_text(html, encoding='utf-8')
    print('Built', filename)

for item in ROOT.iterdir():
    if item.is_dir() and item.name in ('assets', 'css', 'js'):
        shutil.copytree(item, DEST / item.name, dirs_exist_ok=True)
    elif item.is_file() and item.name in ('robots.txt', 'sitemap.xml', 'favicon.ico', 'CNAME'):
        shutil.copy2(item, DEST / item.name)
(DEST / '.nojekyll').touch()

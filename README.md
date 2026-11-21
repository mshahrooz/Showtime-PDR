# Showtime Paintless Dent Repair — publishing and shared layout

The site has six standalone source pages: Home, About, Services, Gallery, Reviews, and Contact.

## Change navigation or footer once

- Edit **`components/navigation.html`** to change the blue utility bar, desktop navigation, mobile navigation, logo, or top estimate button.
- Edit **`components/footer.html`** to change the footer company information, links, or text.
- Commit that single file. The GitHub Pages workflow combines the same components into all six published pages automatically.
- Active desktop/mobile navigation links are marked for each page during the build.
- Page-specific CSS, scripts, images, animations, and content remain in the original HTML pages.

The source pages retain their original header/footer snapshots for standalone offline viewing. **Only the generated `_site/` files are published**, so edit the two shared component files for site-wide changes, not each source page's snapshot.

## GitHub Pages

Go to **Settings → Pages → Build and deployment → Source → GitHub Actions**, if that is not already selected. The workflow is `.github/workflows/pages.yml` and runs whenever a page or shared component is committed to `main`.

Expected URL: **https://mshahrooz.github.io/Showtime-PDR/** (available only when GitHub Pages deployment succeeds).

## Preview locally

Run `python3 scripts/build_site.py`, then open `_site/index.html`. No framework or dependencies are required.

## Estimate form limitation

The current Contact form uses **Netlify Forms**. GitHub Pages does not process Netlify form submissions. The form needs a compatible form endpoint or service before estimate requests can be received. Do not rely on the current form for live lead delivery until configured.


## Theme color customizer

Every published page has a floating **Theme color** control at the bottom left.
Visitors can use the color picker, enter any hexadecimal color (for example
`#26734D`), or select one of seven presets. Changes update the top bar,
footer, buttons, and coordinating blue tones live, across all six pages.
The selected color is saved in their browser and follows them between pages.
**This preference does not change the theme for other visitors.**

To change the site's default color for **all** new visitors, edit the
`DEFAULT` value near the top of **`assets/theme-customizer.js`**
and commit that file. Visitors who already picked a custom color keep their
own preference until they click **Reset to original blue**.

Design and logic live in just three shared files:
- `components/theme-customizer.html` — visual control
- `assets/theme-customizer.css` — customizer styling and contrast
- `assets/theme-customizer.js` — color calculations, preview, and storage

The build changes color tokens in generated CSS only, and does not modify
customer photos, page copy, animations, source page files, or other services.

## Linked pages, video hero and illustrated logo
The main and footer menus now use the six real `.html` page URLs. Homepage service
cards link directly to their matching sections on `services.html`. The existing
three-slide text carousel remains, but its visual layer is now one persistent,
muted, looping video, which **does not restart when slides change**.

The GitHub Pages workflow uses `scripts/prepare_hero_video.sh` to retrieve the
customer-supplied stock clip by its Pexels file ID, verify its SHA-256, create
a ~1 MB desktop H.264 MP4, a ~400 KB mobile MP4, and a small poster.
Build cache avoids downloading or transcoding again on routine page edits.
The site runs from self-hosted video files in `_site/assets/hero-media/`.
The source HTML pages and repair gallery images are not overwritten.

Shared vector logo image assets are `assets/showtime-logo.svg` (navigation)
and `assets/showtime-logo-light.svg` (footer).

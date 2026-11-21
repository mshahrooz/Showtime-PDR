#!/usr/bin/env bash
# Pexels-hosted public source matches the filename of the customer-supplied video.
# Convert once; GitHub Actions caches the results for future deployments.
set -euo pipefail
target="assets/hero-media"
mkdir -p "$target"
if [[ -s "$target/hero-desktop.mp4" && -s "$target/hero-mobile.mp4" && -s "$target/hero-poster.jpg" ]]; then
  echo "Optimized hero media restored from cache."
  exit 0
fi
command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg required on the runner" >&2; exit 1; }
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
url="https://videos.pexels.com/video-files/4281335/4281335-hd_1280_720_24fps.mp4"
echo "Retrieving the supplied video by its public Pexels filename..."
curl -fL --retry 3 --retry-delay 2 --max-time 120 \
 -A 'Mozilla/5.0 (compatible; ShowtimePDR-SiteBuilder/1.0)' \
 "$url" -o "$work/original.mp4"
echo "Verify source bytes match supplied video..."
echo "85ccfe034b21f6f6b971e32a46bc3ea07ea8efda822f1142a1d94d3d33bbea22  $work/original.mp4" | sha256sum -c -
ffmpeg -hide_banner -loglevel error -y -i "$work/original.mp4" -an \
 -vf "scale=960:-2:flags=lanczos,fps=20" -c:v libx264 -preset veryfast \
 -crf 32 -pix_fmt yuv420p -profile:v main -movflags +faststart -g 40 "$target/hero-desktop.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$work/original.mp4" -an \
 -vf "scale=640:-2:flags=lanczos,fps=18" -c:v libx264 -preset veryfast \
 -crf 34 -pix_fmt yuv420p -profile:v main -movflags +faststart -g 36 "$target/hero-mobile.mp4"
ffmpeg -hide_banner -loglevel error -y -ss 00:00:05 -i "$work/original.mp4" \
 -frames:v 1 -vf "scale=960:-2:flags=lanczos" -q:v 6 "$target/hero-poster.jpg"
ls -lh "$target"

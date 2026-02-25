# Proximity dial video queue

Full-screen video pages for display (e.g. Cisco DeskPro). GitHub Pages: https://wxsd-sales.github.io/proximity-dial-video-queue/

## File names and what changed

- **`index.html`** — Native `<video>` page (uses `video.mp4`). Best for DeskPro: same-origin muted video often autoplays where YouTube iframe does not. Loops via duration-based replay.
- **`youtube.html`** — YouTube embed with Tap-to-play overlay. Use when you only have a YouTube link. Autoplay may work on desktop; on DeskPro a single tap starts playback.
- **`video.mp4`** — The video file used by `index.html`. Hosted in the repo so the native page works on GitHub Pages.

Previously the main entry was the YouTube page; the native video page is now the default (`index.html`) for reliable autoplay on embedded devices.

## URLs

| Page    | URL |
|--------|-----|
| Native (default) | https://wxsd-sales.github.io/proximity-dial-video-queue/ |
| YouTube         | https://wxsd-sales.github.io/proximity-dial-video-queue/youtube.html |

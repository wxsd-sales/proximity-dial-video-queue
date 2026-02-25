# Proximity Dial Video Queue

Full-screen video pages for display on devices such as Cisco DeskPro. Hosted on GitHub Pages.

**Live site:** https://wxsd-sales.github.io/proximity-dial-video-queue/

## Demo
[![Vidcast Overview](https://github.com/user-attachments/assets/c7936749-d874-4902-aeae-08fd5ea9d53f)](https://app.vidcast.io/share/642a98bf-542f-4911-8a7a-7d7302d987f3)

## Files

- **`index.html`** — Native `<video>` page (uses `video.mp4`). Best for DeskPro: same-origin muted video often autoplays where a YouTube iframe does not. Loops via duration-based replay.
- **`youtube.html`** — YouTube embed with Tap-to-play overlay. Use when you only have a YouTube link. Autoplay may work on desktop; on DeskPro a single tap starts playback.
- **`video.mp4`** — Video file used by `index.html`. Hosted in the repo so the native page works on GitHub Pages.

The default entry (`index.html`) is the native video page for reliable autoplay on embedded devices.

## URLs

| Page | URL |
|------|-----|
| Native (default) | https://wxsd-sales.github.io/proximity-dial-video-queue/ |
| YouTube | https://wxsd-sales.github.io/proximity-dial-video-queue/youtube.html |

## License

All contents are licensed under the MIT license. Please see [license](LICENSE) for details.

## Disclaimer

Everything included is for demo and Proof of Concept purposes only. Use of the site is solely at your own risk. This site may contain links to third party content, which we do not warrant, endorse, or assume liability for. These demos are for Cisco Webex use cases, but are not Official Cisco Webex Branded demos.

## Support

Please contact the Webex SD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=ProximityDialVideoQueue) for questions. Or for Cisco internal, reach out to us on Webex App via our bot globalexpert@webex.bot & choose "Engagement Type: API/SDK Proof of Concept Integration Development".

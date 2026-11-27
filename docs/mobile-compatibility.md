# Mobile compatibility audit

Date: 2026-11-27. Tested the production build served locally, then checked the published build after delivery.

## Browser and viewport coverage

| Engine | Tested version | Platform |
| --- | --- | --- |
| Chromium, Microsoft Edge | 158.0.4370.45 | Windows, touch/phone emulation |
| WebKit | 27.2 | Windows, touch/phone emulation; Safari engine coverage, not a physical iPhone |
| Firefox | 159.0 | Windows, touch enabled and resized viewport; not Firefox Android hardware |

Viewports: 320×568, 360×640, 390×844, 430×932, 768×1024, and 844×390 landscape.

Each engine visited 13 routes at all six viewports: home, Quran index, Madinah pages 1/312/604, reciter index/detail, prayers, tasbih, adhkar, hadith, settings, and installation help. Total: **234 layout cases**. After the fixes, none had horizontal document overflow, clipped Quran lines, a reader frame outside the viewport, failed displayed images, or uncaught application exceptions. Home and reader screenshots were also visually inspected.

## Functional coverage

The following nine flows were exercised in each engine:

1. Bottom navigation, Quran search and opening a surah.
2. Reader page turning using a real browser pointer drag. Verse selection uses touchscreen taps.
3. Verse bottom sheet, tafsir, sharing preview and closing the sheet.
4. Reciter selection, whole-surah scope and playback state transitions.
5. Global player controls in landscape, minimizing and closing.
6. City selection and tasbih persistence across reloads.
7. Previously visited Madinah page available after a network interruption and reload.
8. More menu navigation and automatic closing after selecting a destination.
9. Dark theme persistence and mobile text controls using a font size of at least 16px.

Playback interaction tests use an in-memory PCM WAV fixture and matching recitation API fixtures, so they do not depend on a remote recording finishing in time. Separately, the real AlQuran Cloud `ar.alafasy` ayah endpoint returned HTTP 200 with CORS enabled, and its audio CDN accepted a byte-range request with HTTP 206 and `audio/mpeg`.

For Firefox's offline case, the local test server was stopped after warming the page and its service-worker cache. This tests a genuine connection failure; Playwright's global Firefox offline switch rejected navigation before the cached-page test could run reliably. Chromium and WebKit used browser-context offline emulation.

## Fixes

- Settings and prayer grids now use zero-minimum tracks and shrinkable child columns. This fixes a reproducible 4px horizontal overflow on WebKit at 320px.
- Text inputs, selects and textareas use a minimum 16px font on narrow/touch screens, addressing iOS focus zoom without disabling pinch zoom.
- The service worker waits for navigation responses to be saved and extends its event lifetime through completion. Previously its navigation cache write was detached and could be interrupted. Added regression tests for completing that write and serving a saved page after a network failure; advanced the cache version.

Validation: production build and CSS compatibility check passed; **48 unit tests passed**.

## Limits and physical-device checks

This is broad browser-engine and viewport coverage, not a guarantee for every phone or older browser version. It does not certify real notches/home indicators, the software keyboard, operating-system permission prompts, hardware sound/Bluetooth, background playback under power saving, actual GPS accuracy, push delivery, native share destinations, or account email/sign-in/sync. These require physical iOS/Android devices and the relevant permissions/accounts. The offline check covers previously visited/cached content, not first launch or remote audio with no network.

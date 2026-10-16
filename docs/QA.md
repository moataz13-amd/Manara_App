# Verification record — 2026-10-16

## Paged reader follow-up

- 15 unit tests pass, including all 6,236 ayahs appearing exactly once across 604 pages, shared-page surahs, all opening basmalas, Tawbah exclusion, Fatiha numbering, and preserving An-Naml 30.
- Browser: Aal Imran opens on page 50; next moves URL/status to page 51 and removes the opening basmala; previous returns to page 50.
- Page 604 renders three surahs/three basmalas and disables next-page navigation.
- Phone check: document height equals viewport height (795px); page 51 text fits its 599px frame; page 604 text is 590px within its 599px frame. No vertical page scrolling.
- Fonts remain temporary until the user supplies surah-name, juz-name and ayah font files. Exact Mushaf line layout is not claimed.

## Automated

- TypeScript strict check and Vite production build succeed.
- Vitest: 11 passing tests in 2 files.
- Original Quran payload: 114 surahs, 6,236 consecutively numbered ayahs; within-surah numbering and page ranges checked.
- Prayer tests: selected timezone day boundaries, next Fajr after Isha, exclusion of sunrise from next obligatory prayer, chronological schedule, Hanafi Asr difference, Cairo DST validity, comparison with AlAdhan method 5.
- Bookmark toggling, normalized Arabic search and bounded adhkar counters checked.

## Browser checks

Codex in-app browser; desktop default viewport and 402 × 874 phone viewport.

- Home renders with matching forest/mint palette, arch motifs and rounded mobile navigation.
- No horizontal overflow in the inspected phone tasbih layout (scrollWidth and clientWidth both 387 CSS px after scrollbar).
- Search `الفاتحة` finds the vocalized Al-Fatiha entry. Reader displays all seven verses.
- Bookmark verse 1, reload, verify `aria-pressed=true`.
- Manual Cairo selection renders real prayer times and countdown; 2026-10-16 displayed 05:31, 06:57, 12:42, 15:56, 18:23, 19:41. AlAdhan sample differs by only one minute at Dhuhr/Asr.
- Tasbih tap increments 0 → 1.
- Reciter search finds Minshawi. Fatiha playback starts, completes and automatically advances to the next available recording. Player is closed after testing.
- Dark theme visibly applies to settings; restored to light afterward.
- Fixed mobile header overlap found during inspection.
- Fixed duplicate createRoot warnings caused by editing the entry module during Vite HMR; root is now reused during hot updates.

## Not verified

- Remote Supabase auth and RLS behavior (credentials absent).
- Permission-denied geolocation flow on a real device, background notifications, PWA installation and real-device audio background behavior.
- Exhaustive audio availability for every reciter, all world locations, and scholarly validation of each upstream adhkar record.
- No deployment was performed. This record does not claim all requirements in the broad master brief are production-complete. Remaining scope is documented in README.

The preview browser contains test-only local data: Cairo location, Fatiha verse-1 bookmark, and one tasbih increment. A fresh browser starts with no selected location.

## Direct-drag reader follow-up

- Removed previous/next footer buttons; only juz, page indicator and swipe hint remain.
- Pointer drag translates the page continuously for mouse, touch and pen. Release commits a sufficient drag or snaps a short drag back. Out-of-range drags resist and return; reduced-motion preference is respected.
- Browser verified: rightward drag 50 → 51; 18px short drag stays on 51; reverse drag returns toward 50. Production build passes.

## Supplied Quran typography

Reader now uses the user's local UthmanicHafs_v2-1, arbfonts_Qurraan_sora and Elgharib Ajzaa Alquran Madina WOFF2 files. Font GSUB tables verified: surah names use zero-padded IDs 001–114; juz names use IDs 1–30. Accessible Arabic labels accompany the glyph codes. Original supplied basmala SVG is stored in public/images/basmala.svg and rendered as a theme-colored mask. Fatiha retains its verse-1 button; Tawbah remains without a basmala. Page fitting reruns after font loading. Browser confirmed Fatiha fits fully after a fresh reload; build passes.

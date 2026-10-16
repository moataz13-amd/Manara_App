# منارة | Manara

Arabic-first React + TypeScript + Vite application, built from the supplied mobile references. The project was initially empty.

## Run

Requires Node 22.12+ (tested with Node 24).

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

Vite prints the actual local port. Build output is `dist/`. For Vercel choose Vite, build command `npm run build`, output directory `dist`. Routing fallback is supplied in `vercel.json`.

## Implemented

- Responsive RTL home, sidebar, mobile navigation and welcome screens.
- All 114 surahs from the original Quran API snapshot; normalized Arabic search, verse search (first 50 matches), juz links, bookmark toggle, copy, configurable font, saved reading position.
- Provider-backed reciter catalogue and actual recordings; persistent player across routes, seek, volume, speed, repeat, previous/next available recordings, basic Media Session integration, error handling.
- Source-backed adhkar categories, daily capped counters, favorites; tasbih with custom goal and reset confirmation.
- Adhan calculations from coordinates, selected timezone/date, Egypt/MWL/Umm al-Qura methods, Hanafi/Jumhur Asr, 12/24-hour display, live countdown, next-day Fajr, manual location and opt-in geolocation. No hardcoded prayer schedule.
- Local persisted settings/progress, dark theme, JSON export, opt-in reminders while the page remains active.
- Optional Supabase email-link login and explicit cloud snapshot upload; restoration safely merges bookmarks and favorites without replacing local settings.
- PWA manifest, same-origin cache fallback, route code splitting, data caching, loading/error states.

## Supabase setup

1. Create a Supabase project and apply `supabase/migrations/001_user_data.sql` in its SQL editor.
2. Copy `.env.example` to `.env.local`; supply the project URL and publishable/anon key. Never supply a service-role key.
3. Enable email authentication and allow your development and deployed `/settings` redirect URLs in Auth configuration.
4. Restart Vite/rebuild. Settings now offers email-link sign-in.
5. Test with two separate users: each can read/write only their own snapshot. Four owner-based RLS policies are included. Live authentication and RLS isolation have **not** been executed against a remote project because no project credentials were supplied.

Cloud storage uses an intentionally small snapshot table instead of seven normalized tables. It is an explicit backup/merge workflow, not automatic cross-device conflict resolution. Anonymous mode works without Supabase.

## Verification and limits

Unit tests cover dataset numbering/counts, Arabic normalization, counter bounds, bookmarks, timezone date boundaries, DST validity, midnight prayer transitions, school selection and a comparison to a real AlAdhan sample. Browser checks cover mobile rendering, Quran search, reader/bookmark persistence, manual Cairo selection, and tasbih. See `docs/QA.md` for the final record.

- No Vercel deployment or hosted Supabase project was created.
- The original calligraphic logo/surah-title artwork was not supplied separately. Current lettering is a font-based interpretation; see `docs/DESIGN.md`.
- Adhkar source has incomplete references; see `docs/SOURCES.md`. A qualified content review remains appropriate before a production religious-content release.
- Notifications cannot guarantee delivery when the page is suspended/closed; no background adhan promise.
- Offline text is cached after service-worker installation; visited route bundles/assets are cached. Unvisited routes and remotely loaded fonts may require a first online visit. Audio is streamed, not downloaded for offline use.
- Geolocation automatically resolves timezone, but shows coordinates if no manual city label is available. Manual city selection includes explicit coordinates and timezone.
- Per-prayer minute adjustments, English translations, fully centralized UI translation dictionaries, complete backend normalization, automated browser regression suites and installability checks on real iOS/Android devices remain future work.

## Source organization

`src/ui.tsx`: shared components. `src/styles.css`: semantic tokens, responsive layouts, themes. `src/data.ts`: content queries/types. `src/store.ts`: persisted preferences. `src/prayer.ts`: timezone-aware calculations. Feature screens are lazy-loaded modules. `src/audio.tsx` owns playback; `src/auth.tsx` owns optional account backup; `src/notifications.tsx` owns active-page reminders.

# Data and image provenance

Retrieved 2026-10-16. Local datasets are provider snapshots, not generated religious text.

- Quran: https://api.alquran.cloud/v1/quran/quran-uthmani (documentation https://alquran.cloud/api). 114 surahs, 6,236 ayahs; original numbering, diacritics and metadata preserved. Source payload: `public/data/quran.json`.
- Reciters: https://mp3quran.net/api/v3/reciters?language=ar (https://www.mp3quran.net/es/api). Tracks are formed from the provider's recording server and declared surah list. Unavailable recordings have an error state. No invented timings or verse highlighting.
- Adhkar: https://github.com/osamayy/azkar-db, `azkar.json`. Source texts/references/counts preserved. The upstream dataset is community maintained and explicitly has incomplete references/counts. Missing references and counts are disclosed in the UI rather than invented; this is not a claim that every entry has received independent scholarly review. Upstream allows free reuse in its README.
- Prayer calculations: https://github.com/batoulapps/adhan-js using coordinates and selected IANA timezone. Cairo 2026-10-16 checked against https://api.aladhan.com/v1/timings/16-10-2026?latitude=30.0444&longitude=31.2357&method=5&timezonestring=Africa%2FCairo . Differences at most one minute in that sample; not universal validation against local mosque schedules.
- Automatic coordinate timezone lookup: Open-Meteo forecast API, `timezone=auto`. Coordinates are sent only after the user requests geolocation. Manual cities do not require this lookup.
- Google Fonts: Tajawal, Amiri and Aref Ruqaa. External font loading requires connectivity; system fonts are the fallback.

Portrait provenance (local visual implementation assets; ownership remains with original owners):
- Minshawi: https://www.alwafd.news/5898426 — https://www.alwafd.news/Upload/libfiles/374/0/432.jpg
- Sudais: https://www.mashahir.net/198897/ — image from that article.
- Alafasy: https://soundcloud.com/alafasy/khvmlojfnr9j — official account's cover image.
- Dosari: https://soundcloud.com/user-609388351/trvvy2nkb0kc — recitation cover image.

Portrait reuse rights are not verified for public commercial distribution. Replace with owned/licensed originals before public publication.

- Font-compatible Hafs display text: KFGQPC Hafs data v18, mirrored at https://github.com/thetruetruth/quran-data-kfgqpc/blob/main/hafs/data/hafsData_v18.json . All 6,236 global IDs, surah IDs and ayah numbers checked against the original dataset. `public/data/hafs-display.json` contains the display text indexed by global ID, with trailing printed numbers removed for the interactive number buttons. Original copy/search text and page metadata remain unchanged. No Quranic marks are stripped from the compatible text.

- Hadith page: the complete 42 entries of an-Nawawi's Forty, Arabic edition from https://github.com/fawazahmed0/hadith-api/blob/1/editions/ara-nawawi.json (retrieved 2026-10-17). Source snapshot: public/data/hadith.json. Arabic text and embedded references preserved verbatim. Individual references link to https://sunnah.com/nawawi40 . The dataset supplies no separate grades for this collection; no grades are invented or inferred. HadeethEnc official API was evaluated but rejected the download with HTTP 403.

- Expanded hadith collections (2026-10-17): Arabic snapshots ara-bukhari, ara-muslim, ara-tirmidhi, ara-abudawud, ara-nasai and ara-ibnmajah from https://github.com/fawazahmed0/hadith-api/tree/1/editions , stored under public/data/hadith-books/. Source numbering, references, grades and grader names preserved; blank text records are excluded from display. Counts include narrations and repeated chains and are not claims about unique canonical hadith numbering. Collections load independently; only the active reading card is rendered.

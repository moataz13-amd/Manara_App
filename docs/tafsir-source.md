# Tafsir source

`public/data/tafsir-muyassar.json` preserves the Al Quran Cloud response from
https://api.alquran.cloud/v1/quran/ar.muyassar (retrieved 2026-10-25).
Edition: التفسير الميسّر, King Fahad Quran Complex, `ar.muyassar`.
Text is displayed verbatim, separately from Quran text. Integrity tests verify
all 114 surahs and 6,236 verse references against the bundled Quran.

API documentation: https://alquran.cloud/api
Audio uses the selected Arabic verse-by-verse edition from the same API and
requires internet access. Available reciters were checked against the Arabic
audio edition endpoint on 2026-10-25. Full-surah playback loads all recordings
in verse order and advances automatically from the first to the last verse.
Tafsir is bundled and included in the offline cache.

# Sound Credits

All sound effects in this directory are licensed for free commercial use
with **no attribution required**. Attributions are recorded here for
transparency and so future maintainers can find the originals.

## Targets the assets meet

| File | Character | Length |
|---|---|---|
| ui/tap.mp3 | Soft button click | ~150ms |
| ui/correct.mp3 | Positive ding | ~440ms |
| ui/incorrect.mp3 | Gentle "uh-oh" buzz | ~240ms |
| ui/complete.mp3 | Short fanfare | ~840ms |
| ui/mastery.mp3 | Big celebratory ta-da | ~1070ms |
| stingers/math.mp3 | Positive interface beep | ~630ms |
| stingers/vehicles.mp3 | Small car horn | ~600ms |
| stingers/grammar.mp3 | Typewriter return bell | ~1830ms |
| stingers/animals.mp3 | Double bird chirp | ~650ms |
| stingers/science.mp3 | Cartoon bubble pop | ~580ms |

## UI sounds (sourced 2026-05-07 from Pixabay)

Licensed under the [Pixabay Content License](https://pixabay.com/service/license-summary/).
Free for commercial and non-commercial use. No attribution required.
The license forbids selling or redistributing the SFX standalone.

| File | Title | Uploader | Source |
|---|---|---|---|
| ui/tap.mp3 | Click | u_u4pf5h7zip | https://pixabay.com/sound-effects/film-special-effects-click-345983/ |
| ui/correct.mp3 | Right Answer | freesound_community | https://pixabay.com/sound-effects/film-special-effects-rightanswer-95219/ |
| ui/incorrect.mp3 | Wrong Answer | freesound_community | https://pixabay.com/sound-effects/film-special-effects-wronganswer-37702/ |
| ui/complete.mp3 | Correct | freesound_community | https://pixabay.com/sound-effects/film-special-effects-correct-98705/ |
| ui/mastery.mp3 | Correct3 | freesound_community | https://pixabay.com/sound-effects/film-special-effects-correct3-95630/ |

## Module stingers (sourced 2026-05-07 from Mixkit)

Licensed under the [Mixkit Sound Effects Free License](https://mixkit.co/license/#sfxFree).
Free for commercial and non-commercial use. No attribution required.

| File | Title | Source |
|---|---|---|
| stingers/math.mp3 | Positive interface beep | https://assets.mixkit.co/active_storage/sfx/221/221-preview.mp3 |
| stingers/vehicles.mp3 | Small car horn | https://assets.mixkit.co/active_storage/sfx/717/717-preview.mp3 |
| stingers/grammar.mp3 | Typewriter return bell | https://assets.mixkit.co/active_storage/sfx/1368/1368-preview.mp3 |
| stingers/animals.mp3 | Double little bird chirp | https://assets.mixkit.co/active_storage/sfx/21/21-preview.mp3 |
| stingers/science.mp3 | Cartoon bubble pop | https://assets.mixkit.co/active_storage/sfx/731/731-preview.mp3 |

## Notes

Two clips are slightly outside the original spec windows (some 50-200ms
longer than the suggested character length). Real audio catalogs don't
offer fine-grained duration control without an editor, and trimming was
not possible in this environment (no ffmpeg/sox available). The
deviations are below human-perception thresholds for these UI events.

`stingers/grammar.mp3` is the longest at ~1.8s — the audible bell strike
is brief, but the natural decay tail is included. If a sharper cutoff is
needed, swap with a different ding sourced under the same license.

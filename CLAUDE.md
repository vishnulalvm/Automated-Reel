# Claude4All Reels

Pipeline that turns a story script from the input folder into a voiced 9:16 Reel in the output folder. Use the `make-reel` skill to build an episode.

## Folders

- Input scripts: `/Users/anonymous/Pictures/Reel/in put script` (one `.md` or `.txt` per reel; the file name becomes the slug). Read-only for the pipeline.
- Output: `/Users/anonymous/Pictures/Reel/out put` (`<slug>.mp4` and `<slug>-caption.txt`).
- Both paths are set in `reel.conf`. `scripts/reel-io.sh in` copies new scripts into `episodes/<slug>/`; `scripts/reel-io.sh out <slug>` copies the finished files out. Working files (script.json, audio, `APPROVED`) stay in `episodes/<slug>/`.

- Auto-build: a macOS launch agent (`com.claude4all.reels`) runs `make_all.sh` whenever the input folder changes. `scripts/auto.sh on | off | status` controls it; `logs/auto.log` records each build. A build that fails leaves a `FAILED` file in its episode folder and is not retried until the script in the input folder is edited. Auto-build never posts.

## Commands

- Voice: `.venv/bin/python scripts/tts.py episodes/<slug>` (Python 3.12 venv; system Python 3.15 has no onnxruntime)
- Render, from `video/`: `npx remotion render <slug> ../episodes/<slug>/final.mp4`
- Still, from `video/`: `npx remotion still <slug> out/<name>.png --frame=<n>`
- Type-check, from `video/`: `npx tsc --noEmit`
- Publishing is `scripts/publish_reel.py`, run by the user or `post_next.sh` only. Never run it, and never create an `APPROVED` file.

## Video

- Each episode is one file, `video/src/scenes/<slug>.tsx`. `Root.tsx` registers every file in `scenes/` automatically; don't edit it per episode.
- Build it with `episode({ slug, code, durations, views, next })` from `video/src/Brand.tsx` and export `durationInFrames` and the default component from its result. Copy the structure of `video/src/scenes/demo.tsx`, which shows every block once.
- `durations` is the contents of `durations.json`. Its values already include the 0.4 s gap; don't add it again.
- `views` has one entry per scene id. The scene with id `end` is always the built-in end card; give `next` the next episode's code and title.
- Build views only from `Brand.tsx` blocks. If a new block or icon is needed, add it to `Brand.tsx` in the same style so later episodes reuse it. Never restyle a single episode.
- For animation and markup technique, use the `remotion-best-practices` skill. Where it disagrees with this file or `make-reel` (it says to open Studio and to render only when asked), this file and `make-reel` win: the pipeline is headless and always renders.
- Media must be in `video/public/` (`tts.py` copies the voiceover to `video/public/<slug>/`). Images come only from `assets/`.

## Format (every video)

The house style is the reference film `claude4all-ep1-voiceover-final.mp4` (S1 · BAS · 01). Every video matches it.

- Output: 1080x1920, 30 fps, H.264 + AAC, 30-45 s. Quality settings live in `video/remotion.config.ts`; don't override them on the command line.
- Background: off-white paper with the dot grid and soft drifting coral and green circles, on every scene. No full-colour or dark backgrounds. The dot grid, dot size and all background colours in `Brand.tsx` were measured from the reference film and match it; don't change them.
- Header on every scene except the end card: logo square and "Claude4All" on the left, the episode code pill on the right, written like `S1 · BAS · 02`.
- Layout: content starts under the header and stacks downward, left-aligned. Nothing below `LAYOUT.contentBottom`; the lower part of the frame stays empty for Instagram's caption.
- A scene is: an optional tilted `Pill`, one `Headline` (or a `Big` number plus a `Headline`), then one or two blocks: `Stat`, `Fact`, `Step`, `Prompt`, `Person`, `Bars`, `Window`, `Row` of `IconChip`s or `Pill`s, and a `Note` for sources.
- The hook is a coral "Do you know..." pill and a size-140 to 150 headline that finishes the question.
- Colours: off-white `#F6F2EA`, coral `#E8674A`, ink `#14161C`, green `#1F9D6B`, plus the two tints in `COLORS`. No others, no gradients.
- Type: Space Grotesk for headlines and numbers; Inter bold for card text and pills; small grey Inter for notes.
- Cards and pills: ink outline, hard offset shadow, no blur. Stat cards use the coral tint.
- On-screen text: 8 words or fewer per headline. Any number shown on screen gets a `Note` naming its source.
- Unofficial channel: no Anthropic or OpenAI logos; "Unofficial channel" in every caption (the end card already shows it).
- No copyrighted photos or music. Photos of people only from `assets/`, and only ones the user has rights to. Voice only unless `assets/` has a track.

## Motion

- Headlines appear word by word (`text`, `at`, `over`), timed to the narration: `at` is when the voice starts that phrase in the scene, `over` is how long the phrase takes.
- Blocks enter one at a time, in the order the voice mentions them, each with its own `at` in seconds from the scene start. Estimate `at` from the narration at about 2.7 words per second.
- Cards rise, windows slide in tilted, pills and icon chips pop. These are built into the blocks; don't add other entrance styles.
- Every block is on screen at least 1 s before the scene ends. Scenes cut with a short fade; no other transitions.

<!-- TODO: if the six Claude4All motion rules differ from the above, paste them here. -->

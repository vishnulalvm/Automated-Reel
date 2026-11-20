# Claude4All Reels

Turns a story script from the user's input folder into a voiced 9:16 Reel, a caption and a thumbnail in the output folder. Use the `make-reel` skill to build an episode.

## One place for settings

`reel.config.json` holds everything that may change: folders, brand name, logo, colours, the three sections, video length, voice engine and voice, pronunciations, narration rules, intro and outro wording, hashtags. When the user asks to change how videos look, sound or are organised, change the config, not an episode. Read the config at the start of every build; where it and this file disagree, the config wins. Only add code to `video/src/Brand.tsx` or the scripts when the config can't express the change, and then make it a config value.

## Folders

All under `folders.root` in the config (currently `/Users/anonymous/Desktop/Reel`):

- `In put script/`: one `.md` or `.txt` per reel; the file name becomes the slug. `_template.txt` shows the format (Section, Episode, Title, Next, Story). Names starting with `_` are ignored. Read-only for the pipeline except `verify`.
- `Out put/`: `<slug>.mp4`, `<slug>-caption.txt`, `<slug>-thumbnail.png`.
- `Assets/`: brand logo and any images an episode needs. `logo.png` (the name is in the config) replaces the drawn logo mark in the header, outro and thumbnail.
- Each has an `Archive/` subfolder, which the pipeline never reads.

`scripts/reel.py` (run with `.venv/bin/python`) moves files:

- `in`: copy new or edited scripts to `episodes/<slug>/story.*`; prints episodes with no video yet.
- `assets`: copy `Assets/` into `video/public/assets/` and list them in `video/src/assets.gen.ts`. Use them as `staticFile("assets/<name>")`.
- `out <slug>`: copy video, caption and thumbnail to `Out put/`.
- `verify <slug>`: move the input script to `In put script/Archive/`. Run it only when the user says, in this session, that they have watched that video and accept it. Never on your own judgment.
- `posted <slug>`: move the output files to `Out put/Archive/`; `publish_reel.py` calls it after posting.
- `status`: one line per episode.

Working files (script.json, audio, `VERIFIED`, `APPROVED`) stay in `episodes/<slug>/`.

## Commands

- Voice: `.venv/bin/python scripts/tts.py episodes/<slug>` (Python 3.12 venv; system Python 3.15 has no onnxruntime). The engine is `voice.engine` in the config: `kokoro` (local, free) or `elevenlabs` (needs `ELEVENLABS_API_KEY` in `.env` and a `voiceId`; untested so far).
- Render, from `video/`: `npx remotion render <slug> ../episodes/<slug>/final.mp4`
- Thumbnail, from `video/`: `npx remotion still <slug>-thumb ../episodes/<slug>/thumbnail.png`
- Still, from `video/`: `npx remotion still <slug> out/<name>.png --frame=<n>`
- Type-check, from `video/`: `npx tsc --noEmit`
- Publishing is `scripts/publish_reel.py`, run by the user or `post_next.sh` only, and it needs an `APPROVED` file. Never run it, and never create `APPROVED`.
- There is no automatic trigger. Builds start when the user asks. Unattended `claude -p` builds don't work here: the project folder name ends in a space, and Claude Code refuses file writes under such a path without manual approval.

## Series

Three sections, set in the config: Basics (`BAS`, season 1), Intermediate (`INT`, season 2), Advanced (`ADV`, season 3). An episode's code is `S<season> · <KEY> · <NN>`, e.g. `S1 · BAS · 02`. The script's `Section:` and `Episode:` lines give the section and number. The next episode is the same section, number + 1, unless the script says otherwise.

Pitch the script to the section: Basics assumes no knowledge and explains every term; Intermediate assumes the viewer uses Claude weekly; Advanced can assume the Basics and Intermediate ideas without re-explaining them.

## Story and narration (every episode)

- Scene 1 has id `intro` and is always one question the episode answers. Follow `intro.rule` in the config.
- The outro is two scenes. The last scene in `script.json` has id `outro` and is a short intro of the next video, not a sign-off: its narration starts with "Curious", asks the question the next video answers and adds one small hint that makes the viewer want it, without giving the answer away. Follow `outro.rule`. The hint comes from the script's `Next:` line; if there is none, ask the user what the next video is, or in an unattended run tease the next step of the same topic without naming a title.
- After it, `tts.py` adds the closing scene `end` to every episode by itself (logo, channel name, follow and save buttons; its spoken line is `outro.end.narration` in the config). Don't write an `end` scene in `script.json`.
- In between: the answer in 3-6 scenes, one idea per scene, with one concrete everyday example, ending on a one-line takeaway before the outro. The `video` scene and length limits count `outro` but not `end`.
- Follow `narration.audience`, `narration.rules` and `narration.wordsPerSecond`, and the length and scene limits under `video`.
- Every number, date, name and claim is checked on the web and listed in `sources`. Anything unverifiable is rewritten or dropped. No invented quotes or statistics.

## Video

- Each episode is one file, `video/src/scenes/<slug>.tsx`. `Root.tsx` registers every file in `scenes/` automatically, plus its `<slug>-thumb` still; don't edit it per episode.
- Build it with `episode({ slug, section, number, title, durations, intro, views, outro })` from `video/src/Brand.tsx`, and export `durationInFrames`, `Thumbnail` and the default component from its result. Copy the structure of `video/src/scenes/demo.tsx`, which shows every block once.
- The intro frame, the two outro frames (next-video teaser, then the follow-and-save frame), header and thumbnail are built into `episode()` so they are identical in every video. An episode supplies only `intro.question`, `outro.hint`, `title` and optionally `outro.peek`: one or two `Brand.tsx` blocks that tease the next video, timed to the second sentence of the outro narration. Don't hand-build these scenes.
- `durations` is the contents of `durations.json`, including `end`. Its values already include the gap; don't add it again.
- `views` has one entry per scene id between `intro` and `outro`, built only from `Brand.tsx` blocks. If a new block or icon is needed, add it to `Brand.tsx` in the same style so later episodes reuse it. Never restyle a single episode.
- For animation and markup technique, use the `remotion-best-practices` skill. Where it disagrees with this file or `make-reel` (it says to open Studio and to render only when asked), this file and `make-reel` win: the pipeline is headless and always renders.

## Format (every video)

The house style is the reference film `claude4all-ep1-voiceover-final.mp4` (S1 · BAS · 01). Every video matches it.

- Output: 1080x1920, 30 fps, H.264 + AAC. Quality settings live in `video/remotion.config.ts`; don't override them on the command line.
- Background: off-white paper with the dot grid and soft drifting coral and green circles, on every scene. No full-colour or dark backgrounds. The dot grid and dot size in `Brand.tsx` were measured from the reference film; don't change them.
- Header on every scene except `end`: logo and channel name on the left, the episode code pill on the right. In the `outro` teaser the pill shows the next episode's code.
- Layout: content starts under the header and stacks downward, left-aligned. Nothing below `LAYOUT.contentBottom`; the lower part of the frame stays empty for Instagram's caption.
- A scene is: an optional tilted `Pill`, one `Headline` (or a `Big` number plus a `Headline`), then one or two blocks: `Stat`, `Fact`, `Step`, `Prompt`, `Person`, `Bars`, `Window`, `Row` of `IconChip`s or `Pill`s, and a `Note` for sources.
- Colours come from `brand.colors` in the config. No others, no gradients.
- Type: Space Grotesk for headlines and numbers; Inter bold for card text and pills; small grey Inter for notes.
- Cards and pills: ink outline, hard offset shadow, no blur. Stat cards use the coral tint.
- On-screen text: 8 words or fewer per headline. Any number shown on screen gets a `Note` naming its source.
- Unofficial channel: no Anthropic or OpenAI logos; the disclaimer from the config in every caption (the outro already shows it).
- No copyrighted photos or music. Images only from the Assets folder. Voice only unless Assets has a track.

## Motion

- Headlines appear word by word (`text`, `at`, `over`), timed to the narration: `at` is when the voice starts that phrase in the scene, `over` is how long the phrase takes.
- Blocks enter one at a time, in the order the voice mentions them, each with its own `at` in seconds from the scene start. Estimate `at` from the narration at about 2.7 words per second.
- Cards rise, windows slide in tilted, pills and icon chips pop. These are built into the blocks; don't add other entrance styles.
- Every block is on screen at least 1 s before the scene ends. Scenes cut with a short fade; no other transitions.

<!-- TODO: if the six Claude4All motion rules differ from the above, paste them here. -->

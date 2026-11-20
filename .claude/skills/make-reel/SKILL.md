---
name: make-reel
description: Turn a story script from the input folder into a fact-checked, voiced Claude4All Reel with caption and thumbnail in the output folder. Use when asked to make, build or render an episode or reel.
---
# Make a Claude4All Reel

Input: an episode folder such as `episodes/s1-bas-02`, a script name, or nothing. The slug is the episode folder's name. Read `reel.config.json` first and follow it and CLAUDE.md; run the Python scripts with `.venv/bin/python`.

0. **Intake.** Run `scripts/reel.py in` and `scripts/reel.py assets`. The first copies scripts from the input folder to `episodes/<slug>/story.*` and prints the episodes with no video yet; the second makes the Assets folder usable in the video. With no input, build the first episode printed; if nothing is printed, say there is nothing new to build.
1. **Script.** Read the episode's `story.*`. Take the section, episode number, title and next-video line from its header lines; if the section or number is missing, ask, or in an unattended run stop and report it. Write `script.json`:
   `{"slug", "section", "number", "title", "intro": {"question"}, "outro": {"hint"}, "scenes": [{"id", "narration", "onscreen", "visual"}], "sources": []}`.
   The first scene id is `intro` and the last is `outro` (a short intro of the next video; `tts.py` adds the closing `end` frame itself, so don't write one); follow `intro.rule` and `outro.rule` in the config and the "Story and narration" section of CLAUDE.md. Keep the scene count and total length inside the `video` limits. `narration` is spoken text; `onscreen` is 8 words or fewer; `visual` names the blocks the scene uses.
2. **Fact-check.** Web-search every number, date, name and claim. Add each as `{"claim", "url"}` to `sources`. Rewrite or drop anything you can't verify. Never invent quotes or statistics. Add any word the voice misreads to `voice.pronounce` in the config, not to the narration.
3. **Voice.** Run `scripts/tts.py episodes/<slug>`. It writes `audio/`, `durations.json` and `video/public/<slug>/voiceover.wav`. If the total is outside the `video` limits, edit the narration and run it again.
4. **Video.** Load the `remotion-best-practices` skill for technique. Write `video/src/scenes/<slug>.tsx`, modelled on `video/src/scenes/demo.tsx`: call `episode()` with the slug, section, number, title, the contents of `durations.json`, `intro.question`, one view per scene id between `intro` and `outro`, `outro.hint`, and usually an `outro.peek` of one or two blocks that tease the next video. Put each scene's narration in a comment above its view so the `at` times can be checked. Then, from `video/`:
   `npx tsc --noEmit`, `npx remotion render <slug> ../episodes/<slug>/final.mp4` and `npx remotion still <slug>-thumb ../episodes/<slug>/thumbnail.png`.
5. **Check.** From `video/`, render one still per scene, about 0.3 s before the scene ends, with `npx remotion still <slug> out/<name>.png --frame=<n>`. Look at them and at `thumbnail.png`. Fix anything that overlaps, is cut off, runs below the content area, has not finished appearing, or does not look like the reference film, and render again.
6. **Caption.** Write `caption.txt`: the intro question, 2-3 lines of value, the "Curious" hint with "Follow for <next code>", hashtags from `caption` in the config, and the disclaimer.
7. **Deliver.** Run `scripts/reel.py out <slug>`.
8. **Stop.** Do not publish, and do not run `verify` or create `APPROVED`: those wait for the user to watch the video. Report the output folder paths, the total length, and anything you could not verify or were unsure of.

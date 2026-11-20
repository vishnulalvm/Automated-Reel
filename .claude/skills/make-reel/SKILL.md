---
name: make-reel
description: Turn a story script from the input folder (or episodes/<slug>/story.md) into a fact-checked, voiced Claude4All Reel (final.mp4 + caption.txt). Use when asked to make, build or render an episode.
---
# Make a Claude4All Reel

Input: an episode folder such as `episodes/s1-bas-02`, a script file in the input folder, or nothing. The slug is the episode folder's name. Follow CLAUDE.md for brand, motion and file rules.

0. **Intake.** Run `scripts/reel-io.sh in`. It copies each script from the user's input folder (set in `reel.conf`) to `episodes/<slug>/story.md` or `story.txt` and prints the episode folders that have no video yet. With no input, build the first one it prints; if it prints nothing, say there is nothing new to build. Never write into the input folder.
1. **Script.** Read the episode's `story.md` or `story.txt`. Write `script.json`:
   `{"slug", "code", "next": {"code", "title"}, "title", "episode", "scenes": [{"id", "narration", "onscreen", "visual"}], "sources": []}`.
   5-8 scenes with short unique ids (`hook`, `s2`, ..., `end`). `narration` is spoken text, about 2.5 words per second; `onscreen` is 8 words or fewer; `visual` is a note on what the scene shows. Scene 1 is a curiosity hook ("Do you know..."). The last scene is the end card. Total 30-45 s, so 75-110 narrated words.
2. **Fact-check.** Web-search every number, date, name and claim. Add each as `{"claim", "url"}` to `sources`. Rewrite or drop anything you can't verify. Never invent quotes or statistics. Spell out anything the voice might misread (write "GPT four", not "GPT-4").
3. **Voice.** Run `.venv/bin/python scripts/tts.py episodes/<slug>`. It writes `audio/`, `durations.json` and `video/public/<slug>/voiceover.wav`. If the total is outside 30-45 s, edit the narration and run it again.
4. **Video.** Load the `remotion-best-practices` skill for technique. Write `video/src/scenes/<slug>.tsx`, modelled on `video/src/scenes/demo.tsx`: call `episode()` with the slug, the episode code (`S1 · BAS · 02`), the contents of `durations.json`, one view per scene id (not `end`), and `next` for the end card. Follow the Format and Motion sections of CLAUDE.md exactly, and put each scene's narration in a comment above its view so the `at` times can be checked. Then, from `video/`:
   `npx tsc --noEmit` and `npx remotion render <slug> ../episodes/<slug>/final.mp4`.
5. **Check.** From `video/`, render one still per scene, about 0.3 s before the scene ends, with `npx remotion still <slug> out/<name>.png --frame=<n>`. Look at them. Fix anything that overlaps, is cut off, runs below the content area, has not finished appearing, or does not look like the reference film, and render again.
6. **Caption.** Write `caption.txt`: hook line, 2-3 lines of value, "Follow for Ep N", 3-5 hashtags, "Unofficial channel".
7. **Deliver.** Run `scripts/reel-io.sh out <slug>`. It copies the video and caption to the user's output folder as `<slug>.mp4` and `<slug>-caption.txt`.
8. **Stop.** Do not publish and do not create `APPROVED`. Report the output folder paths, the total length, and anything you could not verify or were unsure of.

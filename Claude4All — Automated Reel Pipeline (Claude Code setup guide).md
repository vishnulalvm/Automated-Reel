# Claude4All — Automated Reel Pipeline (Claude Code setup guide)

Nov 19, 2026 · @Livo Dev

## At a glance

You write a short story file; Claude Code builds a fact-checked, voiced Reel in your Claude4All style overnight; you watch it and approve; a script posts it on schedule. Setup is about half a day once, then roughly 10 minutes of your time per episode.

&#91;embedded content: story.md → Claude Code skill → your approval → Instagram\]

Everything left of "Approved?" runs on its own. Your only manual step is watching the video and adding an `APPROVED` file.

## What you need

You drop a story file into a folder and run one command. Claude Code writes the script, checks the facts, makes the voice, builds the video in your Claude4All style, and posts it as a Reel. The only paid parts are Claude itself and, optionally, a premium voice.

| Piece | What it does | Cost |
| --- | --- | --- |
| Claude Code (CLI) | Runs the whole pipeline from one skill, `/make-reel` | Your Claude plan or API usage |
| Node.js 20+ and ffmpeg | Run Remotion and join audio and video | Free |
| Remotion | Builds the motion-graphics video from React code, with your brand as a reusable template | Free for individuals and companies of up to 3 people; a company licence from 4 people |
| Voice: Kokoro (local) or ElevenLabs (API) | Turns each scene's narration into speech | Kokoro free; ElevenLabs uses credits |
| Python 3.10+ | Runs the voice and publish scripts | Free |
| Instagram Business account + Meta developer app | Lets the script publish Reels through the official API | Free |

Why Remotion and not the Motion animation from this chat: the Motion page can't be run from a script or exported without clicking. Remotion renders the same kind of film from code on your own computer, so it can run unattended.

## Step 1: Instagram and Meta app setup

This is the only part done by hand, once, in about 30 minutes. Posting uses Instagram's official Content Publishing API, which needs a professional account and an access token.

1. **Switch the account to Business.** In the Instagram app: Settings → Account type and tools → Switch to professional account → Business. Some guides report that Reels publishing through the API works only with Business accounts, so pick Business rather than Creator.
2. **Create a Meta developer app.** Go to developers.facebook.com → My Apps → Create app. Choose the use case for managing messaging and content on Instagram, which adds the Instagram API with Instagram Login.
3. **Add yourself as a tester.** In the app's Roles, add your Instagram account as an Instagram tester, then accept the invite in the Instagram app or website. An app in development mode can post to accounts that have a role on it, so you don't need App Review for your own account.
4. **Generate a token.** In the app's Instagram API setup, connect your account and generate an access token with the `instagram_business_basic` and `instagram_business_content_publish` permissions. Note your Instagram user ID shown there.
5. **Make it long-lived.** Exchange the token for a long-lived one, which lasts about 60 days, and refresh it before it expires. The publish script below refreshes it on every run.
6. **Store the secrets** in a `.env` file in the project, never in code or chat:

```text
IG_USER_ID=1784xxxxxxxxxxxx
IG_ACCESS_TOKEN=IGAA...
GRAPH_VERSION=v25.0
ELEVENLABS_API_KEY=   # optional, only for the premium voice
```

Check the current Graph API version in Meta's docs when you set this up, and update `GRAPH_VERSION` if it has moved on.

## Step 2: Project folder and install

One folder holds the brand template, the scripts and every episode. Each episode gets its own subfolder, so nothing is ever overwritten.

```text
claude4all-reels/
├─ .env                      # secrets from Step 1 (add to .gitignore)
├─ CLAUDE.md                 # brand rules Claude reads every run
├─ .claude/skills/make-reel/SKILL.md   # the pipeline (Step 3)
├─ video/                    # Remotion project: brand template + scenes
│  └─ src/{Root.tsx, Brand.tsx, scenes/*.tsx}
├─ scripts/
│  ├─ tts.py                 # voice per scene, measures lengths
│  └─ publish_reel.py        # posts the MP4 as a Reel
├─ assets/                   # logo, fonts, photos you have rights to
└─ episodes/
   └─ s1-bas-02/
      ├─ story.md            # YOU write this
      ├─ script.json         # Claude writes: scenes, narration, on-screen text, sources
      ├─ audio/              # voice clips + voiceover.wav
      ├─ final.mp4           # rendered Reel
      ├─ caption.txt
      └─ APPROVED            # empty file you add to allow posting
```

Install once, from inside the folder:

```bash
npm install -g @anthropic-ai/claude-code
npx create-video@latest video        # pick the blank template
pip install kokoro-onnx soundfile requests python-dotenv
# download kokoro-v1.0.onnx and voices-v1.0.bin from the kokoro-onnx GitHub releases into scripts/
```

Then open Claude Code in the folder (`claude`) and ask it to build `video/src/Brand.tsx` from your Claude4All style: off-white #F6F2EA, coral #E8674A, ink #14161C, green #1F9D6B, Space Grotesk and Inter, ink-outlined cards with hard shadows, and the six motion rules. Put those same rules in `CLAUDE.md` so every episode follows them.

## Step 3: The Claude Code skill

A skill is a folder of instructions Claude Code loads when you type its name. This one turns a story file into a finished, unposted Reel. Save it as `.claude/skills/make-reel/SKILL.md`:

```markdown
---
name: make-reel
description: Turn episodes/<slug>/story.md into a fact-checked, voiced Claude4All Reel (final.mp4 + caption.txt). Use when asked to make, build or render an episode.
---
# Make a Claude4All Reel

Input: an episode folder, e.g. episodes/s1-bas-02. Follow CLAUDE.md for brand and motion rules.

1. Read story.md. Write script.json: 5-8 scenes; each has id, narration
   (spoken, max ~2.5 words per second), onscreen (max 8 words), visual notes.
   Scene 1 is a curiosity hook ("Do you know..."). Last scene is the end card.
   Total 30-45 s.
2. Fact-check: web-search every number, date, name and claim. Add a
   "sources" list to script.json. Rewrite or drop anything you can't verify.
   Never invent quotes or statistics.
3. Voice: run `python scripts/tts.py episodes/<slug>`. It writes audio/ and
   durations.json. Set each scene's length to its clip length + 0.4 s.
4. Video: write video/src/scenes/<slug>.tsx from Brand.tsx components and
   script.json, with the voiceover as an <Audio> track. Render:
   `npx remotion render <slug> ../episodes/<slug>/final.mp4` (1080x1920, 30 fps).
5. Check: render 3 stills (hook, middle, end) with `npx remotion still`,
   look at them, fix overlapping or cut-off text, re-render if needed.
6. Write caption.txt: hook line, 2-3 lines of value, "Follow for Ep N",
   3-5 hashtags, "Unofficial channel" note.
7. Stop. Do NOT publish. Report the file paths and anything you were unsure of.
```

Publishing is deliberately a separate step (Step 5), so nothing goes out until you've watched it.

## Step 4: The scripts

Two small Python scripts do the parts Claude shouldn't improvise each time: the voice and the posting. The video render is a single Remotion command (in the skill above).

**`scripts/tts.py`** — one clip per scene, then the timeline the video follows:

```python
import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

ep = sys.argv[1]
scenes = json.load(open(f"{ep}/script.json"))["scenes"]
k = Kokoro("scripts/kokoro-v1.0.onnx", "scripts/voices-v1.0.bin")
SR, GAP, track, durs = 24000, 0.4, [], {}
for s in scenes:
    a, _ = k.create(s["narration"], voice="af_heart", speed=1.1, lang="en-us")
    sf.write(f"{ep}/audio/{s['id']}.wav", a, SR)
    durs[s["id"]] = round(len(a) / SR + GAP, 2)
    track += [a, np.zeros(int(GAP * SR), dtype=np.float32)]
sf.write(f"{ep}/audio/voiceover.wav", np.concatenate(track), SR)
json.dump(durs, open(f"{ep}/durations.json", "w"), indent=1)
print(durs)
```

For the premium voice, swap the `k.create` line for a call to the ElevenLabs text-to-speech API with your key from `.env`.

**`scripts/publish_reel.py`** — refuses to post unless the episode has an `APPROVED` file:

```python
import os, sys, time, requests
from dotenv import load_dotenv
load_dotenv()
ep = sys.argv[1]
if not os.path.exists(f"{ep}/APPROVED"):
    sys.exit("Not approved: add an empty APPROVED file after watching final.mp4")
IG, VER = os.environ["IG_USER_ID"], os.environ.get("GRAPH_VERSION", "v25.0")
TOKEN = os.environ["IG_ACCESS_TOKEN"]
API = f"https://graph.instagram.com/{VER}"

# keep the 60-day token alive (save the new one back to .env yourself or with a helper)
r = requests.get("https://graph.instagram.com/refresh_access_token",
                 params={"grant_type": "ig_refresh_token", "access_token": TOKEN}).json()
TOKEN = r.get("access_token", TOKEN)

video, caption = f"{ep}/final.mp4", open(f"{ep}/caption.txt").read()
# 1. create a Reel container for a resumable upload (no public URL needed)
c = requests.post(f"{API}/{IG}/media", data={
    "media_type": "REELS", "upload_type": "resumable", "caption": caption,
    "share_to_feed": "true", "access_token": TOKEN}).json()
cid = c["id"]
upload = c.get("uri", f"https://rupload.facebook.com/ig-api-upload/{VER}/{cid}")
# 2. upload the file
with open(video, "rb") as f:
    requests.post(upload, data=f, headers={"Authorization": f"OAuth {TOKEN}",
        "offset": "0", "file_size": str(os.path.getsize(video))}).raise_for_status()
# 3. wait until Instagram has processed it
for _ in range(60):
    s = requests.get(f"{API}/{cid}", params={"fields": "status_code", "access_token": TOKEN}).json()
    if s.get("status_code") == "FINISHED": break
    if s.get("status_code") == "ERROR": sys.exit(f"Processing failed: {s}")
    time.sleep(10)
# 4. publish
p = requests.post(f"{API}/{IG}/media_publish", data={"creation_id": cid, "access_token": TOKEN}).json()
print("Published:", p)
open(f"{ep}/PUBLISHED", "w").write(str(p))
```

Test the publish script once by hand on a short test video before you trust it in the pipeline. If Meta's docs show a different upload URL or field name when you set up, follow the docs.

## Step 5: Run it, schedule it, approve before posting

Your weekly routine becomes: write story files, watch the finished videos, approve. Everything else runs on its own.

**Make one episode by hand** (best for the first few):

```bash
cd claude4all-reels && claude
> /make-reel episodes/s1-bas-02
```

**Make episodes unattended** with Claude Code's headless mode (`claude -p`). Allow only the tools the skill needs:

```bash
#!/bin/bash  # make_all.sh — builds every episode that has a story but no video yet
for ep in episodes/*/; do
  [ -f "$ep/story.md" ] && [ ! -f "$ep/final.mp4" ] || continue
  claude -p "Use the make-reel skill on $ep" \
    --allowedTools "Read,Write,Edit,WebSearch,WebFetch,Bash(python scripts/tts.py *),Bash(npx remotion *)" \
    --max-turns 60 > "$ep/build.log" 2>&1
done
```

**Post approved episodes, one a day:**

```bash
#!/bin/bash  # post_next.sh — publishes the oldest approved, unposted episode
for ep in episodes/*/; do
  [ -f "$ep/APPROVED" ] && [ ! -f "$ep/PUBLISHED" ] || continue
  python scripts/publish_reel.py "$ep" && break
done
```

**Schedule both** with cron on a computer that stays on (Mac or Linux; on Windows use Task Scheduler). Times below are IST:

```text
30 6 * * *  cd ~/claude4all-reels && ./make_all.sh
0 19 * * 1,3,5  cd ~/claude4all-reels && ./post_next.sh
```

**Approve:** watch `final.mp4`, read `script.json`'s sources, then run `touch episodes/s1-bas-02/APPROVED`. To fix something first, tell Claude Code what to change and it re-renders.

If you want zero approval later, delete the `APPROVED` check from the publish script. I don't recommend it for this channel: a wrong fact or a mispronounced name goes out to everyone, and you can't edit a posted Reel.

## Limits, risks and guardrails

The API limits are far above what this channel needs; the real risks are accuracy, rights and tokens.

| Topic | What to know | Guardrail |
| --- | --- | --- |
| Posting limit | Meta's guide says 100 API-published posts per 24 hours, but other parts of its docs still say 50 | You post 3–5 a week; check `content_publishing_limit` if you ever scale up |
| Containers | A container expires if not published within 24 hours | The publish script uploads and publishes in one run |
| Reel specs | MP4 (H.264), 9:16; some guides report API Reels are capped at 90 s | Keep episodes 30–45 s, which the skill already does |
| Token | Long-lived tokens last about 60 days | The publish script refreshes it each run; save the new one |
| Facts | Claude can still get a fact wrong | Sources listed in script.json; you approve before posting |
| Photos and music | Press photos and songs are usually copyrighted | Only use files in assets/ that you have rights to; the score is original or voice-only |
| Branding | The channel is unofficial | No Anthropic or OpenAI logos; "Unofficial channel" in every caption |
| Remotion licence | Free for individuals and companies of up to 3 people | Revisit if Revin Krishi or the channel grows past 3 people |
| Computer must be on | cron runs only while the machine is awake | Use an always-on machine, or move the scripts to a small cloud server later |

## Sources

- [Meta – Instagram Content Publishing guide](https://developers.facebook.com/documentation/instagram-platform/content-publishing)
- [Meta – IG User Media reference](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media)
- [Meta – Resumable uploads](https://developers.facebook.com/documentation/instagram-platform/content-publishing/resumable-uploads)
- [Postproxy – Instagram Reels API publishing guide (2026)](https://postproxy.dev/blog/instagram-reels-api-publishing-guide/)
- [Socialync – Instagram Graph API posting guide 2026](https://www.socialync.io/blog/instagram-graph-api-posting-guide-2026)
- [RapidDev – Automating Reels scheduling via the API](https://rapidevelopers.com/api-automations/how-to-automate-instagram-reels-scheduling-using-the-api)
- [Claude Code – Headless mode](https://docs.claude.com/en/docs/claude-code/headless)
- [Remotion – Licence](https://companies.remotion.dev/license)
- [kokoro-onnx on GitHub](https://github.com/thewh1teagle/kokoro-onnx)

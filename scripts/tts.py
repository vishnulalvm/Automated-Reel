"""Voice one episode: one clip per scene, a joined voiceover, and durations.json.

Usage: .venv/bin/python scripts/tts.py episodes/<slug>
The engine, voice, speed, gap, loudness and pronunciations come from "voice" in reel.config.json.
To add an engine, write a function that returns (float32 mono samples, sample rate) and add it to ENGINES.
"""
import json
import os
import shutil
import subprocess
import sys

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONFIG = json.load(open(f"{ROOT}/reel.config.json"))
VOICE = CONFIG["voice"]
END = CONFIG["outro"]["end"]


def kokoro():
    from kokoro_onnx import Kokoro

    c = VOICE["kokoro"]
    k = Kokoro(f"{HERE}/kokoro-v1.0.onnx", f"{HERE}/voices-v1.0.bin")
    return lambda text: k.create(text, voice=c["voice"], speed=c["speed"], lang=c["lang"])


def elevenlabs():
    import requests
    from dotenv import load_dotenv

    load_dotenv(f"{ROOT}/.env")
    c, key = VOICE["elevenlabs"], os.environ.get("ELEVENLABS_API_KEY")
    if not key or not c["voiceId"]:
        sys.exit("ElevenLabs needs ELEVENLABS_API_KEY in .env and voice.elevenlabs.voiceId in reel.config.json")

    def speak(text):
        r = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{c['voiceId']}",
            params={"output_format": "pcm_24000"},
            headers={"xi-api-key": key},
            json={"text": text, "model_id": c["model"]},
            timeout=120,
        )
        if not r.ok:
            sys.exit(f"ElevenLabs failed ({r.status_code}): {r.text[:300]}")
        return np.frombuffer(r.content, dtype=np.int16).astype(np.float32) / 32768, 24000

    return speak


ENGINES = {"kokoro": kokoro, "elevenlabs": elevenlabs}


def spoken(text):
    """Apply the pronunciation list, e.g. Claude4All -> Claude for all."""
    for written, said in VOICE.get("pronounce", {}).items():
        text = text.replace(written, said)
    return text


ep = sys.argv[1].rstrip("/")
slug = os.path.basename(ep)
scenes = [s for s in json.load(open(f"{ep}/script.json"))["scenes"] if s["id"] != "end"]
# every episode closes on the same follow-and-save frame, set in the config
scenes.append({"id": "end", "narration": END.get("narration", "")})
os.makedirs(f"{ep}/audio", exist_ok=True)
if VOICE["engine"] not in ENGINES:
    sys.exit(f"Unknown voice engine {VOICE['engine']!r}; choose one of {list(ENGINES)}")
speak = ENGINES[VOICE["engine"]]()

gap, track, durs, sr = VOICE["gapSeconds"], [], {}, 24000
for s in scenes:
    if s["narration"].strip():
        a, sr = speak(spoken(s["narration"]))
    else:  # silent closing frame
        a = np.zeros(int(END["seconds"] * sr), dtype=np.float32)
    sf.write(f"{ep}/audio/{s['id']}.wav", a, sr)
    durs[s["id"]] = round(len(a) / sr + gap, 2)  # clip length + gap
    track += [a, np.zeros(int(gap * sr), dtype=np.float32)]

# Join the clips, then bring the voice to the same loudness every episode (48 kHz). The length does not change.
sf.write(f"{ep}/audio/raw.wav", np.concatenate(track), sr)
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-i", f"{ep}/audio/raw.wav",
     "-af", f"loudnorm=I={VOICE['loudnessLufs']}:TP=-1.5:LRA=11", "-ar", "48000", f"{ep}/audio/voiceover.wav"],
    check=True,
)
os.remove(f"{ep}/audio/raw.wav")
json.dump(durs, open(f"{ep}/durations.json", "w"), indent=1)

# Remotion can only load media from video/public
pub = f"{ROOT}/video/public/{slug}"
os.makedirs(pub, exist_ok=True)
shutil.copy(f"{ep}/audio/voiceover.wav", f"{pub}/voiceover.wav")

print(json.dumps(durs))
print(f"total {sum(durs.values()):.1f}s ({VOICE['engine']})")

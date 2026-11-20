"""Voice one episode: one clip per scene, a joined voiceover, and durations.json.

Usage: .venv/bin/python scripts/tts.py episodes/<slug>
"""
import json
import os
import shutil
import subprocess
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
VOICE, SPEED, GAP = "af_heart", 1.1, 0.4  # GAP = silence after each scene, in seconds
LOUDNESS = "loudnorm=I=-16:TP=-1.5:LRA=11"  # ffmpeg filter; -16 LUFS is the usual level for social video

ep = sys.argv[1].rstrip("/")
slug = os.path.basename(ep)
scenes = json.load(open(f"{ep}/script.json"))["scenes"]
os.makedirs(f"{ep}/audio", exist_ok=True)

k = Kokoro(f"{HERE}/kokoro-v1.0.onnx", f"{HERE}/voices-v1.0.bin")
track, durs, sr = [], {}, 24000
for s in scenes:
    a, sr = k.create(s["narration"], voice=VOICE, speed=SPEED, lang="en-us")
    sf.write(f"{ep}/audio/{s['id']}.wav", a, sr)
    durs[s["id"]] = round(len(a) / sr + GAP, 2)  # clip length + gap
    track += [a, np.zeros(int(GAP * sr), dtype=np.float32)]

# Join the clips, then bring the voice to the loudness of the reference film
# (48 kHz, same level every episode). The length does not change.
sf.write(f"{ep}/audio/raw.wav", np.concatenate(track), sr)
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-i", f"{ep}/audio/raw.wav",
     "-af", LOUDNESS, "-ar", "48000", f"{ep}/audio/voiceover.wav"],
    check=True,
)
os.remove(f"{ep}/audio/raw.wav")
json.dump(durs, open(f"{ep}/durations.json", "w"), indent=1)

# Remotion can only load media from video/public
pub = f"{ROOT}/video/public/{slug}"
os.makedirs(pub, exist_ok=True)
shutil.copy(f"{ep}/audio/voiceover.wav", f"{pub}/voiceover.wav")

print(json.dumps(durs))
print(f"total {sum(durs.values()):.1f}s")

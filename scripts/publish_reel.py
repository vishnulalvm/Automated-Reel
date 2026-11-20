"""Post episodes/<slug>/final.mp4 as an Instagram Reel.

Usage: .venv/bin/python scripts/publish_reel.py episodes/<slug>
Refuses to run unless the episode folder has an APPROVED file.
"""
import json
import os
import subprocess
import sys
import time

import requests
from dotenv import load_dotenv, set_key

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = f"{ROOT}/.env"
load_dotenv(ENV)

ep = sys.argv[1].rstrip("/")
if not os.path.exists(f"{ep}/APPROVED"):
    sys.exit("Not approved: add an empty APPROVED file after watching final.mp4")
if os.path.exists(f"{ep}/PUBLISHED"):
    sys.exit("Already published: PUBLISHED file exists")

IG = os.environ["IG_USER_ID"]
VER = os.environ.get("GRAPH_VERSION") or "v25.0"
TOKEN = os.environ["IG_ACCESS_TOKEN"]
API = f"https://graph.instagram.com/{VER}"


def check(resp, step):
    """Return the JSON body, or stop with Meta's error message."""
    try:
        body = resp.json()
    except ValueError:
        body = {"raw": resp.text}
    if not resp.ok or "error" in body:
        sys.exit(f"{step} failed ({resp.status_code}): {body}")
    return body


# Keep the 60-day token alive and save the new one. A failed refresh is not fatal
# (tokens younger than 24 hours can't be refreshed); the current token is used.
r = requests.get(
    "https://graph.instagram.com/refresh_access_token",
    params={"grant_type": "ig_refresh_token", "access_token": TOKEN},
    timeout=30,
)
new = r.json().get("access_token") if r.ok else None
if new and new != TOKEN:
    TOKEN = new
    set_key(ENV, "IG_ACCESS_TOKEN", TOKEN, quote_mode="never")
elif not new:
    print(f"Token refresh skipped: {r.text[:200]}", file=sys.stderr)

video = f"{ep}/final.mp4"
# cover frame: the end of the intro, when the whole question is on screen
intro = json.load(open(f"{ep}/durations.json")).get("intro", 3)
cover_ms = str(int(max(0, intro - 0.5) * 1000))
caption = open(f"{ep}/caption.txt").read().strip()

# 1. create a Reel container for a resumable upload (no public URL needed)
c = check(
    requests.post(
        f"{API}/{IG}/media",
        data={
            "media_type": "REELS",
            "upload_type": "resumable",
            "caption": caption,
            "share_to_feed": "true",
            "thumb_offset": cover_ms,
            "access_token": TOKEN,
        },
        timeout=60,
    ),
    "Create container",
)
cid = c["id"]
upload = c.get("uri") or f"https://rupload.facebook.com/ig-api-upload/{VER}/{cid}"

# 2. upload the file
with open(video, "rb") as f:
    check(
        requests.post(
            upload,
            data=f,
            headers={
                "Authorization": f"OAuth {TOKEN}",
                "offset": "0",
                "file_size": str(os.path.getsize(video)),
            },
            timeout=600,
        ),
        "Upload",
    )

# 3. wait until Instagram has processed it (up to 10 minutes)
for _ in range(60):
    s = check(
        requests.get(f"{API}/{cid}", params={"fields": "status_code,status", "access_token": TOKEN}, timeout=30),
        "Status check",
    )
    if s.get("status_code") == "FINISHED":
        break
    if s.get("status_code") in ("ERROR", "EXPIRED"):
        sys.exit(f"Processing failed: {s}")
    time.sleep(10)
else:
    sys.exit(f"Still processing after 10 minutes, not published (container {cid})")

# 4. publish
p = check(
    requests.post(f"{API}/{IG}/media_publish", data={"creation_id": cid, "access_token": TOKEN}, timeout=60),
    "Publish",
)
open(f"{ep}/PUBLISHED", "w").write(str(p))
print("Published:", p)
# move the delivered files to the output folder's Archive
subprocess.run([sys.executable, f"{ROOT}/scripts/reel.py", "posted", ep], check=False)

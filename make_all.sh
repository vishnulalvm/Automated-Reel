#!/bin/bash
# Builds a reel for every script in the input folder (reel.conf) that has no video yet,
# and puts each finished video and caption in the output folder.
# Runs by hand, or automatically when the input folder changes (see scripts/auto.sh).
cd "$(dirname "$0")" || exit 1
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"  # launchd starts with a bare PATH
mkdir -p logs
log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> logs/auto.log; }
notify() { osascript -e "display notification \"$2\" with title \"Claude4All Reels\" subtitle \"$1\"" >/dev/null 2>&1; }

# one run at a time; a second trigger while a build is running just exits
mkdir logs/.lock 2>/dev/null || exit 0
trap 'rmdir logs/.lock' EXIT

sleep 5  # let the file finish saving
while :; do
  ep="$(scripts/reel-io.sh in 2>> logs/auto.log | head -1)"
  [ -n "$ep" ] || break
  slug="$(basename "$ep")"
  log "building $slug"
  notify "$slug" "Building the reel..."
  claude -p "Use the make-reel skill on $ep" \
    --allowedTools "Skill,Read,Write,Edit,WebSearch,WebFetch,Bash(.venv/bin/python scripts/tts.py *),Bash(scripts/reel-io.sh *),Bash(npx remotion *),Bash(npx tsc *),Bash(cd video *)" \
    --max-turns 80 > "$ep/build.log" 2>&1 < /dev/null
  if [ -f "$ep/final.mp4" ]; then
    out="$(scripts/reel-io.sh out "$slug" 2>> logs/auto.log)"
    log "done $slug -> $out"
    notify "$slug" "Reel ready in the output folder"
  else
    # mark it so the same script is not retried (and paid for) on every trigger;
    # editing the script in the input folder clears the mark
    touch "$ep/FAILED"
    log "FAILED $slug (see $ep/build.log)"
    notify "$slug" "Build failed. See build.log"
  fi
done

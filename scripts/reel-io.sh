#!/bin/bash
# Moves files between the user's Reel folders (see reel.conf) and episodes/.
#   scripts/reel-io.sh in          copy each new script from the input folder to episodes/<slug>/story.<ext>;
#                                  prints one episode folder per line for every script not built yet
#   scripts/reel-io.sh out <slug>  copy episodes/<slug>/final.mp4 and caption.txt to the output folder
cd "$(dirname "$0")/.." || exit 1
. ./reel.conf

case "$1" in
  in)
    [ -d "$REEL_INPUT" ] || { echo "Input folder not found: $REEL_INPUT" >&2; exit 1; }
    for f in "$REEL_INPUT"/*.md "$REEL_INPUT"/*.txt; do
      [ -f "$f" ] || continue
      name="$(basename "$f")"; ext="${name##*.}"
      # slug: file name without extension, lower case, anything but letters and digits becomes "-"
      slug="$(printf '%s' "${name%.*}" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
      [ -n "$slug" ] || continue
      ep="episodes/$slug"
      mkdir -p "$ep"
      # refresh the copy if the script was edited, and rebuild that episode
      if [ ! -f "$ep/story.$ext" ] || ! cmp -s "$f" "$ep/story.$ext"; then
        cp "$f" "$ep/story.$ext"
        rm -f "$ep/final.mp4" "$ep/FAILED"
      fi
      [ -f "$ep/final.mp4" ] || [ -f "$ep/FAILED" ] || echo "$ep"
    done
    ;;
  out)
    slug="$(basename "${2%/}")"
    ep="episodes/$slug"
    [ -f "$ep/final.mp4" ] || { echo "No final.mp4 in $ep" >&2; exit 1; }
    mkdir -p "$REEL_OUTPUT"
    cp "$ep/final.mp4" "$REEL_OUTPUT/$slug.mp4"
    [ -f "$ep/caption.txt" ] && cp "$ep/caption.txt" "$REEL_OUTPUT/$slug-caption.txt"
    echo "$REEL_OUTPUT/$slug.mp4"
    ;;
  *)
    echo "usage: scripts/reel-io.sh in | out <slug>" >&2; exit 2
    ;;
esac

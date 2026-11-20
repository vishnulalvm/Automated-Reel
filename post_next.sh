#!/bin/bash
# Publishes the oldest approved, unposted episode. One per run.
cd "$(dirname "$0")" || exit 1

for ep in episodes/*/; do
  ep="${ep%/}"
  [ -f "$ep/APPROVED" ] && [ ! -f "$ep/PUBLISHED" ] || continue
  .venv/bin/python scripts/publish_reel.py "$ep" >> "$ep/publish.log" 2>&1
  break  # one attempt per run, even if it failed; see publish.log
done

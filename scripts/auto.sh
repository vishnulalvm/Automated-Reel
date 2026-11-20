#!/bin/bash
# Turns automatic building on or off. When on, macOS runs make_all.sh whenever
# a file is added to or changed in the input folder (reel.conf).
#   scripts/auto.sh on | off | status
cd "$(dirname "$0")/.." || exit 1
. ./reel.conf
LABEL="com.claude4all.reels"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
ROOT="$(pwd)"

case "$1" in
  on)
    mkdir -p "$HOME/Library/LaunchAgents" logs
    cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$ROOT/make_all.sh</string></array>
  <key>WatchPaths</key><array><string>$REEL_INPUT</string></array>
  <key>ThrottleInterval</key><integer>20</integer>
  <key>StandardOutPath</key><string>$ROOT/logs/launchd.log</string>
  <key>StandardErrorPath</key><string>$ROOT/logs/launchd.log</string>
</dict></plist>
PL
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
    launchctl bootstrap "gui/$(id -u)" "$PLIST" && echo "Auto-build is ON, watching: $REEL_INPUT"
    ;;
  off)
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
    rm -f "$PLIST"
    echo "Auto-build is OFF"
    ;;
  status)
    launchctl print "gui/$(id -u)/$LABEL" 2>/dev/null | grep -E "state =|runs =|last exit code" || echo "Auto-build is OFF"
    tail -5 logs/auto.log 2>/dev/null
    ;;
  *) echo "usage: scripts/auto.sh on | off | status" >&2; exit 2 ;;
esac

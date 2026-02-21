#!/bin/sh

# The volume_change event supplies a $INFO variable in which the current volume
# percentage is passed to the script.

if [ "$SENDER" = "volume_change" ]; then
  VOLUME="$INFO"

  case "$VOLUME" in
    [8-9][0-9]|100) ICON="󰕾"
    ;;
    [6-7][0-9]) ICON="󰕾"
    ;;
    [4-5][0-9]) ICON="󰖀"
    ;;
    [1-3][0-9]) ICON="󰕿"
    ;;
    0) ICON="󰖁"
    ;;
    *) ICON="󰖁"
  esac

  # Add color based on volume level
  if [ "$VOLUME" -eq 0 ]; then
    ICON_COLOR="0xffff3050" # Red-ish when muted
  elif [ "$VOLUME" -gt 80 ]; then
    ICON_COLOR="0xff46c880" # Green when loud
  else
    ICON_COLOR="0xffffffff" # White for normal levels
  fi

  sketchybar --set "$NAME" icon="$ICON" icon.color="$ICON_COLOR" label="$VOLUME%"
fi

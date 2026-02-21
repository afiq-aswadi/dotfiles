#!/bin/sh
# filepath: ~/.config/sketchybar/plugins/space.sh

# extract space number from item name (e.g., "space.6" -> "6")
SPACE_ID=$(echo "$NAME" | sed 's/space\.//')

# query all windows in this space
WINDOWS_JSON=$(yabai -m query --windows --space "$SPACE_ID" 2>/dev/null)

if [ -n "$WINDOWS_JSON" ] && [ "$WINDOWS_JSON" != "[]" ]; then
  # separate windows into stacked and tiled
  STACKED_APPS=$(echo "$WINDOWS_JSON" | jq -r '[.[] | select(."stack-index" > 0) | .app] | unique | .[]')
  TILED_APPS=$(echo "$WINDOWS_JSON" | jq -r '[.[] | select(."stack-index" == 0) | .app] | unique | .[]')

  # count total unique apps
  TOTAL_APPS=$(echo "$WINDOWS_JSON" | jq -r '[.[] | .app] | unique | length')

  # get first app (prefer stacked, then tiled)
  if [ -n "$STACKED_APPS" ]; then
    FIRST_APP=$(echo "$STACKED_APPS" | head -1)
    # indicate it's stacked with brackets
    if [ "$TOTAL_APPS" -gt 1 ]; then
      LABEL="[$FIRST_APP] …"
    else
      LABEL="[$FIRST_APP]"
    fi
  elif [ -n "$TILED_APPS" ]; then
    FIRST_APP=$(echo "$TILED_APPS" | head -1)
    if [ "$TOTAL_APPS" -gt 1 ]; then
      LABEL="$FIRST_APP …"
    else
      LABEL="$FIRST_APP"
    fi
  else
    LABEL=""
  fi
else
  LABEL=""
fi

if [ "$SELECTED" = "true" ]; then
  sketchybar --set "$NAME" \
    icon.color=0xff4b0082 \
    background.color=0xff282a36 \
    background.border_width=0 \
    background.corner_radius=0 \
    label="$LABEL" \
    label.drawing=$([ -n "$LABEL" ] && echo "on" || echo "off")
else
  sketchybar --set "$NAME" \
    icon.color=0xffcccccc \
    background.color=0x44000000 \
    background.border_color=0x00000000 \
    background.border_width=0 \
    background.corner_radius=8 \
    label="$LABEL" \
    label.drawing=$([ -n "$LABEL" ] && echo "on" || echo "off")
fi

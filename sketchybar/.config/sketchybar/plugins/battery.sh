#!/bin/sh

PERCENTAGE="$(pmset -g batt | grep -Eo "\d+%" | cut -d% -f1)"
CHARGING="$(pmset -g batt | grep 'AC Power')"

if [ "$PERCENTAGE" = "" ]; then
  exit 0
fi

case "${PERCENTAGE}" in
  9[0-9]|100) ICON="󰁹"
  ;;
  [6-8][0-9]) ICON="󰂁"
  ;;
  [4-5][0-9]) ICON="󰁾"
  ;;
  [1-3][0-9]) ICON="󰁻"
  ;;
  *) ICON="󰂎"
esac

if [[ "$CHARGING" != "" ]]; then
  ICON="󰂄"
fi

# Color coding based on battery level and charging status
if [[ "$CHARGING" != "" ]]; then
  ICON_COLOR="0xff46c880" # Green when charging
elif [ "$PERCENTAGE" -le 20 ]; then
  ICON_COLOR="0xffff3050" # Red when low battery
elif [ "$PERCENTAGE" -le 40 ]; then
  ICON_COLOR="0xffffa030" # Orange when battery below 40%
else
  ICON_COLOR="0xffffffff" # White for normal levels
fi

# The item invoking this script (name $NAME) will get its icon and label
# updated with the current battery status
sketchybar --set "$NAME" \
  icon="$ICON" \
  icon.color="$ICON_COLOR" \
  label="${PERCENTAGE}%"

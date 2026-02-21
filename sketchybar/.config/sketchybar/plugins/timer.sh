#!/bin/bash

TIMER_PID_FILE="/tmp/sketchybar_timer.pid"
TIMER_DURATION=300  # 5 minutes in seconds

start_timer() {
    # kill any existing timer
    if [ -f "$TIMER_PID_FILE" ]; then
        old_pid=$(cat "$TIMER_PID_FILE")
        kill "$old_pid" 2>/dev/null
        rm "$TIMER_PID_FILE"
    fi

    # start new timer in background
    (
        echo $$ > "$TIMER_PID_FILE"
        remaining=$TIMER_DURATION

        while [ $remaining -ge 0 ]; do
            # calculate minutes and seconds
            mins=$((remaining / 60))
            secs=$((remaining % 60))

            # format display
            display=$(printf "%d:%02d" $mins $secs)

            # determine color based on remaining time
            if [ $remaining -gt 180 ]; then
                color="0xff9dd274"  # green
            elif [ $remaining -gt 60 ]; then
                color="0xfff5a97f"  # yellow
            else
                color="0xffed8796"  # red
            fi

            # update sketchybar
            sketchybar --set timer label="$display" label.color="$color"

            if [ $remaining -eq 0 ]; then
                # timer complete
                osascript -e 'display notification "Timer complete!" with title "5-Minute Timer" sound name "Glass"'
                sketchybar --set timer label="" label.color="0xffcad3f5"
                rm "$TIMER_PID_FILE"
                break
            fi

            sleep 1
            remaining=$((remaining - 1))
        done
    ) &
}

# handle events
case "$SENDER" in
    "timer_start")
        start_timer
        ;;
esac

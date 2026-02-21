#!/bin/sh

# Max number of characters for the song title and artist
MAX_LENGTH=40

# Cache directory for album art (track info remains in the main status)
CACHE_DIR="$HOME/.cache/sketchybar"
mkdir -p "$CACHE_DIR"
ALBUM_ART_FILE="$CACHE_DIR/spotify_album_art.jpg"

get_album_art() {
    # Get album artwork using osascript
    osascript << EOF
    tell application "Spotify"
        try
            return artwork url of current track
        on error
            return ""
        end try
    end tell
EOF
}

download_album_art() {
    ARTWORK_URL="$1"
    CACHE_FILE="$CACHE_DIR/spotify_album_art.jpg"
    
    if [ -n "$ARTWORK_URL" ]; then
        curl -s "$ARTWORK_URL" -o "$CACHE_FILE"
        echo "$CACHE_FILE"
    fi
}

update_spotify() {
    # Get Spotify information using osascript
    SPOTIFY_DATA=$(osascript << EOF
        if application "Spotify" is running then
            tell application "Spotify"
                if player state is playing then
                    set currentTrack to name of current track
                    set currentArtist to artist of current track
                    return currentTrack & " *** " & currentArtist
                else
                    return "paused"
                end if
            end tell
        else
            return "not running"
        end if
EOF
    )

    # Process the returned data
    if [ "$SPOTIFY_DATA" = "not running" ] || [ "$SPOTIFY_DATA" = "paused" ]; then
        ICON="󰓃"
        ICON_COLOR="0xffcccccc"
        LABEL="No music"
    else
        # Split the title and artist (separated by " *** ")
        TITLE=$(echo "$SPOTIFY_DATA" | awk -F' \\*\\*\\* ' '{print $1}')
        ARTIST=$(echo "$SPOTIFY_DATA" | awk -F' \\*\\*\\* ' '{print $2}')

        # Truncate title and artist if they're too long
        if [ "${#TITLE}" -gt "$MAX_LENGTH" ]; then
            TITLE="$(echo "$TITLE" | cut -c 1-$MAX_LENGTH)..."
        fi
        if [ "${#ARTIST}" -gt "$MAX_LENGTH" ]; then
            ARTIST="$(echo "$ARTIST" | cut -c 1-$MAX_LENGTH)..."
        fi

        ICON="󰓇"
        ICON_COLOR="0xff1DB954"
        LABEL="$TITLE - $ARTIST"

        # Get and cache album art
        ARTWORK_URL=$(get_album_art)
        if [ -n "$ARTWORK_URL" ]; then
            ARTWORK_FILE=$(download_album_art "$ARTWORK_URL")
        fi
    fi

    # Get current Spotify volume
    VOLUME=$(osascript -e 'tell application "Spotify" to sound volume' 2>/dev/null)
    FILLED=$((VOLUME / 5))
    EMPTY=$((20 - FILLED))
    FILLED_BAR=$(printf '█%.0s' $(seq 1 $FILLED))
    EMPTY_BAR=$(printf '─%.0s' $(seq 1 $EMPTY))
    VOLUME_BAR="[$FILLED_BAR$EMPTY_BAR] ${VOLUME}%"

    sketchybar --set "$NAME" icon="$ICON" \
                            icon.color="$ICON_COLOR" \
                            label="$LABEL"

    # Update popup items
    if [ -n "$ARTWORK_FILE" ] && [ -f "$ARTWORK_FILE" ]; then
        sketchybar --set spotify.album background.image="$ARTWORK_FILE" \
                                     background.image.scale=1.0 \
                                     background.drawing=on
    fi
    
    sketchybar --set spotify.volume label="$VOLUME_BAR"
}

# Run the update function
update_spotify
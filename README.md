# dotfiles

macOS tiling window management setup using yabai, skhd, and sketchybar, managed with GNU Stow.

## Prerequisites

```bash
brew install koekeishiya/formulae/yabai
brew install koekeishiya/formulae/skhd
brew tap FelixKratz/formulae
brew install sketchybar
brew install stow
brew install jq
```

### Font

Install [Hack Nerd Font](https://github.com/ryanoasis/nerd-fonts/tree/master/patched-fonts/Hack) (used by sketchybar):

```bash
brew install font-hack-nerd-font
```

### yabai scripting addition

yabai requires a scripting addition for full functionality (window movements across spaces, etc.). This needs SIP partially disabled.

1. Disable SIP (reboot into Recovery Mode, open Terminal):
   ```bash
   csrutil enable --without fs --without debug --without nvram
   ```
2. After rebooting, allow yabai to load the scripting addition:
   ```bash
   echo "$(whoami) ALL=(root) NOPASSWD: sha256:$(shasum -a 256 $(which yabai) | cut -d " " -f 1) $(which yabai) --load-sa" | sudo tee /private/etc/sudoers.d/yabai
   ```
3. This sudoers entry needs to be updated after every yabai upgrade:
   ```bash
   # after `brew upgrade yabai`:
   sudo yabai --uninstall-sa
   echo "$(whoami) ALL=(root) NOPASSWD: sha256:$(shasum -a 256 $(which yabai) | cut -d " " -f 1) $(which yabai) --load-sa" | sudo tee /private/etc/sudoers.d/yabai
   ```

## Install

```bash
git clone https://github.com/afiqabdillah/dotfiles.git ~/dotfiles
cd ~/dotfiles
stow yabai skhd sketchybar
```

## Start services

```bash
yabai --start-service
skhd --start-service
brew services start sketchybar
```

## Reload after editing configs

```bash
yabai --restart-service
skhd --restart-service
sketchybar --reload
```

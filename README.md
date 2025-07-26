# Serpent-BTP

This repository contains a minimal terminal-based Snake game.

## Requirements

The game relies only on Python's standard library `curses` module. On Windows, install the optional `windows-curses` package:

```bash
pip install windows-curses
```

## Running the game

Run the following command from the repository root:

```bash
python3 snake_game.py
```

Use the arrow keys to control the snake. The game ends when the snake hits the wall or itself.


## Playing Snake Quiz - Construction BTP in the Browser

A browser-based version of the game is included in `index.html`. Simply open this file in any modern web browser (Chrome, Firefox, Edge, etc.) with JavaScript enabled. No server is required because all assets are local.

You can open the file using your operating system's default command:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

Ensure `style.css`, `script.js`, and the image files remain in the same directory as `index.html`.

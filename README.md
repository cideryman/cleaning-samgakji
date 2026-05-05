# Cleaning Samgakji

A small Phaser.js prototype about cleaning trash slimes in a simplified Samgakji neighborhood map.

## Goal

This prototype focuses on a simple loop:

```text
explore -> find trash slime -> sweep -> immediate feedback -> reward -> mission clear
```

The game is designed around generous controls, clear feedback, and minimal text.

## Controls

- Move: Arrow keys or WASD
- Sweep: Space or the broom button

## Current Features

- 8-way player movement
- One-button sweeping with a wide hit area
- Random trash slime waves
- 20-slime mission goal
- Broom upgrade after 10 cleaned slimes
- Sweep, clean, and mission-clear sound effects
- Mission-clear flower bloom
- Restart button after mission clear

## Run

Open `index.html` in a browser.

For a local web server:

```powershell
cd C:\Users\user\Desktop
python -m http.server 5174
```

Then open:

```text
http://localhost:5174/cleaning-samgakji/
```

## Structure

```text
index.html
styles.css
src/main.js
src/scenes/Preload.js
src/scenes/PlayScene.js
assets/
```

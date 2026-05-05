# Cleaning Samgakji Coding Guidelines

Target Audience: People with developmental disabilities  
Tech Stack: Phaser.js, Arcade Physics, web-based

## Core Rule

The game must stay cognitively simple: 8-way movement plus one sweep button.

## Design Priorities

- Prefer visual feedback over text.
- Prefer concrete actions: sweep, clean, trash, flower, broom.
- Do not add dash, combo, precise timing, or punishment-heavy mechanics.
- Make interaction zones generous. Close enough should count.
- Every successful sweep should produce immediate feedback.
- Avoid flashing lights and jarring sounds.

## Development Priorities

- Keep balance values inside `GAME_CONFIG`.
- Keep the Phaser lifecycle clear: preload/create/update.
- Use Phaser Arcade Physics before adding libraries.
- Build in tiny verifiable loops:
  1. trigger
  2. action
  3. reward
  4. feedback

# Tiled Map Guide

Use these settings when making the Samgakji map in Tiled.

- Map size: `48 x 30` tiles
- Tile size: `32 x 32 px`
- Final pixel size: `1536 x 960`
- Tileset image: `assets/tilesets/samgakji-tiles.png`
- Tileset name in Tiled: `samgakji_tiles`
- Export path: `assets/maps/samgakji-map.json`

Recommended layer names:

- `ground`: floor, grass, roads, paths
- `objects`: visual objects that do not block movement
- `collision`: invisible blocking tiles
- `spawn`: object layer for important points

The game recognizes these object names or types in the `spawn` object layer:

- `player_start`: where the player begins
- `broom_upgrade`: where the bigger broom appears
- `slime_spawn`: possible slime spawn points
- `flower`: final flower positions after clearing the mission

Important export note:

Export as JSON and embed the tileset data if Tiled offers that option. Phaser reads the JSON map and the `samgakji_tiles` image, but it does not need to load `.tsx` files at runtime.

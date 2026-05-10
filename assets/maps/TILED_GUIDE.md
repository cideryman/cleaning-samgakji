# Tiled Map Guide

Use these settings when making the Samgakji map in Tiled.

- Map size: `48 x 30` tiles
- Tile size: `32 x 32 px`
- Final pixel size: `1536 x 960`
- Tileset image: `assets/tilesets/samgakji-tiles.png`
- Tileset name in Tiled: `samgakji_tiles`
- Export path: `assets/maps/samgakji-map.json`

The game now loads `assets/maps/samgakji-map.json` first. Edit that file in Tiled and export over the same path when you want the game map to change.

Tile list in `samgakji_tiles`:

```text
row 1: grass, grass-light, grass-dark, grass-edge-left, grass-edge-right, path, path-light, path-corner
row 2: sidewalk, sidewalk-diagonal, road, road-edge, building-roof, building-wall, garden, flower-bed
row 3: tree-top, tree-trunk, bush, small-tree, fence-horizontal, fence-vertical, water-drain, stairs
row 4: bench, green-parasol, parasol-top, parasol-pole
```

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

Tree placement:

For simple trees, place `small-tree` on the `objects` layer.

For a bigger two-tile tree, place `tree-trunk` on the lower tile and `tree-top` directly above it. Put both on the `objects` layer unless you want the tree to block movement. If it should block movement, add a matching tile or rectangle on the `collision` layer.

Bench and parasol placement:

Place `bench` on the `objects` layer. If players should not walk through it, add a matching blocker on the `collision` layer.

For a simple parasol, place `green-parasol` on the `objects` layer. For a larger parasol, place `parasol-pole` on the lower tile and `parasol-top` directly above it.

Important export note:

Export as JSON and embed the tileset data if Tiled offers that option. Phaser reads the JSON map and the `samgakji_tiles` image, but it does not need to load `.tsx` files at runtime.

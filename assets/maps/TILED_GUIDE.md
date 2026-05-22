# Tiled Map Guide

Use these settings when making the Samgakji map in Tiled.

- Map size: `48 x 30` tiles
- Tile size: `32 x 32 px`
- Final pixel size: `1536 x 960`
- Tileset image: `assets/tilesets/samgakji-tiles.png`
- Tileset name in Tiled: `samgakji_tiles`
- Chapter 1 export path: `assets/maps/chapter1-samgakji-map.json`
- Future chapter export path pattern: `assets/maps/chapter2-<short-name>-map.json`, `assets/maps/chapter3-<short-name>-map.json`, and so on

The game currently loads `assets/maps/chapter1-samgakji-map.json` for Chapter 1. Edit that file in Tiled and export over the same path when you want Chapter 1 to change.

Chapter audio:

- Put chapter music in `assets/audio/chapter1.mp3`, `assets/audio/chapter2.mp3`, and so on.
- The game starts with the current chapter music and will naturally try the next numbered file when one exists.

Tile list in `samgakji_tiles`:

```text
row 1: grass, grass-light, grass-dark, grass-edge-left, grass-edge-right, path, path-light, path-corner
row 2: sidewalk, sidewalk-diagonal, road, road-edge, building-roof, building-wall, garden, flower-bed
row 3: tree-top, tree-trunk, bush, small-tree, fence-horizontal, fence-vertical, water-drain, stairs
row 4: bench, green-parasol, parasol-top, parasol-pole
row 5: road-centerline, crosswalk, road-plain
```

Recommended layer names:

- `ground`: floor, grass, roads, paths
- `objects`: visual objects that do not block movement
- `collision`: invisible blocking tiles
- `map_objects`: large image objects such as buildings, benches, trees, and vending machines
- `spawn`: object layer for important points

The game recognizes these object names or types in the `spawn` object layer:

- `player_start`: where the player begins
- `broom_upgrade`: where the bigger broom appears
- `slime_spawn`: possible slime spawn points
- `flower`: final flower positions after clearing the mission

Recommended object naming rules:

- Keep object names concrete and lowercase, such as `slime_spawn` or `player_start`.
- Use multiple `slime_spawn` objects if you want more possible spawn locations.
- Use multiple `flower` objects to control exactly where the clear flowers appear.
- Keep the `collision` layer simple; only place blockers where the player must not walk.

Large map objects:

For buildings and large props, place an object on the `map_objects` layer and add these custom properties:

- `texture`: Phaser texture key, such as `hospital_building`, `pharmacy_building`, `clothing_store`, `sunisuni_tree`, `sunisuni_bench`, `pedestrian_light`, `pedestrian_light_back`, `pedestrian_stop_sign`, or `crosswalk_sign`
- `displayWidth`: rendered width in pixels
- `displayHeight`: rendered height in pixels
- `originX`: usually `0.5`
- `originY`: usually `1`
- `depth`: draw order. Higher values appear above lower values.
- `animation`: optional animation key, such as `pedestrian_light_cycle`

Keep big buildings out of the tileset unless they need to repeat as small 32px tiles. The tileset is best for ground, roads, paths, and small repeated decorations.

Tree placement:

For simple trees, place `small-tree` on the `objects` layer.

For a bigger two-tile tree, place `tree-trunk` on the lower tile and `tree-top` directly above it. Put both on the `objects` layer unless you want the tree to block movement. If it should block movement, add a matching tile or rectangle on the `collision` layer.

Bench and parasol placement:

Place `bench` on the `objects` layer. If players should not walk through it, add a matching blocker on the `collision` layer.

For a simple parasol, place `green-parasol` on the `objects` layer. For a larger parasol, place `parasol-pole` on the lower tile and `parasol-top` directly above it.

Important export note:

Export as JSON and embed the tileset data if Tiled offers that option. Phaser reads the JSON map and the `samgakji_tiles` image, but it does not need to load `.tsx` files at runtime.

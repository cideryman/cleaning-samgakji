# Tiled Map Guide

Use these settings when making the Samgakji map in Tiled.

- Map size: `48 x 30` tiles
- Tile size: `32 x 32 px`
- Final pixel size: `1536 x 960`
- Main tileset image: `assets/tilesets/samgakji-tiles.png`
- Main tileset name in Tiled: `samgakji_tiles`
- Extra tilesets are allowed. Keep their PNG files under `assets/tilesets/`.
- Park tileset: `assets/tilesets/park_tiles.tsx` / `assets/tilesets/park_tiles.png`
- Chapter 1 export path: `assets/maps/chapter1-samgakji-map.json`
- Future chapter export path pattern: `assets/maps/chapter2-<short-name>-map.json`, `assets/maps/chapter3-<short-name>-map.json`, and so on

The game currently loads `assets/maps/chapter1-samgakji-map.json` for Chapter 1. Edit that file in Tiled and export over the same path when you want Chapter 1 to change.

Multiple tilesets:

- You can add another tileset in Tiled and paint with it directly.
- Put the image file in `assets/tilesets/`, for example `assets/tilesets/park_tileset.png`.
- Give each tileset a unique Tiled name, for example `park_tileset`.
- For the current park set, add `assets/tilesets/park_tiles.tsx` in Tiled. Its tileset name is `park_tiles`.
- Export the map JSON after editing. The game supports both embedded tileset data and external `.tsx` tileset references.
- If the map JSON contains `"source":"../tilesets/example.tsx"`, the loader reads that `.tsx`, finds the PNG inside it, and loads the matching texture automatically.
- Do not rename a tileset after using it on the map unless you also re-export and test the game.
- Avoid moving old tiles inside an existing tileset image, because the map stores tile IDs. Add new tiles into empty space or use a new tileset image instead.

Recommended choice:

- Prefer external `.tsx` tilesets while the map is still growing.
- This keeps each tileset independent in Tiled and makes it easier to add, replace, or remove a tileset later.
- Embedded tilesets are also supported, but they are less convenient for ongoing map editing because the tileset metadata is copied into the map JSON.
- For this project, use external `.tsx` tilesets by default unless there is a specific reason to embed.

Chapter audio:

- Put chapter music in `assets/audio/bgm/chapter1.mp3`, `assets/audio/bgm/chapter2.mp3`, and so on.
- The game starts with the current chapter music and will naturally try the next numbered file when one exists.
- Put recorded voice lines in `assets/audio/voice/`.
- Put file-based sound effects in `assets/audio/sfx/`. Current sweep, clean, reward, and pickup sounds are generated in code by `AudioManager.js`.

Tile list in `samgakji_tiles`:

```text
row 1: grass, grass-light, grass-dark, grass-edge-left, grass-edge-right, path, path-light, path-corner
row 2: sidewalk, sidewalk-diagonal, road, road-edge, building-roof, building-wall, garden, flower-bed
row 3: tree-top, tree-trunk, bush, small-tree, fence-horizontal, fence-vertical, water-drain, stairs
row 4: bench, green-parasol, parasol-top, parasol-pole
row 5: road-centerline, crosswalk, road-plain
row 6: custom-grass, bush-1, bush-2, bush-3, bush-4, brick-curb, grass-curb-1, grass-curb-2
row 7: grass-curb-3, grass-curb-4, weed-curb
row 8: vehicle-stop-line
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
- `traffic_left_lane`: Y position for cars driving left on the upper road lane
- `traffic_right_lane`: Y position for cars driving right on the lower road lane
- `crosswalk_west`: X position for the west crosswalk and its vehicle stop lines
- `crosswalk_east`: X position for the east crosswalk and its vehicle stop lines
- `vehicle_stop_left_west`, `vehicle_stop_left_east`: exact stop-line points for cars driving left
- `vehicle_stop_right_west`, `vehicle_stop_right_east`: exact stop-line points for cars driving right
- `bus_stop`: bus stop position used by the travel bus event

Road traffic behavior:

- Cars move when the pedestrian signal is green.
- Cars stop at `vehicle_stop_*` points when the pedestrian signal is red.
- Move `traffic_left_lane` and `traffic_right_lane` up or down in Tiled to adjust each lane's Y position.
- Move `vehicle_stop_left_*` and `vehicle_stop_right_*` in Tiled to adjust the exact stop positions.
- Use the `vehicle-stop-line` tile to draw the visible road marking at the same point.

Recommended object naming rules:

- Keep object names concrete and lowercase, such as `slime_spawn` or `player_start`.
- Use multiple `slime_spawn` objects if you want more possible spawn locations.
- Use multiple `flower` objects to control exactly where the clear flowers appear.
- Keep the `collision` layer simple; only place blockers where the player must not walk.

Samgakji progress objects:

- Place progress anchors on the `spawn` object layer as `logic_point` objects.
- Add `progressObject=true` to opt in. Ordinary points are ignored by the progress system.
- For a single object, add `texture=<Phaser texture key>`.
- For dirty-to-recovered progression, add `dirtyTexture`, `recoveredTexture`, and `revealAtLevel`.
- Use `replacedMapObjectKey` when a dirty prop should temporarily hide an existing `map_objects` item, such as a bench or tree.
- Use `blocksMovement=true` only when the visible progress object should block the player.
- After exporting the map, run `npm.cmd run validate:map-progress` to catch texture-name mistakes, duplicate progress keys, and missing replacement map objects.

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

Export as JSON. Embedded tilesets are still fine, but external `.tsx` tilesets are also supported now. Keep the `.tsx` and its PNG under `assets/tilesets/`, and keep their relative paths valid after exporting.

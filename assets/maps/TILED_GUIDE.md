# Tiled Map Guide

Use these settings when making the Samgakji map in Tiled.

- Map size: `48 x 30` tiles
- Tile size: `32 x 32 px`
- Final pixel size: `1536 x 960`
- Main tileset image: `assets/tilesets/samgakji-tiles.png`
- Main tileset name in Tiled: `samgakji_tiles`
- Extra tilesets are allowed. Keep their PNG files under `assets/tilesets/`.
- Chapter 1 export path: `assets/maps/chapter1-samgakji-map.json`
- Future chapter export path pattern: `assets/maps/chapter2-<short-name>-map.json`, `assets/maps/chapter3-<short-name>-map.json`, and so on

The game currently loads `assets/maps/chapter1-samgakji-map.json` for Chapter 1. Edit that file in Tiled and export over the same path when you want Chapter 1 to change.

Multiple tilesets:

- You can add another tileset in Tiled and paint with it directly.
- Put the image file in `assets/tilesets/`, for example `assets/tilesets/park_tileset.png`.
- Give each tileset a unique Tiled name, for example `park_tileset`.
- Export the map JSON with embedded tileset data. The game reads the JSON `tilesets` list and loads each referenced PNG automatically.
- Do not rename a tileset after using it on the map unless you also re-export and test the game.
- Avoid moving old tiles inside an existing tileset image, because the map stores tile IDs. Add new tiles into empty space or use a new tileset image instead.

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

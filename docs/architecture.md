# Architecture Overview

The GTA engine keeps a clear separation between simulation (game loop), world data (tiles/entities), and presentation (renderer). This document outlines the major systems so that future contributors can extend the project without reverse engineering the codebase.

## Update loop
- `GameLoop` (src/systems/GameLoop.ts) owns the authoritative `GameState`. On each animation frame it:
  - Computes `deltaTime` from `performance.now()`.
  - Updates the player via `updatePlayer`, applying GTA 2-style acceleration/deceleration and sprite animation logic.
  - Repositions the camera (`updateCamera`) so the player remains centered.
  - Emits a **new** `GameState` object to React to trigger a render.
- The loop stores virtual joystick input through `setInput`, so adding new input systems just means updating that vector.

## Coordinate systems
- **World space** is a simple grid measured in pixels (`TILE_SIZE = 64`). Tile indices `(x, y)` convert to world positions by multiplying with `TILE_SIZE`.
- **Screen space** is derived by `worldToIsometric` in `src/utils/Isometric.ts`. Despite the name it implements a top-down oblique GTA 2 projection: `x` remains `x`, but `z` height offsets `y` for pseudo depth.
- The renderer further offsets projected coordinates by the camera and half the screen dimensions, so `(0,0)` is the top-left corner of the viewport.

## Rendering flow
- `GameRenderer` performs three tasks:
  1. `useProjectedScene` maps every tile to screen coordinates, filters by the viewport with a small culling margin, and precomputes road neighbor data. This removes redundant math inside Skia components and dramatically improves performance on large maps.
  2. The component chooses between a Skia implementation (native platforms) and a web fallback that uses absolutely positioned `View`s. Both branches share the same projected tile data to keep visuals in sync.
  3. Tiles are sorted by `(x + y)` depth, and the player sprite renders at the correct layer relative to buildings.
- Tile components (`IsometricGrass`, `IsometricRoad`, `IsometricBuilding`) now receive screen coordinates directly, so they simply draw rectangles/shapes. `IsometricGrass` also handles the new `pavement` type for sidewalks.
- The renderer only draws tiles within `CULL_MARGIN` of the viewport, which keeps frame times stable even if you expand the city.

## Procedural city generation
- `generateCityMap` uses a `BLOCK_SIZE` of 5 tiles:
  - Roads occupy every 5th tile.
  - Adjacent tiles become `pavement` to emulate sidewalks.
  - Central block tiles (positions 2–3 inside each block) have a deterministic pseudo-random chance to spawn buildings.
- Building heights taper with distance from the city centre, producing tall downtown blocks and shorter outskirts.
- Each `Tile` can carry an optional `buildingHeight` for renderers that want to add detail (Skia currently uses this to scale the extrusion).

## Player representation
- `updatePlayer` applies acceleration, deceleration, and speed clamping. Movement feeds the sprite state machine (`SpriteAnimation`) to pick the correct spritesheet frame.
- The renderer flips frames for left-facing movement and falls back to a simple circle placeholder when the spritesheet is unavailable.

## Extending the world
1. **Add a new tile type:** update `TileType` in `src/types/Game.ts`, teach `generateCityMap` how to assign it, and render it in both Skia (`GameRenderer` switch) and the web fallback.
2. **Spawn new entities:** append to `gameState.entities` in `GameLoop` and draw them in `GameRenderer` after projecting to screen space.
3. **Tweak visuals:** adjust the specialised tile components or extend `IsometricRoad`/`IsometricBuilding` for additional detail. Keep changes platform-neutral by updating the web renderer in tandem.

Keeping logic pure and referentially transparent (no in-place mutations) ensures React sees state changes and re-renders correctly. Maintain that pattern when adding features to avoid subtle rendering bugs.


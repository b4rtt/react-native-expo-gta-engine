# GTA Engine Roadmap

Actionable tasks that bring the prototype closer to the GTA 2 experience. Items are grouped by feature areas and ordered by priority. Check boxes track completion status.

## Core Gameplay
- [x] Lock the camera so the player sprite remains exactly at screen center on every frame (audit `GameRenderer` + `updateCamera` behaviour during resizing).
- [x] Implement solid collision for buildings, road edges, and props (axis-aligned grid colliders first, then expand to per-tile flags).
- [x] Add collectible coins/loot that spawn across the city, update HUD counters, and respawn logically.
- [ ] Introduce NPC pedestrians with simple wandering AI and collision avoidance.
- [ ] Support entering/exiting vehicles: parked car entities, state transition to driving mode, and vehicle handling model.

## Controls & UI
- [ ] Rework the virtual joystick visuals and responsiveness; provide optional keyboard mapping on web.
- [x] Add an on-screen GTA-style HUD (health, cash, minimap placeholder, wanted stars stub).
- [ ] Build a pause menu with resume/settings/exit and wire it into the game loop.
- [ ] Create a main menu scene with start game / options / credits flow.

## World Building
- [ ] Expand road generator to include corners, T-junctions, roundabouts, and alleyways (new tile metadata + renderer support).
- [ ] Add sidewalks/curbs variation, crosswalks at intersections, and traffic lights props.
- [ ] Scatter vegetation and street furniture (trees, lamp posts, trash bins, benches) with deterministic seeding.
- [ ] Improve building extrusion to show façades, roof details, rooftop props, and per-height color ramps.
- [ ] Introduce water tiles (rivers/canals) and bridges connecting blocks.

## Art & Audio
- [ ] Replace the placeholder sprite with a custom player character (idle/walk animations in four directions).
- [ ] Design GTA-inspired vehicle and pedestrian sprites.
- [ ] Add ambient city soundscape and SFX hooks for movement, pickups, and UI.
- [ ] Implement day/night cycle with palette shifts and dynamic lighting accents.

## Tooling & Extensibility
- [ ] Load city layout from external matrix-based JSON/CSV definition, with fallback to procedural generation.
- [ ] Provide a simple map editor (even CLI or React web panel) to edit tile types and props.
- [ ] Document sprite sheet specifications and pipeline for adding new assets.
- [ ] Create automated tests for map generation, collision resolution, and animation state machine.

## Polish & Performance
- [ ] Profile rendering on low-end devices; add tile batching and memoisation where necessary.
- [ ] Expose debug overlays (FPS counter, collision boxes, tile coordinates).
- [ ] Add save/load of player progress and world state.
- [ ] Prepare CI script that runs TypeScript checks and linting on push.

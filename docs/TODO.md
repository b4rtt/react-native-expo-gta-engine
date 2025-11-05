# GTA Engine Roadmap

Actionable tasks that bring the prototype closer to the GTA 2 experience. Items are grouped by feature areas and ordered by priority. Check boxes track completion status.

## Core Gameplay
- [x] Lock the camera so the player sprite remains exactly at screen center on every frame (audit `GameRenderer` + `updateCamera` behaviour during resizing).
- [x] Implement solid collision for buildings, road edges, and props (axis-aligned grid colliders first, then expand to per-tile flags).
- [x] Add collectible coins/loot that spawn across the city, update HUD counters, and respawn logically.
- [x] Introduce NPC pedestrians with simple wandering AI and collision avoidance.
- [x] Support entering/exiting vehicles: parked car entities, state transition to driving mode, and vehicle handling model.

## Controls & UI
- [x] Rework the virtual joystick visuals and responsiveness; provide optional keyboard mapping on web.
- [x] Add an on-screen GTA-style HUD (health, cash, minimap placeholder, wanted stars stub).
- [x] Add a weapon quick-select HUD with tap cycling and iconography placeholder.
- [x] Build a pause menu with resume/settings/exit and wire it into the game loop.
- [x] Create a main menu scene with start game / options / credits flow.

## World Building
- [x] Expand road generator to include corners, T-junctions, roundabouts, and alleyways (new tile metadata + renderer support).
- [x] Add sidewalks/curbs variation, crosswalks at intersections, and traffic lights props (with animation and proper placement).
- [x] Scatter vegetation and street furniture (trees, lamp posts, trash bins, benches) with deterministic seeding.
- [x] Create varied city layout with different districts (downtown, residential, industrial, parks) instead of uniform grid.
- [x] Improve building extrusion to show façades, roof details, rooftop props, and per-height color ramps.
- [x] Introduce water tiles (rivers/canals) and bridges connecting blocks.

## Art & Audio
- [x] Replace the placeholder sprite with a custom player character (idle/walk animations in four directions).
- [ ] Design GTA-inspired vehicle and pedestrian sprites.
- [ ] Add ambient city soundscape and SFX hooks for movement, pickups, and UI.
- [x] Implement day/night cycle with palette shifts and dynamic lighting accents.
- [x] Fix vehicle controls: acceleration with forward arrow, brake with backward arrow or spacebar, steering with left/right arrows.
- [x] Add speedometer HUD when player is in vehicle (replace weapon selector).
- [x] Improve vehicle acceleration and handling physics.

## Combat & Wanted System
- [x] Implement basic shooting mechanics (projectiles, hit detection, damage).
- [x] Add weapon functionality (different weapons, ammo system, weapon switching).
- [ ] Add ammo pickups and weapon pickups in the world.
- [ ] Create wanted level system that increases when player commits crimes.
- [ ] Add police vehicles that chase player when wanted level is high.
- [ ] Implement NPC reactions to player actions (flee from gunfire, call police).
- [ ] Add health regeneration/pickup system.

## Advanced Gameplay
- [ ] Implement vehicle damage system (visual damage, health, explosions).
- [ ] Add mission system with objectives and rewards.
- [ ] Create different pedestrian types (civilians, police, gang members).
- [ ] Implement basic AI for police pursuit (pathfinding, ramming).
- [ ] Add weapon shops where player can buy/upgrade weapons.
- [ ] Create garage/parking system for saving vehicles.

## UI & UX Improvements
- [ ] Implement functional minimap showing player position, objectives, and enemies.
- [ ] Add notification system for missions, wanted level changes, and achievements.
- [ ] Create death/wasted screen with respawn mechanic.
- [ ] Add settings menu (sound volume, controls customization, graphics quality).
- [ ] Implement on-screen tutorial for first-time players.

## Tooling & Extensibility
- [x] Load city layout from external matrix-based JSON/CSV definition, with fallback to procedural generation.
- [x] Provide a simple map editor (even CLI or React web panel) to edit tile types and props.
- [x] Document sprite sheet specifications and pipeline for adding new assets.
- [ ] Create automated tests for map generation, collision resolution, and animation state machine.
- [ ] Add mission editor for creating custom objectives and triggers.

## Polish & Performance
- [ ] Profile rendering on low-end devices; add tile batching and memoisation where necessary.
- [x] Expose debug overlays (FPS counter, collision boxes, tile coordinates).
- [x] Add save/load of player progress and world state.
- [x] Prepare CI script that runs TypeScript checks and linting on push.
- [ ] Optimize collision detection for large numbers of entities.
- [ ] Add particle effects for explosions, muzzle flash, and tire smoke.

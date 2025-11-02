# GTA Engine

Top-down GTA 2-inspired prototype built with Expo and React Native. The engine renders a tile-based city, animates a player avatar, and handles virtual joystick input for touch devices.

## Quick start
- `npm install` (or `yarn install`) to install dependencies.
- `npm start` to launch the Expo development server.
- Use the Expo Go app or a simulator to open the project. The renderer adapts to native and web targets automatically.

## Project layout
- `App.tsx` – boots the game loop, locks landscape orientation, and wires input from the virtual joystick.
- `src/components/GameRenderer.tsx` – projects world data into screen space and renders the scene (Skia on native, DOM fallback on web).
- `src/systems/GameLoop.ts` – fixed-timestep update of the player and camera.
- `src/utils/CityMap.ts` – procedural GTA-style block generator (roads, sidewalks, buildings).
- `src/entities/Player.ts` – movement physics plus sprite animation state machine.
- `docs/architecture.md` – deeper overview of coordinates, rendering, and extension points.

## Contributing hints
- Keep any new tile types lightweight; add rendering support in both Skia and web branches of `GameRenderer`.
- Reuse the helpers in `src/utils/Isometric.ts` when projecting world coordinates.
- When tweaking visuals, test on web (`npm run web`) and native to confirm parity.


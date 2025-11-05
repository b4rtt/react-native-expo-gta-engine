# Sprite Sheet Specifications and Pipeline

This document describes the sprite sheet format, conventions, and how to add new sprite assets to the GTA Engine.

## Overview

The GTA Engine uses a grid-based sprite sheet system where sprites are arranged in a regular grid. Each sprite frame is extracted from the sheet using row/column coordinates.

## Current Sprite Sheets

### Character Sprite Sheet (`character-spritesheet.png`)

**Location:** `assets/character-spritesheet.png`

**Dimensions:**
- Total size: 192x96 pixels
- Grid: 6 columns × 3 rows
- Sprite size: 32×32 pixels per frame

**Layout:**

```
Row 0 (Top):    [Right 0] [Left 1] [Left 2] [Right 3] [Left 4] [Left 5]
Row 1 (Middle): [Back 0]  [Right 1] [Right 2] [Right 3] [Left 4] [Empty]
Row 2 (Bottom): [Back 0]  [Back 1]  [Front 2] [Front 3] [Idle 4] [Idle 5]
```

**Frame Mapping:**

| Direction | Animation Type | Frames | Sprite Coordinates |
|-----------|----------------|--------|-------------------|
| Right     | Walk           | 2      | Row 0, Cols 0, 3  |
| Left      | Walk           | 2      | Row 0, Cols 0, 3 (mirrored) |
| Front     | Walk           | 2      | Row 2, Cols 2-3   |
| Back      | Walk           | 3      | Row 1 Col 0, Row 2 Cols 0-1 |
| Any       | Idle           | 2      | Row 2, Cols 4-5   |

**Notes:**
- Left direction uses the same sprites as right but horizontally mirrored
- Back walk animation spans multiple rows (row 1 and row 2)
- Idle animation is shared across all directions

## Sprite Sheet Conventions

### File Format
- **Format:** PNG with transparency support
- **Color depth:** 32-bit RGBA (supports transparency)
- **Naming:** `{entity-type}-spritesheet.png` (e.g., `character-spritesheet.png`, `vehicle-spritesheet.png`)

### Grid Layout
- All sprites in a sheet must be the same size
- Sprites are arranged in a regular grid
- Grid positions are 0-indexed (starting from 0)
- Empty cells are allowed but should be at the end of rows

### Sprite Size
- **Standard size:** 32×32 pixels
- Sprites should be centered within their cells
- Pixel art style recommended for GTA 2 aesthetic
- Avoid sub-pixel rendering by using integer pixel coordinates

### Animation Conventions
- **Idle animations:** Usually 2 frames, slower animation speed (2 fps)
- **Walk/Run animations:** 2-4 frames, faster animation speed (8 fps)
- **Frame order:** Left to right, top to bottom
- Animations should loop seamlessly

## Adding New Sprite Sheets

### Step 1: Create the Sprite Sheet Image

1. Create a PNG image with dimensions that match your grid:
   - Width = `spriteWidth × columns`
   - Height = `spriteHeight × rows`
   - Example: 6 columns × 3 rows × 32px = 192×96 pixels

2. Arrange sprites in a grid:
   - Fill sprites from left to right, top to bottom
   - Keep sprites centered within their cells
   - Use transparency for empty space

3. Save as `{entity-type}-spritesheet.png` in `assets/` directory

### Step 2: Update Constants

Add sprite sheet configuration in the relevant utility file (e.g., `src/utils/SpriteAnimation.ts`):

```typescript
// Example: Vehicle sprite sheet
export const VEHICLE_SPRITE_SIZE = 32;
export const VEHICLE_SPRITESHEET_COLS = 4;
export const VEHICLE_SPRITESHEET_ROWS = 2;
```

### Step 3: Create Coordinate Mapping Function

Create a function to map animation states to sprite coordinates:

```typescript
export const getVehicleSpriteCoords = (
  vehicleType: VehicleType,
  rotation: number,
  frame: number
): { col: number; row: number } => {
  // Map vehicle type and rotation to grid coordinates
  // Return { col, row } based on your sprite sheet layout
};
```

### Step 4: Create/Update Render Component

Create a sprite component similar to `PlayerSprite.tsx`:

```typescript
import { useImage } from '@shopify/react-native-skia';
import { Image, Group } from '@shopify/react-native-skia';

export const VehicleSprite: React.FC<VehicleSpriteProps> = ({
  vehicle,
  screenX,
  screenY,
}) => {
  const spritesheet = useImage(require('../../assets/vehicle-spritesheet.png'));
  const { col, row } = getVehicleSpriteCoords(vehicle.type, vehicle.rotation, 0);
  
  const srcX = col * VEHICLE_SPRITE_SIZE;
  const srcY = row * VEHICLE_SPRITE_SIZE;
  
  // ... rendering logic
};
```

### Step 5: Update Game Renderer

Add the new sprite component to `GameRenderer.tsx`:

```typescript
case 'vehicle': {
  const { vehicle, screenX, screenY } = item.vehicle;
  return (
    <VehicleSprite
      key={`vehicle-${vehicle.id}-${index}`}
      vehicle={vehicle}
      screenX={screenX}
      screenY={screenY}
    />
  );
}
```

## Planned Sprite Sheets

### NPC Sprite Sheet (Not Yet Implemented)

**Proposed Layout:**
- Multiple NPC types (pedestrians)
- Each type: 4 directions × 2 animation types (idle/walk) × 2 frames
- Suggested grid: 8 columns × 4 rows (32 sprites total)
- Size: 256×128 pixels

**Frame Structure:**
- Row 0-1: NPC Type 1 (Right, Left, Front, Back)
- Row 2-3: NPC Type 2 (Right, Left, Front, Back)
- Each direction: 2 frames (idle or walk)

### Vehicle Sprite Sheet (Not Yet Implemented)

**Proposed Layout:**
- Multiple vehicle types (car, truck, bus, etc.)
- Each type: 8 rotation angles × 1 frame
- Suggested grid: 8 columns × 4 rows (32 vehicles total)
- Size: 256×128 pixels

**Frame Structure:**
- Columns 0-7: Rotation angles (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
- Rows: Different vehicle types

## Best Practices

### Design Guidelines
1. **Consistency:** Keep sprite sizes consistent across sheets
2. **Alignment:** Center sprites within their cells
3. **Padding:** Add 1-2px padding around sprites to prevent bleeding
4. **Transparency:** Use alpha channel for clean edges
5. **Style:** Match GTA 2 pixel art aesthetic

### Performance
1. **Batching:** Group sprites by sheet to minimize texture swaps
2. **Caching:** Load sprite sheets once and reuse
3. **Size:** Keep sheets reasonable (max 512×512 pixels recommended)
4. **Optimization:** Use compressed PNG formats when possible

### Code Organization
1. **Constants:** Define sprite sheet constants in dedicated files
2. **Mapping:** Create clear mapping functions for coordinate calculation
3. **Types:** Use TypeScript types for sprite state and animations
4. **Documentation:** Document any special cases or quirks

## Troubleshooting

### Sprite Bleeding
- **Problem:** Sprites show pixels from adjacent cells
- **Solution:** Add padding between sprites or adjust clipping rectangles

### Animation Jitter
- **Problem:** Animation frames don't align properly
- **Solution:** Ensure all frames are same size and properly aligned in grid

### Wrong Sprite Displayed
- **Problem:** Incorrect sprite shown for animation state
- **Solution:** Verify coordinate mapping function matches sprite sheet layout

### Performance Issues
- **Problem:** Slow rendering with many sprites
- **Solution:** Use sprite batching, reduce sprite size, or optimize sheet layout

## Tools and Resources

### Recommended Tools
- **Aseprite:** Pixel art editor with sprite sheet export
- **Pyxel Edit:** Tile-based sprite editor
- **Photoshop/GIMP:** With grid guides for sprite arrangement
- **Sprite Sheet Packer:** Online tools for organizing sprites

### Useful Resources
- [Aseprite Documentation](https://www.aseprite.org/docs/)
- [Sprite Sheet Best Practices](https://www.codeandweb.com/texturepacker/documentation)
- [GTA 2 Sprite References](https://gta.fandom.com/wiki/GTA_2)

## Implementation Status

- [x] Character sprite sheet implemented
- [ ] NPC sprite sheet (planned)
- [ ] Vehicle sprite sheet (planned)
- [ ] Prop sprite sheet (optional)
- [ ] UI icon sprite sheet (optional)

## Notes

- The current implementation uses React Native Skia for rendering on mobile and standard React Native Image for web
- Sprite coordinates are 0-indexed (first sprite is at col=0, row=0)
- Horizontal mirroring is used for left-facing sprites to save sprite sheet space
- Animation frame timing is controlled by `ANIMATION_SPEEDS` constants


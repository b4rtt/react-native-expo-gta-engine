# City Layout Format Documentation

The GTA Engine supports loading city layouts from external JSON or CSV files. This allows you to design custom city layouts instead of relying solely on procedural generation.

## JSON Format

### Simple Array Format
```json
[
  ["g", "g", "r", "r", "g"],
  ["g", "p", "r", "r", "p"],
  ["r", "r", "r", "r", "r"],
  ["g", "p", "r", "r", "p"],
  ["g", "g", "r", "r", "g"]
]
```

### Object Format
```json
{
  "width": 5,
  "height": 5,
  "layout": [
    ["g", "g", "r", "r", "g"],
    ["g", "p", "r", "r", "p"],
    ["r", "r", "r", "r", "r"],
    ["g", "p", "r", "r", "p"],
    ["g", "g", "r", "r", "g"]
  ]
}
```

## CSV Format

```csv
g,g,r,r,g
g,p,r,r,p
r,r,r,r,r
g,p,r,r,p
g,g,r,r,g
```

## Tile Type Codes

- `g` or `G` = **Grass** - Open green space
- `p` or `P` = **Pavement** - Sidewalk/curb area
- `r` or `R` = **Road** - Street/traffic area
- `b` or `B` = **Building** - Default height building (1 floor)
- `b1`, `b2`, `b3`, etc. = **Building** with specific height (1, 2, 3 floors...)
- `w` or `W` = **Water** - River/canal tile
- `x` or `X` = **Bridge** - Road that crosses water

## Examples

### Simple Grid City
```json
[
  ["r", "r", "r", "r"],
  ["r", "b", "b", "r"],
  ["r", "b", "b", "r"],
  ["r", "r", "r", "r"]
]
```

### City with River
```json
[
  ["g", "g", "r", "r", "g", "g"],
  ["g", "p", "r", "r", "p", "g"],
  ["w", "w", "x", "x", "w", "w"],
  ["g", "p", "r", "r", "p", "g"],
  ["g", "g", "r", "r", "g", "g"]
]
```

### City with Tall Buildings
```json
[
  ["r", "r", "r", "r"],
  ["r", "b3", "b5", "r"],
  ["r", "b2", "b4", "r"],
  ["r", "r", "r", "r"]
]
```

## Usage

The system automatically tries to load from JSON/CSV if provided, otherwise falls back to procedural generation:

```typescript
// In GameLoop constructor:
const cityData = loadCityLayout(jsonData, csvData, defaultWidth, defaultHeight);
```

## Notes

- Road connections are automatically calculated for road and bridge tiles
- Buildings can have heights from 1-9 floors (b1 to b9)
- The layout will be validated and invalid tiles default to grass
- All rows must have the same width (will be padded/trimmed automatically)


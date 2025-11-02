import React from 'react';
import { Path, Group, Skia, Circle, RoundedRect } from '@shopify/react-native-skia';
import { Tile } from '../types/Game';
import { TILE_SIZE } from '../utils/Isometric';

export interface RoadNeighbors {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

interface IsometricRoadProps {
  tile: Tile;
  screenX: number;
  screenY: number;
  neighbors: RoadNeighbors;
}

const shouldHaveTrafficLight = (tile: Tile, neighbors: RoadNeighbors): boolean => {
  if (tile.type !== 'road') return false;
  
  // Count road connections
  const connectionCount = [neighbors.left, neighbors.right, neighbors.top, neighbors.bottom].filter(Boolean).length;
  
  // Traffic lights at 4-way intersections (major crossroads)
  if (connectionCount === 4) {
    // Use deterministic seeding - place traffic lights at some intersections
    const seed = tile.x * 73 + tile.y * 37;
    return seed % 3 === 0; // ~33% of 4-way intersections
  }
  
  return false;
};

const getTrafficLightColor = (tileX: number, tileY: number, corner: number): string => {
  const now = Date.now();
  const seed = (tileX * 73 + tileY * 37 + corner * 11) % 1000;
  const cycleOffset = seed * 12; // Each light has different offset
  const cycleTime = (now + cycleOffset) % 12000; // 12 second cycle
  
  // Red for 6s, Yellow for 2s, Green for 4s
  if (cycleTime < 6000) return '#ff3333'; // Red
  if (cycleTime < 8000) return '#ffcc00'; // Yellow
  return '#33ff33'; // Green
};

export const IsometricRoad: React.FC<IsometricRoadProps> = ({
  tile,
  screenX,
  screenY,
  neighbors,
}) => {
  // GTA 2 uses rectangular tiles (NOT diamond shapes)
  const tileWidth = TILE_SIZE;
  const tileHeight = TILE_SIZE;
  
  // Use roadConnections if available, otherwise fallback to neighbors
  const left = tile.roadConnections?.west ?? neighbors.left;
  const right = tile.roadConnections?.east ?? neighbors.right;
  const top = tile.roadConnections?.north ?? neighbors.top;
  const bottom = tile.roadConnections?.south ?? neighbors.bottom;
  
  // Count connections to determine road type
  const connectionCount = [left, right, top, bottom].filter(Boolean).length;
  
  // Create road tile path (rectangle - GTA 2 style)
  const roadPath = Skia.Path.Make();
  roadPath.addRect({
    x: screenX,
    y: screenY,
    width: tileWidth,
    height: tileHeight,
  });
  
  // Create road markings based on connections
  const markings: typeof roadPath[] = [];
  const centerX = screenX + tileWidth / 2;
  const centerY = screenY + tileHeight / 2;
  
  // Determine road type
  const isHorizontal = (left || right) && !top && !bottom;
  const isVertical = (top || bottom) && !left && !right;
  const isCorner = connectionCount === 2 && (
    (left && top) || (left && bottom) || (right && top) || (right && bottom)
  );
  
  // Crosswalk logic
  const isHorizontalRoad = left && right && !top && !bottom;
  const isVerticalRoad = top && bottom && !left && !right;
  
  const hasIntersectionNearby = connectionCount === 2 && (
    (isHorizontalRoad && (tile.x + 1) % 6 === 0) ||
    (isHorizontalRoad && (tile.x - 1) % 6 === 0) ||
    (isVerticalRoad && (tile.y + 1) % 6 === 0) ||
    (isVerticalRoad && (tile.y - 1) % 6 === 0)
  );
  
  const isCrosswalkHorizontal = isHorizontalRoad && hasIntersectionNearby;
  const isCrosswalkVertical = isVerticalRoad && hasIntersectionNearby;
  
  // Horizontal road markings (shorter lines)
  if (isHorizontal && !isCrosswalkHorizontal) {
    const markingPath = Skia.Path.Make();
    markingPath.moveTo(screenX + tileWidth * 0.25, centerY);
    markingPath.lineTo(screenX + tileWidth * 0.75, centerY);
    markings.push(markingPath);
  }
  
  // Vertical road markings (shorter lines)
  if (isVertical && !isCrosswalkVertical) {
    const markingPath = Skia.Path.Make();
    markingPath.moveTo(centerX, screenY + tileHeight * 0.25);
    markingPath.lineTo(centerX, screenY + tileHeight * 0.75);
    markings.push(markingPath);
  }
  
  // Corner markings (arcs on inside of turn)
  if (isCorner) {
    const arcPath = Skia.Path.Make();
    const arcSize = tileWidth * 0.25;
    const arcRadius = tileWidth * 0.15;
    
    if (left && top) {
      // North-West turn - arc in SE quadrant
      arcPath.moveTo(screenX + tileWidth * 0.75 - arcRadius, screenY + tileHeight * 0.75);
      arcPath.lineTo(screenX + tileWidth * 0.75, screenY + tileHeight * 0.75);
      arcPath.lineTo(screenX + tileWidth * 0.75, screenY + tileHeight * 0.75 - arcRadius);
    } else if (right && top) {
      // North-East turn - arc in SW quadrant
      arcPath.moveTo(screenX + tileWidth * 0.25 + arcRadius, screenY + tileHeight * 0.75);
      arcPath.lineTo(screenX + tileWidth * 0.25, screenY + tileHeight * 0.75);
      arcPath.lineTo(screenX + tileWidth * 0.25, screenY + tileHeight * 0.75 - arcRadius);
    } else if (left && bottom) {
      // South-West turn - arc in NE quadrant
      arcPath.moveTo(screenX + tileWidth * 0.75 - arcRadius, screenY + tileHeight * 0.25);
      arcPath.lineTo(screenX + tileWidth * 0.75, screenY + tileHeight * 0.25);
      arcPath.lineTo(screenX + tileWidth * 0.75, screenY + tileHeight * 0.25 + arcRadius);
    } else if (right && bottom) {
      // South-East turn - arc in NW quadrant
      arcPath.moveTo(screenX + tileWidth * 0.25 + arcRadius, screenY + tileHeight * 0.25);
      arcPath.lineTo(screenX + tileWidth * 0.25, screenY + tileHeight * 0.25);
      arcPath.lineTo(screenX + tileWidth * 0.25, screenY + tileHeight * 0.25 + arcRadius);
    }
    
    markings.push(arcPath);
  }
  
  // Crosswalk paths
  const crosswalkPaths: typeof roadPath[] = [];
  
  if (isCrosswalkHorizontal) {
    // Horizontal crosswalk stripes (50% width, centered)
    for (let i = 0; i < 6; i++) {
      const stripePath = Skia.Path.Make();
      const stripeTop = screenY + tileHeight * 0.2 + i * (tileHeight * 0.6 / 6);
      stripePath.addRect({
        x: screenX + tileWidth * 0.25,
        y: stripeTop,
        width: tileWidth * 0.5,
        height: tileHeight * 0.08,
      });
      crosswalkPaths.push(stripePath);
    }
  }
  
  if (isCrosswalkVertical) {
    // Vertical crosswalk stripes (50% height, centered)
    for (let i = 0; i < 6; i++) {
      const stripePath = Skia.Path.Make();
      const stripeLeft = screenX + tileWidth * 0.2 + i * (tileWidth * 0.6 / 6);
      stripePath.addRect({
        x: stripeLeft,
        y: screenY + tileHeight * 0.25,
        width: tileWidth * 0.08,
        height: tileHeight * 0.5,
      });
      crosswalkPaths.push(stripePath);
    }
  }
  
  // Traffic lights
  const hasTrafficLight = shouldHaveTrafficLight(tile, neighbors);
  const trafficLights: Array<{ x: number; y: number; color: string }> = [];
  
  if (hasTrafficLight) {
    const lightSize = 6;
    const offset = tileWidth * 0.12;
    
    // 4 traffic lights at corners
    trafficLights.push(
      { x: screenX + offset, y: screenY + offset, color: getTrafficLightColor(tile.x, tile.y, 0) },
      { x: screenX + tileWidth - offset, y: screenY + offset, color: getTrafficLightColor(tile.x, tile.y, 1) },
      { x: screenX + offset, y: screenY + tileHeight - offset, color: getTrafficLightColor(tile.x, tile.y, 2) },
      { x: screenX + tileWidth - offset, y: screenY + tileHeight - offset, color: getTrafficLightColor(tile.x, tile.y, 3) }
    );
  }
  
  return (
    <Group>
      {/* Road base with slightly darker color for GTA 2 style */}
      <Path path={roadPath} color="#2a2a2a" />
      
      {/* Crosswalk stripes in white */}
      {crosswalkPaths.map((path, i) => (
        <Path key={`crosswalk-${i}`} path={path} color="rgba(255,255,255,0.8)" />
      ))}
      
      {/* Road markings in yellow */}
      {markings.map((marking, i) => (
        <Path key={`marking-${i}`} path={marking} color="#e0c030" style="stroke" strokeWidth={2} />
      ))}
      
      {/* Traffic lights */}
      {trafficLights.map((light, i) => (
        <Group key={`light-${i}`}>
          {/* Pole */}
          <RoundedRect
            x={light.x - 1.5}
            y={light.y - 8}
            width={3}
            height={10}
            r={1.5}
            color="#333333"
          />
          {/* Light box */}
          <RoundedRect
            x={light.x - 3}
            y={light.y - 10}
            width={6}
            height={8}
            r={1}
            color="#1a1a1a"
          />
          {/* Active light with glow */}
          <Circle
            cx={light.x}
            cy={light.y - 6}
            r={2.5}
            color={light.color}
            opacity={0.3}
          >
            <Circle
              cx={light.x}
              cy={light.y - 6}
              r={1.5}
              color={light.color}
            />
          </Circle>
        </Group>
      ))}
    </Group>
  );
};

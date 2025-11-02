import { Vector2 } from '../types/Game';

export const add = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

export const subtract = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

export const multiply = (v: Vector2, scalar: number): Vector2 => ({
  x: v.x * scalar,
  y: v.y * scalar,
});

export const length = (v: Vector2): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y);
};

export const normalize = (v: Vector2): Vector2 => {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
};

export const distance = (a: Vector2, b: Vector2): number => {
  return length(subtract(a, b));
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};


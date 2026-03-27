export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export const lerp = (from: number, to: number, alpha: number): number =>
  from + (to - from) * alpha

export const damp = (
  current: number,
  target: number,
  smoothing: number,
  deltaTime: number,
): number => lerp(current, target, 1 - Math.exp(-smoothing * deltaTime))

export const remapClamped = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => {
  if (inMax === inMin) {
    return outMin
  }

  const progress = clamp((value - inMin) / (inMax - inMin), 0, 1)
  return lerp(outMin, outMax, progress)
}

export const easeInOutCubic = (value: number): number =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2

export const easeOutQuint = (value: number): number => 1 - Math.pow(1 - value, 5)

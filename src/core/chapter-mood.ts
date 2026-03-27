import { gsap } from 'gsap'

export const blendStyleValue = (primary: string, secondary: string, mix: number): string => {
  if (mix <= 0) {
    return primary
  }

  if (mix >= 1) {
    return secondary
  }

  return gsap.utils.interpolate(primary, secondary, mix)
}

export const blendStyleMap = (
  primary: Record<string, string>,
  secondary: Record<string, string> | null,
  mix: number,
): Record<string, string> => {
  if (!secondary || mix <= 0) {
    return primary
  }

  const result: Record<string, string> = {}

  for (const key of Object.keys(primary)) {
    result[key] = blendStyleValue(primary[key], secondary[key] ?? primary[key], mix)
  }

  return result
}

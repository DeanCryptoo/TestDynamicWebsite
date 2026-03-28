import type {
  CameraPreset,
  ChapterDefinition,
  ChapterTiming,
  EffectPlacement,
  MaterialPreset,
  PropPlacement,
  SceneMoodPreset,
  ThemeTokens,
} from './types'

export const createTheme = (overrides: Partial<ThemeTokens>): ThemeTokens => ({
  accent: '#8cf0ff',
  accentSoft: 'rgba(140, 240, 255, 0.14)',
  bgTop: '#0f151a',
  bgMid: '#0a1015',
  bgBottom: '#070b10',
  glowA: 'rgba(140, 240, 255, 0.18)',
  glowB: 'rgba(255, 255, 255, 0.08)',
  glowC: 'rgba(255, 190, 130, 0.14)',
  washA: 'rgba(140, 240, 255, 0.14)',
  washB: 'rgba(255, 255, 255, 0.07)',
  washC: 'rgba(255, 190, 130, 0.12)',
  ink: '#f5efe7',
  muted: 'rgba(245, 239, 231, 0.72)',
  line: 'rgba(245, 239, 231, 0.14)',
  card: 'rgba(9, 11, 14, 0.54)',
  cardStrong: 'rgba(8, 10, 14, 0.78)',
  shadow: 'rgba(0, 0, 0, 0.42)',
  gridLine: 'rgba(255, 255, 255, 0.08)',
  grainOpacity: '0.18',
  ...overrides,
})

export const createMood = (overrides: Partial<SceneMoodPreset>): SceneMoodPreset => ({
  ambientIntensity: 0.68,
  fillColor: '#6be7ff',
  fogColor: '#0b1016',
  fogDensity: 0.03,
  keyColor: '#fff2d8',
  keyIntensity: 1.05,
  rimColor: '#7cdfff',
  rimIntensity: 0.92,
  ...overrides,
})

export const createCamera = (overrides: Partial<CameraPreset>): CameraPreset => ({
  anchor: [0, 0, 0],
  cameraOffset: [0, 0.2, 8.4],
  cameraTravel: [0, 0, -2.4],
  groupDrift: [0, 0, -0.8],
  groupRotation: [0, 0, 0],
  lookOffset: [0, 0.1, 0],
  lookTravel: [0, 0, -1.5],
  pointerParallax: [0.32, 0.22, 0],
  ...overrides,
})

export const createTiming = (overrides: Partial<ChapterTiming> = {}): ChapterTiming => ({
  fadeInEnd: 0.24,
  fadeInStart: 0.04,
  fadeOutEnd: 0.99,
  fadeOutStart: 0.82,
  progressEnd: 1,
  progressStart: 0,
  staggerSpan: 0.68,
  staggerSpread: 0.22,
  tailCap: 0.9,
  tailStart: 0.68,
  ...overrides,
})

export const createMaterial = (overrides: Partial<MaterialPreset>): MaterialPreset => ({
  base: '#f0ebe1',
  emissive: '#1d1b18',
  roughness: 0.32,
  metalness: 0.56,
  clearcoat: 0.44,
  clearcoatRoughness: 0.36,
  emissiveIntensity: 0.18,
  opacity: 1,
  ...overrides,
})

export const createLinePlacements = (
  count: number,
  options: {
    xFrom: number
    xTo: number
    y?: number
    yCurve?: number
    zFrom?: number
    zTo?: number
    scale?: number
    scaleStep?: number
  },
): PropPlacement[] =>
  Array.from({ length: count }, (_, index) => {
    const ratio = count <= 1 ? 0.5 : index / (count - 1)
    const centered = ratio - 0.5
    return {
      x: options.xFrom + (options.xTo - options.xFrom) * ratio,
      y: (options.y ?? 0) + centered * centered * (options.yCurve ?? 0),
      z: (options.zFrom ?? 0) + ((options.zTo ?? 0) - (options.zFrom ?? 0)) * ratio,
      scale: (options.scale ?? 1) - index * (options.scaleStep ?? 0),
    }
  })

export const createArcPlacements = (
  count: number,
  options: {
    centerX?: number
    centerY?: number
    centerZ?: number
    radiusX: number
    radiusY: number
    scale?: number
    rotY?: number
    start?: number
    end?: number
  },
): PropPlacement[] =>
  Array.from({ length: count }, (_, index) => {
    const ratio = count <= 1 ? 0.5 : index / (count - 1)
    const angle = (options.start ?? -0.8) + ((options.end ?? 0.8) - (options.start ?? -0.8)) * ratio
    return {
      x: (options.centerX ?? 0) + Math.cos(angle * Math.PI) * options.radiusX,
      y: (options.centerY ?? 0) + Math.sin(angle * Math.PI) * options.radiusY,
      z: (options.centerZ ?? 0) + Math.cos(angle * Math.PI * 0.6) * 0.4,
      scale: options.scale ?? 1,
      rotY: (options.rotY ?? 0) + angle * 0.34,
    }
  })

export const createBurstPlacements = (
  count: number,
  options: {
    centerX?: number
    centerY?: number
    centerZ?: number
    radius: number
    scale?: number
  },
): PropPlacement[] =>
  Array.from({ length: count }, (_, index) => {
    const angle = (index / Math.max(count, 1)) * Math.PI * 2
    const radius = options.radius * (0.62 + (index % 3) * 0.18)
    return {
      x: (options.centerX ?? 0) + Math.cos(angle) * radius,
      y: (options.centerY ?? 0) + Math.sin(angle) * radius * 0.36,
      z: (options.centerZ ?? 0) - index * 0.24,
      scale: (options.scale ?? 1) * (1 - index * 0.03),
      rotY: angle,
      rotZ: angle * 0.22,
    }
  })

export const createEffectLine = (
  count: number,
  options: {
    xFrom: number
    xTo: number
    y?: number
    z?: number
    scale?: number
  },
): EffectPlacement[] =>
  Array.from({ length: count }, (_, index) => {
    const ratio = count <= 1 ? 0.5 : index / (count - 1)
    return {
      x: options.xFrom + (options.xTo - options.xFrom) * ratio,
      y: options.y ?? 0,
      z: options.z ?? 0,
      scale: options.scale ?? 1,
    }
  })

export const createEffectArc = (
  count: number,
  options: {
    radiusX: number
    radiusY: number
    centerX?: number
    centerY?: number
    centerZ?: number
    scale?: number
  },
): EffectPlacement[] =>
  Array.from({ length: count }, (_, index) => {
    const angle = -0.8 + (index / Math.max(count - 1, 1)) * 1.6
    return {
      x: (options.centerX ?? 0) + Math.cos(angle * Math.PI) * options.radiusX,
      y: (options.centerY ?? 0) + Math.sin(angle * Math.PI) * options.radiusY,
      z: (options.centerZ ?? 0),
      scale: options.scale ?? 1,
      rotX: Math.PI * 0.5,
    }
  })

export const createLauncherPreview = (ctaLabel: string, summary: string, tags: string[]) => ({
  ctaLabel,
  summary,
  tags,
})

export const withClasses = (chapter: ChapterDefinition, ...classes: string[]): ChapterDefinition => ({
  ...chapter,
  layout: {
    ...chapter.layout,
    classes: [...(chapter.layout.classes ?? []), ...classes],
  },
})

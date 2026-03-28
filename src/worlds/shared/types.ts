export type DeviceTier = 'desktop' | 'tablet' | 'mobileLite'

export interface ThemeTokens {
  accent: string
  accentSoft: string
  bgTop: string
  bgMid: string
  bgBottom: string
  glowA: string
  glowB: string
  glowC: string
  washA: string
  washB: string
  washC: string
  ink: string
  muted: string
  line: string
  card: string
  cardStrong: string
  shadow: string
  gridLine: string
  grainOpacity: string
}

export interface DeviceProfile {
  enableBlur: boolean
  enableOverlay: boolean
  enablePointer: boolean
  hazeCount: number
  heroLightIntensity: number
  maxEffectInstances: number
  maxPropInstances: number
  pixelRatioCap: number
  sceneSmoothing: {
    enter: number
    exit: number
  }
}

export interface DevicePolicy {
  desktop?: Partial<DeviceProfile>
  tablet?: Partial<DeviceProfile>
  mobileLite?: Partial<DeviceProfile>
}

export interface ChapterTiming {
  fadeInEnd?: number
  fadeInStart?: number
  fadeOutEnd?: number
  fadeOutStart?: number
  progressEnd?: number
  progressStart?: number
  staggerSpan?: number
  staggerSpread?: number
  tailCap?: number
  tailStart?: number
}

export interface SceneMoodPreset {
  ambientIntensity: number
  fillColor: string
  fogColor: string
  fogDensity: number
  keyColor: string
  keyIntensity: number
  rimColor: string
  rimIntensity: number
}

export interface CameraPreset {
  anchor: [number, number, number]
  cameraOffset: [number, number, number]
  cameraTravel: [number, number, number]
  groupDrift?: [number, number, number]
  groupRotation?: [number, number, number]
  lookOffset: [number, number, number]
  lookTravel?: [number, number, number]
  pointerParallax?: [number, number, number]
}

export interface PropPlacement {
  rotX?: number
  rotY?: number
  rotZ?: number
  scale: number
  x: number
  y: number
  z: number
}

export interface MaterialPreset {
  accent?: string
  base: string
  clearcoat?: number
  clearcoatRoughness?: number
  emissive: string
  emissiveIntensity?: number
  metalness?: number
  opacity?: number
  roughness?: number
  specularIntensity?: number
}

export interface QualityRules {
  hideOn?: DeviceTier[]
  maxInstances?: Partial<Record<DeviceTier, number>>
  scaleMultiplier?: Partial<Record<DeviceTier, number>>
}

export type ModelKey =
  | 'microphone'
  | 'balloon'
  | 'bottle'
  | 'discoBall'
  | 'martini'
  | 'sphere'
  | 'orb'
  | 'box'
  | 'plate'
  | 'cone'
  | 'ring'
  | 'knot'
  | 'shard'

export type MotionPresetName =
  | 'float'
  | 'orbit'
  | 'spiral'
  | 'fan'
  | 'drift'
  | 'burst'
  | 'stage-rise'
  | 'swarm'
  | 'hang'
  | 'dissolve'

export interface PropCastEntry {
  materialPreset: MaterialPreset
  model: ModelKey
  motionPreset: MotionPresetName
  placements: PropPlacement[]
  qualityRules?: QualityRules
  role: string
}

export type EffectPresetType =
  | 'pulse-ring'
  | 'spark-burst'
  | 'ribbon-trail'
  | 'light-cone'
  | 'hero-glow-shell'
  | 'depth-haze-plane'
  | 'dust-field'

export interface EffectPlacement {
  rotX?: number
  rotY?: number
  rotZ?: number
  scale?: number
  x: number
  y: number
  z: number
}

export interface EffectPreset {
  color: string
  intensity?: number
  placements: EffectPlacement[]
  qualityRules?: QualityRules
  secondaryColor?: string
  size?: number
  type: EffectPresetType
}

export interface OverlayCardDefinition {
  body: string
  label: string
  title: string
}

export interface OverlayDefinition {
  cards: OverlayCardDefinition[]
  handoffChapter?: string
  triggerChapter: string
  type: 'card-stack'
}

export interface LauncherPreviewDefinition {
  ctaLabel: string
  summary: string
  tags: string[]
}

export interface ChapterDefinition {
  cameraPreset: CameraPreset
  contentHtml: string
  copy?: {
    eyebrow?: string
    title?: string
  }
  effects: EffectPreset[]
  id: string
  layout: {
    classes?: string[]
    minHeight?: string
  }
  mood: ThemeTokens
  propCast: PropCastEntry[]
  scenePreset: SceneMoodPreset
  timing: ChapterTiming
}

export interface WorldDefinition {
  chapters: ChapterDefinition[]
  chromeLabel: string
  devicePolicy?: DevicePolicy
  headerMeta: string
  id: string
  introSelector?: string
  label: string
  launcherPreview: LauncherPreviewDefinition
  overlay?: OverlayDefinition | null
  railLabel: string
  shellClassName?: string
  theme: ThemeTokens
}

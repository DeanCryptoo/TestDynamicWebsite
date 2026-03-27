import { damp, remapClamped } from './math'
import type { SectionRegistry } from './section-registry'

export interface ChapterWeightConfig<Id extends string> {
  baselines?: Partial<Record<Id, number>>
  exponents?: Partial<Record<Id, number>>
  visibilityBoost?: number
}

export interface ChapterBlendConfig {
  maxSecondaryMix?: number
  secondaryEnterEnd?: number
  secondaryEnterStart?: number
  secondaryWeight?: number
}

export interface ChapterSmoothingConfig {
  deadZone?: number
  enterSmoothing?: number
  exitSmoothing?: number
}

export interface ChapterState<Id extends string> {
  focus: Record<Id, number>
  progress: Record<Id, number>
  visibility: Record<Id, number>
  weights: Record<Id, number>
}

export interface ChapterBlendTarget<Id extends string> {
  primary: Id
  secondary: Id | null
  target: Record<Id, number>
}

export interface StaggeredTimelineConfig {
  ease?: (value: number) => number
  span?: number
  spread?: number
  windowEnd?: number
  windowStart?: number
}

export interface SoftenedTimelineConfig {
  cap?: number
  ease?: (value: number) => number
  tailStart?: number
}

export interface OrbitOffsetConfig {
  ease?: (value: number) => number
  phase?: number
  radiusX?: number
  radiusY?: number
  turns?: number
}

export interface FloatMotionConfig {
  amplitude?: number
  base?: number
  ease?: (value: number) => number
  frequency?: number
  phase?: number
  progressGain?: number
}

export interface FanOffsetConfig {
  ease?: (value: number) => number
  spread?: number
  curve?: number
}

const createRecord = <Id extends string>(ids: readonly Id[], initial: number): Record<Id, number> => {
  const record = {} as Record<Id, number>
  for (const id of ids) {
    record[id] = initial
  }
  return record
}

export const createChapterProgress = (
  progress: number,
  start = 0,
  end = 1,
  ease?: (value: number) => number,
): number => {
  const local = remapClamped(progress, start, end, 0, 1)
  return ease ? ease(local) : local
}

export const createStaggeredTimeline = (
  progress: number,
  index: number,
  count: number,
  config: StaggeredTimelineConfig = {},
): number => {
  const local = createChapterProgress(progress, config.windowStart ?? 0, config.windowEnd ?? 1)
  if (count <= 1) {
    return config.ease ? config.ease(local) : local
  }

  const span = Math.min(1, Math.max(config.span ?? 0.48, 0.04))
  const spread = Math.min(1 - span, Math.max(config.spread ?? 1 - span, 0))
  const ratio = count > 1 ? index / (count - 1) : 0
  const start = spread * ratio
  const end = Math.min(1, start + span)
  const windowed = remapClamped(local, start, end, 0, 1)

  return config.ease ? config.ease(windowed) : windowed
}

export const softenTimelineTail = (
  progress: number,
  config: SoftenedTimelineConfig = {},
): number => {
  const cap = Math.min(1, Math.max(config.cap ?? 0.86, 0))
  const tailStart = Math.min(cap, Math.max(config.tailStart ?? Math.min(cap, 0.68), 0))

  if (progress <= tailStart || cap <= tailStart) {
    return Math.min(progress, cap)
  }

  const tail = remapClamped(progress, tailStart, 1, 0, 1)
  const eased = config.ease ? config.ease(tail) : tail
  return tailStart + (cap - tailStart) * eased
}

export const createOrbitOffset = (
  progress: number,
  config: OrbitOffsetConfig = {},
): { x: number; y: number } => {
  const local = config.ease ? config.ease(progress) : progress
  const angle = ((config.phase ?? 0) + local * (config.turns ?? 1)) * Math.PI * 2

  return {
    x: Math.cos(angle) * (config.radiusX ?? 1),
    y: Math.sin(angle) * (config.radiusY ?? config.radiusX ?? 1),
  }
}

export const createFloatMotion = (
  time: number,
  progress: number,
  config: FloatMotionConfig = {},
): number => {
  const gain =
    (config.base ?? 0.6) +
    (config.progressGain ?? 0.4) * (config.ease ? config.ease(progress) : progress)
  return Math.sin(time * (config.frequency ?? 1) + (config.phase ?? 0)) * (config.amplitude ?? 1) * gain
}

export const createFanOffset = (
  progress: number,
  index: number,
  count: number,
  config: FanOffsetConfig = {},
): number => {
  if (count <= 1) {
    return 0
  }

  const local = config.ease ? config.ease(progress) : progress
  const normalized = index / (count - 1) - 0.5
  const curved =
    Math.sign(normalized) *
    Math.pow(Math.abs(normalized) * 2, Math.max(config.curve ?? 1, 0.2))

  return curved * (config.spread ?? 1) * local
}

export const collectChapterState = <Id extends string>(
  ids: readonly Id[],
  sections: SectionRegistry,
  config: ChapterWeightConfig<Id> = {},
): ChapterState<Id> => {
  const progress = createRecord(ids, 0)
  const visibility = createRecord(ids, 0)
  const focus = createRecord(ids, 0)
  const weights = createRecord(ids, 0)

  const visibilityBoost = config.visibilityBoost ?? 0.08
  let total = 0

  for (const id of ids) {
    const metrics = sections.get(id)
    progress[id] = metrics?.progress ?? 0
    visibility[id] = metrics?.visibility ?? 0
    focus[id] = metrics?.focus ?? 0

    const exponent = config.exponents?.[id] ?? 1.9
    const baseline = config.baselines?.[id] ?? 0
    const raw = Math.pow(focus[id], exponent) + visibility[id] * visibilityBoost + baseline
    weights[id] = raw
    total += raw
  }

  if (total > 0) {
    for (const id of ids) {
      weights[id] /= total
    }
  } else if (ids.length > 0) {
    weights[ids[0]] = 1
  }

  return { focus, progress, visibility, weights }
}

export const createChapterBlendTarget = <Id extends string>(
  ids: readonly Id[],
  weights: Record<Id, number>,
  config: ChapterBlendConfig = {},
): ChapterBlendTarget<Id> => {
  const sorted = [...ids].sort((left, right) => weights[right] - weights[left])
  const primary = sorted[0]
  const secondaryCandidate = sorted[1] ?? null
  const target = createRecord(ids, 0)

  if (!secondaryCandidate) {
    target[primary] = 1
    return { primary, secondary: null, target }
  }

  const pairTotal = weights[primary] + weights[secondaryCandidate]
  const secondaryGate = remapClamped(
    weights[secondaryCandidate],
    config.secondaryEnterStart ?? 0.16,
    config.secondaryEnterEnd ?? 0.38,
    0,
    1,
  )
  const secondaryMix =
    pairTotal > 0
      ? Math.min(
          (config.maxSecondaryMix ?? 0.4),
          secondaryGate * (weights[secondaryCandidate] / pairTotal) * (config.secondaryWeight ?? 1.2),
        )
      : 0

  target[primary] = 1 - secondaryMix

  if (secondaryMix > 0.025) {
    target[secondaryCandidate] = secondaryMix
    return { primary, secondary: secondaryCandidate, target }
  }

  return { primary, secondary: null, target }
}

export class ChapterBlendTracker<Id extends string> {
  private readonly ids: readonly Id[]
  private readonly state: Record<Id, number>

  constructor(ids: readonly Id[], initialId: Id) {
    this.ids = ids
    this.state = createRecord(ids, 0)
    this.state[initialId] = 1
  }

  update(target: Record<Id, number>, deltaTime: number, config: ChapterSmoothingConfig = {}): Record<Id, number> {
    let total = 0

    for (const id of this.ids) {
      const smoothing =
        target[id] > this.state[id]
          ? config.enterSmoothing ?? 6.6
          : config.exitSmoothing ?? 8.4
      this.state[id] = damp(this.state[id], target[id], smoothing, deltaTime)

      if (this.state[id] < (config.deadZone ?? 0.002)) {
        this.state[id] = 0
      }

      total += this.state[id]
    }

    if (total > 0) {
      for (const id of this.ids) {
        this.state[id] /= total
      }
    }

    return this.state
  }
}

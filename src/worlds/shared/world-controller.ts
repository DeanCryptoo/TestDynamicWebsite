import { blendStyleMap } from '../../core/chapter-mood'
import {
  ChapterBlendTracker,
  collectChapterState,
  createChapterBlendTarget,
  createStaggeredTimeline,
} from '../../core/chapter-timeline'
import { easeOutQuint, remapClamped } from '../../core/math'
import type { PointerState } from '../../core/pointer-tracker'
import type { ScrollFrame } from '../../core/smooth-scroll'
import { SectionRegistry } from '../../core/section-registry'
import type { OverlayDefinition, ThemeTokens, WorldDefinition } from './types'

interface ControllerUpdateInput {
  deltaTime: number
  pointer: PointerState
  scroll: ScrollFrame
  time: number
}

const toTokenMap = (theme: ThemeTokens): Record<string, string> => ({
  '--chapter-accent': theme.accent,
  '--chapter-accent-soft': theme.accentSoft,
  '--bg-top': theme.bgTop,
  '--bg-mid': theme.bgMid,
  '--bg-bottom': theme.bgBottom,
  '--glow-a': theme.glowA,
  '--glow-b': theme.glowB,
  '--glow-c': theme.glowC,
  '--wash-a': theme.washA,
  '--wash-b': theme.washB,
  '--wash-c': theme.washC,
  '--ink': theme.ink,
  '--muted': theme.muted,
  '--line': theme.line,
  '--card': theme.card,
  '--card-strong': theme.cardStrong,
  '--shadow': theme.shadow,
  '--grid-line': theme.gridLine,
  '--grain-opacity': theme.grainOpacity,
})

export class WorldController {
  private readonly chapterIds: string[]
  private readonly cssCache = new Map<string, string>()
  private readonly dots: HTMLElement[]
  private readonly overlayCards: HTMLElement[]
  private readonly overlayGrid: HTMLElement | null
  private readonly overlayRoot: HTMLElement | null
  private readonly overlay: OverlayDefinition | null
  private readonly root = document.documentElement
  private readonly rootStyle = this.root.style
  private readonly sections: SectionRegistry
  private readonly tracker: ChapterBlendTracker<string>
  private readonly world: WorldDefinition

  constructor(world: WorldDefinition, sections: SectionRegistry) {
    this.world = world
    this.sections = sections
    this.chapterIds = world.chapters.map((chapter) => chapter.id)
    this.tracker = new ChapterBlendTracker(this.chapterIds, this.chapterIds[0])
    this.dots = Array.from(document.querySelectorAll<HTMLElement>('[data-world-dot]'))
    this.overlay = world.overlay ?? null
    this.overlayRoot = document.querySelector<HTMLElement>('[data-world-overlay]')
    this.overlayGrid = document.querySelector<HTMLElement>('[data-world-overlay-grid]')
    this.overlayCards = Array.from(document.querySelectorAll<HTMLElement>('[data-world-overlay-card]'))

    this.applyMood(world.theme, null, 0)
  }

  update({ deltaTime, pointer, scroll, time }: ControllerUpdateInput): void {
    for (const chapter of this.world.chapters) {
      const progress = this.sections.get(chapter.id)?.progress ?? 0
      this.setRootVariable(`--chapter-${chapter.id}-progress`, progress.toFixed(4))
    }

    this.setRootVariable('--scroll-progress', scroll.progress.toFixed(4))

    const chapterState = collectChapterState(this.chapterIds, this.sections, {
      baselines: { [this.chapterIds[0]]: 0.02 },
      visibilityBoost: 0.08,
    })
    const chapterBlend = createChapterBlendTarget(this.chapterIds, chapterState.weights, {
      maxSecondaryMix: 0.42,
      secondaryEnterEnd: 0.38,
      secondaryEnterStart: 0.14,
      secondaryWeight: 1.14,
    })
    const moodWeights = this.tracker.update(chapterBlend.target, deltaTime, {
      enterSmoothing: 2.3,
      exitSmoothing: 3.1,
    })
    const primary = this.world.chapters.find((chapter) => chapter.id === chapterBlend.primary) ?? this.world.chapters[0]
    const secondary = chapterBlend.secondary
      ? this.world.chapters.find((chapter) => chapter.id === chapterBlend.secondary) ?? null
      : null
    const secondaryWeight = secondary ? moodWeights[secondary.id] : 0
    const total = moodWeights[primary.id] + secondaryWeight
    const mix = secondary && total > 0 ? secondaryWeight / total : 0

    this.root.dataset.scene = primary.id
    this.applyMood(primary.mood, secondary?.mood ?? null, mix)

    for (const dot of this.dots) {
      const dotId = dot.dataset.worldDot
      const dotIndex = this.chapterIds.findIndex((id) => id === dotId)
      const activeIndex = this.chapterIds.findIndex((id) => id === primary.id)
      dot.classList.toggle('is-active', dotId === primary.id)
      dot.classList.toggle('is-past', dotIndex < activeIndex)
    }

    this.updateOverlay(time, pointer)
  }

  private applyMood(primary: ThemeTokens, secondary: ThemeTokens | null, mix: number): void {
    const variables = blendStyleMap(toTokenMap(primary), secondary ? toTokenMap(secondary) : null, mix)

    for (const [property, value] of Object.entries(variables)) {
      this.setRootVariable(property, value)
    }
  }

  private updateOverlay(time: number, pointer: PointerState): void {
    if (!this.overlay || !this.overlayRoot || !this.overlayGrid || this.overlayCards.length === 0) {
      return
    }

    const triggerProgress = this.sections.get(this.overlay.triggerChapter)?.progress ?? 0
    const handoffProgress = this.overlay.handoffChapter
      ? this.sections.get(this.overlay.handoffChapter)?.progress ?? 0
      : 0

    const reveal = Math.sin(remapClamped(triggerProgress, 0.05, 0.92, 0, 1) * Math.PI)
    const stageOpacity = remapClamped(reveal, 0.06, 1, 0, 1)
    this.overlayRoot.style.opacity = stageOpacity.toFixed(4)
    this.overlayRoot.style.transform =
      `translate3d(0, ${(remapClamped(reveal, 0, 1, 40, -18) + Math.sin(time * 0.8) * 3).toFixed(2)}px, 0)` +
      ` rotate(${(pointer.x * 1.8 - handoffProgress * 3.2).toFixed(2)}deg)`

    for (let index = 0; index < this.overlayCards.length; index += 1) {
      const progress = createStaggeredTimeline(triggerProgress, index, this.overlayCards.length, {
        ease: easeOutQuint,
        span: 0.48,
        spread: 0.24,
        windowStart: 0.02,
        windowEnd: 0.94,
      })
      const xFrom = [-260, 0, 280][index] ?? index * 160
      const xTo = [-34, 28, 84][index] ?? 0
      const yFrom = [120, 150, 170][index] ?? 120
      const yTo = [-72, -10, 52][index] ?? 0
      const rotateFrom = [-18, 12, 18][index] ?? 0
      const rotateTo = [-7, 2, 8][index] ?? 0

      this.overlayCards[index].style.transform =
        `translate3d(${remapClamped(progress, 0, 1, xFrom, xTo).toFixed(2)}px, ` +
        `${remapClamped(progress, 0, 1, yFrom, yTo).toFixed(2)}px, 0) ` +
        `rotate(${remapClamped(progress, 0, 1, rotateFrom, rotateTo).toFixed(2)}deg) ` +
        `scale(${remapClamped(progress, 0, 1, 0.86, 1).toFixed(3)})`
    }

    const gridRotate = remapClamped(triggerProgress, 0, 1, -10, 8) + pointer.x * 4 - handoffProgress * 5
    const gridScale = 1 + remapClamped(reveal, 0, 1, 0, 0.16)
    this.overlayGrid.style.transform =
      `translate3d(0, 0, 0) scale(${gridScale.toFixed(3)}) rotate(${gridRotate.toFixed(2)}deg)`
    this.overlayGrid.style.opacity = remapClamped(reveal, 0.04, 1, 0, 0.96).toFixed(4)
  }

  private setRootVariable(property: string, value: string): void {
    if (this.cssCache.get(property) === value) {
      return
    }

    this.cssCache.set(property, value)
    this.rootStyle.setProperty(property, value)
  }
}

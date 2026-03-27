import { blendStyleMap } from '../core/chapter-mood'
import {
  ChapterBlendTracker,
  collectChapterState,
  createStaggeredTimeline,
  createChapterBlendTarget,
} from '../core/chapter-timeline'
import { easeInOutCubic, easeOutQuint, remapClamped } from '../core/math'
import type { PointerState } from '../core/pointer-tracker'
import type { ScrollFrame } from '../core/smooth-scroll'
import { SectionRegistry } from '../core/section-registry'

interface DemoUpdateInput {
  deltaTime: number
  time: number
  pointer: PointerState
  scroll: ScrollFrame
}

interface ChapterMeta {
  id: string
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

type ChapterId = 'hero' | 'portal' | 'systems' | 'sequence' | 'launch' | 'cta'

const CHAPTER_IDS: ChapterId[] = ['hero', 'portal', 'systems', 'sequence', 'launch', 'cta']

const CHAPTERS: ChapterMeta[] = [
  {
    id: 'hero',
    accent: '#0e7d84',
    accentSoft: 'rgba(14, 125, 132, 0.18)',
    bgTop: '#f8f2e8',
    bgMid: '#efe4d6',
    bgBottom: '#e1d4bf',
    glowA: 'rgba(20, 127, 136, 0.18)',
    glowB: 'rgba(216, 152, 86, 0.18)',
    glowC: 'rgba(255, 255, 255, 0.28)',
    washA: 'rgba(20, 127, 136, 0.12)',
    washB: 'rgba(216, 152, 86, 0.14)',
    washC: 'rgba(255, 255, 255, 0.04)',
    ink: '#10212a',
    muted: 'rgba(16, 33, 42, 0.64)',
    line: 'rgba(16, 33, 42, 0.1)',
    card: 'rgba(255, 252, 247, 0.72)',
    cardStrong: 'rgba(255, 250, 242, 0.88)',
    shadow: '0 28px 90px rgba(16, 33, 42, 0.1)',
    gridLine: 'rgba(16, 33, 42, 0.04)',
    grainOpacity: '0.22',
  },
  {
    id: 'portal',
    accent: '#ff9152',
    accentSoft: 'rgba(255, 145, 82, 0.2)',
    bgTop: '#0a1117',
    bgMid: '#121c29',
    bgBottom: '#1a2434',
    glowA: 'rgba(23, 181, 194, 0.28)',
    glowB: 'rgba(255, 145, 82, 0.28)',
    glowC: 'rgba(142, 208, 255, 0.12)',
    washA: 'rgba(27, 189, 202, 0.17)',
    washB: 'rgba(255, 145, 82, 0.15)',
    washC: 'rgba(10, 17, 23, 0.18)',
    ink: '#eef6f7',
    muted: 'rgba(238, 246, 247, 0.72)',
    line: 'rgba(238, 246, 247, 0.16)',
    card: 'rgba(12, 18, 24, 0.5)',
    cardStrong: 'rgba(16, 24, 34, 0.76)',
    shadow: '0 32px 120px rgba(0, 0, 0, 0.34)',
    gridLine: 'rgba(238, 246, 247, 0.06)',
    grainOpacity: '0.16',
  },
  {
    id: 'systems',
    accent: '#2e84b7',
    accentSoft: 'rgba(46, 132, 183, 0.18)',
    bgTop: '#dbe5ef',
    bgMid: '#c6d6e5',
    bgBottom: '#b7cadc',
    glowA: 'rgba(50, 130, 196, 0.22)',
    glowB: 'rgba(127, 231, 255, 0.14)',
    glowC: 'rgba(255, 255, 255, 0.2)',
    washA: 'rgba(39, 117, 172, 0.12)',
    washB: 'rgba(103, 198, 232, 0.12)',
    washC: 'rgba(255, 255, 255, 0.03)',
    ink: '#12212d',
    muted: 'rgba(18, 33, 45, 0.66)',
    line: 'rgba(18, 33, 45, 0.1)',
    card: 'rgba(251, 253, 255, 0.68)',
    cardStrong: 'rgba(248, 252, 255, 0.84)',
    shadow: '0 30px 110px rgba(24, 52, 82, 0.14)',
    gridLine: 'rgba(18, 33, 45, 0.04)',
    grainOpacity: '0.18',
  },
  {
    id: 'sequence',
    accent: '#7a6ff2',
    accentSoft: 'rgba(122, 111, 242, 0.18)',
    bgTop: '#10111f',
    bgMid: '#1a1735',
    bgBottom: '#271f4b',
    glowA: 'rgba(124, 114, 247, 0.28)',
    glowB: 'rgba(88, 208, 255, 0.2)',
    glowC: 'rgba(255, 214, 248, 0.12)',
    washA: 'rgba(122, 111, 242, 0.16)',
    washB: 'rgba(88, 208, 255, 0.14)',
    washC: 'rgba(16, 17, 31, 0.2)',
    ink: '#f6f2ff',
    muted: 'rgba(246, 242, 255, 0.72)',
    line: 'rgba(246, 242, 255, 0.16)',
    card: 'rgba(23, 20, 47, 0.52)',
    cardStrong: 'rgba(30, 24, 58, 0.76)',
    shadow: '0 34px 130px rgba(6, 4, 18, 0.36)',
    gridLine: 'rgba(246, 242, 255, 0.06)',
    grainOpacity: '0.14',
  },
  {
    id: 'launch',
    accent: '#dd6f52',
    accentSoft: 'rgba(221, 111, 82, 0.18)',
    bgTop: '#1a1111',
    bgMid: '#32191a',
    bgBottom: '#4b211f',
    glowA: 'rgba(221, 111, 82, 0.28)',
    glowB: 'rgba(255, 199, 112, 0.2)',
    glowC: 'rgba(255, 245, 232, 0.12)',
    washA: 'rgba(221, 111, 82, 0.16)',
    washB: 'rgba(255, 199, 112, 0.13)',
    washC: 'rgba(26, 17, 17, 0.18)',
    ink: '#fff2ed',
    muted: 'rgba(255, 242, 237, 0.72)',
    line: 'rgba(255, 242, 237, 0.14)',
    card: 'rgba(34, 18, 18, 0.52)',
    cardStrong: 'rgba(50, 24, 24, 0.76)',
    shadow: '0 34px 130px rgba(7, 3, 3, 0.36)',
    gridLine: 'rgba(255, 242, 237, 0.05)',
    grainOpacity: '0.15',
  },
  {
    id: 'cta',
    accent: '#1aa1ab',
    accentSoft: 'rgba(26, 161, 171, 0.18)',
    bgTop: '#061215',
    bgMid: '#0d2025',
    bgBottom: '#123038',
    glowA: 'rgba(26, 161, 171, 0.24)',
    glowB: 'rgba(132, 238, 228, 0.16)',
    glowC: 'rgba(255, 255, 255, 0.08)',
    washA: 'rgba(26, 161, 171, 0.15)',
    washB: 'rgba(132, 238, 228, 0.12)',
    washC: 'rgba(6, 18, 21, 0.18)',
    ink: '#ecfbfb',
    muted: 'rgba(236, 251, 251, 0.72)',
    line: 'rgba(236, 251, 251, 0.14)',
    card: 'rgba(8, 22, 24, 0.5)',
    cardStrong: 'rgba(12, 32, 36, 0.76)',
    shadow: '0 34px 120px rgba(2, 8, 10, 0.36)',
    gridLine: 'rgba(236, 251, 251, 0.05)',
    grainOpacity: '0.12',
  },
]

export class DemoController {
  private readonly root = document.documentElement
  private readonly rootStyle = this.root.style
  private readonly stage: HTMLElement
  private readonly stageCards: HTMLElement[]
  private readonly grid: HTMLElement
  private readonly storyDots: HTMLElement[]
  private readonly sections: SectionRegistry
  private readonly moodBlendTracker = new ChapterBlendTracker(CHAPTER_IDS, 'hero')

  private activeChapterId = 'hero'

  constructor(sections: SectionRegistry) {
    this.sections = sections
    this.stage = this.query('[data-stage]')
    this.stageCards = Array.from(document.querySelectorAll<HTMLElement>('[data-stage-card]'))
    this.grid = this.query('[data-stage-grid]')
    this.storyDots = Array.from(document.querySelectorAll<HTMLElement>('[data-story-dot]'))

    this.applyChapterMood(CHAPTERS[0], null, 0)
  }

  update({ deltaTime, time, pointer, scroll }: DemoUpdateInput): void {
    const hero = this.sections.get('hero')?.progress ?? 0
    const portal = this.sections.get('portal')?.progress ?? 0
    const systems = this.sections.get('systems')?.progress ?? 0
    const sequence = this.sections.get('sequence')?.progress ?? 0
    const launch = this.sections.get('launch')?.progress ?? 0
    const cta = this.sections.get('cta')?.progress ?? 0

    this.rootStyle.setProperty('--scroll-progress', scroll.progress.toFixed(4))
    this.rootStyle.setProperty('--hero-progress', hero.toFixed(4))
    this.rootStyle.setProperty('--portal-progress', portal.toFixed(4))
    this.rootStyle.setProperty('--systems-progress', systems.toFixed(4))
    this.rootStyle.setProperty('--sequence-progress', sequence.toFixed(4))
    this.rootStyle.setProperty('--launch-progress', launch.toFixed(4))
    this.rootStyle.setProperty('--cta-progress', cta.toFixed(4))

    this.updateStage(time, pointer, sequence, launch)

    const chapterState = collectChapterState(CHAPTER_IDS, this.sections, {
      baselines: { hero: 0.02 },
      exponents: {
        hero: 1.9,
        portal: 1.95,
        systems: 2,
        sequence: 2,
        launch: 2,
        cta: 2,
      },
      visibilityBoost: 0.08,
    })
    const chapterBlend = createChapterBlendTarget(CHAPTER_IDS, chapterState.weights, {
      maxSecondaryMix: 0.42,
      secondaryEnterEnd: 0.36,
      secondaryEnterStart: 0.14,
      secondaryWeight: 1.18,
    })
    const moodWeights = this.moodBlendTracker.update(chapterBlend.target, deltaTime, {
      enterSmoothing: 2.3,
      exitSmoothing: 3.1,
    })
    const primary = CHAPTERS.find((item) => item.id === chapterBlend.primary) ?? CHAPTERS[0]
    const secondary = chapterBlend.secondary
      ? CHAPTERS.find((item) => item.id === chapterBlend.secondary) ?? null
      : null
    const primaryId = primary.id as ChapterId
    const secondaryId = secondary?.id as ChapterId | undefined
    const secondaryWeight = secondaryId ? moodWeights[secondaryId] : 0
    const combinedWeight = moodWeights[primaryId] + secondaryWeight
    const blendRatio = secondary && combinedWeight > 0 ? secondaryWeight / combinedWeight : 0
    const chapterProgress = this.sections.get(primary.id)?.progress ?? 0

    if (this.activeChapterId !== primary.id) {
      this.activeChapterId = primary.id
    }

    this.root.dataset.scene = primary.id
    this.applyChapterMood(primary, secondary, blendRatio)

    for (const dot of this.storyDots) {
      const dotId = dot.dataset.storyDot
      const dotIndex = CHAPTERS.findIndex((item) => item.id === dotId)
      const activeIndex = CHAPTERS.findIndex((item) => item.id === primary.id)

      dot.classList.toggle('is-active', dotId === primary.id)
      dot.classList.toggle('is-past', dotIndex < activeIndex)
    }

    this.rootStyle.setProperty('--chapter-progress', chapterProgress.toFixed(4))
  }

  private applyChapterMood(primary: ChapterMeta, secondary: ChapterMeta | null, mix: number): void {
    const variables = blendStyleMap(
      {
        '--chapter-accent': primary.accent,
        '--chapter-accent-soft': primary.accentSoft,
        '--bg-top': primary.bgTop,
        '--bg-mid': primary.bgMid,
        '--bg-bottom': primary.bgBottom,
        '--glow-a': primary.glowA,
        '--glow-b': primary.glowB,
        '--glow-c': primary.glowC,
        '--wash-a': primary.washA,
        '--wash-b': primary.washB,
        '--wash-c': primary.washC,
        '--ink': primary.ink,
        '--muted': primary.muted,
        '--line': primary.line,
        '--card': primary.card,
        '--card-strong': primary.cardStrong,
        '--shadow': primary.shadow,
        '--grid-line': primary.gridLine,
        '--grain-opacity': primary.grainOpacity,
      },
      secondary
        ? {
            '--chapter-accent': secondary.accent,
            '--chapter-accent-soft': secondary.accentSoft,
            '--bg-top': secondary.bgTop,
            '--bg-mid': secondary.bgMid,
            '--bg-bottom': secondary.bgBottom,
            '--glow-a': secondary.glowA,
            '--glow-b': secondary.glowB,
            '--glow-c': secondary.glowC,
            '--wash-a': secondary.washA,
            '--wash-b': secondary.washB,
            '--wash-c': secondary.washC,
            '--ink': secondary.ink,
            '--muted': secondary.muted,
            '--line': secondary.line,
            '--card': secondary.card,
            '--card-strong': secondary.cardStrong,
            '--shadow': secondary.shadow,
            '--grid-line': secondary.gridLine,
            '--grain-opacity': secondary.grainOpacity,
          }
        : null,
      mix,
    )

    for (const [property, value] of Object.entries(variables)) {
      this.rootStyle.setProperty(property, value)
    }
  }

  private updateStage(time: number, pointer: PointerState, sequence: number, launch: number): void {
    const stageReveal = Math.sin(sequence * Math.PI)
    const stageOpacity = remapClamped(stageReveal, 0.08, 1, 0, 1)
    this.stage.style.opacity = stageOpacity.toFixed(4)
    this.stage.style.transform =
      `translate3d(0, ${(remapClamped(stageReveal, 0, 1, 34, -22) + Math.sin(time * 0.9) * 3).toFixed(2)}px, 0) ` +
      `rotate(${(pointer.x * 1.8).toFixed(2)}deg)`

    const cardA = createStaggeredTimeline(sequence, 0, 3, {
      ease: easeOutQuint,
      span: 0.44,
      spread: 0.26,
      windowStart: 0.02,
      windowEnd: 0.9,
    })
    const cardB = createStaggeredTimeline(sequence, 1, 3, {
      ease: easeOutQuint,
      span: 0.44,
      spread: 0.26,
      windowStart: 0.02,
      windowEnd: 0.9,
    })
    const cardC = createStaggeredTimeline(sequence, 2, 3, {
      ease: easeOutQuint,
      span: 0.44,
      spread: 0.26,
      windowStart: 0.02,
      windowEnd: 0.9,
    })

    const [firstCard, secondCard, thirdCard] = this.stageCards

    if (!firstCard || !secondCard || !thirdCard) {
      return
    }

    firstCard.style.transform =
      `translate3d(${remapClamped(cardA, 0, 1, -260, -24).toFixed(2)}px, ` +
      `${remapClamped(cardA, 0, 1, 110, -68).toFixed(2)}px, 0) ` +
      `rotate(${remapClamped(cardA, 0, 1, -18, -6).toFixed(2)}deg) scale(${remapClamped(cardA, 0, 1, 0.88, 1).toFixed(3)})`

    secondCard.style.transform =
      `translate3d(${remapClamped(cardB, 0, 1, 0, 30).toFixed(2)}px, ` +
      `${remapClamped(cardB, 0, 1, 140, -6).toFixed(2)}px, 0) ` +
      `rotate(${remapClamped(cardB, 0, 1, 12, 3).toFixed(2)}deg) scale(${remapClamped(cardB, 0, 1, 0.85, 1).toFixed(3)})`

    thirdCard.style.transform =
      `translate3d(${remapClamped(cardC, 0, 1, 280, 70).toFixed(2)}px, ` +
      `${remapClamped(cardC, 0, 1, 150, 42).toFixed(2)}px, 0) ` +
      `rotate(${remapClamped(cardC, 0, 1, 18, 7).toFixed(2)}deg) scale(${remapClamped(cardC, 0, 1, 0.84, 1).toFixed(3)})`

    const gridRotate = remapClamped(sequence, 0, 1, -10, 8) + pointer.x * 4.5 - launch * 5
    const gridScale = 1 + easeInOutCubic(remapClamped(stageReveal, 0, 1, 0, 1)) * 0.16
    this.grid.style.transform =
      `translate3d(0, 0, 0) scale(${gridScale.toFixed(4)}) rotate(${gridRotate.toFixed(2)}deg)`
    this.grid.style.opacity = remapClamped(stageReveal, 0.04, 1, 0, 0.96).toFixed(4)
  }

  private query(selector: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(selector)

    if (!element) {
      throw new Error(`Missing required demo element: ${selector}`)
    }

    return element
  }
}

import { blendStyleMap } from '../core/chapter-mood'
import {
  ChapterBlendTracker,
  collectChapterState,
  createChapterBlendTarget,
} from '../core/chapter-timeline'
import type { ScrollFrame } from '../core/smooth-scroll'
import { SectionRegistry } from '../core/section-registry'

interface PullupUpdateInput {
  deltaTime: number
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
  ink: string
  muted: string
  line: string
  card: string
  cardStrong: string
  shadow: string
}

type ChapterId = 'intro' | 'events' | 'movement' | 'gallery' | 'contact'

const CHAPTER_IDS: ChapterId[] = ['intro', 'events', 'movement', 'gallery', 'contact']

const CHAPTERS: ChapterMeta[] = [
  {
    id: 'intro',
    accent: '#ccff00',
    accentSoft: 'rgba(204, 255, 0, 0.18)',
    bgTop: '#040507',
    bgMid: '#090b0f',
    bgBottom: '#0b1114',
    glowA: 'rgba(204, 255, 0, 0.18)',
    glowB: 'rgba(255, 132, 76, 0.18)',
    ink: '#f7fcec',
    muted: 'rgba(247, 252, 236, 0.68)',
    line: 'rgba(247, 252, 236, 0.12)',
    card: 'rgba(10, 12, 16, 0.62)',
    cardStrong: 'rgba(12, 15, 18, 0.8)',
    shadow: '0 32px 120px rgba(0, 0, 0, 0.34)',
  },
  {
    id: 'events',
    accent: '#ff8e54',
    accentSoft: 'rgba(255, 142, 84, 0.18)',
    bgTop: '#0c1015',
    bgMid: '#11161d',
    bgBottom: '#171a1f',
    glowA: 'rgba(255, 142, 84, 0.2)',
    glowB: 'rgba(204, 255, 0, 0.12)',
    ink: '#fff4ef',
    muted: 'rgba(255, 244, 239, 0.7)',
    line: 'rgba(255, 244, 239, 0.12)',
    card: 'rgba(18, 13, 12, 0.64)',
    cardStrong: 'rgba(24, 16, 14, 0.82)',
    shadow: '0 34px 120px rgba(0, 0, 0, 0.38)',
  },
  {
    id: 'movement',
    accent: '#74e4ff',
    accentSoft: 'rgba(116, 228, 255, 0.18)',
    bgTop: '#081017',
    bgMid: '#0e171f',
    bgBottom: '#10161d',
    glowA: 'rgba(116, 228, 255, 0.16)',
    glowB: 'rgba(204, 255, 0, 0.1)',
    ink: '#eefcff',
    muted: 'rgba(238, 252, 255, 0.68)',
    line: 'rgba(238, 252, 255, 0.12)',
    card: 'rgba(8, 16, 20, 0.64)',
    cardStrong: 'rgba(10, 19, 24, 0.82)',
    shadow: '0 34px 120px rgba(0, 0, 0, 0.34)',
  },
  {
    id: 'gallery',
    accent: '#bf7bff',
    accentSoft: 'rgba(191, 123, 255, 0.18)',
    bgTop: '#0f0b19',
    bgMid: '#141024',
    bgBottom: '#1a1230',
    glowA: 'rgba(191, 123, 255, 0.18)',
    glowB: 'rgba(116, 228, 255, 0.12)',
    ink: '#faf4ff',
    muted: 'rgba(250, 244, 255, 0.7)',
    line: 'rgba(250, 244, 255, 0.12)',
    card: 'rgba(16, 12, 26, 0.64)',
    cardStrong: 'rgba(20, 14, 31, 0.82)',
    shadow: '0 34px 120px rgba(0, 0, 0, 0.36)',
  },
  {
    id: 'contact',
    accent: '#2fd0b5',
    accentSoft: 'rgba(47, 208, 181, 0.18)',
    bgTop: '#071316',
    bgMid: '#0c1a1d',
    bgBottom: '#102326',
    glowA: 'rgba(47, 208, 181, 0.18)',
    glowB: 'rgba(204, 255, 0, 0.1)',
    ink: '#effffd',
    muted: 'rgba(239, 255, 253, 0.72)',
    line: 'rgba(239, 255, 253, 0.12)',
    card: 'rgba(10, 19, 18, 0.64)',
    cardStrong: 'rgba(11, 24, 22, 0.84)',
    shadow: '0 34px 120px rgba(0, 0, 0, 0.34)',
  },
]

export class PullupController {
  private readonly root = document.documentElement
  private readonly rootStyle = this.root.style
  private readonly cssCache = new Map<string, string>()
  private readonly dots: HTMLElement[]
  private readonly sections: SectionRegistry
  private readonly moodBlendTracker = new ChapterBlendTracker(CHAPTER_IDS, 'intro')

  private activeChapterId = 'intro'

  constructor(sections: SectionRegistry) {
    this.sections = sections
    this.dots = Array.from(document.querySelectorAll<HTMLElement>('[data-pullup-dot]'))

    this.applyChapterMood(CHAPTERS[0], null, 0)
  }

  update({ deltaTime, scroll }: PullupUpdateInput): void {
    for (const id of CHAPTER_IDS) {
      const progress = this.sections.get(id)?.progress ?? 0
      this.setRootVariable(`--pullup-${id}-progress`, progress.toFixed(4))
    }

    this.setRootVariable('--pullup-scroll-progress', scroll.progress.toFixed(4))

    const chapterState = collectChapterState(CHAPTER_IDS, this.sections, {
      baselines: { intro: 0.02 },
      exponents: {
        intro: 1.8,
        events: 1.9,
        movement: 1.9,
        gallery: 1.9,
        contact: 1.9,
      },
      visibilityBoost: 0.08,
    })
    const chapterBlend = createChapterBlendTarget(CHAPTER_IDS, chapterState.weights, {
      maxSecondaryMix: 0.38,
      secondaryEnterEnd: 0.42,
      secondaryEnterStart: 0.18,
      secondaryWeight: 1.08,
    })
    const moodWeights = this.moodBlendTracker.update(chapterBlend.target, deltaTime, {
      enterSmoothing: 2.2,
      exitSmoothing: 3,
    })
    const primary = CHAPTERS.find((item) => item.id === chapterBlend.primary) ?? CHAPTERS[0]
    const secondary = chapterBlend.secondary
      ? CHAPTERS.find((item) => item.id === chapterBlend.secondary) ?? null
      : null
    const primaryId = primary.id as ChapterId
    const secondaryId = secondary?.id as ChapterId | undefined
    const secondaryWeight = secondaryId ? moodWeights[secondaryId] : 0
    const primaryWeight = moodWeights[primaryId] + secondaryWeight
    const blendRatio = secondary && primaryWeight > 0 ? secondaryWeight / primaryWeight : 0

    if (this.activeChapterId !== primary.id) {
      this.activeChapterId = primary.id
    }

    this.root.dataset.scene = primary.id
    this.applyChapterMood(primary, secondary, blendRatio)

    for (const dot of this.dots) {
      const dotId = dot.dataset.pullupDot
      const dotIndex = CHAPTERS.findIndex((item) => item.id === dotId)
      const activeIndex = CHAPTERS.findIndex((item) => item.id === primary.id)
      dot.classList.toggle('is-active', dotId === primary.id)
      dot.classList.toggle('is-past', dotIndex < activeIndex)
    }
  }

  private applyChapterMood(primary: ChapterMeta, secondary: ChapterMeta | null, mix: number): void {
    const variables = blendStyleMap(
      {
        '--pullup-accent': primary.accent,
        '--pullup-accent-soft': primary.accentSoft,
        '--pullup-bg-top': primary.bgTop,
        '--pullup-bg-mid': primary.bgMid,
        '--pullup-bg-bottom': primary.bgBottom,
        '--pullup-glow-a': primary.glowA,
        '--pullup-glow-b': primary.glowB,
        '--pullup-ink': primary.ink,
        '--pullup-muted': primary.muted,
        '--pullup-line': primary.line,
        '--pullup-card': primary.card,
        '--pullup-card-strong': primary.cardStrong,
        '--pullup-shadow': primary.shadow,
      },
      secondary
        ? {
            '--pullup-accent': secondary.accent,
            '--pullup-accent-soft': secondary.accentSoft,
            '--pullup-bg-top': secondary.bgTop,
            '--pullup-bg-mid': secondary.bgMid,
            '--pullup-bg-bottom': secondary.bgBottom,
            '--pullup-glow-a': secondary.glowA,
            '--pullup-glow-b': secondary.glowB,
            '--pullup-ink': secondary.ink,
            '--pullup-muted': secondary.muted,
            '--pullup-line': secondary.line,
            '--pullup-card': secondary.card,
            '--pullup-card-strong': secondary.cardStrong,
            '--pullup-shadow': secondary.shadow,
          }
        : null,
      mix,
    )

    for (const [property, value] of Object.entries(variables)) {
      this.setRootVariable(property, value)
    }
  }

  private setRootVariable(property: string, value: string): void {
    if (this.cssCache.get(property) === value) {
      return
    }

    this.cssCache.set(property, value)
    this.rootStyle.setProperty(property, value)
  }
}

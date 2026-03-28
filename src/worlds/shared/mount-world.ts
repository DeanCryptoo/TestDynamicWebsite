import { gsap } from 'gsap'

import { PointerTracker } from '../../core/pointer-tracker'
import { MOBILE_FRAME_INTERVAL } from '../../core/runtime-profile'
import { SectionRegistry } from '../../core/section-registry'
import { SmoothScroll } from '../../core/smooth-scroll'
import './world-shell.css'
import { WorldController } from './world-controller'
import { WorldSceneEngine } from './world-scene-engine'
import type { WorldDefinition } from './types'

const renderOverlay = (world: WorldDefinition): string => {
  if (!world.overlay || world.overlay.type !== 'card-stack') {
    return ''
  }

  return `
    <div class="world-overlay" data-world-overlay aria-hidden="true">
      <div class="world-overlay__grid" data-world-overlay-grid></div>
      ${world.overlay.cards
        .map(
          (card, index) => `
            <article class="world-overlay__card world-overlay__card--${index + 1}" data-world-overlay-card>
              <span class="world-overlay__card-label">${card.label}</span>
              <h3>${card.title}</h3>
              <p>${card.body}</p>
            </article>
          `,
        )
        .join('')}
    </div>
  `
}

const renderRail = (world: WorldDefinition): string => `
  <nav class="world-rail" aria-hidden="true">
    <span class="world-rail__label">${world.railLabel}</span>
    <div class="world-rail__dots">
      ${world.chapters
        .map((chapter) => `<span class="world-rail__dot" data-world-dot="${chapter.id}"></span>`)
        .join('')}
    </div>
  </nav>
`

const renderSections = (world: WorldDefinition): string =>
  world.chapters
    .map((chapter) => {
      const classes = ['world-section', `world-section--${chapter.id}`, ...(chapter.layout.classes ?? [])]
      const style = chapter.layout.minHeight ? ` style="min-height:${chapter.layout.minHeight}"` : ''
      return `
        <section class="${classes.join(' ')}" data-section="${chapter.id}"${style}>
          <div class="world-section__inner">
            ${chapter.contentHtml}
          </div>
        </section>
      `
    })
    .join('')

export const mountWorldDefinition = (app: HTMLDivElement, world: WorldDefinition): void => {
  document.documentElement.dataset.world = world.id
  document.body.dataset.world = world.id

  const shellClass = ['world-shell', world.shellClassName ?? '', `${world.id}-world`].filter(Boolean).join(' ')

  app.innerHTML = `
    <div class="${shellClass}">
      <canvas class="world-canvas" aria-hidden="true"></canvas>
      <div class="world-ambient" aria-hidden="true"></div>
      <div class="world-grain" aria-hidden="true"></div>

      <header class="world-header">
        <a class="world-back" href="./" data-world-intro>All Worlds</a>
        <div class="world-meta" data-world-intro>${world.headerMeta}</div>
      </header>

      ${renderRail(world)}
      ${renderOverlay(world)}

      <main class="world-scroll" data-scroll-root>
        ${renderSections(world)}
      </main>
    </div>
  `

  const scrollRoot = app.querySelector<HTMLElement>('[data-scroll-root]')
  const canvas = app.querySelector<HTMLCanvasElement>('.world-canvas')

  if (!scrollRoot || !canvas) {
    throw new Error(`Missing required elements for world "${world.id}".`)
  }

  const pointer = new PointerTracker()
  const sections = new SectionRegistry(scrollRoot)
  const scroll = new SmoothScroll(scrollRoot)
  const scene = new WorldSceneEngine(canvas, sections, world)
  const controller = new WorldController(world, sections)

  const introTargets = Array.from(
    document.querySelectorAll<HTMLElement>(world.introSelector ?? '[data-world-intro]'),
  )

  gsap.fromTo(
    introTargets,
    { autoAlpha: 0, y: 34 },
    {
      autoAlpha: 1,
      delay: 0.12,
      duration: 0.95,
      ease: 'power3.out',
      stagger: 0.05,
      y: 0,
    },
  )

  const handleResize = (): void => {
    sections.refresh()
    scroll.refresh()
    scene.resize(window.innerWidth, window.innerHeight)
  }

  handleResize()
  window.addEventListener('resize', handleResize)

  let previous = performance.now()
  let frameCarry = 0
  let time = 0

  const tick = (now: number): void => {
    const elapsed = Math.min(0.05, (now - previous) / 1000)
    previous = now
    frameCarry += elapsed

    if (scroll.usesNativeScroll && frameCarry < MOBILE_FRAME_INTERVAL) {
      window.requestAnimationFrame(tick)
      return
    }

    const deltaTime = scroll.usesNativeScroll ? frameCarry : elapsed
    frameCarry = 0
    time += deltaTime

    const pointerState = pointer.update(deltaTime)
    const scrollFrame = scroll.update(deltaTime)

    sections.update(scrollFrame.current, window.innerHeight)
    controller.update({ deltaTime, pointer: pointerState, scroll: scrollFrame, time })
    scene.update({ deltaTime, pointer: pointerState, scroll: scrollFrame, time })

    window.requestAnimationFrame(tick)
  }

  window.requestAnimationFrame(tick)
}

import { gsap } from 'gsap'

import '../style.css'

import { DemoController } from '../demo/demo-controller'
import { PointerTracker } from '../core/pointer-tracker'
import { SectionRegistry } from '../core/section-registry'
import { SmoothScroll } from '../core/smooth-scroll'
import { MOBILE_FRAME_INTERVAL } from '../core/runtime-profile'
import { BackgroundScene } from '../webgl/background-scene'

export const mountStoryMotionWorld = (app: HTMLDivElement): void => {
  document.documentElement.dataset.world = 'story-motion'
  document.body.dataset.world = 'story-motion'

  app.innerHTML = `
    <div class="site-chrome">
      <canvas class="scene-canvas" aria-hidden="true"></canvas>
      <div class="ambient-wash" aria-hidden="true"></div>
      <div class="ambient-grain" aria-hidden="true"></div>

      <header class="site-header">
        <a class="brand-mark" href="./">All Worlds</a>
        <div class="brand-caption" data-intro>Reusable cinematic website system with chapter-based 3D scroll choreography</div>
      </header>

      <nav class="story-rail" aria-hidden="true">
        <span class="story-rail__label">Chapters</span>
        <div class="story-rail__dots">
          <span class="story-rail__dot" data-story-dot="hero"></span>
          <span class="story-rail__dot" data-story-dot="portal"></span>
          <span class="story-rail__dot" data-story-dot="systems"></span>
          <span class="story-rail__dot" data-story-dot="sequence"></span>
          <span class="story-rail__dot" data-story-dot="launch"></span>
          <span class="story-rail__dot" data-story-dot="cta"></span>
        </div>
      </nav>

      <div class="sequence-stage" data-stage aria-hidden="true">
        <div class="sequence-stage__grid" data-stage-grid></div>
        <article class="sequence-card sequence-card--alpha" data-stage-card>
          <span class="sequence-card__label">Beat 01</span>
          <h3>Frame the problem.</h3>
          <p>The first card enters like a title slate instead of a static feature box.</p>
        </article>
        <article class="sequence-card sequence-card--beta" data-stage-card>
          <span class="sequence-card__label">Beat 02</span>
          <h3>Move through the system.</h3>
          <p>The second layer rides the same timeline as the camera instead of triggering in isolation.</p>
        </article>
        <article class="sequence-card sequence-card--gamma" data-stage-card>
          <span class="sequence-card__label">Beat 03</span>
          <h3>Land the reveal.</h3>
          <p>The last layer arrives with restraint so the ending feels authored, not random.</p>
        </article>
      </div>

      <main class="page-scroll" data-scroll-root>
        <section class="section hero" data-section="hero">
          <p class="eyebrow" data-intro>Chapter 01</p>
          <div class="hero__grid">
            <div class="hero__copy">
              <h1 class="hero__title">
                <span data-intro>Open with</span>
                <span data-intro>a signal.</span>
                <span data-intro>Pull them</span>
                <span data-intro>into a world.</span>
              </h1>
              <p class="hero__lede" data-intro>
                This starter is meant to pitch range, not just polish: each chapter shifts the camera route, object
                language, palette, and atmosphere so the site feels directed like a short film.
              </p>
              <div class="hero__chips" data-intro>
                <span>Portal travel</span>
                <span>Scene swaps</span>
                <span>Chapter rail</span>
                <span>Reusable scroll engine</span>
              </div>
            </div>
          </div>
        </section>

        <section class="section portal" data-section="portal">
          <div class="section-heading section-heading--narrow">
            <p class="eyebrow">Chapter 02</p>
            <h2>Stop scrolling like a document. Start moving like a camera.</h2>
            <p class="section-copy">
              This chapter pushes the scene through a ring field so the page feels like a transition, not a stack of panels.
            </p>
          </div>

          <div class="portal-steps">
            <article class="portal-step">
              <span>Signal</span>
              <p>Wake the object and establish the mood before heavy copy appears.</p>
            </article>
            <article class="portal-step">
              <span>Pull</span>
              <p>Shift the palette and camera language mid-scroll so the next chapter feels like a new destination.</p>
            </article>
            <article class="portal-step">
              <span>Land</span>
              <p>Arrive in the next scene with new objects already in motion.</p>
            </article>
          </div>
        </section>

        <section class="section systems" data-section="systems">
          <div class="section-heading">
            <p class="eyebrow">Chapter 03</p>
            <h2>Then build the world around the camera, not underneath it.</h2>
          </div>
          <div class="system-cards">
            <article class="system-card">
              <span class="system-card__index">01</span>
              <h3>Core engine</h3>
              <p>Native scroll stays intact while a damped visual layer handles the premium feel.</p>
            </article>
            <article class="system-card">
              <span class="system-card__index">02</span>
              <h3>Chapter registry</h3>
              <p>Each section exposes progress and focus so copy, camera, and objects can stay synchronized.</p>
            </article>
            <article class="system-card">
              <span class="system-card__index">03</span>
              <h3>Object systems</h3>
              <p>Portal rings, orbiting shards, monoliths, dust, and ribbons all read the same scroll story.</p>
            </article>
          </div>
        </section>

        <section class="section sequence" data-section="sequence">
          <div class="section-heading section-heading--narrow">
            <p class="eyebrow">Chapter 04</p>
            <h2>Pin a stage to the viewport and choreograph the message above the moving world.</h2>
            <p class="section-copy">
              The fixed card stack demonstrates how you can reveal features, process steps, or product beats without
              abandoning the shared animation timeline.
            </p>
          </div>
        </section>

        <section class="section launch" data-section="launch">
          <div class="section-heading">
            <p class="eyebrow">Chapter 05</p>
            <h2>Release the scene into orbit instead of fading to a boring final block.</h2>
          </div>
          <div class="launch-grid">
            <article class="launch-note">
              <h3>Escalate the camera path</h3>
              <p>Move from hero framing into travel, then open the scene back out for the ending.</p>
            </article>
            <article class="launch-note">
              <h3>Change the object language</h3>
              <p>Let rings, shards, and monoliths hand off attention from one chapter to the next.</p>
            </article>
            <article class="launch-note">
              <h3>Keep the message readable</h3>
              <p>Strong overlays and restrained typography let the world change aggressively without losing the pitch.</p>
            </article>
            <article class="launch-note launch-note--code">
              <pre><code>scroll.update(dt)
sections.update(scroll.current, viewport)
scene.update({ time, pointer, scroll })
story.update({ time, pointer, scroll })</code></pre>
            </article>
          </div>
        </section>

        <section class="section cta" data-section="cta">
          <p class="eyebrow">Chapter 06</p>
          <h2>Keep the core engine. Swap the scene, chapters, and visual language per project.</h2>
          <p class="section-copy">
            Use this as the baseline when a project needs real scroll storytelling instead of a page with animations attached to it.
          </p>
        </section>
      </main>
    </div>
  `

  const scrollRoot = app.querySelector<HTMLElement>('[data-scroll-root]')
  const canvas = app.querySelector<HTMLCanvasElement>('.scene-canvas')

  if (!scrollRoot || !canvas) {
    throw new Error('Missing required stage elements.')
  }

  const pointer = new PointerTracker()
  const sections = new SectionRegistry(scrollRoot)
  const scroll = new SmoothScroll(scrollRoot)
  const scene = new BackgroundScene(canvas, sections)
  const demo = new DemoController(sections)

  const introTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-intro]'))
  gsap.fromTo(
    introTargets,
    {
      autoAlpha: 0,
      y: 42,
    },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.06,
      delay: 0.15,
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
  let time = 0
  let frameCarry = 0

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
    demo.update({ deltaTime, time, pointer: pointerState, scroll: scrollFrame })
    scene.update({ deltaTime, time, pointer: pointerState, scroll: scrollFrame })

    window.requestAnimationFrame(tick)
  }

  window.requestAnimationFrame(tick)
}

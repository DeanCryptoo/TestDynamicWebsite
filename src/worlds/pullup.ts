import { gsap } from 'gsap'

import './pullup.css'

import { PointerTracker } from '../core/pointer-tracker'
import { SectionRegistry } from '../core/section-registry'
import { SmoothScroll } from '../core/smooth-scroll'
import { MOBILE_FRAME_INTERVAL } from '../core/runtime-profile'
import { PullupController } from './pullup-controller'
import { PullupScene } from './pullup-scene'

const EVENTS = [
  {
    city: 'Berlin',
    venue: 'Kraftwerk',
    date: '24 Oct',
    lineup: 'DJ EZ / Skepta / Pullup Soundsystem',
    image: '/worlds/pullup/1.jpg',
    href: 'https://linktr.ee/pullup_ofc',
    status: 'Tickets live',
    label: 'Flagship drop',
  },
  {
    city: 'Hamburg',
    venue: 'Uebel & Gefaehrlich',
    date: '08 Nov',
    lineup: 'AJ Tracey / OG Keemo / Soulection',
    image: '/worlds/pullup/2.jpg',
    href: 'https://linktr.ee/pullup_ofc',
    status: 'Door first',
    label: 'North circuit',
  },
  {
    city: 'Koeln',
    venue: 'Bootshaus',
    date: '15 Dec',
    lineup: 'Metro Boomin / Luciano / Pullup Residents',
    image: '/worlds/pullup/3.jpg',
    href: 'https://linktr.ee/pullup_ofc',
    status: 'Tickets live',
    label: 'Crew takeover',
  },
  {
    city: 'Muenchen',
    venue: 'Blitz Club',
    date: '31 Dec',
    lineup: 'NYE Special / Travis Scott (Live) / Pullup Crew',
    image: '/worlds/pullup/4.jpg',
    href: 'https://linktr.ee/pullup_ofc',
    status: 'NYE drop',
    label: 'New year close',
  },
]

const GALLERY = [
  {
    image: '/worlds/pullup/6.jpg',
    title: 'Crowd pressure',
    note: 'Bodies packed close, lights low, phones up only when the drop lands.',
  },
  {
    image: '/worlds/pullup/7.jpg',
    title: 'After-dark warmup',
    note: 'The room starts slow, then tightens into a full-floor release.',
  },
  {
    image: '/worlds/pullup/8.jpg',
    title: 'Back-room blur',
    note: 'Moody side angles, flash spill, and the feeling that you missed something if you left early.',
  },
  {
    image: '/worlds/pullup/1.jpg',
    title: 'Headliner arrival',
    note: 'Big-room energy framed like a poster, not a feed.',
  },
  {
    image: '/worlds/pullup/2.jpg',
    title: 'Exit haze',
    note: 'The memory that stays after the room empties and the bass is still in your chest.',
  },
]

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/pullup_ofc/',
    handle: '@pullup_ofc',
    cue: 'Feed',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@pullup.ofc',
    handle: '@pullup.ofc',
    cue: 'Rushes',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@pullup_ofc',
    handle: '@pullup_ofc',
    cue: 'Archive',
  },
  {
    label: 'Community',
    href: 'https://www.whatsapp.com/channel/0029Vb3YnJV35fM3V9GMNc0q',
    handle: 'WhatsApp line',
    cue: 'Line',
  },
]

export const mountPullupWorld = (app: HTMLDivElement): void => {
  document.documentElement.dataset.world = 'pullup'
  document.body.dataset.world = 'pullup'

  app.innerHTML = `
    <div class="pullup-chrome">
      <canvas class="pullup-canvas" aria-hidden="true"></canvas>
      <div class="pullup-ambient" aria-hidden="true"></div>
      <div class="pullup-noise" aria-hidden="true"></div>

      <header class="pullup-header">
        <a class="pullup-back" href="./" data-pullup-intro>All Worlds</a>
        <div class="pullup-header__meta" data-pullup-intro>PULLUP / Nightlife conversion demo</div>
      </header>

      <nav class="pullup-rail" aria-hidden="true">
        <span class="pullup-rail__label">Scenes</span>
        <div class="pullup-rail__dots">
          <span class="pullup-rail__dot" data-pullup-dot="intro"></span>
          <span class="pullup-rail__dot" data-pullup-dot="events"></span>
          <span class="pullup-rail__dot" data-pullup-dot="movement"></span>
          <span class="pullup-rail__dot" data-pullup-dot="gallery"></span>
          <span class="pullup-rail__dot" data-pullup-dot="contact"></span>
        </div>
      </nav>

      <main class="pullup-scroll" data-scroll-root>
        <section class="pullup-section pullup-intro" data-section="intro">
          <div class="pullup-intro__copy">
            <p class="pullup-eyebrow" data-pullup-intro>World 02 / PULLUP</p>
            <img class="pullup-logo" data-pullup-intro src="/worlds/pullup/logo.png" alt="PULLUP logo" />
            <h1 class="pullup-title" data-pullup-intro>
              Convert a nightlife brand into a cinematic scroll world without losing the raw energy.
            </h1>
            <p class="pullup-copy" data-pullup-intro>
              This rebuild takes the original one-file microsite and remaps it into the same chapter engine:
              different sections, different mood shifts, and a different 3D language from the abstract studio demo.
            </p>
            <div class="pullup-intro__facts" data-pullup-intro>
              <div>
                <span>Reach</span>
                <strong>100k+</strong>
              </div>
              <div>
                <span>Night flow</span>
                <strong>1k+ guests</strong>
              </div>
              <div>
                <span>Since</span>
                <strong>2019</strong>
              </div>
            </div>
            <div class="pullup-tags" data-pullup-intro>
              <span>HipHop</span>
              <span>Afro</span>
              <span>Latin</span>
              <span>Trap</span>
              <span>Community First</span>
            </div>
          </div>

          <div class="pullup-intro__visuals" data-pullup-intro>
            <div class="pullup-intro__stack">
              <figure class="pullup-intro__poster pullup-intro__poster--primary">
                <img src="/worlds/pullup/1.jpg" alt="PULLUP main room" />
              </figure>
              <figure class="pullup-intro__poster pullup-intro__poster--secondary">
                <img src="/worlds/pullup/2.jpg" alt="PULLUP crowd energy" />
              </figure>
              <div class="pullup-intro__caption">
                <span>Main room energy</span>
                <strong>Editorial poster stack instead of a boxed hero card.</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="pullup-section pullup-events" data-section="events">
          <div class="pullup-heading pullup-heading--narrow">
            <p class="pullup-eyebrow">Scene 02</p>
            <h2>Upcoming nights become a tunnel of drops, scarcity, and momentum.</h2>
            <p class="pullup-copy">
              Instead of a flat event list, this chapter turns each stop into a motion beat with room for venue, lineup,
              ticket state, and hover-ready media.
            </p>
          </div>
          <div class="pullup-events__shell">
            <div class="pullup-events__grid">
              ${EVENTS.map(
                (event, index) => `
                  <article class="pullup-event-card ${index === 0 ? 'pullup-event-card--featured' : 'pullup-event-card--compact'}">
                    <div class="pullup-event-card__visual">
                      <img src="${event.image}" alt="${event.city}" class="pullup-event-card__image" />
                      <div class="pullup-event-card__label">${event.label}</div>
                    </div>
                    <div class="pullup-event-card__body">
                      <div class="pullup-event-card__top">
                        <span>${event.date}</span>
                        <span>${event.status}</span>
                      </div>
                      <h3>${event.city}</h3>
                      <p class="pullup-event-card__venue">${event.venue}</p>
                      <div class="pullup-event-card__foot">
                        <p class="pullup-event-card__lineup">${event.lineup}</p>
                        <a href="${event.href}" target="_blank" rel="noreferrer">Open drop</a>
                      </div>
                    </div>
                  </article>
                `,
              ).join('')}
            </div>
          </div>
        </section>

        <section class="pullup-section pullup-movement" data-section="movement">
          <div class="pullup-heading">
            <p class="pullup-eyebrow">Scene 03</p>
            <h2>Keep the community angle, but give it a bigger physical stage.</h2>
          </div>
          <div class="pullup-movement__grid">
            <article class="pullup-manifesto">
              <p>
                PULLUP built momentum by mixing newcomer opportunity with headliner energy. In this system,
                that same story becomes a scene change: the visuals shift from club travel into a more structured world.
              </p>
              <p>
                The copy, stats, and media still do the selling, but now the environment reinforces the message instead
                of sitting behind it as wallpaper.
              </p>
              <div class="pullup-manifesto__stats">
                <div>
                  <strong>Community</strong>
                  <span>Voting and local pull</span>
                </div>
                <div>
                  <strong>Energy</strong>
                  <span>Night-level urgency</span>
                </div>
                <div>
                  <strong>Scale</strong>
                  <span>Ready for multi-city growth</span>
                </div>
              </div>
            </article>

            <figure class="pullup-feature">
              <img src="/worlds/pullup/5.jpg" alt="PULLUP movement" />
              <figcaption>
                <span>PULLUP MOVIE</span>
                <strong>The movement begins</strong>
              </figcaption>
            </figure>
          </div>
        </section>

        <section class="pullup-section pullup-gallery" data-section="gallery">
          <div class="pullup-heading pullup-heading--narrow">
            <p class="pullup-eyebrow">Scene 04</p>
            <h2>Turn the gallery into a suspended memory lane instead of a horizontal image belt.</h2>
            <p class="pullup-copy">
              The photos still matter, but the presentation becomes more cinematic: slower, moodier, and staged as a dedicated world.
            </p>
          </div>

          <div class="pullup-gallery__stage">
            <div class="pullup-gallery__meta">
              <div class="pullup-gallery__label">
                <span>Memory lane</span>
                <strong>Live from the pit</strong>
              </div>
              <div class="pullup-gallery__quote">
                A cinematic archive instead of a social strip: slower, heavier, and built to keep the feeling of the room alive.
              </div>
            </div>
            <div class="pullup-gallery__frames">
              ${GALLERY.map(
                (item, index) => `
                  <figure class="pullup-gallery__frame pullup-gallery__frame--${index + 1}">
                    <img src="${item.image}" alt="${item.title}" />
                    <figcaption>
                      <span>${item.title}</span>
                      <p>${item.note}</p>
                    </figcaption>
                  </figure>
                `,
              ).join('')}
            </div>
          </div>
        </section>

        <section class="pullup-section pullup-contact" data-section="contact">
          <div class="pullup-contact__grid">
            <div>
              <p class="pullup-eyebrow">Scene 05</p>
              <h2>End with the brand mark, the social layer, and a world that can scale per campaign.</h2>
              <p class="pullup-copy">
                This version keeps the spirit of the original site, but proves the format can stretch far beyond a single custom one-pager.
              </p>
            </div>

            <div class="pullup-socials">
              ${SOCIALS.map(
                (social, index) => `
                  <a class="pullup-social-card" href="${social.href}" target="_blank" rel="noreferrer">
                    <div class="pullup-social-card__head">
                      <span class="pullup-social-card__index">0${index + 1}</span>
                      <span class="pullup-social-card__cue">${social.cue}</span>
                    </div>
                    <strong class="pullup-social-card__label">${social.label}</strong>
                    <span class="pullup-social-card__handle">${social.handle}</span>
                  </a>
                `,
              ).join('')}
            </div>
          </div>

          <div class="pullup-wordmark">PULLUP</div>
        </section>
      </main>
    </div>
  `

  const scrollRoot = app.querySelector<HTMLElement>('[data-scroll-root]')
  const canvas = app.querySelector<HTMLCanvasElement>('.pullup-canvas')

  if (!scrollRoot || !canvas) {
    throw new Error('Missing required PULLUP world elements.')
  }

  const pointer = new PointerTracker()
  const sections = new SectionRegistry(scrollRoot)
  const scroll = new SmoothScroll(scrollRoot)
  const scene = new PullupScene(canvas, sections)
  const controller = new PullupController(sections)

  const introTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-pullup-intro]'))
  gsap.fromTo(
    introTargets,
    { autoAlpha: 0, y: 30 },
    { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.06, delay: 0.1 },
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
    controller.update({ deltaTime, scroll: scrollFrame })
    scene.update({ deltaTime, time, pointer: pointerState, scroll: scrollFrame })

    window.requestAnimationFrame(tick)
  }

  window.requestAnimationFrame(tick)
}

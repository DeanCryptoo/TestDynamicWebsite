import { gsap } from 'gsap'

import './launcher.css'

export const mountLauncherWorld = (app: HTMLDivElement): void => {
  document.documentElement.dataset.world = 'launcher'
  document.body.dataset.world = 'launcher'
  document.body.style.height = 'auto'

  app.innerHTML = `
    <main class="launcher-shell">
      <div class="launcher-backdrop" aria-hidden="true">
        <div class="launcher-orb launcher-orb--a"></div>
        <div class="launcher-orb launcher-orb--b"></div>
        <div class="launcher-grid"></div>
      </div>

      <header class="launcher-header" data-launcher-intro>
        <a class="launcher-mark" href="./">Story Motion Worlds</a>
        <span class="launcher-header__meta">Scrollable selector / multi-world demo</span>
      </header>

      <section class="launcher-landing launcher-landing--story" data-launcher-card>
        <div class="launcher-landing__content">
          <div class="launcher-landing__eyebrow">World 01 / Abstract Studio</div>
          <h2>Story Motion Lab</h2>
          <p>
            The abstract system demo: authored transitions, pinned narrative beats, chapter-based palettes, and one
            camera route pushing through multiple 3D environments.
          </p>
          <ul class="launcher-tags">
            <li>Abstract 3D</li>
            <li>Premium launch page</li>
            <li>Scene choreography</li>
          </ul>
          <a class="launcher-cta" href="?world=story-motion">Enter Story Motion Lab</a>
        </div>

        <div class="launcher-preview launcher-preview--story" aria-hidden="true">
          <div class="launcher-preview__ring"></div>
          <div class="launcher-preview__ring launcher-preview__ring--amber"></div>
          <div class="launcher-preview__core"></div>
          <div class="launcher-preview__ribbon"></div>
        </div>
      </section>

      <section class="launcher-landing launcher-landing--pullup" data-launcher-card>
        <div class="launcher-landing__content">
          <div class="launcher-landing__eyebrow">World 02 / Brand Conversion</div>
          <h2>PULLUP</h2>
          <p>
            A nightlife brand reinterpreted through this same system: event-drop energy, darker staging, media-led
            storytelling, and a completely different visual language from the abstract lab.
          </p>
          <ul class="launcher-tags">
            <li>Nightlife</li>
            <li>Asset conversion</li>
            <li>Different scene stack</li>
          </ul>
          <a class="launcher-cta launcher-cta--pullup" href="?world=pullup">Enter PULLUP World</a>
        </div>

        <div class="launcher-preview launcher-preview--pullup" aria-hidden="true">
          <div class="launcher-preview__poster">
            <img src="/worlds/pullup/1.jpg" alt="PULLUP preview" />
            <img src="/worlds/pullup/logo.png" alt="PULLUP logo" />
          </div>
          <div class="launcher-preview__marquee">Berlin / Hamburg / Koeln / Muenchen / Community / Turnup</div>
        </div>
      </section>
    </main>
  `

  const introTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-launcher-intro]'))
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-launcher-card]'))

  gsap.fromTo(
    introTargets,
    { autoAlpha: 0, y: 28 },
    { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 },
  )

  gsap.fromTo(
    sections,
    { autoAlpha: 0, y: 54 },
    { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.14, delay: 0.18 },
  )
}

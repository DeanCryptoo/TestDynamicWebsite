import { mountWorldDefinition } from './shared/mount-world'
import {
  createArcPlacements,
  createCamera,
  createEffectArc,
  createLauncherPreview,
  createMaterial,
  createMood,
  createTheme,
  createTiming,
} from './shared/presets'
import type { WorldDefinition } from './shared/types'

const launcherTheme = createTheme({
  accent: '#f4f1e6',
  accentSoft: 'rgba(244, 241, 230, 0.12)',
  bgTop: '#0f1116',
  bgMid: '#090c10',
  bgBottom: '#06070a',
  glowA: 'rgba(123, 227, 255, 0.16)',
  glowC: 'rgba(255, 182, 129, 0.12)',
  muted: 'rgba(244, 241, 230, 0.7)',
})

const launcherWorld: WorldDefinition = {
  id: 'launcher',
  label: 'World Selector',
  chromeLabel: 'Launcher',
  headerMeta: 'Cinematic World Builder v2 / world selector',
  railLabel: 'Worlds',
  shellClassName: 'launcher-world',
  theme: launcherTheme,
  launcherPreview: createLauncherPreview(
    'Browse worlds',
    'A scrollable launcher that behaves like a world itself rather than a card grid.',
    ['World previews', 'Mini openings', 'Scroll selector'],
  ),
  overlay: null,
  devicePolicy: {
    mobileLite: { maxEffectInstances: 4, maxPropInstances: 4, hazeCount: 60 },
  },
  chapters: [
    {
      id: 'studio',
      layout: { minHeight: '106svh' },
      mood: launcherTheme,
      contentHtml: `
        <div class="feature-grid">
          <div class="copy-stack">
            <p class="eyebrow" data-world-intro>World 01 / Abstract Studio</p>
            <h1 class="hero-title" data-world-intro>Each scroll step is a different landing page you can enter.</h1>
            <p class="section-copy" data-world-intro>
              The launcher is now a world too. Each chapter previews a different atmosphere, then links straight into the full experience.
            </p>
            <div class="chip-row" data-world-intro>
              <span>World selector</span>
              <span>Mini opening frame</span>
              <span>Shared engine</span>
            </div>
            <a class="world-cta" data-world-intro href="./?world=story-motion">Enter Abstract Studio</a>
          </div>
          <div class="preview-stage hide-mobile" data-world-intro>
            <article class="preview-card preview-card--alpha"><span class="eyebrow">System</span><h3>Abstract range</h3><p class="body-copy">Portal, systems, overlay, launch.</p></article>
            <article class="preview-card preview-card--beta"><span class="eyebrow">Motion</span><h3>Signal world</h3><p class="body-copy">Clean sci-fi language for pitching the engine itself.</p></article>
            <article class="preview-card preview-card--gamma"><span class="eyebrow">Route</span><h3>World 01</h3><p class="body-copy">A controlled showcase of the shared runtime.</p></article>
          </div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0a1016', fillColor: '#84eefe', keyColor: '#fff1dc', rimColor: '#84eefe' }),
      cameraPreset: createCamera({ anchor: [0, 0.15, 0], cameraOffset: [0, 0.45, 8.8], cameraTravel: [0, 0, -1.8], lookOffset: [0, 0.15, -0.4] }),
      timing: createTiming({ tailCap: 0.92 }),
      propCast: [
        {
          model: 'ring',
          role: 'preview ring',
          motionPreset: 'orbit',
          materialPreset: createMaterial({ base: '#e7ffff', emissive: '#84eefe', metalness: 0.56, roughness: 0.22 }),
          placements: createArcPlacements(3, { radiusX: 1.8, radiusY: 0.7, centerY: 0.35, centerZ: -1.2, scale: 1.1 }),
        },
      ],
      effects: [
        { type: 'pulse-ring', color: '#84eefe', placements: createEffectArc(3, { radiusX: 1.8, radiusY: 0.7, centerY: 0.35, centerZ: -1.2, scale: 1.2 }) },
      ],
    },
    {
      id: 'nightlife',
      layout: { minHeight: '106svh' },
      mood: createTheme({
        accent: '#d8ff26',
        accentSoft: 'rgba(216, 255, 38, 0.16)',
        bgTop: '#17180c',
        bgMid: '#101107',
        bgBottom: '#090b05',
        glowA: 'rgba(216, 255, 38, 0.14)',
        glowC: 'rgba(255, 203, 156, 0.12)',
      }),
      contentHtml: `
        <div class="feature-grid">
          <div class="copy-stack">
            <p class="eyebrow">World 02 / PULLUP</p>
            <h2 class="section-title">Nightlife turned into a chapter-based stage world.</h2>
            <p class="section-copy">The PULLUP rebuild now uses cleaner hero composition, staged drop cards, a flagship performance scene, and a moodier memory lane.</p>
            <div class="pill-row"><span>Nightlife</span><span>Stage cones</span><span>Atmosphere</span></div>
            <a class="world-cta" href="./?world=pullup">Enter PULLUP</a>
          </div>
          <div class="preview-stage hide-mobile">
            <article class="preview-card preview-card--alpha"><span class="eyebrow">Intro</span><h3>Celebration</h3></article>
            <article class="preview-card preview-card--beta"><span class="eyebrow">Movement</span><h3>Hero mic stage</h3></article>
            <article class="preview-card preview-card--gamma"><span class="eyebrow">Gallery</span><h3>Suspended memory lane</h3></article>
          </div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#100f08', fillColor: '#d8ff26', keyColor: '#fff4d4', rimColor: '#ffcb9c' }),
      cameraPreset: createCamera({ anchor: [0, 0, -6], cameraOffset: [0, 0.45, 8.6], cameraTravel: [0.2, 0.1, -2], lookOffset: [0, 0.1, -6.5] }),
      timing: createTiming({ tailCap: 0.92 }),
      propCast: [
        {
          model: 'balloon',
          role: 'nightlife cue',
          motionPreset: 'hang',
          materialPreset: createMaterial({ base: '#f8ffd8', emissive: '#d8ff26', metalness: 0.12, roughness: 0.38 }),
          placements: createArcPlacements(3, { radiusX: 1.6, radiusY: 0.8, centerX: 1.1, centerY: 1.4, centerZ: -1.2, scale: 0.62, start: -0.8, end: 0.1 }),
        },
      ],
      effects: [
        { type: 'hero-glow-shell', color: '#d8ff26', placements: [{ x: 1.1, y: 1.25, z: -1.4, scale: 1.2 }] },
      ],
    },
    {
      id: 'luxury',
      layout: { minHeight: '106svh' },
      mood: createTheme({
        accent: '#f3d3a2',
        accentSoft: 'rgba(243, 211, 162, 0.14)',
        bgTop: '#17120e',
        bgMid: '#0f0b09',
        bgBottom: '#090705',
        glowA: 'rgba(243, 211, 162, 0.16)',
        glowC: 'rgba(255, 255, 255, 0.08)',
      }),
      contentHtml: `
        <div class="feature-grid">
          <div class="copy-stack">
            <p class="eyebrow">World 03 / Luxury</p>
            <h2 class="section-title">A premium object world for product-led campaigns.</h2>
            <p class="section-copy">Large hero object, restrained camera travel, warm sweeps, glints, and quieter typography.</p>
            <div class="pill-row"><span>Product</span><span>Material detail</span><span>Spec reveal</span></div>
            <a class="world-cta" href="./?world=luxury">Enter Luxury</a>
          </div>
          <div class="preview-stage hide-mobile">
            <article class="preview-card preview-card--alpha"><span class="eyebrow">Reveal</span><h3>Hero object</h3></article>
            <article class="preview-card preview-card--beta"><span class="eyebrow">Detail</span><h3>Material sweeps</h3></article>
            <article class="preview-card preview-card--gamma"><span class="eyebrow">Close</span><h3>Campaign landing</h3></article>
          </div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0f0c09', fillColor: '#f3d3a2', keyColor: '#fff6e7', rimColor: '#ffffff' }),
      cameraPreset: createCamera({ anchor: [0, 0, -12], cameraOffset: [0, 0.4, 8.7], cameraTravel: [0.1, 0, -1.7], lookOffset: [0, 0.05, -12.5] }),
      timing: createTiming({ tailCap: 0.92 }),
      propCast: [
        {
          model: 'bottle',
          role: 'luxury cue',
          motionPreset: 'float',
          materialPreset: createMaterial({ base: '#f7e8d5', emissive: '#f3d3a2', metalness: 0.38, roughness: 0.28 }),
          placements: [{ x: 0.8, y: 0.2, z: -1.7, scale: 1.1 }],
        },
      ],
      effects: [
        { type: 'spark-burst', color: '#f3d3a2', placements: [{ x: 0.8, y: 0.3, z: -1.7, scale: 1 }] },
      ],
    },
    {
      id: 'fashion',
      layout: { minHeight: '106svh' },
      mood: createTheme({
        accent: '#f6d7ff',
        accentSoft: 'rgba(246, 215, 255, 0.14)',
        bgTop: '#171018',
        bgMid: '#0f0a11',
        bgBottom: '#080609',
        glowA: 'rgba(246, 215, 255, 0.18)',
        glowC: 'rgba(157, 241, 255, 0.1)',
      }),
      contentHtml: `
        <div class="feature-grid">
          <div class="copy-stack">
            <p class="eyebrow">World 04 / Fashion</p>
            <h2 class="section-title">Editorial panels, runway passage, and framed image choreography.</h2>
            <p class="section-copy">This world pushes a more image-led rhythm: suspended panels, silhouette lighting, ribbons, and archive frames.</p>
            <div class="pill-row"><span>Editorial</span><span>Runway</span><span>Archive wall</span></div>
            <a class="world-cta" href="./?world=fashion">Enter Fashion</a>
          </div>
          <div class="preview-stage hide-mobile">
            <article class="preview-card preview-card--alpha"><span class="eyebrow">Cover</span><h3>Suspended panels</h3></article>
            <article class="preview-card preview-card--beta"><span class="eyebrow">Runway</span><h3>Frame choreography</h3></article>
            <article class="preview-card preview-card--gamma"><span class="eyebrow">Archive</span><h3>Campaign close</h3></article>
          </div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#100b12', fillColor: '#f6d7ff', keyColor: '#fff4ff', rimColor: '#9df1ff' }),
      cameraPreset: createCamera({ anchor: [0, 0, -18], cameraOffset: [0, 0.4, 8.8], cameraTravel: [0.2, 0, -1.8], lookOffset: [0, 0.1, -18.6] }),
      timing: createTiming({ tailCap: 0.92 }),
      propCast: [
        {
          model: 'plate',
          role: 'editorial panel',
          motionPreset: 'hang',
          materialPreset: createMaterial({ base: '#f4dbff', emissive: '#f6d7ff', metalness: 0.2, roughness: 0.16, opacity: 0.9 }),
          placements: createArcPlacements(3, { radiusX: 1.6, radiusY: 0.7, centerY: 0.2, centerZ: -1.8, scale: 1.05 }),
        },
      ],
      effects: [
        { type: 'ribbon-trail', color: '#f6d7ff', secondaryColor: '#9df1ff', placements: [{ x: 0, y: 0.1, z: -2, scale: 1.4 }] },
      ],
    },
  ],
}

export const mountLauncherWorld = (app: HTMLDivElement): void => {
  mountWorldDefinition(app, launcherWorld)
}

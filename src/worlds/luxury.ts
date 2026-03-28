import { mountWorldDefinition } from './shared/mount-world'
import {
  createArcPlacements,
  createBurstPlacements,
  createCamera,
  createEffectArc,
  createLauncherPreview,
  createLinePlacements,
  createMaterial,
  createMood,
  createTheme,
  createTiming,
} from './shared/presets'
import type { WorldDefinition } from './shared/types'

const luxuryTheme = createTheme({
  accent: '#f1cfa2',
  accentSoft: 'rgba(241, 207, 162, 0.16)',
  bgTop: '#17120e',
  bgMid: '#0f0b09',
  bgBottom: '#090705',
  glowA: 'rgba(241, 207, 162, 0.18)',
  glowB: 'rgba(255, 255, 255, 0.08)',
  glowC: 'rgba(255, 244, 223, 0.08)',
  washA: 'rgba(241, 207, 162, 0.12)',
  washB: 'rgba(255, 255, 255, 0.05)',
  washC: 'rgba(255, 244, 223, 0.08)',
})

const luxuryWorld: WorldDefinition = {
  id: 'luxury',
  label: 'Luxury',
  chromeLabel: 'World 03',
  headerMeta: 'Luxury / premium object storytelling',
  railLabel: 'Chapters',
  shellClassName: 'luxury-world',
  theme: luxuryTheme,
  launcherPreview: createLauncherPreview(
    'Enter World 03',
    'Premium product language with controlled camera travel and rich materials.',
    ['Premium object', 'Material sweeps', 'Spec reveal'],
  ),
  overlay: null,
  devicePolicy: {
    mobileLite: { hazeCount: 64, maxEffectInstances: 4, maxPropInstances: 4, pixelRatioCap: 1.05 },
  },
  chapters: [
    {
      id: 'reveal',
      layout: { minHeight: '118svh' },
      mood: luxuryTheme,
      contentHtml: `
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="eyebrow" data-world-intro>World 03 / Luxury</p>
            <h1 class="hero-title" data-world-intro>A premium object world with slower camera travel and richer material cues.</h1>
            <p class="section-copy" data-world-intro>
              This is the template for spirits, jewelry, auto detail, fragrance, and any product page that needs to feel expensive without becoming cold.
            </p>
            <div class="chip-row" data-world-intro>
              <span>Hero object</span>
              <span>Light sweep</span>
              <span>Material detail</span>
            </div>
            <a class="world-cta" data-world-intro href="#luxury-spec">See the system</a>
          </div>
          <div class="preview-stage hide-mobile" data-world-intro>
            <article class="preview-card preview-card--alpha"><span class="eyebrow">Reveal</span><h3>Hero object first.</h3></article>
            <article class="preview-card preview-card--beta"><span class="eyebrow">Detail</span><h3>Finish and craft.</h3></article>
            <article class="preview-card preview-card--gamma"><span class="eyebrow">Close</span><h3>Luxury campaign handoff.</h3></article>
          </div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0e0b09', fillColor: '#f1cfa2', keyColor: '#fff6e7', rimColor: '#fffdf8', fogDensity: 0.028 }),
      cameraPreset: createCamera({
        anchor: [0, 0.05, 0],
        cameraOffset: [0, 0.4, 8.8],
        cameraTravel: [0.1, 0, -1.6],
        lookOffset: [0, 0.05, -0.3],
      }),
      timing: createTiming({ tailCap: 0.9 }),
      propCast: [
        {
          model: 'bottle',
          role: 'hero bottle',
          motionPreset: 'float',
          materialPreset: createMaterial({ base: '#f8e8d7', emissive: '#f1cfa2', metalness: 0.34, roughness: 0.26 }),
          placements: [{ x: 0, y: -0.1, z: -1.4, scale: 1.65 }],
        },
        {
          model: 'ring',
          role: 'luxury halo',
          motionPreset: 'hang',
          materialPreset: createMaterial({ base: '#fff4df', emissive: '#fff4df', metalness: 0.68, roughness: 0.14 }),
          placements: [{ x: 0, y: 0.4, z: -1.8, scale: 1.32, rotX: 1.2 }],
        },
      ],
      effects: [
        { type: 'hero-glow-shell', color: '#f1cfa2', placements: [{ x: 0, y: 0.2, z: -1.6, scale: 1.7 }] },
        { type: 'spark-burst', color: '#fff4df', placements: [{ x: 0, y: 0.25, z: -1.4, scale: 0.92 }] },
      ],
    },
    {
      id: 'detail',
      layout: {},
      mood: createTheme({
        accent: '#edd9b8',
        accentSoft: 'rgba(237, 217, 184, 0.14)',
        bgTop: '#14100d',
        bgMid: '#0d0907',
        bgBottom: '#070504',
        glowA: 'rgba(237, 217, 184, 0.18)',
      }),
      contentHtml: `
        <div class="section-heading">
          <p class="eyebrow">Chapter 02</p>
          <h2 class="section-title">Use slower sweeps and glints instead of aggressive movement.</h2>
          <p class="section-copy">
            Luxury pages do not need to shout. The premium effect comes from restraint, layered lighting, and confidence in the object.
          </p>
        </div>
        <div class="card-grid">
          <article class="info-card"><span>Material</span><h3>Glass, metal, and specular edges.</h3><p class="body-copy">The shared material pipeline lets imported assets read consistently.</p></article>
          <article class="info-card"><span>Motion</span><h3>Minimal travel, maximum presence.</h3><p class="body-copy">Motion is used to reveal craft, not to create noise.</p></article>
          <article class="info-card"><span>Use case</span><h3>Fragrance, spirits, jewelry, auto.</h3><p class="body-copy">This world is designed to slot into premium commerce storytelling.</p></article>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0d0907', fillColor: '#edd9b8', keyColor: '#fff7ea', rimColor: '#f6ede2', fogDensity: 0.03 }),
      cameraPreset: createCamera({
        anchor: [0, 0, -6],
        cameraOffset: [0, 0.3, 8.4],
        cameraTravel: [0.2, 0.04, -1.4],
        lookOffset: [0, 0.05, -6.4],
      }),
      timing: createTiming({ tailCap: 0.9 }),
      propCast: [
        {
          model: 'orb',
          role: 'detail droplets',
          motionPreset: 'drift',
          materialPreset: createMaterial({ base: '#fff7ea', emissive: '#f1cfa2', metalness: 0.12, roughness: 0.08 }),
          placements: createBurstPlacements(6, { centerY: 0.1, centerZ: -2.1, radius: 1.8, scale: 0.28 }),
        },
        {
          model: 'bottle',
          role: 'secondary detail',
          motionPreset: 'hang',
          materialPreset: createMaterial({ base: '#f8e8d7', emissive: '#edd9b8', metalness: 0.3, roughness: 0.24 }),
          placements: createArcPlacements(2, { radiusX: 1.6, radiusY: 0.2, centerY: 0.1, centerZ: -2.4, scale: 0.68 }),
        },
      ],
      effects: [
        { type: 'spark-burst', color: '#fff7ea', placements: [{ x: 0, y: 0.1, z: -2.2, scale: 1.1 }] },
        { type: 'depth-haze-plane', color: '#edd9b8', placements: [{ x: 0, y: 0.1, z: -2.8, scale: 2.7 }] },
      ],
    },
    {
      id: 'precision',
      layout: { classes: ['feature-spec'], minHeight: '146svh' },
      mood: createTheme({
        accent: '#f6e7d0',
        accentSoft: 'rgba(246, 231, 208, 0.14)',
        bgTop: '#16110d',
        bgMid: '#0d0907',
        bgBottom: '#070504',
        glowA: 'rgba(246, 231, 208, 0.12)',
        glowC: 'rgba(241, 207, 162, 0.1)',
      }),
      contentHtml: `
        <div class="stage-grid" id="luxury-spec">
          <div class="copy-stack">
            <p class="eyebrow">Chapter 03</p>
            <h2 class="section-title">Precision systems, staged like a design presentation instead of a feature list.</h2>
            <p class="section-copy">
              The same builder can render a more technical middle chapter without breaking the emotional tone of the world.
            </p>
            <div class="metric-strip">
              <div class="metric-card"><span>Finish</span><strong>Polished PBR surfaces</strong></div>
              <div class="metric-card"><span>Motion</span><strong>Low-amplitude travel</strong></div>
              <div class="metric-card"><span>Atmosphere</span><strong>Warm glints + haze</strong></div>
            </div>
          </div>
          <div class="spec-grid">
            <article class="info-card"><span>01</span><h3>Material stack</h3><p class="body-copy">Consistent physical materials across imported models.</p></article>
            <article class="info-card"><span>02</span><h3>Device tiers</h3><p class="body-copy">Luxury still reads on mobile-lite without dragging desktop cost along.</p></article>
            <article class="info-card"><span>03</span><h3>Scene presets</h3><p class="body-copy">Camera, mood, prop cast, and effects are all declarative.</p></article>
          </div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0d0907', fillColor: '#f6e7d0', keyColor: '#fffaf0', rimColor: '#f1cfa2' }),
      cameraPreset: createCamera({
        anchor: [0, 0, -12],
        cameraOffset: [0, 0.35, 8.2],
        cameraTravel: [0.16, 0.08, -1.8],
        lookOffset: [0, 0.1, -12.4],
      }),
      timing: createTiming({ fadeOutStart: 0.88, tailCap: 0.92 }),
      propCast: [
        {
          model: 'ring',
          role: 'precision frame',
          motionPreset: 'orbit',
          materialPreset: createMaterial({ base: '#fff4df', emissive: '#f6e7d0', metalness: 0.74, roughness: 0.14 }),
          placements: createLinePlacements(3, { xFrom: -1.3, xTo: 1.3, y: 0.2, zFrom: -1.8, zTo: -3.4, scale: 0.92, scaleStep: 0.06 }),
        },
        {
          model: 'orb',
          role: 'glint nodes',
          motionPreset: 'swarm',
          materialPreset: createMaterial({ base: '#ffffff', emissive: '#f1cfa2', metalness: 0.08, roughness: 0.06 }),
          placements: createBurstPlacements(5, { centerY: 0.3, centerZ: -2.5, radius: 1.8, scale: 0.22 }),
        },
      ],
      effects: [
        { type: 'pulse-ring', color: '#f1cfa2', placements: createEffectArc(3, { radiusX: 1.5, radiusY: 0.4, centerY: 0.2, centerZ: -2.2, scale: 1.1 }) },
        { type: 'ribbon-trail', color: '#fff4df', secondaryColor: '#f1cfa2', placements: [{ x: 0, y: 0, z: -2.4, scale: 1.2 }] },
      ],
    },
    {
      id: 'gallery',
      layout: { minHeight: '144svh' },
      mood: createTheme({
        accent: '#f0d8c2',
        accentSoft: 'rgba(240, 216, 194, 0.14)',
        bgTop: '#15100d',
        bgMid: '#0d0908',
        bgBottom: '#060504',
        glowA: 'rgba(240, 216, 194, 0.16)',
        glowC: 'rgba(255, 255, 255, 0.06)',
      }),
      contentHtml: `
        <div class="section-heading">
          <p class="eyebrow">Chapter 04</p>
          <h2 class="section-title">Use the gallery as a spec reveal wall instead of a simple carousel.</h2>
          <p class="section-copy">The scene can hold product fragments, finish callouts, campaign stills, or technical highlights.</p>
        </div>
        <div class="archive-grid">
          <article class="archive-panel">
            <div class="archive-panel__visual"><img src="/worlds/pullup/6.jpg" alt="Material still" /></div>
            <div class="archive-panel__meta">Finish / satin reflection</div>
            <h3>Surface feels tactile.</h3>
          </article>
          <article class="archive-panel">
            <div class="archive-panel__visual"><img src="/worlds/pullup/7.jpg" alt="Craft still" /></div>
            <div class="archive-panel__meta">Craft / precision framing</div>
            <h3>Frames become product theatre.</h3>
          </article>
          <article class="archive-panel">
            <div class="archive-panel__visual"><img src="/worlds/pullup/8.jpg" alt="Campaign still" /></div>
            <div class="archive-panel__meta">Campaign / closing still</div>
            <h3>Luxury worlds can still hold media.</h3>
          </article>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0d0908', fillColor: '#f0d8c2', keyColor: '#fff8f1', rimColor: '#f1cfa2' }),
      cameraPreset: createCamera({
        anchor: [0, 0, -18],
        cameraOffset: [0, 0.4, 8.3],
        cameraTravel: [0.12, 0.05, -1.6],
        lookOffset: [0, 0.08, -18.4],
      }),
      timing: createTiming({ fadeOutStart: 0.9, tailCap: 0.92 }),
      propCast: [
        {
          model: 'martini',
          role: 'glass accents',
          motionPreset: 'hang',
          materialPreset: createMaterial({ base: '#fff4df', emissive: '#f0d8c2', metalness: 0.54, roughness: 0.18 }),
          placements: createArcPlacements(3, { radiusX: 1.8, radiusY: 0.65, centerY: 0.4, centerZ: -2.6, scale: 0.62 }),
        },
      ],
      effects: [
        { type: 'depth-haze-plane', color: '#f0d8c2', placements: [{ x: 0, y: 0.1, z: -2.8, scale: 2.8 }] },
      ],
    },
    {
      id: 'close',
      layout: { minHeight: '110svh' },
      mood: createTheme({
        accent: '#f7ead5',
        accentSoft: 'rgba(247, 234, 213, 0.14)',
        bgTop: '#16120e',
        bgMid: '#0d0908',
        bgBottom: '#060504',
        glowA: 'rgba(247, 234, 213, 0.18)',
      }),
      contentHtml: `
        <div class="two-up-grid">
          <div class="copy-stack">
            <p class="eyebrow">Chapter 05</p>
            <h2 class="section-title">Close like a campaign landing, not a technical demo.</h2>
            <p class="section-copy">Luxury worlds benefit from a final frame that feels composed enough to hand directly into a product CTA.</p>
            <div class="metric-strip">
              <div class="metric-card"><span>Style</span><strong>Controlled motion</strong></div>
              <div class="metric-card"><span>Atmosphere</span><strong>Warm sweep</strong></div>
              <div class="metric-card"><span>Use</span><strong>Premium launch</strong></div>
            </div>
          </div>
          <div class="wordmark">LUXURY</div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0d0908', fillColor: '#f7ead5', keyColor: '#fffaf2', rimColor: '#f1cfa2' }),
      cameraPreset: createCamera({
        anchor: [0, 0, -24],
        cameraOffset: [0, 0.35, 8.1],
        cameraTravel: [0, 0, -1.2],
        lookOffset: [0, 0.06, -24.4],
      }),
      timing: createTiming({ fadeOutStart: 1.04, fadeOutEnd: 1.08 }),
      propCast: [
        {
          model: 'orb',
          role: 'close glow',
          motionPreset: 'float',
          materialPreset: createMaterial({ base: '#fff7ea', emissive: '#f1cfa2', metalness: 0.1, roughness: 0.06 }),
          placements: [{ x: 0, y: 0.2, z: -2, scale: 0.84 }],
        },
      ],
      effects: [
        { type: 'hero-glow-shell', color: '#f7ead5', placements: [{ x: 0, y: 0.2, z: -2.2, scale: 1.5 }] },
      ],
    },
  ],
}

export const mountLuxuryWorld = (app: HTMLDivElement): void => {
  mountWorldDefinition(app, luxuryWorld)
}

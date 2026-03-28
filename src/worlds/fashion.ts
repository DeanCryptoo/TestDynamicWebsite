import { mountWorldDefinition } from './shared/mount-world'
import {
  createArcPlacements,
  createBurstPlacements,
  createCamera,
  createLauncherPreview,
  createLinePlacements,
  createMaterial,
  createMood,
  createTheme,
  createTiming,
} from './shared/presets'
import type { WorldDefinition } from './shared/types'

const fashionTheme = createTheme({
  accent: '#f4d8ff',
  accentSoft: 'rgba(244, 216, 255, 0.16)',
  bgTop: '#171018',
  bgMid: '#0f0a11',
  bgBottom: '#08060a',
  glowA: 'rgba(244, 216, 255, 0.18)',
  glowB: 'rgba(255, 255, 255, 0.07)',
  glowC: 'rgba(157, 241, 255, 0.1)',
  washA: 'rgba(244, 216, 255, 0.12)',
  washC: 'rgba(157, 241, 255, 0.1)',
})

const fashionWorld: WorldDefinition = {
  id: 'fashion',
  label: 'Fashion',
  chromeLabel: 'World 04',
  headerMeta: 'Fashion / editorial runway storytelling',
  railLabel: 'Chapters',
  shellClassName: 'fashion-world',
  theme: fashionTheme,
  launcherPreview: createLauncherPreview(
    'Enter World 04',
    'Editorial image-led storytelling with runway passage and archive framing.',
    ['Editorial', 'Runway', 'Archive wall'],
  ),
  overlay: null,
  devicePolicy: {
    mobileLite: { hazeCount: 68, maxEffectInstances: 4, maxPropInstances: 4, pixelRatioCap: 1.05 },
  },
  chapters: [
    {
      id: 'cover',
      layout: { minHeight: '120svh' },
      mood: fashionTheme,
      contentHtml: `
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="eyebrow" data-world-intro>World 04 / Fashion</p>
            <h1 class="hero-title" data-world-intro>Editorial panels, silhouette light, and a runway you scroll through.</h1>
            <p class="section-copy" data-world-intro>
              This world is built for collections, campaigns, artists, and studios that want image-first storytelling without defaulting to a static editorial grid.
            </p>
            <div class="chip-row" data-world-intro>
              <span>Cover frame</span>
              <span>Runway passage</span>
              <span>Archive wall</span>
            </div>
          </div>
          <div class="frame-stack hide-mobile" data-world-intro>
            <figure class="frame-stack__main poster-card poster-card--main">
              <img src="/worlds/pullup/6.jpg" alt="Editorial still" />
              <div class="frame-stack__label">Cover frame<br/>Suspended image panel.</div>
            </figure>
            <figure class="frame-stack__side poster-card poster-card--side">
              <img src="/worlds/pullup/7.jpg" alt="Editorial side still" />
            </figure>
          </div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#100b12', fillColor: '#f4d8ff', keyColor: '#fff4ff', rimColor: '#9df1ff' }),
      cameraPreset: createCamera({
        anchor: [0, 0.12, 0],
        cameraOffset: [0, 0.45, 8.8],
        cameraTravel: [0, 0, -1.6],
        lookOffset: [0, 0.12, -0.3],
      }),
      timing: createTiming({ tailCap: 0.92 }),
      propCast: [
        {
          model: 'plate',
          role: 'cover panels',
          motionPreset: 'hang',
          materialPreset: createMaterial({ base: '#f8e2ff', emissive: '#f4d8ff', metalness: 0.18, roughness: 0.12, opacity: 0.92 }),
          placements: createArcPlacements(3, { radiusX: 1.8, radiusY: 0.6, centerY: 0.2, centerZ: -1.8, scale: 1.06, start: -0.88, end: 0.88 }),
        },
      ],
      effects: [
        { type: 'hero-glow-shell', color: '#f4d8ff', placements: [{ x: 0, y: 0.1, z: -1.8, scale: 1.4 }] },
        { type: 'ribbon-trail', color: '#f4d8ff', secondaryColor: '#9df1ff', placements: [{ x: -0.6, y: 0.1, z: -1.8, scale: 1.4 }, { x: 0.8, y: -0.1, z: -1.8, scale: 1.3 }] },
      ],
    },
    {
      id: 'runway',
      layout: { minHeight: '148svh' },
      mood: createTheme({
        accent: '#ffe3f8',
        accentSoft: 'rgba(255, 227, 248, 0.14)',
        bgTop: '#151015',
        bgMid: '#0d090d',
        bgBottom: '#070507',
        glowA: 'rgba(255, 227, 248, 0.16)',
        glowC: 'rgba(157, 241, 255, 0.08)',
      }),
      contentHtml: `
        <div class="section-heading">
          <p class="eyebrow">Chapter 02</p>
          <h2 class="section-title">Run the user through a passage instead of showing a single static hero.</h2>
          <p class="section-copy">The scene becomes a runway with light cones and a procession of framed silhouettes.</p>
        </div>
        <div class="card-grid">
          <article class="info-card"><span>Passage</span><h3>Move through the scene.</h3><p class="body-copy">This is where editorial motion stops feeling decorative and becomes structural.</p></article>
          <article class="info-card"><span>Panels</span><h3>Frame choreography.</h3><p class="body-copy">The panels act like hanging looks rather than UI cards.</p></article>
          <article class="info-card"><span>Light</span><h3>Silhouette cues.</h3><p class="body-copy">Light cones and haze create the runway read without heavy post-processing.</p></article>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0d090d', fillColor: '#ffe3f8', keyColor: '#fff7fd', rimColor: '#9df1ff', fogDensity: 0.032 }),
      cameraPreset: createCamera({
        anchor: [0, 0, -6],
        cameraOffset: [0, 0.42, 8.5],
        cameraTravel: [0.14, 0.08, -2.4],
        lookOffset: [0, 0.08, -6.8],
        groupRotation: [0.02, 0.1, 0],
      }),
      timing: createTiming({ tailCap: 0.92 }),
      propCast: [
        {
          model: 'plate',
          role: 'runway frames',
          motionPreset: 'spiral',
          materialPreset: createMaterial({ base: '#ffe8fb', emissive: '#f4d8ff', metalness: 0.22, roughness: 0.14, opacity: 0.88 }),
          placements: createLinePlacements(5, { xFrom: -1.2, xTo: 1.2, y: 0.15, zFrom: -1.5, zTo: -5.8, scale: 0.92, scaleStep: 0.08 }),
        },
      ],
      effects: [
        { type: 'light-cone', color: '#ffe3f8', placements: [{ x: 0, y: 2.1, z: -2.2, scale: 1.5 }, { x: -1.6, y: 2, z: -3.6, scale: 1.2 }, { x: 1.6, y: 2, z: -3.6, scale: 1.2 }] },
        { type: 'depth-haze-plane', color: '#f4d8ff', placements: [{ x: 0, y: 0.1, z: -3.2, scale: 2.8 }] },
      ],
    },
    {
      id: 'editorial',
      layout: { minHeight: '144svh' },
      mood: createTheme({
        accent: '#f5c8ff',
        accentSoft: 'rgba(245, 200, 255, 0.14)',
        bgTop: '#160f16',
        bgMid: '#0d090e',
        bgBottom: '#070507',
        glowA: 'rgba(245, 200, 255, 0.18)',
        glowC: 'rgba(255, 255, 255, 0.06)',
      }),
      contentHtml: `
        <div class="stage-grid">
          <div class="copy-stack">
            <p class="eyebrow">Chapter 03</p>
            <h2 class="section-title">Build an editorial stack with copy and image blocks sharing the same scene rhythm.</h2>
            <p class="section-copy">This is the chapter for lookbook beats, pull quotes, collection notes, and controlled text/image contrast.</p>
          </div>
          <div class="spec-grid">
            <article class="info-card"><span>01</span><h3>Collection frame</h3><p class="body-copy">Use suspended imagery as part of the spatial composition.</p></article>
            <article class="info-card"><span>02</span><h3>Quote layer</h3><p class="body-copy">Large editorial text can sit in the scene without killing movement.</p></article>
            <article class="info-card"><span>03</span><h3>Shared presets</h3><p class="body-copy">This is still the same builder underneath, just with a different mood and cast.</p></article>
          </div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0d090e', fillColor: '#f5c8ff', keyColor: '#fff5ff', rimColor: '#ffffff' }),
      cameraPreset: createCamera({
        anchor: [0, 0, -12],
        cameraOffset: [0, 0.38, 8.2],
        cameraTravel: [0.1, 0.1, -1.8],
        lookOffset: [0, 0.1, -12.5],
      }),
      timing: createTiming({ tailCap: 0.92 }),
      propCast: [
        {
          model: 'plate',
          role: 'editorial stack',
          motionPreset: 'fan',
          materialPreset: createMaterial({ base: '#ffdffb', emissive: '#f5c8ff', metalness: 0.2, roughness: 0.12, opacity: 0.92 }),
          placements: createLinePlacements(4, { xFrom: -1.8, xTo: 1.8, y: 0.2, zFrom: -2.1, zTo: -3.4, scale: 0.98, scaleStep: 0.06 }),
        },
        {
          model: 'orb',
          role: 'flash points',
          motionPreset: 'swarm',
          materialPreset: createMaterial({ base: '#ffffff', emissive: '#ffffff', metalness: 0.06, roughness: 0.08 }),
          placements: createBurstPlacements(5, { centerY: 0.3, centerZ: -2.4, radius: 1.6, scale: 0.18 }),
        },
      ],
      effects: [
        { type: 'spark-burst', color: '#ffffff', placements: [{ x: 0, y: 0.2, z: -2.2, scale: 1 }] },
        { type: 'ribbon-trail', color: '#f5c8ff', secondaryColor: '#ffffff', placements: [{ x: 0, y: 0, z: -2.4, scale: 1.3 }] },
      ],
    },
    {
      id: 'archive',
      layout: { minHeight: '146svh' },
      mood: createTheme({
        accent: '#f0dfff',
        accentSoft: 'rgba(240, 223, 255, 0.14)',
        bgTop: '#150f14',
        bgMid: '#0d090c',
        bgBottom: '#070506',
        glowA: 'rgba(240, 223, 255, 0.16)',
        glowC: 'rgba(157, 241, 255, 0.08)',
      }),
      contentHtml: `
        <div class="section-heading">
          <p class="eyebrow">Chapter 04</p>
          <h2 class="section-title">Turn the lower section into an archive wall instead of a leftover gallery.</h2>
          <p class="section-copy">This is where a campaign can stage editorials, detail crops, backstage stills, or a collection archive.</p>
        </div>
        <div class="archive-grid">
          <article class="archive-panel">
            <div class="archive-panel__visual"><img src="/worlds/pullup/1.jpg" alt="Archive 1" /></div>
            <div class="archive-panel__meta">Archive / cover still</div>
            <h3>Lead with one strong silhouette.</h3>
          </article>
          <article class="archive-panel">
            <div class="archive-panel__visual"><img src="/worlds/pullup/2.jpg" alt="Archive 2" /></div>
            <div class="archive-panel__meta">Archive / motion frame</div>
            <h3>Then layer movement and blur.</h3>
          </article>
          <article class="archive-panel">
            <div class="archive-panel__visual"><img src="/worlds/pullup/3.jpg" alt="Archive 3" /></div>
            <div class="archive-panel__meta">Archive / backstage note</div>
            <h3>Finish with a more intimate frame.</h3>
          </article>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0d090c', fillColor: '#f0dfff', keyColor: '#fff7ff', rimColor: '#9df1ff' }),
      cameraPreset: createCamera({
        anchor: [0, 0, -18],
        cameraOffset: [0, 0.36, 8.1],
        cameraTravel: [0.1, 0.05, -1.6],
        lookOffset: [0, 0.08, -18.5],
      }),
      timing: createTiming({ tailCap: 0.92 }),
      propCast: [
        {
          model: 'plate',
          role: 'archive walls',
          motionPreset: 'hang',
          materialPreset: createMaterial({ base: '#f7e8ff', emissive: '#f0dfff', metalness: 0.2, roughness: 0.14, opacity: 0.88 }),
          placements: createArcPlacements(3, { radiusX: 1.9, radiusY: 0.5, centerY: 0.35, centerZ: -2.6, scale: 0.98 }),
        },
      ],
      effects: [
        { type: 'depth-haze-plane', color: '#f0dfff', placements: [{ x: 0, y: 0.1, z: -2.8, scale: 2.8 }] },
      ],
    },
    {
      id: 'close',
      layout: { minHeight: '110svh' },
      mood: createTheme({
        accent: '#ffffff',
        accentSoft: 'rgba(255, 255, 255, 0.12)',
        bgTop: '#120e12',
        bgMid: '#0b080b',
        bgBottom: '#050405',
        glowA: 'rgba(255, 255, 255, 0.12)',
        glowC: 'rgba(244, 216, 255, 0.08)',
      }),
      contentHtml: `
        <div class="two-up-grid">
          <div class="copy-stack">
            <p class="eyebrow">Chapter 05</p>
            <h2 class="section-title">Close with a campaign mark and a frame that still feels editorial.</h2>
            <p class="section-copy">The same builder can hold a stronger visual identity here: collection names, artist names, or a studio sign-off.</p>
            <div class="metric-strip">
              <div class="metric-card"><span>Use</span><strong>Collection launch</strong></div>
              <div class="metric-card"><span>Use</span><strong>Editorial campaign</strong></div>
              <div class="metric-card"><span>Use</span><strong>Creative studio site</strong></div>
            </div>
          </div>
          <div class="wordmark">FASHION</div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0b080b', fillColor: '#ffffff', keyColor: '#ffffff', rimColor: '#f4d8ff' }),
      cameraPreset: createCamera({
        anchor: [0, 0, -24],
        cameraOffset: [0, 0.34, 8.1],
        cameraTravel: [0, 0, -1.2],
        lookOffset: [0, 0.08, -24.4],
      }),
      timing: createTiming({ fadeOutStart: 1.04, fadeOutEnd: 1.08 }),
      propCast: [
        {
          model: 'orb',
          role: 'final flash',
          motionPreset: 'float',
          materialPreset: createMaterial({ base: '#ffffff', emissive: '#f4d8ff', metalness: 0.08, roughness: 0.08 }),
          placements: [{ x: 0, y: 0.15, z: -2.1, scale: 0.82 }],
        },
      ],
      effects: [
        { type: 'hero-glow-shell', color: '#ffffff', placements: [{ x: 0, y: 0.15, z: -2.2, scale: 1.4 }] },
      ],
    },
  ],
}

export const mountFashionWorld = (app: HTMLDivElement): void => {
  mountWorldDefinition(app, fashionWorld)
}

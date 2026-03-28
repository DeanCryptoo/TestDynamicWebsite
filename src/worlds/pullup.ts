import { mountWorldDefinition } from './shared/mount-world'
import {
  createArcPlacements,
  createCamera,
  createEffectArc,
  createEffectLine,
  createLauncherPreview,
  createLinePlacements,
  createMaterial,
  createMood,
  createTheme,
  createTiming,
} from './shared/presets'
import type { WorldDefinition } from './shared/types'

const pullupTheme = createTheme({
  accent: '#d8ff26',
  accentSoft: 'rgba(216, 255, 38, 0.16)',
  bgTop: '#18190c',
  bgMid: '#101208',
  bgBottom: '#0a0c06',
  glowA: 'rgba(216, 255, 38, 0.16)',
  glowB: 'rgba(255, 255, 255, 0.06)',
  glowC: 'rgba(255, 173, 131, 0.12)',
  washA: 'rgba(216, 255, 38, 0.12)',
  washC: 'rgba(255, 173, 131, 0.12)',
})

const pullupWorld: WorldDefinition = {
  id: 'pullup',
  label: 'PULLUP',
  chromeLabel: 'World 02',
  headerMeta: 'PULLUP / nightlife campaign system',
  railLabel: 'Scenes',
  shellClassName: 'pullup-world',
  theme: pullupTheme,
  launcherPreview: createLauncherPreview(
    'Enter World 02',
    'Nightlife storytelling with a cleaner chapter system and a flagship performance scene.',
    ['Nightlife', 'Stage energy', 'Cinematic gallery'],
  ),
  overlay: null,
  devicePolicy: {
    desktop: { maxPropInstances: 7, maxEffectInstances: 8 },
    tablet: { maxPropInstances: 5, maxEffectInstances: 6 },
    mobileLite: { hazeCount: 72, maxEffectInstances: 4, maxPropInstances: 4, pixelRatioCap: 1.05 },
  },
  chapters: [
    {
      id: 'intro',
      layout: { minHeight: '118svh' },
      mood: pullupTheme,
      contentHtml: `
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="eyebrow" data-world-intro>World 02 / PULLUP</p>
            <img class="logo-lockup" data-world-intro src="/worlds/pullup/logo.png" alt="PULLUP logo" />
            <h1 class="hero-title" data-world-intro>Convert a nightlife brand into a cinematic scroll world without losing the raw energy.</h1>
            <p class="section-copy" data-world-intro>
              The first fold stays cleaner now: logo, message, and brand facts up front while the scene behind it sells celebration instead of generic space.
            </p>
            <div class="stat-strip" data-world-intro>
              <div class="stat-card"><span>Reach</span><strong>100k+</strong></div>
              <div class="stat-card"><span>Night flow</span><strong>1k+ guests</strong></div>
              <div class="stat-card"><span>Since</span><strong>2019</strong></div>
            </div>
            <div class="chip-row" data-world-intro>
              <span>HipHop</span>
              <span>Afro</span>
              <span>Latin</span>
              <span>Trap</span>
              <span>Community First</span>
            </div>
          </div>
          <div class="frame-stack hide-mobile" data-world-intro>
            <figure class="frame-stack__main poster-card--main poster-card">
              <img src="/worlds/pullup/1.jpg" alt="PULLUP main room" />
              <div class="frame-stack__label">Main room energy<br/>Poster stack, not a boxed hero card.</div>
            </figure>
            <figure class="frame-stack__side poster-card--side poster-card">
              <img src="/worlds/pullup/2.jpg" alt="PULLUP crowd energy" />
            </figure>
          </div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#101106', fillColor: '#d8ff26', keyColor: '#fff6d8', rimColor: '#ffe5b4' }),
      cameraPreset: createCamera({
        anchor: [0.2, 0.1, 0],
        cameraOffset: [0.2, 0.5, 8.6],
        cameraTravel: [0.1, 0.1, -1.8],
        lookOffset: [0, 0.2, -0.4],
      }),
      timing: createTiming({ tailCap: 0.92, fadeOutStart: 0.86 }),
      propCast: [
        {
          model: 'balloon',
          role: 'celebration cluster',
          motionPreset: 'hang',
          materialPreset: createMaterial({ base: '#f3ffd0', emissive: '#d8ff26', metalness: 0.18, roughness: 0.34 }),
          placements: createArcPlacements(4, { radiusX: 2.2, radiusY: 1.1, centerX: 1.4, centerY: 1.55, centerZ: -1.2, scale: 0.74, start: -0.9, end: 0.2 }),
        },
        {
          model: 'discoBall',
          role: 'glint anchor',
          motionPreset: 'float',
          materialPreset: createMaterial({ base: '#fbfff2', emissive: '#d8ff26', metalness: 0.86, roughness: 0.12 }),
          placements: [{ x: -1.9, y: 1.2, z: -2.2, scale: 0.46 }],
          qualityRules: { hideOn: ['mobileLite'] },
        },
      ],
      effects: [
        { type: 'hero-glow-shell', color: '#d8ff26', placements: [{ x: 1.2, y: 1.4, z: -1.6, scale: 1.5 }] },
        { type: 'spark-burst', color: '#fff9bd', placements: [{ x: 1.1, y: 1.3, z: -1.4, scale: 1.1 }] },
        { type: 'depth-haze-plane', color: '#cfff55', placements: [{ x: 0.8, y: 0.2, z: -2.4, scale: 2.6 }] },
      ],
    },
    {
      id: 'events',
      layout: { minHeight: '148svh' },
      mood: createTheme({
        accent: '#ffcb9c',
        accentSoft: 'rgba(255, 203, 156, 0.12)',
        bgTop: '#181107',
        bgMid: '#110c06',
        bgBottom: '#080604',
        glowA: 'rgba(255, 203, 156, 0.17)',
        glowC: 'rgba(216, 255, 38, 0.1)',
      }),
      contentHtml: `
        <div class="section-heading">
          <p class="eyebrow">Scene 02</p>
          <h2 class="section-title">Upcoming nights become a tunnel of drops, scarcity, and momentum.</h2>
          <p class="section-copy">
            The first event anchors the chapter, the others support it, and on mobile the whole set becomes a carousel instead of a giant scroll block.
          </p>
        </div>
        <div class="drop-grid">
          <article class="drop-card drop-card--feature">
            <div class="drop-card__visual">
              <img src="/worlds/pullup/1.jpg" alt="Berlin event" />
              <div class="drop-card__meta">Flagship drop</div>
            </div>
            <div class="drop-card__body">
              <div class="drop-card__top"><span>Berlin / Kraftwerk</span><span>24 Oct</span></div>
              <h3>Main room pressure.</h3>
              <p class="body-copy">A headline event card with enough space for venue, timing, and the idea of demand.</p>
              <div class="drop-card__foot"><span>DJ EZ / Skepta / Pullup Soundsystem</span><a class="drop-card__action" href="https://linktr.ee/pullup_ofc" target="_blank" rel="noreferrer">Open drop</a></div>
            </div>
          </article>
          <article class="drop-card">
            <div class="drop-card__visual"><img src="/worlds/pullup/2.jpg" alt="Hamburg event" /></div>
            <div class="drop-card__body"><div class="drop-card__top"><span>Hamburg</span><span>08 Nov</span></div><h3>North circuit.</h3><p class="body-copy">Uebel &amp; Gefaehrlich with a darker room and a tighter line.</p></div>
          </article>
          <article class="drop-card">
            <div class="drop-card__visual"><img src="/worlds/pullup/3.jpg" alt="Koeln event" /></div>
            <div class="drop-card__body"><div class="drop-card__top"><span>Koeln</span><span>15 Dec</span></div><h3>Crew takeover.</h3><p class="body-copy">Bootshaus energy framed more like a drop than a poster wall.</p></div>
          </article>
          <article class="drop-card">
            <div class="drop-card__visual"><img src="/worlds/pullup/4.jpg" alt="Muenchen event" /></div>
            <div class="drop-card__body"><div class="drop-card__top"><span>Muenchen</span><span>31 Dec</span></div><h3>New year close.</h3><p class="body-copy">The final event card lands like a season close instead of another listing row.</p></div>
          </article>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#100b06', fillColor: '#ffcb9c', keyColor: '#ffe9dd', rimColor: '#d8ff26', fogDensity: 0.036 }),
      cameraPreset: createCamera({
        anchor: [0.1, -0.15, -6],
        cameraOffset: [0, 0.45, 8.8],
        cameraTravel: [0.2, 0, -2.2],
        lookOffset: [0, 0.1, -6.6],
        groupRotation: [0.03, 0.15, 0.02],
      }),
      timing: createTiming({ fadeOutStart: 0.9, tailCap: 0.92 }),
      propCast: [
        {
          model: 'bottle',
          role: 'drop markers',
          motionPreset: 'spiral',
          materialPreset: createMaterial({ base: '#f5e7d5', emissive: '#ffcb9c', metalness: 0.22, roughness: 0.54 }),
          placements: createLinePlacements(4, { xFrom: -1.5, xTo: 1.5, y: 0.45, zFrom: -1.5, zTo: -5.2, scale: 0.82, scaleStep: 0.06 }),
        },
      ],
      effects: [
        { type: 'pulse-ring', color: '#ffcb9c', placements: createEffectLine(4, { xFrom: -1.6, xTo: 1.6, y: 0.1, z: -3.2, scale: 1.2 }) },
        { type: 'spark-burst', color: '#d8ff26', placements: [{ x: 0.3, y: 0.5, z: -2.6, scale: 1.2 }] },
        { type: 'depth-haze-plane', color: '#ffc48d', placements: [{ x: 0, y: 0.1, z: -3.8, scale: 2.8 }] },
      ],
    },
    {
      id: 'movement',
      layout: { minHeight: '154svh' },
      mood: createTheme({
        accent: '#8df3ff',
        accentSoft: 'rgba(141, 243, 255, 0.12)',
        bgTop: '#0c1414',
        bgMid: '#091011',
        bgBottom: '#060809',
        glowA: 'rgba(141, 243, 255, 0.16)',
        glowC: 'rgba(216, 255, 38, 0.1)',
      }),
      contentHtml: `
        <div class="stage-grid">
          <div class="section-copy-block">
            <p class="eyebrow">Scene 03</p>
            <h2 class="section-title">Keep the community angle, but give it a real performance space.</h2>
            <p class="section-copy">
              This is the flagship chapter now: one hero mic, a few supporting mics, and enough haze, cone light,
              and pulse to feel like entering a stage instead of passing another product cluster.
            </p>
            <div class="metric-strip">
              <div class="metric-card"><span>Anchor</span><strong>Hero microphone</strong></div>
              <div class="metric-card"><span>Support</span><strong>3 stage mics</strong></div>
              <div class="metric-card"><span>Atmosphere</span><strong>Pulse + cones + haze</strong></div>
            </div>
          </div>
          <figure class="memory-card hide-mobile">
            <div class="memory-card__visual"><img src="/worlds/pullup/5.jpg" alt="PULLUP performance still" /></div>
            <div class="memory-card__body"><span>PULLUP movie</span><h3>The movement begins.</h3><p class="body-copy">The media still matters, but the world behind it now feels staged.</p></div>
          </figure>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#081012', fillColor: '#8df3ff', keyColor: '#f4ffff', rimColor: '#d8ff26', fogDensity: 0.034 }),
      cameraPreset: createCamera({
        anchor: [0, -0.2, -12.5],
        cameraOffset: [0, 0.65, 8.5],
        cameraTravel: [0.3, 0.15, -2.8],
        lookOffset: [0, 0.1, -13.6],
        lookTravel: [0, 0.18, -0.8],
        groupRotation: [0.02, -0.12, 0],
      }),
      timing: createTiming({ fadeOutStart: 0.9, tailCap: 0.94 }),
      propCast: [
        {
          model: 'microphone',
          role: 'hero mic',
          motionPreset: 'stage-rise',
          materialPreset: createMaterial({ base: '#f1f0ea', emissive: '#8df3ff', metalness: 0.58, roughness: 0.18 }),
          placements: [{ x: 0, y: -0.55, z: -1.6, scale: 1.45, rotY: 0.1 }],
        },
        {
          model: 'microphone',
          role: 'support mics',
          motionPreset: 'orbit',
          materialPreset: createMaterial({ base: '#f1f0ea', emissive: '#d8ff26', metalness: 0.54, roughness: 0.22 }),
          placements: createArcPlacements(3, { radiusX: 2, radiusY: 0.5, centerY: -0.05, centerZ: -2.3, scale: 0.72, start: -0.86, end: 0.86 }),
        },
      ],
      effects: [
        { type: 'light-cone', color: '#8df3ff', placements: [{ x: 0, y: 2.1, z: -1.8, scale: 1.7 }, { x: -1.5, y: 2, z: -2.4, scale: 1.2 }, { x: 1.5, y: 2, z: -2.4, scale: 1.2 }] },
        { type: 'pulse-ring', color: '#d8ff26', placements: createEffectArc(3, { radiusX: 1.6, radiusY: 0.2, centerY: -0.4, centerZ: -1.8, scale: 1.2 }) },
        { type: 'spark-burst', color: '#8df3ff', placements: [{ x: 0, y: 0.3, z: -1.6, scale: 1.3 }] },
        { type: 'depth-haze-plane', color: '#8df3ff', placements: [{ x: 0, y: 0.2, z: -2.6, scale: 3 }] },
      ],
    },
    {
      id: 'gallery',
      layout: { minHeight: '148svh' },
      mood: createTheme({
        accent: '#f5aaff',
        accentSoft: 'rgba(245, 170, 255, 0.14)',
        bgTop: '#17101a',
        bgMid: '#100a12',
        bgBottom: '#09060b',
        glowA: 'rgba(245, 170, 255, 0.18)',
        glowC: 'rgba(141, 243, 255, 0.1)',
      }),
      contentHtml: `
        <div class="section-heading">
          <p class="eyebrow">Scene 04</p>
          <h2 class="section-title">Turn the gallery into a suspended memory lane.</h2>
          <p class="section-copy">
            The frames slow down here. This chapter is less about velocity and more about atmosphere, recall, and hang time.
          </p>
        </div>
        <div class="memory-grid">
          <article class="memory-card">
            <div class="memory-card__visual"><img src="/worlds/pullup/6.jpg" alt="Crowd pressure" /></div>
            <div class="memory-card__body"><span>Crowd pressure</span><h3>Phones up when the drop lands.</h3><p class="body-copy">The room compresses and the lights flatten into streaks.</p></div>
          </article>
          <article class="memory-card">
            <div class="memory-card__visual"><img src="/worlds/pullup/7.jpg" alt="After-dark warmup" /></div>
            <div class="memory-card__body"><span>Warmup</span><h3>The room tightens slowly.</h3><p class="body-copy">This stage keeps the archive feeling cinematic instead of social.</p></div>
          </article>
          <article class="memory-card">
            <div class="memory-card__visual"><img src="/worlds/pullup/8.jpg" alt="Back-room blur" /></div>
            <div class="memory-card__body"><span>Back room blur</span><h3>Leave the memory hanging.</h3><p class="body-copy">The final frame feels like a room you just walked out of.</p></div>
          </article>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#100a14', fillColor: '#f5aaff', keyColor: '#fff0fa', rimColor: '#8df3ff' }),
      cameraPreset: createCamera({
        anchor: [0, 0.1, -20],
        cameraOffset: [0, 0.4, 8.4],
        cameraTravel: [0.2, 0.1, -2.2],
        lookOffset: [0, 0.2, -20.8],
        groupRotation: [0.04, 0.1, 0],
      }),
      timing: createTiming({ fadeOutStart: 0.9, tailCap: 0.92 }),
      propCast: [
        {
          model: 'discoBall',
          role: 'memory glints',
          motionPreset: 'hang',
          materialPreset: createMaterial({ base: '#faf4ff', emissive: '#f5aaff', metalness: 0.88, roughness: 0.16 }),
          placements: createArcPlacements(3, { radiusX: 2.2, radiusY: 0.8, centerY: 1.05, centerZ: -2.8, scale: 0.54 }),
        },
      ],
      effects: [
        { type: 'ribbon-trail', color: '#f5aaff', secondaryColor: '#8df3ff', placements: [{ x: -1.4, y: 0.2, z: -2.6, scale: 1.4 }, { x: 1.3, y: -0.2, z: -2.4, scale: 1.4 }] },
        { type: 'depth-haze-plane', color: '#f5aaff', placements: [{ x: 0, y: 0.1, z: -3.1, scale: 2.8 }] },
      ],
    },
    {
      id: 'contact',
      layout: { minHeight: '116svh' },
      mood: createTheme({
        accent: '#ffe5b6',
        accentSoft: 'rgba(255, 229, 182, 0.14)',
        bgTop: '#17120d',
        bgMid: '#0e0b08',
        bgBottom: '#080604',
        glowA: 'rgba(255, 229, 182, 0.18)',
        glowC: 'rgba(216, 255, 38, 0.08)',
      }),
      contentHtml: `
        <div class="two-up-grid">
          <div class="copy-stack">
            <p class="eyebrow">Scene 05</p>
            <h2 class="section-title">End with the brand mark and a quieter social layer.</h2>
            <p class="section-copy">
              The links should feel like part of the atmosphere, not a block of buttons shouting for attention.
            </p>
            <div class="social-strip">
              <a class="social-ghost" href="https://www.instagram.com/pullup_ofc/" target="_blank" rel="noreferrer"><span>01 / Feed</span><strong>Instagram</strong></a>
              <a class="social-ghost" href="https://www.tiktok.com/@pullup.ofc" target="_blank" rel="noreferrer"><span>02 / Rushes</span><strong>TikTok</strong></a>
              <a class="social-ghost" href="https://www.youtube.com/@pullup_ofc" target="_blank" rel="noreferrer"><span>03 / Archive</span><strong>YouTube</strong></a>
              <a class="social-ghost" href="https://www.whatsapp.com/channel/0029Vb3YnJV35fM3V9GMNc0q" target="_blank" rel="noreferrer"><span>04 / Line</span><strong>Community</strong></a>
            </div>
          </div>
          <div class="wordmark">PULLUP</div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0d0a07', fillColor: '#ffe5b6', keyColor: '#fff9ea', rimColor: '#d8ff26' }),
      cameraPreset: createCamera({
        anchor: [0, 0.15, -26],
        cameraOffset: [0, 0.45, 8.2],
        cameraTravel: [0, 0, -1.6],
        lookOffset: [0, 0.1, -27],
      }),
      timing: createTiming({ fadeOutStart: 1.04, fadeOutEnd: 1.08 }),
      propCast: [
        {
          model: 'martini',
          role: 'close prop',
          motionPreset: 'float',
          materialPreset: createMaterial({ base: '#fbf0d9', emissive: '#ffe5b6', metalness: 0.5, roughness: 0.24 }),
          placements: createArcPlacements(3, { radiusX: 1.5, radiusY: 0.6, centerY: 0.2, centerZ: -2.2, scale: 0.72 }),
        },
      ],
      effects: [
        { type: 'hero-glow-shell', color: '#ffe5b6', placements: [{ x: 0, y: 0.2, z: -2.4, scale: 1.5 }] },
        { type: 'spark-burst', color: '#d8ff26', placements: [{ x: 0, y: 0.2, z: -2.1, scale: 1 }] },
      ],
    },
  ],
}

export const mountPullupWorld = (app: HTMLDivElement): void => {
  mountWorldDefinition(app, pullupWorld)
}

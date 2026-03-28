import { mountWorldDefinition } from './shared/mount-world'
import {
  createArcPlacements,
  createBurstPlacements,
  createCamera,
  createEffectArc,
  createEffectLine,
  createLinePlacements,
  createLauncherPreview,
  createMaterial,
  createMood,
  createTheme,
  createTiming,
} from './shared/presets'
import type { WorldDefinition } from './shared/types'

const theme = createTheme({
  accent: '#86f3ff',
  accentSoft: 'rgba(134, 243, 255, 0.16)',
  bgTop: '#0d151b',
  bgMid: '#0b0f16',
  bgBottom: '#07090e',
  glowA: 'rgba(134, 243, 255, 0.2)',
  glowC: 'rgba(255, 165, 104, 0.15)',
})

const storyMotionWorld: WorldDefinition = {
  id: 'story-motion',
  label: 'Abstract Studio',
  chromeLabel: 'World 01',
  headerMeta: 'Abstract Studio / cinematic system range demo',
  railLabel: 'Chapters',
  shellClassName: 'story-motion-world',
  theme,
  launcherPreview: createLauncherPreview(
    'Enter World 01',
    'Abstract studio language to demonstrate transitions, scene swaps, and pinned overlays.',
    ['Portal travel', 'Mood shifts', 'System first'],
  ),
  overlay: {
    type: 'card-stack',
    triggerChapter: 'sequence',
    handoffChapter: 'launch',
    cards: [
      {
        label: 'Beat 01',
        title: 'Frame the world.',
        body: 'Overlay cards lock to the same chapter timeline instead of popping in as unrelated UI.',
      },
      {
        label: 'Beat 02',
        title: 'Shift the camera.',
        body: 'The stack rides the scene handoff so DOM and WebGL feel authored together.',
      },
      {
        label: 'Beat 03',
        title: 'Land the reveal.',
        body: 'The final card arrives with restraint while the world keeps moving underneath.',
      },
    ],
  },
  devicePolicy: {
    mobileLite: {
      enableBlur: false,
      hazeCount: 90,
      maxEffectInstances: 5,
      maxPropInstances: 5,
      pixelRatioCap: 1.1,
    },
  },
  chapters: [
    {
      id: 'hero',
      layout: { classes: ['chapter-hero'] },
      mood: theme,
      copy: { eyebrow: 'Chapter 01', title: 'Open with a signal.' },
      contentHtml: `
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="eyebrow" data-world-intro>Chapter 01</p>
            <h1 class="hero-title" data-world-intro>Open with a signal. Pull them into a world.</h1>
            <p class="section-copy" data-world-intro>
              This world stays abstract on purpose. It proves the engine can swap palettes, object language,
              camera travel, and overlays without changing the core architecture.
            </p>
            <div class="chip-row" data-world-intro>
              <span>Portal travel</span>
              <span>Scene swaps</span>
              <span>Overlay stage</span>
              <span>Reusable engine</span>
            </div>
            <div class="stat-strip" data-world-intro>
              <div class="stat-card"><span>Mode</span><strong>Abstract studio</strong></div>
              <div class="stat-card"><span>Build</span><strong>World builder</strong></div>
              <div class="stat-card"><span>Use</span><strong>Client pitches</strong></div>
            </div>
          </div>
          <div class="preview-stage hide-mobile" data-world-intro>
            <article class="preview-card preview-card--alpha">
              <span class="eyebrow">Scene range</span>
              <h3>From signal to launch.</h3>
              <p class="body-copy">Every section shifts the palette and the spatial grammar.</p>
            </article>
            <article class="preview-card preview-card--beta">
              <span class="eyebrow">Camera path</span>
              <h3>Travel instead of scroll.</h3>
              <p class="body-copy">The sections behave like destinations, not blocks on a page.</p>
            </article>
            <article class="preview-card preview-card--gamma">
              <span class="eyebrow">Reusable</span>
              <h3>Swap the world, keep the engine.</h3>
              <p class="body-copy">The builder can be used as the base for different verticals.</p>
            </article>
          </div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#091017', fillColor: '#87efff', keyColor: '#fff0d0', rimColor: '#73d1ff' }),
      cameraPreset: createCamera({
        anchor: [0, 0.15, 0],
        cameraOffset: [0, 0.4, 8.9],
        cameraTravel: [0, 0.1, -2.1],
        lookOffset: [0, 0.15, 0],
      }),
      timing: createTiming({ tailCap: 0.9 }),
      propCast: [
        {
          model: 'orb',
          role: 'signal core',
          motionPreset: 'float',
          materialPreset: createMaterial({ base: '#dffcff', emissive: '#5bdfff', metalness: 0.28, roughness: 0.18 }),
          placements: [{ x: 0, y: 0.4, z: -0.4, scale: 2.1 }],
        },
        {
          model: 'ring',
          role: 'entry rings',
          motionPreset: 'orbit',
          materialPreset: createMaterial({ base: '#fff4d7', emissive: '#8cf0ff', metalness: 0.52, roughness: 0.26 }),
          placements: createArcPlacements(3, { radiusX: 1.6, radiusY: 0.6, centerY: 0.4, centerZ: -0.6, scale: 1.05 }),
        },
      ],
      effects: [
        { type: 'hero-glow-shell', color: '#8cf0ff', placements: [{ x: 0, y: 0.35, z: -0.8, scale: 1.7 }] },
        { type: 'pulse-ring', color: '#8cf0ff', placements: createEffectArc(3, { radiusX: 1.8, radiusY: 0.8, centerY: 0.4, centerZ: -0.6, scale: 1.2 }) },
        { type: 'depth-haze-plane', color: '#82f0ff', placements: [{ x: 0, y: 0.1, z: -2.2, scale: 2.4 }] },
      ],
    },
    {
      id: 'portal',
      layout: {},
      mood: createTheme({
        accent: '#ffc08d',
        accentSoft: 'rgba(255, 192, 141, 0.14)',
        bgTop: '#140f12',
        bgMid: '#0e0b10',
        bgBottom: '#08070c',
        glowA: 'rgba(255, 192, 141, 0.18)',
        glowC: 'rgba(118, 244, 255, 0.14)',
      }),
      contentHtml: `
        <div class="section-heading">
          <p class="eyebrow">Chapter 02</p>
          <h2 class="section-title">Stop scrolling like a document. Start moving like a camera.</h2>
          <p class="section-copy">
            This chapter becomes a tunnel. It is the cleanest proof that a section change can feel like a new physical space.
          </p>
        </div>
        <div class="card-grid">
          <article class="info-card"><span>Signal</span><h3>Wake the scene first.</h3><p class="body-copy">The first prop establishes mood before the copy becomes dense.</p></article>
          <article class="info-card"><span>Pull</span><h3>Hand off mid-scroll.</h3><p class="body-copy">The palette and camera route change while the page is still moving.</p></article>
          <article class="info-card"><span>Land</span><h3>Arrive with motion already active.</h3><p class="body-copy">The next chapter reads as a destination instead of a fade.</p></article>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#110d12', fillColor: '#ffbb84', keyColor: '#ffe4d5', rimColor: '#8ff2ff', fogDensity: 0.036 }),
      cameraPreset: createCamera({
        anchor: [0, 0, -5],
        cameraOffset: [0, 0.2, 8.3],
        cameraTravel: [0, 0, -3.8],
        lookOffset: [0, 0.1, -4],
        lookTravel: [0, 0, -3.2],
        groupRotation: [0.08, 0.22, 0.06],
      }),
      timing: createTiming({ tailCap: 0.88, tailStart: 0.6 }),
      propCast: [
        {
          model: 'ring',
          role: 'portal gate',
          motionPreset: 'spiral',
          materialPreset: createMaterial({ base: '#ffd3b0', emissive: '#ffb775', metalness: 0.62, roughness: 0.24 }),
          placements: createLinePlacements(5, { xFrom: -1.2, xTo: 1.2, y: 0, zFrom: -1, zTo: -6.5, scale: 1.05, scaleStep: 0.08 }),
        },
        {
          model: 'shard',
          role: 'portal debris',
          motionPreset: 'burst',
          materialPreset: createMaterial({ base: '#fff1dc', emissive: '#86f3ff', metalness: 0.5, roughness: 0.36 }),
          placements: createBurstPlacements(6, { centerY: 0.1, centerZ: -2.4, radius: 2.2, scale: 0.52 }),
        },
      ],
      effects: [
        { type: 'pulse-ring', color: '#ffc08d', placements: createEffectLine(4, { xFrom: -1.4, xTo: 1.4, y: 0, z: -3.2, scale: 1.4 }) },
        { type: 'spark-burst', color: '#86f3ff', placements: [{ x: 0, y: 0.1, z: -3.2, scale: 1.1 }] },
        { type: 'depth-haze-plane', color: '#ffb980', placements: [{ x: 0, y: 0, z: -4.6, scale: 2.8 }] },
      ],
    },
    {
      id: 'systems',
      layout: {},
      mood: createTheme({
        accent: '#8de6ff',
        accentSoft: 'rgba(141, 230, 255, 0.12)',
        bgTop: '#11161e',
        bgMid: '#0b1119',
        bgBottom: '#081018',
        glowA: 'rgba(141, 230, 255, 0.18)',
        glowC: 'rgba(255, 244, 178, 0.12)',
      }),
      contentHtml: `
        <div class="section-heading">
          <p class="eyebrow">Chapter 03</p>
          <h2 class="section-title">Build the world around the camera, not underneath it.</h2>
          <p class="section-copy">
            The scene engine, section registry, and motion library are meant to become a reusable tool, not one project’s custom trick.
          </p>
        </div>
        <div class="card-grid">
          <article class="info-card"><span>Core</span><h3>World registry</h3><p class="body-copy">Each experience mounts from data, not a bespoke scene file.</p></article>
          <article class="info-card"><span>Motion</span><h3>Shared presets</h3><p class="body-copy">Float, orbit, burst, ribbon, pulse, haze, and stage-rise all live in one runtime.</p></article>
          <article class="info-card"><span>Device</span><h3>Tiered quality</h3><p class="body-copy">Desktop, tablet, and mobile-lite live under one profile system.</p></article>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#0d1118', fillColor: '#8ee8ff', keyColor: '#f1f6ff', rimColor: '#9ff4d8' }),
      cameraPreset: createCamera({
        anchor: [0, -0.1, -10],
        cameraOffset: [0, 0.2, 8.2],
        cameraTravel: [0.6, 0.1, -2.5],
        lookOffset: [0, 0.2, -10.4],
        groupDrift: [0.4, 0, -1.2],
      }),
      timing: createTiming({ tailCap: 0.9 }),
      propCast: [
        {
          model: 'box',
          role: 'monoliths',
          motionPreset: 'stage-rise',
          materialPreset: createMaterial({ base: '#daeaf3', emissive: '#95e8ff', metalness: 0.42, roughness: 0.42 }),
          placements: createLinePlacements(4, { xFrom: -1.9, xTo: 1.9, y: -0.8, zFrom: -0.6, zTo: -3.4, scale: 1.15, scaleStep: 0.14 }),
        },
        {
          model: 'orb',
          role: 'system nodes',
          motionPreset: 'swarm',
          materialPreset: createMaterial({ base: '#f7fafc', emissive: '#a0fff1', metalness: 0.2, roughness: 0.16 }),
          placements: createBurstPlacements(5, { centerY: 0.2, centerZ: -1.8, radius: 1.6, scale: 0.36 }),
        },
      ],
      effects: [
        { type: 'light-cone', color: '#8de6ff', placements: createEffectLine(3, { xFrom: -1.6, xTo: 1.6, y: 1.6, z: -1.8, scale: 1.3 }) },
        { type: 'ribbon-trail', color: '#8de6ff', secondaryColor: '#fff4c0', placements: [{ x: -0.8, y: 0.2, z: -2.8, scale: 1.3 }, { x: 1, y: -0.1, z: -1.8, scale: 1.1 }] },
      ],
    },
    {
      id: 'sequence',
      layout: { minHeight: '150svh' },
      mood: createTheme({
        accent: '#dba6ff',
        accentSoft: 'rgba(219, 166, 255, 0.16)',
        bgTop: '#15111c',
        bgMid: '#0e0c16',
        bgBottom: '#080710',
        glowA: 'rgba(219, 166, 255, 0.18)',
        glowC: 'rgba(140, 239, 255, 0.14)',
      }),
      contentHtml: `
        <div class="section-heading">
          <p class="eyebrow">Chapter 04</p>
          <h2 class="section-title">Pin a stage to the viewport and choreograph the message above the moving world.</h2>
          <p class="section-copy">
            This is the part that usually breaks in normal landing pages. Here it becomes another chapter in the same scene system.
          </p>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#120d16', fillColor: '#dba6ff', keyColor: '#fff0f8', rimColor: '#7fe3ff' }),
      cameraPreset: createCamera({
        anchor: [0, 0.1, -16],
        cameraOffset: [0, 0.35, 8],
        cameraTravel: [0, 0, -1.8],
        lookOffset: [0, 0, -16.8],
        groupRotation: [0.04, -0.14, 0],
      }),
      timing: createTiming({ fadeOutStart: 0.88, tailCap: 0.92 }),
      propCast: [
        {
          model: 'plate',
          role: 'holographic slabs',
          motionPreset: 'hang',
          materialPreset: createMaterial({ base: '#f3e0ff', emissive: '#dca8ff', metalness: 0.18, roughness: 0.12, opacity: 0.88 }),
          placements: createArcPlacements(3, { radiusX: 1.7, radiusY: 0.8, centerY: 0.1, centerZ: -2.2, scale: 1.18 }),
        },
      ],
      effects: [
        { type: 'depth-haze-plane', color: '#dba6ff', placements: [{ x: 0, y: 0.1, z: -2.8, scale: 2.9 }] },
        { type: 'hero-glow-shell', color: '#7fe3ff', placements: [{ x: 0, y: 0.1, z: -2.2, scale: 1.3 }] },
        { type: 'ribbon-trail', color: '#dba6ff', secondaryColor: '#7fe3ff', placements: [{ x: -1.2, y: 0.2, z: -2.4, scale: 1.5 }, { x: 1.2, y: -0.2, z: -2.4, scale: 1.5 }] },
      ],
    },
    {
      id: 'launch',
      layout: {},
      mood: createTheme({
        accent: '#ffb47b',
        accentSoft: 'rgba(255, 180, 123, 0.14)',
        bgTop: '#171012',
        bgMid: '#100c0f',
        bgBottom: '#09080c',
        glowA: 'rgba(255, 180, 123, 0.2)',
        glowC: 'rgba(141, 233, 255, 0.12)',
      }),
      contentHtml: `
        <div class="section-heading">
          <p class="eyebrow">Chapter 05</p>
          <h2 class="section-title">Release the scene into orbit instead of fading to a dead final block.</h2>
        </div>
        <div class="card-grid">
          <article class="info-card"><span>Travel</span><h3>Escalate the camera path.</h3><p class="body-copy">The route shifts from close staging into wider travel.</p></article>
          <article class="info-card"><span>Objects</span><h3>Swap the language.</h3><p class="body-copy">The scene pivots from panels into burst geometry and ribbon light.</p></article>
          <article class="info-card"><span>Readable</span><h3>Keep the pitch intact.</h3><p class="body-copy">The scene can move hard without losing the message.</p></article>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#120d10', fillColor: '#ffbf86', keyColor: '#fff0d8', rimColor: '#7fe5ff', fogDensity: 0.04 }),
      cameraPreset: createCamera({
        anchor: [0, 0.1, -22],
        cameraOffset: [0, 0.6, 8.5],
        cameraTravel: [0.3, 0.2, -2.8],
        lookOffset: [0, 0, -22.8],
        groupDrift: [0.3, 0.15, -1.8],
      }),
      timing: createTiming({ fadeOutStart: 0.9, tailCap: 0.93 }),
      propCast: [
        {
          model: 'knot',
          role: 'launch core',
          motionPreset: 'burst',
          materialPreset: createMaterial({ base: '#ffe3c3', emissive: '#ffb47b', metalness: 0.54, roughness: 0.2 }),
          placements: [{ x: 0, y: 0.25, z: -1.4, scale: 1.4 }],
        },
        {
          model: 'shard',
          role: 'burst field',
          motionPreset: 'burst',
          materialPreset: createMaterial({ base: '#f7f2ff', emissive: '#7fe5ff', metalness: 0.38, roughness: 0.26 }),
          placements: createBurstPlacements(7, { centerY: 0.2, centerZ: -1.8, radius: 2.6, scale: 0.48 }),
        },
      ],
      effects: [
        { type: 'spark-burst', color: '#ffbf86', placements: [{ x: 0, y: 0.2, z: -1.6, scale: 1.4 }] },
        { type: 'pulse-ring', color: '#7fe5ff', placements: [{ x: 0, y: 0.15, z: -2.4, scale: 1.8 }] },
        { type: 'ribbon-trail', color: '#ffbf86', secondaryColor: '#7fe5ff', placements: [{ x: 0, y: 0.1, z: -2.2, scale: 1.8 }] },
      ],
    },
    {
      id: 'cta',
      layout: { minHeight: '110svh' },
      mood: createTheme({
        accent: '#91f2dc',
        accentSoft: 'rgba(145, 242, 220, 0.14)',
        bgTop: '#0f1415',
        bgMid: '#091011',
        bgBottom: '#06090b',
        glowA: 'rgba(145, 242, 220, 0.18)',
        glowC: 'rgba(151, 212, 255, 0.12)',
      }),
      contentHtml: `
        <div class="feature-grid">
          <div class="copy-stack">
            <p class="eyebrow">Chapter 06</p>
            <h2 class="section-title">Keep the engine. Swap the world.</h2>
            <p class="section-copy">
              The demo becomes valuable when the architecture survives a completely different art direction.
            </p>
            <div class="metric-strip">
              <div class="metric-card"><span>Shared</span><strong>World scene engine</strong></div>
              <div class="metric-card"><span>Shared</span><strong>Motion/effects presets</strong></div>
              <div class="metric-card"><span>Shared</span><strong>Device profiles</strong></div>
            </div>
          </div>
          <div class="wordmark">BUILD WORLDS</div>
        </div>
      `,
      scenePreset: createMood({ fogColor: '#091112', fillColor: '#91f2dc', keyColor: '#edfdf7', rimColor: '#8fe8ff' }),
      cameraPreset: createCamera({
        anchor: [0, 0, -28],
        cameraOffset: [0, 0.4, 8.4],
        cameraTravel: [0, 0, -1.6],
        lookOffset: [0, 0.1, -29],
      }),
      timing: createTiming({ fadeOutStart: 1.04, fadeOutEnd: 1.08 }),
      propCast: [
        {
          model: 'orb',
          role: 'handoff node',
          motionPreset: 'float',
          materialPreset: createMaterial({ base: '#effff7', emissive: '#91f2dc', metalness: 0.24, roughness: 0.16 }),
          placements: [{ x: 0, y: 0.25, z: -1.4, scale: 1.3 }],
        },
      ],
      effects: [
        { type: 'hero-glow-shell', color: '#91f2dc', placements: [{ x: 0, y: 0.2, z: -1.6, scale: 1.6 }] },
        { type: 'depth-haze-plane', color: '#8fe8ff', placements: [{ x: 0, y: 0.1, z: -2.4, scale: 2.6 }] },
      ],
    },
  ],
}

export const mountStoryMotionWorld = (app: HTMLDivElement): void => {
  mountWorldDefinition(app, storyMotionWorld)
}

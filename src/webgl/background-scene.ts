import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  FogExp2,
  Group,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TetrahedronGeometry,
  TorusGeometry,
  TorusKnotGeometry,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from 'three'

import {
  ChapterBlendTracker,
  collectChapterState,
  createChapterProgress,
  createChapterBlendTarget,
  createFloatMotion,
  softenTimelineTail,
} from '../core/chapter-timeline'
import { remapClamped } from '../core/math'
import type { PointerState } from '../core/pointer-tracker'
import type { ScrollFrame } from '../core/smooth-scroll'
import { SectionRegistry } from '../core/section-registry'

const CHAPTER_IDS = ['hero', 'portal', 'systems', 'sequence', 'launch', 'cta'] as const

interface SceneUpdateInput {
  deltaTime: number
  time: number
  pointer: PointerState
  scroll: ScrollFrame
}

interface PortalRing {
  mesh: Mesh
  material: MeshBasicMaterial
  baseZ: number
  radius: number
  spin: number
  pulse: number
}

interface Orbiter {
  mesh: Mesh
  material: MeshStandardMaterial
  radius: number
  height: number
  offset: number
  speed: number
  drift: number
}

interface FrameUnit {
  mesh: Mesh
  material: MeshBasicMaterial | MeshStandardMaterial
  glow?: Mesh
  glowMaterial?: MeshBasicMaterial
  radius: number
  angle: number
  depth: number
  offset: number
  height: number
  scale: number
}

interface Beacon {
  mesh: Mesh
  material: MeshStandardMaterial
  radius: number
  angle: number
  height: number
  offset: number
}

export class BackgroundScene {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(38, 1, 0.1, 120)
  private readonly lookTarget = new Vector3()
  private readonly sections: SectionRegistry
  private readonly lowPower: boolean
  private readonly blendTracker = new ChapterBlendTracker(CHAPTER_IDS, 'hero')

  private readonly world = new Group()
  private readonly heroScene = new Group()
  private readonly portalScene = new Group()
  private readonly systemsScene = new Group()
  private readonly sequenceScene = new Group()
  private readonly launchScene = new Group()
  private readonly ctaScene = new Group()

  private readonly heroAnchor = new Vector3(0, 0.25, 0)
  private readonly portalAnchor = new Vector3(0.45, -0.05, -16)
  private readonly systemsAnchor = new Vector3(-6.8, 0.45, -32)
  private readonly sequenceAnchor = new Vector3(7.4, 1, -48)
  private readonly launchAnchor = new Vector3(0.8, 5.2, -62)
  private readonly ctaAnchor = new Vector3(0, 1.7, -76)

  private readonly ambientLight = new AmbientLight(new Color('#ffffff'), 0.9)
  private readonly keyLight = new DirectionalLight(new Color('#f7f1e7'), 1.2)
  private readonly rimLight = new DirectionalLight(new Color('#93dfe4'), 0.95)
  private readonly accentLightA = new PointLight(new Color('#0f7f88'), 1.9, 26, 2)
  private readonly accentLightB = new PointLight(new Color('#d38745'), 1.7, 22, 2)

  private readonly portalRings: PortalRing[] = []
  private readonly heroOrbiters: Orbiter[] = []
  private readonly satellites: Orbiter[] = []
  private readonly monoliths: Orbiter[] = []
  private readonly systemsFrames: FrameUnit[] = []
  private readonly sequencePanels: FrameUnit[] = []
  private readonly launchShards: Orbiter[] = []
  private readonly ctaNodes: Beacon[] = []

  private core!: Mesh
  private coreShell!: Mesh
  private halo!: Mesh
  private glow!: Mesh
  private wireframe!: LineSegments
  private coreMaterial!: MeshStandardMaterial
  private coreShellMaterial!: MeshBasicMaterial
  private haloMaterial!: MeshBasicMaterial
  private glowMaterial!: MeshBasicMaterial
  private wireMaterial!: LineBasicMaterial

  private portalRibbon!: Line
  private portalRibbonMaterial!: LineBasicMaterial
  private portalRibbonPositions!: Float32Array
  private portalRibbonAttribute!: BufferAttribute

  private sequenceKnot!: Mesh
  private sequenceKnotMaterial!: MeshBasicMaterial

  private launchHalo!: Mesh
  private launchHaloMaterial!: MeshBasicMaterial
  private launchPulse!: Mesh
  private launchPulseMaterial!: MeshBasicMaterial
  private launchCore!: Mesh
  private launchCoreMaterial!: MeshStandardMaterial

  private ctaHalo!: Mesh
  private ctaHaloMaterial!: MeshBasicMaterial
  private ctaCore!: Mesh
  private ctaCoreMaterial!: MeshStandardMaterial
  private ctaLinks!: Line
  private ctaLinkMaterial!: LineBasicMaterial
  private ctaLinkPositions!: Float32Array
  private ctaLinkAttribute!: BufferAttribute

  private dust!: Points
  private dustMaterial!: PointsMaterial
  private dustPositions!: Float32Array
  private dustBase!: Float32Array
  private dustThrottle = 0

  constructor(canvas: HTMLCanvasElement, sections: SectionRegistry) {
    this.sections = sections
    this.lowPower = window.matchMedia('(max-width: 860px), (pointer: coarse)').matches

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: !this.lowPower,
      alpha: true,
      powerPreference: this.lowPower ? 'low-power' : 'high-performance',
    })
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = this.lowPower ? 0.94 : 1.02
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.lowPower ? 0.8 : 1.45))
    this.renderer.setClearColor(0x000000, 0)

    this.scene.fog = new FogExp2('#efe6d6', this.lowPower ? 0.031 : 0.028)
    this.camera.position.set(0, 0.3, 8.8)

    this.keyLight.position.set(4.4, 4.8, 7.4)
    this.rimLight.position.set(-4.8, -2, -6.4)
    this.accentLightA.position.set(2.8, 1.8, 6.2)
    this.accentLightB.position.set(-3.2, -1.1, 5.1)
    this.scene.add(this.ambientLight, this.keyLight, this.rimLight, this.accentLightA, this.accentLightB)

    this.heroScene.position.copy(this.heroAnchor)
    this.portalScene.position.copy(this.portalAnchor)
    this.systemsScene.position.copy(this.systemsAnchor)
    this.sequenceScene.position.copy(this.sequenceAnchor)
    this.launchScene.position.copy(this.launchAnchor)
    this.ctaScene.position.copy(this.ctaAnchor)

    this.world.add(
      this.heroScene,
      this.portalScene,
      this.systemsScene,
      this.sequenceScene,
      this.launchScene,
      this.ctaScene,
    )
    this.scene.add(this.world)

    this.createHeroScene()
    this.createPortalScene()
    this.createSystemsScene()
    this.createSequenceScene()
    this.createLaunchScene()
    this.createCtaScene()
    this.createDust()
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / Math.max(height, 1)
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.lowPower ? 0.8 : 1.45))
    this.renderer.setSize(width, height, false)
  }

  update({ deltaTime, time, pointer, scroll }: SceneUpdateInput): void {
    const chapterState = collectChapterState(CHAPTER_IDS, this.sections, {
      baselines: { hero: 0.02 },
      exponents: {
        hero: 1.9,
        portal: 1.95,
        systems: 2,
        sequence: 2,
        launch: 2,
        cta: 2,
      },
      visibilityBoost: 0.08,
    })
    const blendTarget = createChapterBlendTarget(CHAPTER_IDS, chapterState.weights, {
      maxSecondaryMix: 0.42,
      secondaryEnterEnd: 0.36,
      secondaryEnterStart: 0.14,
      secondaryWeight: 1.18,
    })
    const weights = this.blendTracker.update(blendTarget.target, deltaTime, {
      enterSmoothing: this.lowPower ? 2.1 : 2.4,
      exitSmoothing: this.lowPower ? 2.8 : 3.2,
    })
    this.setSceneVisibility(weights)

    const heroProgress = chapterState.progress.hero
    const portalProgress = chapterState.progress.portal
    const systemsProgress = chapterState.progress.systems
    const sequenceProgress = chapterState.progress.sequence
    const launchProgress = chapterState.progress.launch
    const ctaProgress = chapterState.progress.cta
    const heroTravel = softenTimelineTail(createChapterProgress(heroProgress), {
      tailStart: 0.56,
      cap: 0.84,
    })
    const portalTravel = softenTimelineTail(createChapterProgress(portalProgress), {
      tailStart: 0.52,
      cap: 0.86,
    })
    const systemsTravel = softenTimelineTail(createChapterProgress(systemsProgress), {
      tailStart: 0.58,
      cap: 0.84,
    })
    const sequenceTravel = softenTimelineTail(createChapterProgress(sequenceProgress), {
      tailStart: 0.58,
      cap: 0.84,
    })
    const launchTravel = softenTimelineTail(createChapterProgress(launchProgress), {
      tailStart: 0.54,
      cap: 0.86,
    })
    const ctaTravel = softenTimelineTail(createChapterProgress(ctaProgress), {
      tailStart: 0.58,
      cap: 0.86,
    })

    this.updateHeroScene(time, pointer, heroProgress, weights.hero, portalProgress, weights.launch)
    this.updatePortalScene(time, pointer, portalProgress, weights.portal, weights.systems, weights.cta)
    this.updateSystemsScene(time, pointer, systemsProgress, weights.systems, weights.sequence)
    this.updateSequenceScene(time, pointer, sequenceProgress, weights.sequence, weights.launch)
    this.updateLaunchScene(time, pointer, launchProgress, weights.launch, weights.cta)
    this.updateCtaScene(time, pointer, ctaProgress, weights.cta)
    this.updateDust(time, scroll.progress, pointer, weights.launch, weights.cta)

    const heroCam = new Vector3(this.heroAnchor.x + 0.42 + pointer.x * 0.58, this.heroAnchor.y + 0.38 + pointer.y * 0.22, this.heroAnchor.z + 8.8 - heroTravel * 1.35)
    const portalCam = new Vector3(this.portalAnchor.x + Math.sin(time * 0.42) * 0.18 + pointer.x * 0.28, this.portalAnchor.y + pointer.y * 0.16, this.portalAnchor.z + 6.9 - portalTravel * 8.2)
    const systemsCam = new Vector3(this.systemsAnchor.x + 3 + pointer.x * 0.38, this.systemsAnchor.y + 1 + pointer.y * 0.16, this.systemsAnchor.z + 7.4 - systemsTravel * 1.45)
    const sequenceCam = new Vector3(this.sequenceAnchor.x - 2.6 + pointer.x * 0.42, this.sequenceAnchor.y + 1.5 + pointer.y * 0.24, this.sequenceAnchor.z + 8.1 - sequenceTravel * 1.28)
    const launchCam = new Vector3(this.launchAnchor.x + 0.8 + pointer.x * 0.56, this.launchAnchor.y + 3.2 + pointer.y * 0.24, this.launchAnchor.z + 9.8 - launchTravel * 3.7)
    const ctaCam = new Vector3(this.ctaAnchor.x + pointer.x * 0.26, this.ctaAnchor.y + 1.4 + pointer.y * 0.14, this.ctaAnchor.z + 10.6 - ctaTravel * 1.4)

    const heroLook = new Vector3(this.heroAnchor.x + pointer.x * 0.16, this.heroAnchor.y + pointer.y * 0.08, this.heroAnchor.z)
    const portalLook = new Vector3(this.portalAnchor.x + pointer.x * 0.08, this.portalAnchor.y, this.portalAnchor.z - 4.6 - portalTravel * 4.6)
    const systemsLook = new Vector3(this.systemsAnchor.x - 0.2, this.systemsAnchor.y + 0.2, this.systemsAnchor.z - 2.1)
    const sequenceLook = new Vector3(this.sequenceAnchor.x + 0.45, this.sequenceAnchor.y + 0.25, this.sequenceAnchor.z)
    const launchLook = new Vector3(this.launchAnchor.x, this.launchAnchor.y + 0.8, this.launchAnchor.z + 0.5)
    const ctaLook = new Vector3(this.ctaAnchor.x, this.ctaAnchor.y + 0.35, this.ctaAnchor.z)

    const cameraTarget = new Vector3()
      .addScaledVector(heroCam, weights.hero)
      .addScaledVector(portalCam, weights.portal)
      .addScaledVector(systemsCam, weights.systems)
      .addScaledVector(sequenceCam, weights.sequence)
      .addScaledVector(launchCam, weights.launch)
      .addScaledVector(ctaCam, weights.cta)
    const lookTarget = new Vector3()
      .addScaledVector(heroLook, weights.hero)
      .addScaledVector(portalLook, weights.portal)
      .addScaledVector(systemsLook, weights.systems)
      .addScaledVector(sequenceLook, weights.sequence)
      .addScaledVector(launchLook, weights.launch)
      .addScaledVector(ctaLook, weights.cta)

    this.camera.position.copy(cameraTarget)
    this.lookTarget.copy(lookTarget)
    this.camera.lookAt(this.lookTarget)

    ;(this.scene.fog as FogExp2).color.copy(this.mixColor([
      [weights.hero, '#efe5d6'], [weights.portal, '#101821'], [weights.systems, '#d3e0ec'],
      [weights.sequence, '#18162f'], [weights.launch, '#241515'], [weights.cta, '#0c1b1f'],
    ]))
    ;(this.scene.fog as FogExp2).density = weights.hero * 0.024 + weights.portal * 0.042 + weights.systems * 0.032 + weights.sequence * 0.026 + weights.launch * 0.03 + weights.cta * 0.018 + (this.lowPower ? 0.003 : 0)

    this.keyLight.color.copy(this.mixColor([[weights.hero, '#fff4e7'], [weights.portal, '#ffc99c'], [weights.systems, '#ebf8ff'], [weights.sequence, '#c1c6ff'], [weights.launch, '#ffd6bd'], [weights.cta, '#c7fffb']]))
    this.rimLight.color.copy(this.mixColor([[weights.hero, '#94dde1'], [weights.portal, '#2ad8e2'], [weights.systems, '#7fc8ff'], [weights.sequence, '#7a6ff2'], [weights.launch, '#ff9f74'], [weights.cta, '#5ce7df']]))
    this.accentLightA.color.copy(this.mixColor([[weights.hero, '#0f7f88'], [weights.portal, '#25d0da'], [weights.systems, '#358dd0'], [weights.sequence, '#7a6ff2'], [weights.launch, '#ff7d5c'], [weights.cta, '#1faeb7']]))
    this.accentLightB.color.copy(this.mixColor([[weights.hero, '#d38745'], [weights.portal, '#ff9152'], [weights.systems, '#8fe4ff'], [weights.sequence, '#5fd2ff'], [weights.launch, '#ffc870'], [weights.cta, '#88f5eb']]))

    this.ambientLight.intensity = weights.hero * 0.92 + weights.portal * 0.52 + weights.systems * 0.86 + weights.sequence * 0.58 + weights.launch * 0.54 + weights.cta * 0.48
    this.keyLight.intensity = weights.hero * 1.22 + weights.portal * 1.02 + weights.systems * 1.12 + weights.sequence * 0.88 + weights.launch * 1.08 + weights.cta * 0.84
    this.rimLight.intensity = weights.hero * 0.92 + weights.portal * 1.04 + weights.systems * 0.82 + weights.sequence * 1.08 + weights.launch * 0.92 + weights.cta * 0.86

    this.accentLightA.position.set(this.lookTarget.x + 2.8 + Math.sin(time * 0.42) * 1.2, this.lookTarget.y + 1.6 + Math.cos(time * 0.34) * 0.8, this.lookTarget.z + 5.6)
    this.accentLightB.position.set(this.lookTarget.x - 3 + Math.cos(time * 0.37) * 1.3, this.lookTarget.y - 1.1 + Math.sin(time * 0.26) * 0.9, this.lookTarget.z + 4.8)
    this.accentLightA.intensity = 1.5 + weights.sequence * 0.9 + weights.launch * 1.1
    this.accentLightB.intensity = 1.4 + weights.portal * 0.7 + weights.launch * 1.3

    this.world.position.set(pointer.x * 0.16, pointer.y * 0.1, 0)
    this.world.rotation.z = pointer.x * 0.025 + weights.sequence * 0.04 - weights.launch * 0.02
    this.renderer.render(this.scene, this.camera)
  }

  private mixColor(entries: Array<[number, string]>): Color {
    const color = new Color()
    const scratch = new Color()
    let total = 0
    for (const [weight, value] of entries) {
      if (weight <= 0) continue
      scratch.set(value)
      color.r += scratch.r * weight
      color.g += scratch.g * weight
      color.b += scratch.b * weight
      total += weight
    }
    return total > 0 ? color.multiplyScalar(1 / total) : color.set('#ffffff')
  }

  private createHeroScene(): void {
    this.coreMaterial = new MeshStandardMaterial({
      color: new Color('#eff4ef'),
      roughness: 0.18,
      metalness: 0.18,
      emissive: new Color('#13888f'),
      emissiveIntensity: 0.24,
    })
    this.core = new Mesh(new IcosahedronGeometry(1.14, 6), this.coreMaterial)

    this.coreShellMaterial = new MeshBasicMaterial({
      color: new Color('#0e7d84'),
      wireframe: true,
      transparent: true,
      opacity: 0.26,
    })
    this.coreShell = new Mesh(
      new TorusKnotGeometry(1.86, 0.16, 220, 24, 2, 5),
      this.coreShellMaterial,
    )

    this.haloMaterial = new MeshBasicMaterial({
      color: new Color('#d38745'),
      transparent: true,
      opacity: 0.28,
    })
    this.halo = new Mesh(new TorusGeometry(2.55, 0.05, 16, 120), this.haloMaterial)
    this.halo.rotation.x = Math.PI * 0.56

    this.glowMaterial = new MeshBasicMaterial({
      color: new Color('#f3c38f'),
      transparent: true,
      opacity: 0.1,
    })
    this.glow = new Mesh(new SphereGeometry(1.9, 32, 32), this.glowMaterial)

    this.wireMaterial = new LineBasicMaterial({
      color: new Color('#0d6770'),
      transparent: true,
      opacity: 0.32,
    })
    this.wireframe = new LineSegments(
      new WireframeGeometry(new IcosahedronGeometry(1.52, 2)),
      this.wireMaterial,
    )

    this.heroScene.add(this.glow, this.halo, this.coreShell, this.wireframe, this.core)

    for (let index = 0; index < 30; index += 1) {
      const material = new MeshStandardMaterial({
        color: new Color(index % 5 === 0 ? '#f1d1a3' : '#d9f0ef'),
        emissive: new Color(index % 2 === 0 ? '#0f7f88' : '#d38745'),
        emissiveIntensity: 0.18,
        roughness: 0.18,
        metalness: 0.24,
      })
      const mesh = new Mesh(new TetrahedronGeometry(0.15 + Math.random() * 0.18, 0), material)
      this.heroScene.add(mesh)
      this.heroOrbiters.push({
        mesh,
        material,
        radius: 2 + Math.random() * 4.8,
        height: 0.7 + Math.random() * 2.7,
        offset: Math.random() * Math.PI * 2,
        speed: 0.35 + Math.random() * 0.6,
        drift: 1.4 + Math.random() * 3.8,
      })
    }

    for (let index = 0; index < 8; index += 1) {
      const material = new MeshStandardMaterial({
        color: new Color(index % 2 === 0 ? '#ffffff' : '#f4d8b6'),
        emissive: new Color(index % 2 === 0 ? '#0e7d84' : '#d38745'),
        emissiveIntensity: 0.2,
        roughness: 0.12,
        metalness: 0.32,
      })
      const mesh = new Mesh(new SphereGeometry(0.12 + index * 0.02, 20, 20), material)
      this.heroScene.add(mesh)
      this.satellites.push({
        mesh,
        material,
        radius: 2 + index * 0.32,
        height: 0.42 + index * 0.08,
        offset: Math.random() * Math.PI * 2,
        speed: 0.45 + index * 0.08,
        drift: 0.7,
      })
    }
  }

  private createPortalScene(): void {
    for (let index = 0; index < 20; index += 1) {
      const radius = 1.4 + (index % 4) * 0.18
      const material = new MeshBasicMaterial({
        color: new Color(index % 2 === 0 ? '#17b5c2' : '#ff9152'),
        transparent: true,
        opacity: 0.12,
      })
      const mesh = new Mesh(
        new TorusGeometry(radius, 0.04 + (index % 3) * 0.018, 18, 96),
        material,
      )
      mesh.position.z = -index * 3.8
      this.portalScene.add(mesh)
      this.portalRings.push({
        mesh,
        material,
        baseZ: -index * 3.8,
        radius: 1 + index * 0.04,
        spin: (index % 2 === 0 ? 1 : -1) * (0.28 + Math.random() * 0.18),
        pulse: Math.random() * Math.PI * 2,
      })
    }

    this.portalRibbonPositions = new Float32Array(220 * 3)
    const geometry = new BufferGeometry()
    this.portalRibbonAttribute = new BufferAttribute(this.portalRibbonPositions, 3)
    geometry.setAttribute('position', this.portalRibbonAttribute)
    this.portalRibbonMaterial = new LineBasicMaterial({
      color: new Color('#1cc1cf'),
      transparent: true,
      opacity: 0.36,
    })
    this.portalRibbon = new Line(geometry, this.portalRibbonMaterial)
    this.portalScene.add(this.portalRibbon)
  }
  private createSystemsScene(): void {
    for (let index = 0; index < 14; index += 1) {
      const material = new MeshStandardMaterial({
        color: new Color(index % 3 === 0 ? '#f4e8d6' : '#d9f2f2'),
        emissive: new Color(index % 2 === 0 ? '#2c86c9' : '#88deff'),
        emissiveIntensity: 0.14,
        roughness: 0.22,
        metalness: 0.24,
        transparent: true,
        opacity: 0.82,
      })
      const mesh = new Mesh(new BoxGeometry(0.28, 2.8, 0.28), material)
      this.systemsScene.add(mesh)
      this.monoliths.push({
        mesh,
        material,
        radius: 3.5 + (index % 3) * 0.52,
        height: -4 - index * 1.25,
        offset: Math.random() * Math.PI * 2,
        speed: 0.08,
        drift: 0.9,
      })
    }

    for (let index = 0; index < 10; index += 1) {
      const material = new MeshBasicMaterial({
        color: new Color(index % 2 === 0 ? '#4ba7df' : '#8fe4ff'),
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      })
      const mesh = new Mesh(
        new BoxGeometry(1.2 + (index % 3) * 0.45, 2.3 + (index % 2) * 0.8, 0.16),
        material,
      )
      this.systemsScene.add(mesh)
      this.systemsFrames.push({
        mesh,
        material,
        radius: 2.8 + index * 0.42,
        angle: (index / 10) * Math.PI * 2,
        depth: -3 - index * 2.1,
        offset: Math.random() * Math.PI * 2,
        height: -0.2 + (index % 3) * 0.85,
        scale: 1,
      })
    }
  }

  private createSequenceScene(): void {
    this.sequenceKnotMaterial = new MeshBasicMaterial({
      color: new Color('#7a6ff2'),
      wireframe: true,
      transparent: true,
      opacity: 0.24,
    })
    this.sequenceKnot = new Mesh(
      new TorusKnotGeometry(1.4, 0.08, 180, 18, 3, 5),
      this.sequenceKnotMaterial,
    )
    this.sequenceScene.add(this.sequenceKnot)

    for (let index = 0; index < 7; index += 1) {
      const material = new MeshStandardMaterial({
        color: new Color(index % 2 === 0 ? '#c8c3ff' : '#88f4ff'),
        emissive: new Color(index % 2 === 0 ? '#756af1' : '#59d0ff'),
        emissiveIntensity: 0.14,
        roughness: 0.12,
        metalness: 0.24,
        transparent: true,
        opacity: 0.28,
      })
      const mesh = new Mesh(
        new BoxGeometry(1.7 + Math.random() * 0.9, 1.1 + Math.random() * 0.45, 0.1),
        material,
      )
      const glowMaterial = new MeshBasicMaterial({
        color: new Color(index % 2 === 0 ? '#b8a5ff' : '#85eeff'),
        transparent: true,
        opacity: 0.08,
      })
      const glow = new Mesh(
        new BoxGeometry(1 + Math.random() * 0.55, 0.16 + Math.random() * 0.12, 0.18),
        glowMaterial,
      )
      const pivot = new Group()
      pivot.add(mesh, glow)
      this.sequenceScene.add(pivot)
      this.sequencePanels.push({
        mesh,
        material,
        glow,
        glowMaterial,
        radius: 2.4 + index * 0.42,
        angle: (index / 7) * Math.PI * 2,
        depth: -1.8 - index * 0.72,
        offset: Math.random() * Math.PI * 2,
        height: -0.4 + (index % 3) * 0.78,
        scale: 0.92 + Math.random() * 0.38,
      })
    }
  }

  private createLaunchScene(): void {
    this.launchHaloMaterial = new MeshBasicMaterial({
      color: new Color('#ff9d74'),
      transparent: true,
      opacity: 0.24,
    })
    this.launchHalo = new Mesh(new TorusGeometry(2.9, 0.08, 24, 160), this.launchHaloMaterial)
    this.launchHalo.rotation.x = Math.PI * 0.28

    this.launchPulseMaterial = new MeshBasicMaterial({
      color: new Color('#ffd8b1'),
      transparent: true,
      opacity: 0.1,
    })
    this.launchPulse = new Mesh(new SphereGeometry(1.45, 26, 26), this.launchPulseMaterial)

    this.launchCoreMaterial = new MeshStandardMaterial({
      color: new Color('#ffd8b8'),
      emissive: new Color('#ff7d5c'),
      emissiveIntensity: 0.22,
      roughness: 0.12,
      metalness: 0.28,
      transparent: true,
      opacity: 0.92,
    })
    this.launchCore = new Mesh(
      new TorusKnotGeometry(1.58, 0.12, 200, 20, 2, 5),
      this.launchCoreMaterial,
    )
    this.launchScene.add(this.launchHalo, this.launchPulse, this.launchCore)

    for (let index = 0; index < 20; index += 1) {
      const material = new MeshStandardMaterial({
        color: new Color(index % 3 === 0 ? '#ffd8b1' : '#ff9c75'),
        emissive: new Color(index % 2 === 0 ? '#ff7d5c' : '#ffca70'),
        emissiveIntensity: 0.2,
        roughness: 0.16,
        metalness: 0.28,
        transparent: true,
        opacity: 0.86,
      })
      const mesh = new Mesh(new TetrahedronGeometry(0.22 + Math.random() * 0.18, 0), material)
      this.launchScene.add(mesh)
      this.launchShards.push({
        mesh,
        material,
        radius: 1.8 + Math.random() * 3.6,
        height: 0.6 + Math.random() * 2.4,
        offset: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.7,
        drift: 1,
      })
    }
  }

  private createCtaScene(): void {
    this.ctaHaloMaterial = new MeshBasicMaterial({
      color: new Color('#37d8d1'),
      transparent: true,
      opacity: 0.18,
    })
    this.ctaHalo = new Mesh(new TorusGeometry(3.1, 0.06, 18, 120), this.ctaHaloMaterial)
    this.ctaHalo.rotation.x = Math.PI * 0.47

    this.ctaCoreMaterial = new MeshStandardMaterial({
      color: new Color('#e9ffff'),
      emissive: new Color('#2bb5bf'),
      emissiveIntensity: 0.18,
      roughness: 0.18,
      metalness: 0.22,
      transparent: true,
      opacity: 0.92,
    })
    this.ctaCore = new Mesh(new IcosahedronGeometry(0.84, 4), this.ctaCoreMaterial)

    this.ctaLinkPositions = new Float32Array((7 + 1) * 3)
    const geometry = new BufferGeometry()
    this.ctaLinkAttribute = new BufferAttribute(this.ctaLinkPositions, 3)
    geometry.setAttribute('position', this.ctaLinkAttribute)
    this.ctaLinkMaterial = new LineBasicMaterial({
      color: new Color('#68ebe2'),
      transparent: true,
      opacity: 0.24,
    })
    this.ctaLinks = new Line(geometry, this.ctaLinkMaterial)
    this.ctaScene.add(this.ctaHalo, this.ctaCore, this.ctaLinks)

    for (let index = 0; index < 7; index += 1) {
      const material = new MeshStandardMaterial({
        color: new Color(index % 2 === 0 ? '#eaffff' : '#9af3ec'),
        emissive: new Color(index % 2 === 0 ? '#27b6c2' : '#88f5eb'),
        emissiveIntensity: 0.24,
        roughness: 0.14,
        metalness: 0.24,
      })
      const mesh = new Mesh(new SphereGeometry(0.12 + index * 0.016, 18, 18), material)
      this.ctaScene.add(mesh)
      this.ctaNodes.push({
        mesh,
        material,
        radius: 1.8 + index * 0.28,
        angle: (index / 7) * Math.PI * 2,
        height: -0.6 + (index % 3) * 0.7,
        offset: Math.random() * Math.PI * 2,
      })
    }
  }

  private createDust(): void {
    const count = this.lowPower ? 720 : 2600
    this.dustBase = new Float32Array(count * 3)
    this.dustPositions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let index = 0; index < count; index += 1) {
      const stride = index * 3
      const radius = Math.random() * 10 + 1.2
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 14
      const z = -Math.random() * 92 + 12
      this.dustBase[stride] = Math.cos(theta) * radius
      this.dustBase[stride + 1] = y
      this.dustBase[stride + 2] = z
      this.dustPositions[stride] = this.dustBase[stride]
      this.dustPositions[stride + 1] = y
      this.dustPositions[stride + 2] = z
      const color = new Color(index % 6 === 0 ? '#ffd18f' : '#8ff0f5')
      colors[stride] = color.r
      colors[stride + 1] = color.g
      colors[stride + 2] = color.b
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(this.dustPositions, 3))
    geometry.setAttribute('color', new BufferAttribute(colors, 3))
    this.dustMaterial = new PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.74,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    this.dust = new Points(geometry, this.dustMaterial)
    this.scene.add(this.dust)
  }
  private updateHeroScene(
    time: number,
    pointer: PointerState,
    heroProgress: number,
    heroWeight: number,
    portalProgress: number,
    launchWeight: number,
  ): void {
    const presence = MathUtils.clamp(heroWeight * 1.85 + (1 - portalProgress) * 0.12, 0, 1)

    this.heroScene.position.set(
      this.heroAnchor.x + pointer.x * 0.36,
      this.heroAnchor.y + pointer.y * 0.18,
      this.heroAnchor.z,
    )
    this.heroScene.rotation.y = time * 0.12 + pointer.x * 0.25
    this.heroScene.scale.setScalar(0.9 + presence * 0.42 + launchWeight * 0.08)

    this.core.rotation.x = time * 0.46
    this.core.rotation.y = time * 0.42
    this.coreShell.rotation.x = time * 0.22 + heroProgress * 0.75
    this.coreShell.rotation.y = time * 0.3 + heroProgress * 0.55
    this.halo.rotation.z = time * 0.18 - heroProgress * 0.35
    this.halo.scale.setScalar(1 + Math.sin(time * 1.35) * 0.06 + launchWeight * 0.18)
    this.wireframe.rotation.x = time * 0.14 + 0.45
    this.wireframe.rotation.y = -time * 0.18 + 0.24

    this.coreMaterial.emissiveIntensity = 0.16 + presence * 0.26 + launchWeight * 0.08
    this.coreShellMaterial.opacity = 0.06 + presence * 0.24
    this.haloMaterial.opacity = 0.08 + presence * 0.22
    this.glowMaterial.opacity = 0.05 + presence * 0.14
    this.wireMaterial.opacity = 0.12 + presence * 0.22

    for (const orbiter of this.heroOrbiters) {
      const angle = time * orbiter.speed + orbiter.offset + heroProgress * 2.4 + launchWeight * 1.8
      const float = createFloatMotion(time, heroProgress, {
        amplitude: 0.16,
        frequency: 0.68,
        phase: orbiter.offset,
        base: 0.6,
        progressGain: 0.3,
      })
      orbiter.mesh.position.x =
        Math.cos(angle) * orbiter.radius + Math.sin(time * 0.24 + orbiter.offset) * 0.45
      orbiter.mesh.position.y =
        Math.sin(angle * 1.34) * orbiter.height + Math.cos(time * 0.52 + orbiter.offset) * 0.25 + float
      orbiter.mesh.position.z = Math.sin(angle * 0.88) * orbiter.drift - heroProgress * 1.8
      orbiter.mesh.rotation.x = angle * 1.6 + orbiter.offset
      orbiter.mesh.rotation.y = angle * 1.2 + orbiter.offset * 0.5
      orbiter.mesh.rotation.z = angle * 1.8
      orbiter.mesh.scale.setScalar(0.55 + presence * 0.7)
      orbiter.material.emissiveIntensity = 0.08 + presence * 0.2 + launchWeight * 0.18
    }

    for (const satellite of this.satellites) {
      const angle = time * satellite.speed + satellite.offset + launchWeight * 1.8
      satellite.mesh.position.set(
        Math.cos(angle) * satellite.radius,
        Math.sin(angle * 1.45) * satellite.height,
        Math.sin(angle) * satellite.radius * satellite.drift - heroProgress * 0.9,
      )
      satellite.mesh.rotation.y = angle * 1.4
      satellite.material.emissiveIntensity = 0.14 + presence * 0.16 + launchWeight * 0.16
    }
  }

  private updatePortalScene(
    time: number,
    pointer: PointerState,
    portalProgress: number,
    portalWeight: number,
    systemsWeight: number,
    ctaWeight: number,
  ): void {
    const presence = MathUtils.clamp(portalWeight * 1.8 + systemsWeight * 0.18, 0, 1)
    const travel = portalProgress * 56 + time * 1.1

    this.portalScene.position.set(
      this.portalAnchor.x + pointer.x * 0.22,
      this.portalAnchor.y + pointer.y * 0.12,
      this.portalAnchor.z,
    )
    this.portalScene.rotation.z = pointer.x * 0.08

    for (const ring of this.portalRings) {
      const wrappedZ = MathUtils.euclideanModulo(ring.baseZ + travel + 66, 72) - 66
      const pulse = 1 + Math.sin(time * 1.25 + ring.pulse) * 0.06 + presence * 0.14
      ring.mesh.position.x = Math.sin(time * 0.3 + ring.pulse) * 0.08 * presence
      ring.mesh.position.z = wrappedZ
      ring.mesh.rotation.z = time * ring.spin + ring.pulse
      ring.mesh.rotation.x = Math.sin(time * 0.35 + ring.pulse) * 0.18
      ring.mesh.scale.setScalar(ring.radius * pulse)
      ring.material.opacity =
        remapClamped(wrappedZ, -66, 8, 0.02, 0.28) * presence * (1 - ctaWeight * 0.6)
    }

    const count = this.portalRibbonPositions.length / 3
    const forward = portalProgress * 44 + time * 2.2
    for (let index = 0; index < count; index += 1) {
      const ratio = index / (count - 1)
      const spiral = time * 0.82 + ratio * 9.6
      const radius = 1.7 + Math.sin(ratio * 7 + time * 0.8) * 0.25 + presence * 0.36
      const z = MathUtils.euclideanModulo(MathUtils.lerp(8, -60, ratio) + forward + 66, 72) - 66
      const stride = index * 3
      this.portalRibbonPositions[stride] = Math.cos(spiral) * radius
      this.portalRibbonPositions[stride + 1] =
        Math.sin(spiral * 1.24) * (0.95 + presence * 0.5) + Math.cos(time + ratio * 8) * 0.18
      this.portalRibbonPositions[stride + 2] = z
    }
    this.portalRibbonAttribute.needsUpdate = true
    this.portalRibbon.rotation.z = time * 0.08
    this.portalRibbonMaterial.opacity = 0.06 + presence * 0.32
  }
  private updateSystemsScene(
    time: number,
    pointer: PointerState,
    systemsProgress: number,
    systemsWeight: number,
    sequenceWeight: number,
  ): void {
    const presence = MathUtils.clamp(systemsWeight * 1.95 + sequenceWeight * 0.12, 0, 1)
    const rise = remapClamped(systemsProgress, 0.02, 1, 0, 1)

    this.systemsScene.position.set(
      this.systemsAnchor.x + pointer.x * 0.16,
      this.systemsAnchor.y + pointer.y * 0.1,
      this.systemsAnchor.z,
    )
    this.systemsScene.rotation.y = time * 0.04 - systemsProgress * 0.22

    for (const monolith of this.monoliths) {
      monolith.mesh.position.x = Math.cos(monolith.offset + time * 0.08) * monolith.radius
      monolith.mesh.position.y =
        -4.6 + rise * (3 + Math.sin(monolith.offset) * 0.5) + Math.sin(time * 0.7 + monolith.offset) * 0.18
      monolith.mesh.position.z = monolith.height + Math.cos(time * 0.24 + monolith.offset) * monolith.drift
      monolith.mesh.rotation.y = time * 0.18 + monolith.offset
      monolith.mesh.scale.y = 0.18 + rise * (1.45 + Math.sin(monolith.offset) * 0.2)
      monolith.material.emissiveIntensity = 0.08 + presence * 0.28
      monolith.material.opacity = 0.12 + presence * 0.7
    }

    for (const frame of this.systemsFrames) {
      frame.mesh.position.set(
        Math.cos(frame.angle + time * 0.18 + frame.offset) * frame.radius,
        frame.height + Math.sin(time * 0.52 + frame.offset) * 0.4,
        frame.depth + rise * 4.5,
      )
      frame.mesh.rotation.x = Math.sin(time * 0.25 + frame.offset) * 0.18
      frame.mesh.rotation.y = time * 0.1 + frame.angle
      frame.mesh.rotation.z = Math.cos(time * 0.24 + frame.offset) * 0.12
      frame.mesh.scale.setScalar(0.76 + presence * 0.44)
      frame.material.opacity = 0.06 + presence * 0.26
    }
  }

  private updateSequenceScene(
    time: number,
    pointer: PointerState,
    sequenceProgress: number,
    sequenceWeight: number,
    launchWeight: number,
  ): void {
    const presence = MathUtils.clamp(sequenceWeight * 1.95 + launchWeight * 0.14, 0, 1)

    this.sequenceScene.position.set(
      this.sequenceAnchor.x + pointer.x * 0.18,
      this.sequenceAnchor.y + pointer.y * 0.14,
      this.sequenceAnchor.z,
    )
    this.sequenceScene.rotation.y = -0.18 + pointer.x * 0.2

    this.sequenceKnot.rotation.x = time * 0.22 + sequenceProgress * 0.8
    this.sequenceKnot.rotation.y = time * 0.3 + sequenceProgress * 0.4
    this.sequenceKnot.rotation.z = time * 0.14
    this.sequenceKnot.scale.setScalar(0.9 + presence * 0.38)
    this.sequenceKnotMaterial.opacity = 0.08 + presence * 0.26

    for (const panel of this.sequencePanels) {
      const pivot = panel.mesh.parent as Group
      const angle = panel.angle + time * 0.22 + sequenceProgress * 1.1
      pivot.position.set(
        Math.cos(angle) * panel.radius,
        panel.height + Math.sin(time * 0.72 + panel.offset) * 0.35,
        panel.depth + Math.sin(time * 0.34 + panel.offset) * 1.1,
      )
      pivot.rotation.x = Math.sin(time * 0.18 + panel.offset) * 0.2
      pivot.rotation.y = angle * 0.48
      pivot.rotation.z = Math.cos(time * 0.3 + panel.offset) * 0.18
      pivot.scale.setScalar(panel.scale * (0.76 + presence * 0.44))
      panel.material.opacity = 0.08 + presence * 0.38
      ;(panel.material as MeshStandardMaterial).emissiveIntensity = 0.08 + presence * 0.34
      if (panel.glowMaterial) panel.glowMaterial.opacity = 0.04 + presence * 0.16
      if (panel.glow) panel.glow.position.z = 0.12 + Math.sin(time + panel.offset) * 0.04
    }
  }

  private updateLaunchScene(
    time: number,
    pointer: PointerState,
    launchProgress: number,
    launchWeight: number,
    ctaWeight: number,
  ): void {
    const presence = MathUtils.clamp(launchWeight * 2 + ctaWeight * 0.08, 0, 1)
    const burst = remapClamped(launchProgress, 0.04, 1, 0, 1)

    this.launchScene.position.set(
      this.launchAnchor.x + pointer.x * 0.2,
      this.launchAnchor.y + pointer.y * 0.12,
      this.launchAnchor.z,
    )
    this.launchScene.rotation.z = time * 0.06

    this.launchHalo.rotation.z = time * 0.12
    this.launchHalo.scale.setScalar(1 + burst * 1.1 + Math.sin(time * 1.4) * 0.05)
    this.launchHaloMaterial.opacity = 0.08 + presence * 0.24
    this.launchPulse.scale.setScalar(0.6 + presence * 0.85 + burst * 0.55)
    this.launchPulseMaterial.opacity = 0.04 + presence * 0.12
    this.launchCore.rotation.x = time * 0.26 + burst * 0.4
    this.launchCore.rotation.y = time * 0.32 + burst * 0.85
    this.launchCore.rotation.z = time * 0.18
    this.launchCore.scale.setScalar(0.72 + presence * 0.42 + burst * 0.32)
    this.launchCoreMaterial.emissiveIntensity = 0.12 + presence * 0.32

    for (const shard of this.launchShards) {
      const angle = time * shard.speed + shard.offset + burst * 1.8
      const radius = shard.radius + burst * 2.8
      shard.mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 1.42) * shard.height,
        Math.sin(angle * 0.78 + shard.offset) * radius * shard.drift,
      )
      shard.mesh.rotation.x = angle * 1.6 + shard.offset
      shard.mesh.rotation.y = angle * 1.2
      shard.mesh.rotation.z = angle * 1.8
      shard.mesh.scale.setScalar(0.45 + presence)
      shard.material.emissiveIntensity = 0.1 + presence * 0.28 + burst * 0.18
      shard.material.opacity = 0.12 + presence * 0.7
    }
  }

  private updateCtaScene(
    time: number,
    pointer: PointerState,
    ctaProgress: number,
    ctaWeight: number,
  ): void {
    const presence = MathUtils.clamp(ctaWeight * 2.05 + ctaProgress * 0.12, 0, 1)

    this.ctaScene.position.set(
      this.ctaAnchor.x + pointer.x * 0.12,
      this.ctaAnchor.y + pointer.y * 0.1,
      this.ctaAnchor.z,
    )
    this.ctaScene.rotation.y = time * 0.04 + pointer.x * 0.08

    this.ctaHalo.rotation.z = time * 0.11
    this.ctaHalo.scale.setScalar(1 + presence * 0.42)
    this.ctaHaloMaterial.opacity = 0.06 + presence * 0.2
    this.ctaCore.rotation.x = time * 0.2
    this.ctaCore.rotation.y = time * 0.18
    this.ctaCore.scale.setScalar(0.8 + presence * 0.24 + Math.sin(time * 1.2) * 0.03)
    this.ctaCoreMaterial.emissiveIntensity = 0.12 + presence * 0.22

    for (let index = 0; index < this.ctaNodes.length; index += 1) {
      const node = this.ctaNodes[index]
      const angle = node.angle + time * 0.18
      node.mesh.position.set(
        Math.cos(angle) * node.radius,
        node.height + Math.sin(time * 0.7 + node.offset) * 0.34,
        Math.sin(angle) * node.radius * 0.62,
      )
      node.material.emissiveIntensity = 0.12 + presence * 0.24
      const stride = index * 3
      this.ctaLinkPositions[stride] = node.mesh.position.x
      this.ctaLinkPositions[stride + 1] = node.mesh.position.y
      this.ctaLinkPositions[stride + 2] = node.mesh.position.z
    }

    this.ctaLinkPositions[this.ctaNodes.length * 3] = this.ctaLinkPositions[0]
    this.ctaLinkPositions[this.ctaNodes.length * 3 + 1] = this.ctaLinkPositions[1]
    this.ctaLinkPositions[this.ctaNodes.length * 3 + 2] = this.ctaLinkPositions[2]
    this.ctaLinkAttribute.needsUpdate = true
    this.ctaLinkMaterial.opacity = 0.08 + presence * 0.3
  }

  private updateDust(
    time: number,
    scrollProgress: number,
    pointer: PointerState,
    launchWeight: number,
    ctaWeight: number,
  ): void {
    if (this.lowPower) {
      this.dustThrottle = (this.dustThrottle + 1) % 2
      if (this.dustThrottle !== 0) {
        return
      }
    }

    const count = this.dustPositions.length / 3
    const forward = scrollProgress * 90 + time * 1.8 + launchWeight * 14
    for (let index = 0; index < count; index += 1) {
      const stride = index * 3
      const phase = index * 0.017
      const wrappedZ = MathUtils.euclideanModulo(this.dustBase[stride + 2] + forward + 96, 104) - 96
      this.dustPositions[stride] =
        this.dustBase[stride] + Math.sin(time * 0.32 + phase * 11) * 0.18 + pointer.x * 0.26
      this.dustPositions[stride + 1] =
        this.dustBase[stride + 1] + Math.cos(time * 0.41 + phase * 9) * 0.16 + pointer.y * 0.18
      this.dustPositions[stride + 2] = wrappedZ
    }
    ;(this.dust.geometry.getAttribute('position') as BufferAttribute).needsUpdate = true
    this.dustMaterial.size = 0.046 + launchWeight * 0.016 + ctaWeight * 0.01
    this.dustMaterial.opacity = 0.52 + launchWeight * 0.12 + ctaWeight * 0.08
  }

  private setSceneVisibility(weights: Record<(typeof CHAPTER_IDS)[number], number>): void {
    this.heroScene.visible = weights.hero > 0.01
    this.portalScene.visible = weights.portal > 0.01
    this.systemsScene.visible = weights.systems > 0.01
    this.sequenceScene.visible = weights.sequence > 0.01
    this.launchScene.visible = weights.launch > 0.01
    this.ctaScene.visible = weights.cta > 0.01
  }
}

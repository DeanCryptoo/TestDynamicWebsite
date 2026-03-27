import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  FogExp2,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  RingGeometry,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import {
  ChapterBlendTracker,
  createChapterProgress,
  createStaggeredTimeline,
  collectChapterState,
  createChapterBlendTarget,
  createFanOffset,
  createFloatMotion,
  createOrbitOffset,
  createPulseValue,
  createTimelineEnvelope,
  softenTimelineTail,
} from '../core/chapter-timeline'
import { easeInOutCubic, easeOutQuint } from '../core/math'
import type { PointerState } from '../core/pointer-tracker'
import type { ScrollFrame } from '../core/smooth-scroll'
import { SectionRegistry } from '../core/section-registry'

const MICROPHONE_MODEL_URL = new URL('../../3DModels/Microphone.glb', import.meta.url).href
const BALLOON_MODEL_URL = new URL('../../3DModels/Balloon.glb', import.meta.url).href
const BOTTLE_MODEL_URL = new URL('../../3DModels/Bottle.glb', import.meta.url).href
const DISCO_BALL_MODEL_URL = new URL('../../3DModels/DiscoBall.glb', import.meta.url).href
const MARTINI_MODEL_URL = new URL('../../3DModels/MartiniGlass.glb', import.meta.url).href
const CHAPTER_IDS = ['intro', 'events', 'movement', 'gallery', 'contact'] as const

interface SceneUpdateInput {
  deltaTime: number
  time: number
  pointer: PointerState
  scroll: ScrollFrame
}

interface MicrophoneInstance {
  group: Group
  baseX: number
  baseY: number
  baseZ: number
  baseRotX: number
  baseRotY: number
  baseRotZ: number
  phase: number
  scale: number
  drift: number
}

interface MicrophoneConfig {
  baseX: number
  baseY: number
  baseZ: number
  baseRotX?: number
  baseRotY?: number
  baseRotZ?: number
  phase: number
  scale: number
  drift: number
  palette: ModelPalette
}

interface PulseRing {
  mesh: Mesh
  material: MeshBasicMaterial
  baseScale: number
  baseX: number
  baseY: number
  baseZ: number
  phase: number
  rotationX: number
  spin: number
}

interface ModelPalette {
  base: string
  emissive: string
  accent?: string
  clearcoat?: number
  clearcoatRoughness?: number
  opacity?: number
  roughness?: number
  metalness?: number
  emissiveIntensity?: number
  specularIntensity?: number
}

type SceneKey = 'intro' | 'events' | 'movement' | 'gallery' | 'contact'

interface SceneFrame {
  cameraTarget: Vector3
  look: Vector3
  fogColor: string
  fogDensity: number
  keyColor: string
  rimColor: string
  accentColor: string
  fillColor: string
}

export class PullupScene {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(42, 1, 0.1, 120)
  private readonly lookTarget = new Vector3()
  private readonly sections: SectionRegistry
  private readonly lowPower: boolean
  private readonly blendTracker = new ChapterBlendTracker(CHAPTER_IDS, 'intro')

  private readonly world = new Group()
  private readonly introGroup = new Group()
  private readonly eventsGroup = new Group()
  private readonly movementGroup = new Group()
  private readonly galleryGroup = new Group()
  private readonly contactGroup = new Group()

  private readonly introAnchor = new Vector3(0, 0.05, 0)
  private readonly eventsAnchor = new Vector3(0.5, -0.06, -18)
  private readonly movementAnchor = new Vector3(-5.2, 0.35, -36)
  private readonly galleryAnchor = new Vector3(4.4, 0.45, -52)
  private readonly contactAnchor = new Vector3(0.1, 1.05, -70)

  private readonly ambientLight = new AmbientLight(new Color('#fff4e5'), 0.62)
  private readonly skyLight = new HemisphereLight(new Color('#fff5de'), new Color('#0a1013'), 0.44)
  private readonly keyLight = new DirectionalLight(new Color('#fff0d8'), 0.74)
  private readonly rimLight = new DirectionalLight(new Color('#ff7b59'), 0.62)
  private readonly accentLight = new PointLight(new Color('#b7ff3b'), 0.92, 26, 2)
  private readonly fillLight = new PointLight(new Color('#ff8d72'), 0.84, 22, 2)
  private readonly propKeyLight = new PointLight(new Color('#fff7db'), 0, 22, 2)
  private readonly propAccentLight = new PointLight(new Color('#d8ff66'), 0, 18, 2)

  private readonly introStageRoot = new Group()
  private readonly eventsStageRoot = new Group()
  private readonly movementStageRoot = new Group()
  private readonly galleryStageRoot = new Group()
  private readonly contactStageRoot = new Group()

  private readonly contactRings: PulseRing[] = []
  private readonly eventBursts: PulseRing[] = []
  private readonly movementBursts: PulseRing[] = []
  private readonly movementMicrophones: MicrophoneInstance[] = []
  private readonly eventBottles: MicrophoneInstance[] = []
  private readonly galleryDiscoBalls: MicrophoneInstance[] = []
  private readonly contactMartinis: MicrophoneInstance[] = []
  private readonly introBalloons: MicrophoneInstance[] = []

  private readonly haze: Points
  private readonly hazeMaterial: PointsMaterial
  private readonly hazePositions: Float32Array
  private readonly hazeBase: Float32Array
  private readonly tempColorA = new Color()
  private readonly tempColorB = new Color()
  private readonly tempColorC = new Color()
  private readonly tempVectorA = new Vector3()
  private readonly tempVectorB = new Vector3()
  private readonly tempVectorC = new Vector3()
  private readonly tempVectorD = new Vector3()
  private readonly tempVectorE = new Vector3()
  private hazeThrottle = 0

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
    this.renderer.toneMappingExposure = this.lowPower ? 0.92 : 1.04
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.lowPower ? 0.8 : 1.35))
    this.renderer.setClearColor(0x000000, 0)

    this.scene.fog = new FogExp2('#09070a', this.lowPower ? 0.03 : 0.026)
    this.camera.position.set(0, 0.45, 9)

    this.skyLight.position.set(0, 3.8, 0)
    this.keyLight.position.set(4.8, 5.6, 7.4)
    this.rimLight.position.set(-4.2, 2.9, -5.6)
    this.accentLight.position.set(2.6, 1.5, 5.1)
    this.fillLight.position.set(-2.4, 0.8, 4.6)
    this.scene.add(
      this.ambientLight,
      this.skyLight,
      this.keyLight,
      this.rimLight,
      this.accentLight,
      this.fillLight,
      this.propKeyLight,
      this.propAccentLight,
    )

    this.introGroup.position.copy(this.introAnchor)
    this.eventsGroup.position.copy(this.eventsAnchor)
    this.movementGroup.position.copy(this.movementAnchor)
    this.galleryGroup.position.copy(this.galleryAnchor)
    this.contactGroup.position.copy(this.contactAnchor)

    this.introGroup.add(this.introStageRoot)
    this.eventsGroup.add(this.eventsStageRoot)
    this.movementGroup.add(this.movementStageRoot)
    this.galleryGroup.add(this.galleryStageRoot)
    this.contactGroup.add(this.contactStageRoot)

    this.world.add(
      this.introGroup,
      this.eventsGroup,
      this.movementGroup,
      this.galleryGroup,
      this.contactGroup,
    )
    this.scene.add(this.world)

    const contactRingConfigs = this.lowPower
      ? [
          { x: 0.02, y: 0.72, z: -1.28, scale: 0.98, color: '#34dbc0', phase: 0, spin: 0.06 },
          { x: 0.02, y: 0.72, z: -1.3, scale: 1.34, color: '#f3f7f6', phase: 1.4, spin: -0.05 },
        ]
      : [
          { x: 0.02, y: 0.72, z: -1.28, scale: 0.92, color: '#34dbc0', phase: 0, spin: 0.06 },
          { x: 0.02, y: 0.72, z: -1.3, scale: 1.26, color: '#f3f7f6', phase: 1.4, spin: -0.05 },
          { x: 0.02, y: 0.72, z: -1.32, scale: 1.62, color: '#d8ff66', phase: 2.8, spin: 0.04 },
        ]

    for (const config of contactRingConfigs) {
      this.addPulseRing(this.contactStageRoot, this.contactRings, {
        x: config.x,
        y: config.y,
        z: config.z,
        baseScale: config.scale,
        color: config.color,
        phase: config.phase,
        spin: config.spin,
      })
    }

    const eventBurstConfigs = this.lowPower
      ? [
          { x: 0.12, y: 0.52, z: -5.28, scale: 1.08, color: '#ff9b67', phase: 0.4, spin: 0.05 },
          { x: 0.12, y: 0.52, z: -5.48, scale: 1.54, color: '#d7ff5b', phase: 1.3, spin: -0.04 },
        ]
      : [
          { x: 0.18, y: 0.58, z: -5.88, scale: 1.1, color: '#ff9b67', phase: 0.4, spin: 0.05 },
          { x: 0.18, y: 0.58, z: -6.12, scale: 1.58, color: '#d7ff5b', phase: 1.3, spin: -0.04 },
          { x: 0.18, y: 0.58, z: -6.36, scale: 2.04, color: '#fff1dd', phase: 2.2, spin: 0.03 },
        ]

    for (const config of eventBurstConfigs) {
      this.addPulseRing(this.eventsStageRoot, this.eventBursts, {
        x: config.x,
        y: config.y,
        z: config.z,
        baseScale: config.scale,
        color: config.color,
        phase: config.phase,
        spin: config.spin,
        rotationX: Math.PI * 0.18,
      })
    }

    const movementBurstConfigs = this.lowPower
      ? [
          { x: -0.18, y: 0.24, z: -4.6, scale: 1.24, color: '#53d2ff', phase: 0.3, spin: 0.04, rotationX: Math.PI * 0.36 },
          { x: -0.08, y: 0.54, z: -5.3, scale: 1.76, color: '#d9fbff', phase: 1.2, spin: -0.03, rotationX: Math.PI * 0.46 },
        ]
      : [
          { x: -0.26, y: 0.18, z: -4.82, scale: 1.18, color: '#53d2ff', phase: 0.3, spin: 0.04, rotationX: Math.PI * 0.34 },
          { x: 0.04, y: 0.46, z: -5.54, scale: 1.72, color: '#d9fbff', phase: 1.2, spin: -0.03, rotationX: Math.PI * 0.44 },
          { x: 0.28, y: 0.8, z: -6.18, scale: 2.22, color: '#8ddfff', phase: 2.1, spin: 0.02, rotationX: Math.PI * 0.52 },
        ]

    for (const config of movementBurstConfigs) {
      this.addPulseRing(this.movementStageRoot, this.movementBursts, {
        x: config.x,
        y: config.y,
        z: config.z,
        baseScale: config.scale,
        color: config.color,
        phase: config.phase,
        spin: config.spin,
        rotationX: config.rotationX,
      })
    }

    const hazeCount = this.lowPower ? 72 : 220
    this.hazeBase = new Float32Array(hazeCount * 3)
    this.hazePositions = new Float32Array(hazeCount * 3)
    const hazeColors = new Float32Array(hazeCount * 3)

    for (let index = 0; index < hazeCount; index += 1) {
      const stride = index * 3
      const radius = Math.random() * 5.6 + 1
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 5.8
      const z = -Math.random() * 90 + 12
      this.hazeBase[stride] = Math.cos(theta) * radius
      this.hazeBase[stride + 1] = y
      this.hazeBase[stride + 2] = z
      this.hazePositions[stride] = this.hazeBase[stride]
      this.hazePositions[stride + 1] = y
      this.hazePositions[stride + 2] = z
      const color = new Color(index % 3 === 0 ? '#ff8b67' : index % 4 === 0 ? '#cbff4e' : '#f7e6d2')
      hazeColors[stride] = color.r
      hazeColors[stride + 1] = color.g
      hazeColors[stride + 2] = color.b
    }

    const hazeGeometry = new BufferGeometry()
    hazeGeometry.setAttribute('position', new BufferAttribute(this.hazePositions, 3))
    hazeGeometry.setAttribute('color', new BufferAttribute(hazeColors, 3))
    this.hazeMaterial = new PointsMaterial({
      size: this.lowPower ? 0.07 : 0.055,
      vertexColors: true,
      transparent: true,
      opacity: this.lowPower ? 0.07 : 0.1,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    this.haze = new Points(hazeGeometry, this.hazeMaterial)
    this.scene.add(this.haze)

    void Promise.allSettled([
      this.loadMicrophones(),
      this.loadBalloons(),
      this.loadBottles(),
      this.loadDiscoBalls(),
      this.loadMartinis(),
    ])
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / Math.max(height, 1)
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.lowPower ? 0.8 : 1.35))
    this.renderer.setSize(width, height, false)
  }

  update({ deltaTime, time, pointer, scroll }: SceneUpdateInput): void {
    const chapterState = collectChapterState(CHAPTER_IDS, this.sections, {
      baselines: { intro: 0.02 },
      exponents: {
        intro: 1.8,
        events: 1.9,
        movement: 1.9,
        gallery: 1.9,
        contact: 1.9,
      },
      visibilityBoost: 0.08,
    })
    const sceneBlend = createChapterBlendTarget(CHAPTER_IDS, chapterState.weights, {
      maxSecondaryMix: 0.38,
      secondaryEnterEnd: 0.42,
      secondaryEnterStart: 0.18,
      secondaryWeight: 1.08,
    })
    const sceneIntensities = this.blendTracker.update(sceneBlend.target, deltaTime, {
      enterSmoothing: this.lowPower ? 2.1 : 2.4,
      exitSmoothing: this.lowPower ? 2.8 : 3.2,
    })
    this.setSceneVisibility(sceneIntensities)

    const introProgress = chapterState.progress.intro
    const eventsProgress = chapterState.progress.events
    const movementProgress = chapterState.progress.movement
    const galleryProgress = chapterState.progress.gallery
    const contactProgress = chapterState.progress.contact

    this.updateIntro(time, pointer, introProgress, sceneIntensities.intro)
    this.updateEvents(time, pointer, eventsProgress, sceneIntensities.events)
    this.updateMovement(time, pointer, movementProgress, sceneIntensities.movement)
    this.updateGallery(time, pointer, galleryProgress, sceneIntensities.gallery)
    this.updateContact(time, pointer, contactProgress, sceneIntensities.contact)
    this.updateHaze(
      time,
      scroll.progress,
      pointer,
      sceneIntensities.gallery * 0.9 +
        sceneIntensities.events * 0.45 +
        sceneIntensities.movement * 0.32 +
        0.15,
    )

    const blendedFrame = this.composeSceneFrame(sceneIntensities, {
      pointer,
      introProgress,
      eventsProgress,
      movementProgress,
      galleryProgress,
      contactProgress,
    })

    const { cameraTarget, look, fogColor, fogDensity, keyColor, rimColor, accentColor, fillColor } =
      blendedFrame

    this.camera.position.copy(cameraTarget)
    this.lookTarget.copy(look)
    this.camera.lookAt(this.lookTarget)

    ;(this.scene.fog as FogExp2).color.set(fogColor)
    ;(this.scene.fog as FogExp2).density = fogDensity + (this.lowPower ? 0.004 : 0)

    this.keyLight.color.set(keyColor)
    this.rimLight.color.set(rimColor)
    this.accentLight.position.set(this.lookTarget.x + 2.4, this.lookTarget.y + 1.8, this.lookTarget.z + 4.8)
    this.fillLight.position.set(this.lookTarget.x - 2.2, this.lookTarget.y + 1, this.lookTarget.z + 5.1)
    this.accentLight.color.set(accentColor)
    this.fillLight.color.set(fillColor)
    this.skyLight.color.copy(this.tempColorA.set(keyColor).lerp(this.tempColorB.set(fillColor), 0.26))
    this.skyLight.groundColor.copy(this.tempColorC.set(fogColor).lerp(this.tempColorB.set('#06080b'), 0.54))
    this.skyLight.intensity =
      (this.lowPower ? 0.28 : 0.44) +
      sceneIntensities.intro * 0.12 +
      sceneIntensities.gallery * 0.08 +
      sceneIntensities.contact * 0.06
    this.updateReactiveLights(
      time,
      sceneBlend.primary,
      sceneBlend.secondary,
      sceneIntensities,
      keyColor,
      accentColor,
    )

    this.world.position.set(pointer.x * 0.06, pointer.y * 0.045, 0)
    this.world.rotation.z = pointer.x * 0.008

    this.renderer.render(this.scene, this.camera)
  }

  private updateIntro(
    time: number,
    pointer: PointerState,
    introProgress: number,
    introWeight: number,
  ): void {
    const timeline = createChapterProgress(introProgress, 0, 1, easeInOutCubic)
    const travel = softenTimelineTail(timeline, { tailStart: 0.58, cap: 0.82, ease: easeOutQuint })
    const presence = MathUtils.clamp(introWeight * 1.28 + (1 - travel) * 0.06, 0, 1)
    const arc = Math.sin(travel * Math.PI)
    this.introStageRoot.position.set(
      0.62 + pointer.x * 0.12,
      -0.62 + pointer.y * 0.04 + travel * 0.06,
      -6.64 - travel * 0.58,
    )
    this.introStageRoot.rotation.y = 0.06 + pointer.x * 0.04 - travel * 0.1
    this.introStageRoot.rotation.z = -0.03 + arc * 0.03

    for (let index = 0; index < this.introBalloons.length; index += 1) {
      const balloon = this.introBalloons[index]
      const float = softenTimelineTail(
        createStaggeredTimeline(travel, index, this.introBalloons.length, {
          ease: easeOutQuint,
          span: 0.78,
          spread: 0.1,
        }),
        { tailStart: 0.42, cap: 0.88, ease: easeOutQuint },
      )
      const envelope = createTimelineEnvelope(float, {
        easeIn: easeOutQuint,
        easeOut: easeInOutCubic,
        fadeInEnd: 0.22,
        fadeInStart: 0.04,
        fadeOutEnd: 0.985,
        fadeOutStart: 0.82,
      })
      const motionBand = createTimelineEnvelope(float, {
        easeIn: easeInOutCubic,
        easeOut: easeInOutCubic,
        fadeInEnd: 0.3,
        fadeInStart: 0.08,
        fadeOutEnd: 0.96,
        fadeOutStart: 0.74,
      })
      const burst = createChapterProgress(float, 0.2, 0.82, easeOutQuint)
      const exitRetreat = createChapterProgress(float, 0.72, 0.98, easeInOutCubic)
      const helium = createPulseValue(time, envelope, {
        amplitude: 0.28,
        base: 0.38,
        frequency: 0.54 + index * 0.06,
        phase: balloon.phase,
        progressGain: 0.2,
      })
      const orbit = createOrbitOffset(float, {
        phase: balloon.phase * 0.06,
        radiusX: 0.1 + index * 0.05,
        radiusY: 0.06 + index * 0.04,
        turns: 0.2,
      })
      const spread = createFanOffset(float, index, this.introBalloons.length, {
        spread: 0.58,
        curve: 0.8,
        ease: easeOutQuint,
      })
      const lift = createFloatMotion(time, float, {
        amplitude: 0.06 + index * 0.012,
        frequency: 0.48 + index * 0.06,
        phase: balloon.phase,
        base: 0.68,
        progressGain: 0.18,
      })
      this.setModelOpacity(balloon.group, 0.02 + presence * envelope * 0.94)
      this.animateMicrophonePalette(balloon, time, presence, float)
      balloon.group.position.set(
        balloon.baseX + spread * 0.08 * motionBand + orbit.x * motionBand * 0.82 + helium * 0.08,
        balloon.baseY + (orbit.y + lift) * motionBand + burst * 0.14 + exitRetreat * 0.1 + helium * 0.22,
        balloon.baseZ - burst * 0.48 - exitRetreat * 0.14 + Math.sin(time * 0.24 + balloon.phase) * 0.06,
      )
      balloon.group.rotation.set(
        balloon.baseRotX + lift * 0.08 * motionBand + helium * 0.04,
        balloon.baseRotY + (spread * 0.03 + orbit.x * 0.04) * motionBand,
        balloon.baseRotZ + lift * 0.08 * motionBand + Math.sin(time * 0.38 + balloon.phase) * 0.05 * envelope,
      )
      balloon.group.scale.setScalar(balloon.scale * envelope * (1.02 + presence * 0.04))
    }
  }

  private updateEvents(
    time: number,
    pointer: PointerState,
    eventsProgress: number,
    eventsWeight: number,
  ): void {
    const timeline = createChapterProgress(eventsProgress, 0.03, 1, easeInOutCubic)
    const travel = softenTimelineTail(timeline, { tailStart: 0.52, cap: 0.8, ease: easeOutQuint })
    const presence = MathUtils.clamp(eventsWeight * 1.42 + travel * 0.12, 0, 1)
    this.eventsStageRoot.position.set(
      0.24 + pointer.x * 0.06,
      -1.02 + pointer.y * 0.03 + travel * 0.05,
      -7.94 + travel * 1.18,
    )
    this.eventsStageRoot.rotation.y = -0.05 - travel * 0.14

    for (let index = 0; index < this.eventBottles.length; index += 1) {
      const bottle = this.eventBottles[index]
      const pass = softenTimelineTail(
        createStaggeredTimeline(travel, index, this.eventBottles.length, {
          ease: easeInOutCubic,
          span: 0.58,
          spread: 0.2,
        }),
        { tailStart: 0.48, cap: 0.82, ease: easeOutQuint },
      )
      const envelope = createTimelineEnvelope(pass, {
        easeIn: easeOutQuint,
        easeOut: easeInOutCubic,
        fadeInEnd: 0.24,
        fadeInStart: 0.05,
        fadeOutEnd: 0.985,
        fadeOutStart: 0.84,
      })
      const motionBand = createTimelineEnvelope(pass, {
        easeIn: easeInOutCubic,
        easeOut: easeInOutCubic,
        fadeInEnd: 0.34,
        fadeInStart: 0.08,
        fadeOutEnd: 0.965,
        fadeOutStart: 0.76,
      })
      const burst = createChapterProgress(pass, 0.16, 0.84, easeOutQuint)
      const exitRetreat = createChapterProgress(pass, 0.76, 0.99, easeInOutCubic)
      const arc = Math.sin(pass * Math.PI)
      const spread = createFanOffset(pass, index, this.eventBottles.length, {
        spread: 1.28,
        curve: 0.72,
        ease: easeOutQuint,
      })
      const orbit = createOrbitOffset(pass, {
        phase: bottle.phase * 0.05,
        radiusX: 0.12 + Math.abs(spread) * 0.08,
        radiusY: 0.05 + index * 0.01,
        turns: 0.18,
      })
      const lift = createFloatMotion(time, pass, {
        amplitude: 0.08,
        frequency: 0.64 + index * 0.06,
        phase: bottle.phase,
        base: 0.64,
        progressGain: 0.3,
      })
      this.setModelOpacity(bottle.group, 0.02 + presence * envelope * 0.98)
      this.animateMicrophonePalette(bottle, time, presence, pass)
      bottle.group.position.set(
        bottle.baseX + spread * 0.06 * motionBand + orbit.x * 0.5 * motionBand,
        bottle.baseY + (arc * 0.08 + lift) * motionBand + burst * 0.16 + exitRetreat * 0.08,
        bottle.baseZ + burst * 0.92 - exitRetreat * 0.16,
      )
      bottle.group.rotation.set(
        bottle.baseRotX + (burst * 0.06 - arc * 0.02) * motionBand,
        bottle.baseRotY + (spread * 0.03 + orbit.x * 0.04) * motionBand,
        bottle.baseRotZ + (spread * 0.03 + arc * 0.02) * motionBand,
      )
      bottle.group.scale.setScalar(bottle.scale * envelope * (1.04 + presence * 0.04))
    }

    const burstEnvelope = createTimelineEnvelope(travel, {
      easeIn: easeOutQuint,
      easeOut: easeOutQuint,
      fadeInEnd: 0.22,
      fadeInStart: 0.08,
      fadeOutEnd: 0.985,
      fadeOutStart: 0.78,
    })

    for (const ring of this.eventBursts) {
      const pulse = createPulseValue(time, burstEnvelope, {
        amplitude: 0.84,
        base: 0.34,
        frequency: 1.08 + ring.phase * 0.08,
        phase: ring.phase,
        progressGain: 0.22,
      })
      ring.mesh.position.set(ring.baseX, ring.baseY, ring.baseZ - travel * 0.48)
      ring.mesh.rotation.set(ring.rotationX, 0, time * ring.spin + ring.phase * 0.8)
      ring.mesh.scale.setScalar(ring.baseScale * (0.82 + burstEnvelope * 0.92 + pulse * 0.42))
      ring.material.opacity = presence * burstEnvelope * (0.04 + pulse * 0.24)
    }
  }

  private updateMovement(
    time: number,
    pointer: PointerState,
    movementProgress: number,
    movementWeight: number,
  ): void {
    const timeline = createChapterProgress(movementProgress, 0.06, 1, easeInOutCubic)
    const travel = softenTimelineTail(timeline, { tailStart: 0.56, cap: 0.8, ease: easeOutQuint })
    const presence = MathUtils.clamp(movementWeight * 1.46 + travel * 0.12, 0, 1)
    this.movementStageRoot.position.set(
      -0.08 + pointer.x * 0.08,
      -1.42 + pointer.y * 0.04 + travel * 0.14,
      -5.96 + travel * 0.48,
    )
    this.movementStageRoot.rotation.y = -0.09 + pointer.x * 0.05 + travel * 0.16
    this.movementStageRoot.rotation.x = Math.sin(time * 0.22) * 0.02

    for (let index = 0; index < this.movementMicrophones.length; index += 1) {
      const mic = this.movementMicrophones[index]
      const rise = softenTimelineTail(
        createStaggeredTimeline(travel, index, this.movementMicrophones.length, {
          ease: easeInOutCubic,
          span: 0.6,
          spread: 0.3,
        }),
        { tailStart: 0.52, cap: 0.82, ease: easeOutQuint },
      )
      const envelope = createTimelineEnvelope(rise, {
        easeIn: easeOutQuint,
        easeOut: easeInOutCubic,
        fadeInEnd: 0.22,
        fadeInStart: 0.05,
        fadeOutEnd: 0.988,
        fadeOutStart: 0.86,
      })
      const motionBand = createTimelineEnvelope(rise, {
        easeIn: easeInOutCubic,
        easeOut: easeInOutCubic,
        fadeInEnd: 0.32,
        fadeInStart: 0.08,
        fadeOutEnd: 0.972,
        fadeOutStart: 0.8,
      })
      const burst = createChapterProgress(rise, 0.14, 0.82, easeOutQuint)
      const exitRetreat = createChapterProgress(rise, 0.8, 0.99, easeInOutCubic)
      const arc = Math.sin(rise * Math.PI)
      const spiral = createOrbitOffset(rise, {
        phase: mic.phase * 0.04,
        radiusX: 0.1 + Math.abs(mic.baseX) * 0.02,
        radiusY: 0.1 + Math.abs(mic.baseX) * 0.02,
        turns: Math.abs(mic.baseX) < 0.2 ? 0.04 : 0.14,
      })
      const fan = createFanOffset(rise, index, this.movementMicrophones.length, {
        spread: 0.58,
        curve: 0.92,
        ease: easeInOutCubic,
      })
      const ambient = createFloatMotion(time, rise, {
        amplitude: 0.06,
        frequency: 0.78,
        phase: mic.phase,
        base: 0.54,
        progressGain: 0.3,
      })
      this.setModelOpacity(mic.group, 0.02 + presence * envelope * 0.98)
      this.animateMicrophonePalette(mic, time, presence, rise)
      const centerWeight = Math.abs(mic.baseX) < 0.2 ? 1 : 0
      const sway = Math.sin(time * (0.56 + index * 0.04) + mic.phase) * (centerWeight ? 0.04 : 0.08)
      mic.group.position.set(
        mic.baseX * (1 + burst * (centerWeight ? 0.03 : 0.08)) + fan * 0.08 * motionBand + spiral.x * motionBand,
        mic.baseY +
          (arc * mic.drift * (centerWeight ? 0.08 : 0.18) + ambient + sway) * motionBand +
          burst * (centerWeight ? 0.18 : 0.34 + Math.abs(mic.baseX) * 0.04) +
          spiral.y * motionBand +
          exitRetreat * 0.06,
        mic.baseZ - burst * (centerWeight ? 0.22 : 0.52) - exitRetreat * 0.08 - Math.abs(fan) * 0.04,
      )
      mic.group.rotation.set(
        mic.baseRotX + burst * (centerWeight ? 0.02 : 0.06) * motionBand,
        mic.baseRotY + ((index % 2 === 0 ? -1 : 1) * arc * 0.05 + fan * 0.04 + spiral.x * (centerWeight ? 0.02 : 0.05)) * motionBand,
        mic.baseRotZ + ((index % 2 === 0 ? -1 : 1) * rise * (centerWeight ? 0.02 : 0.06) + fan * 0.03 + spiral.y * (centerWeight ? 0.02 : 0.06)) * motionBand,
      )
      mic.group.scale.setScalar(mic.scale * envelope * (centerWeight ? 1.08 : 1.02 + presence * 0.04))
    }

    const movementPulse = createTimelineEnvelope(travel, {
      easeIn: easeOutQuint,
      easeOut: easeOutQuint,
      fadeInEnd: 0.24,
      fadeInStart: 0.08,
      fadeOutEnd: 0.99,
      fadeOutStart: 0.84,
    })

    for (const ring of this.movementBursts) {
      const wave = createPulseValue(time, movementPulse, {
        amplitude: 0.78,
        base: 0.4,
        frequency: 0.84 + ring.phase * 0.05,
        phase: ring.phase,
        progressGain: 0.3,
      })
      ring.mesh.position.set(
        ring.baseX + Math.sin(time * 0.2 + ring.phase) * 0.12,
        ring.baseY + travel * 0.1,
        ring.baseZ - travel * 0.42,
      )
      ring.mesh.rotation.set(ring.rotationX, 0, time * ring.spin + ring.phase * 0.8)
      ring.mesh.scale.setScalar(ring.baseScale * (0.86 + movementPulse * 0.72 + wave * 0.36))
      ring.material.opacity = presence * movementPulse * (0.03 + wave * 0.2)
    }
  }

  private updateGallery(
    time: number,
    pointer: PointerState,
    galleryProgress: number,
    galleryWeight: number,
  ): void {
    const timeline = createChapterProgress(galleryProgress, 0.04, 1, easeInOutCubic)
    const travel = softenTimelineTail(timeline, { tailStart: 0.6, cap: 0.82, ease: easeOutQuint })
    const presence = MathUtils.clamp(galleryWeight * 1.42 + travel * 0.12, 0, 1)
    this.galleryStageRoot.position.set(
      -0.08 + pointer.x * 0.04,
      -1.04 + pointer.y * 0.03 + travel * 0.05,
      -6.24 - travel * 0.18,
    )
    this.galleryStageRoot.rotation.y = -0.12 + travel * 0.16

    for (let index = 0; index < this.galleryDiscoBalls.length; index += 1) {
      const discoBall = this.galleryDiscoBalls[index]
      const hang = softenTimelineTail(
        createStaggeredTimeline(travel, index, this.galleryDiscoBalls.length, {
          ease: easeInOutCubic,
          span: 0.62,
          spread: 0.26,
        }),
        { tailStart: 0.5, cap: 0.8, ease: easeOutQuint },
      )
      const envelope = createTimelineEnvelope(hang, {
        easeIn: easeOutQuint,
        easeOut: easeInOutCubic,
        fadeInEnd: 0.22,
        fadeInStart: 0.05,
        fadeOutEnd: 0.988,
        fadeOutStart: 0.86,
      })
      const motionBand = createTimelineEnvelope(hang, {
        easeIn: easeInOutCubic,
        easeOut: easeInOutCubic,
        fadeInEnd: 0.32,
        fadeInStart: 0.08,
        fadeOutEnd: 0.972,
        fadeOutStart: 0.8,
      })
      const burst = createChapterProgress(hang, 0.18, 0.84, easeOutQuint)
      const exitRetreat = createChapterProgress(hang, 0.82, 0.99, easeInOutCubic)
      const drift = createFanOffset(hang, index, this.galleryDiscoBalls.length, {
        spread: 0.66,
        curve: 0.74,
        ease: easeInOutCubic,
      })
      const orbit = createOrbitOffset(hang, {
        phase: discoBall.phase * 0.04,
        radiusX: 0.16 + index * 0.03,
        radiusY: 0.08 + index * 0.02,
        turns: 0.14,
      })
      const bob = createFloatMotion(time, hang, {
        amplitude: 0.09,
        frequency: 0.42 + index * 0.04,
        phase: discoBall.phase,
        base: 0.66,
        progressGain: 0.24,
      })
      this.setModelOpacity(discoBall.group, 0.02 + presence * envelope * 0.98)
      this.animateMicrophonePalette(discoBall, time, presence, hang)
      discoBall.group.position.set(
        discoBall.baseX + drift * 0.06 * motionBand + orbit.x * 0.58 * motionBand,
        discoBall.baseY + orbit.y * motionBand + bob * motionBand + burst * 0.12 + exitRetreat * 0.08,
        discoBall.baseZ - burst * 0.28 - exitRetreat * 0.06,
      )
      discoBall.group.rotation.set(
        discoBall.baseRotX + hang * 0.04 * motionBand,
        discoBall.baseRotY + time * (0.28 + index * 0.03) * envelope + drift * 0.04 * motionBand,
        discoBall.baseRotZ + orbit.x * 0.08 * motionBand,
      )
      discoBall.group.scale.setScalar(discoBall.scale * envelope * (1.03 + presence * 0.04))
    }
  }

  private updateContact(
    time: number,
    pointer: PointerState,
    contactProgress: number,
    contactWeight: number,
  ): void {
    const timeline = createChapterProgress(contactProgress, 0.06, 1, easeInOutCubic)
    const settle = softenTimelineTail(
      createChapterProgress(timeline, 0.18, 0.96, easeOutQuint),
      { tailStart: 0.58, cap: 0.82, ease: easeOutQuint },
    )
    const presence = MathUtils.clamp(contactWeight * 1.38 + settle * 0.14, 0, 1)
    this.contactStageRoot.position.set(
      0.42 + pointer.x * 0.04,
      -1.24 + pointer.y * 0.03 + settle * 0.1,
      -5.42 - settle * 0.1,
    )
    this.contactStageRoot.rotation.y = 0.12 + settle * 0.12

    for (let index = 0; index < this.contactMartinis.length; index += 1) {
      const martini = this.contactMartinis[index]
      const cheers = softenTimelineTail(
        createStaggeredTimeline(settle, index, this.contactMartinis.length, {
          ease: easeOutQuint,
          span: 0.64,
          spread: 0.18,
        }),
        { tailStart: 0.48, cap: 0.84, ease: easeOutQuint },
      )
      const envelope = createTimelineEnvelope(cheers, {
        easeIn: easeOutQuint,
        easeOut: easeInOutCubic,
        fadeInEnd: 0.22,
        fadeInStart: 0.05,
        fadeOutEnd: 0.988,
        fadeOutStart: 0.88,
      })
      const motionBand = createTimelineEnvelope(cheers, {
        easeIn: easeInOutCubic,
        easeOut: easeInOutCubic,
        fadeInEnd: 0.32,
        fadeInStart: 0.08,
        fadeOutEnd: 0.972,
        fadeOutStart: 0.82,
      })
      const burst = createChapterProgress(cheers, 0.18, 0.86, easeOutQuint)
      const exitRetreat = createChapterProgress(cheers, 0.82, 0.99, easeInOutCubic)
      const arc = Math.sin(cheers * Math.PI)
      const toastSpread = createFanOffset(cheers, index, this.contactMartinis.length, {
        spread: this.lowPower ? 0.84 : 1.08,
        curve: 0.82,
        ease: easeOutQuint,
      })
      const orbit = createOrbitOffset(cheers, {
        phase: martini.phase * 0.05,
        radiusX: 0.08 + index * 0.025,
        radiusY: 0.06 + index * 0.02,
        turns: 0.16,
      })
      const ambient = createFloatMotion(time, cheers, {
        amplitude: 0.04,
        frequency: 0.44 + index * 0.04,
        phase: martini.phase,
        base: 0.56,
        progressGain: 0.18,
      })
      const sway = Math.sin(time * (0.64 + index * 0.06) + martini.phase) * 0.08
      this.setModelOpacity(martini.group, 0.02 + presence * envelope * 0.94)
      this.animateMicrophonePalette(martini, time, presence, cheers)
      martini.group.position.set(
        martini.baseX + toastSpread * 0.06 * motionBand + orbit.x * 0.56 * motionBand,
        martini.baseY + (arc * 0.1 + ambient + Math.abs(toastSpread) * 0.02) * motionBand + burst * 0.16 + exitRetreat * 0.08,
        martini.baseZ - burst * 0.24 - exitRetreat * 0.06,
      )
      martini.group.rotation.set(
        martini.baseRotX + arc * 0.05 * motionBand,
        martini.baseRotY + (toastSpread * 0.04 + orbit.x * 0.06) * motionBand,
        martini.baseRotZ + (sway + orbit.y * 0.08) * motionBand,
      )
      martini.group.scale.setScalar(martini.scale * envelope * (1.04 + presence * 0.04))
    }

    for (const ring of this.contactRings) {
      const ringEnvelope = createTimelineEnvelope(settle, {
        easeIn: easeOutQuint,
        easeOut: easeOutQuint,
        fadeInEnd: 0.18,
        fadeInStart: 0.04,
        fadeOutEnd: 0.992,
        fadeOutStart: 0.9,
      })
      const pulse = createPulseValue(time, ringEnvelope, {
        amplitude: 0.68,
        base: 0.42,
        frequency: 0.72 + ring.phase * 0.06,
        phase: ring.phase,
        progressGain: 0.3,
      })
      ring.mesh.position.set(ring.baseX, ring.baseY, ring.baseZ)
      ring.mesh.rotation.set(ring.rotationX, 0, time * ring.spin + ring.phase * 0.4)
      ring.mesh.scale.setScalar(ring.baseScale * (0.72 + ringEnvelope * 0.34 + pulse * 0.42))
      ring.material.opacity = presence * ringEnvelope * (0.03 + pulse * 0.15)
    }
  }

  private updateHaze(
    time: number,
    scrollProgress: number,
    pointer: PointerState,
    sectionBias: number,
  ): void {
    if (this.lowPower) {
      this.hazeThrottle = (this.hazeThrottle + 1) % 2
      if (this.hazeThrottle !== 0) {
        return
      }
    }

    const count = this.hazePositions.length / 3
    const forward = scrollProgress * 86 + time * 0.8 + sectionBias * 5

    for (let index = 0; index < count; index += 1) {
      const stride = index * 3
      const phase = index * 0.023
      const wrappedZ = MathUtils.euclideanModulo(this.hazeBase[stride + 2] + forward + 92, 104) - 92
      this.hazePositions[stride] =
        this.hazeBase[stride] + Math.sin(time * 0.18 + phase * 7) * 0.06 + pointer.x * 0.08
      this.hazePositions[stride + 1] =
        this.hazeBase[stride + 1] + Math.cos(time * 0.22 + phase * 8) * 0.05 + pointer.y * 0.06
      this.hazePositions[stride + 2] = wrappedZ
    }

    ;(this.haze.geometry.getAttribute('position') as BufferAttribute).needsUpdate = true
  }

  private updateReactiveLights(
    time: number,
    primary: SceneKey,
    secondary: SceneKey | null,
    intensities: Record<SceneKey, number>,
    keyColor: string,
    accentColor: string,
  ): void {
    const primaryWeight = intensities[primary]
    const secondaryWeight = secondary ? intensities[secondary] : 0
    const totalWeight = primaryWeight + secondaryWeight

    if (totalWeight <= 0.01) {
      this.propKeyLight.intensity = 0
      this.propAccentLight.intensity = 0
      return
    }

    this.getSceneLightPosition(primary, 'key', this.tempVectorA).multiplyScalar(primaryWeight)
    this.getSceneLightPosition(primary, 'accent', this.tempVectorB).multiplyScalar(primaryWeight)

    if (secondary) {
      this.getSceneLightPosition(secondary, 'key', this.tempVectorC).multiplyScalar(secondaryWeight)
      this.getSceneLightPosition(secondary, 'accent', this.tempVectorD).multiplyScalar(secondaryWeight)
      this.tempVectorA.add(this.tempVectorC)
      this.tempVectorB.add(this.tempVectorD)
    }

    this.tempVectorA.multiplyScalar(1 / totalWeight)
    this.tempVectorB.multiplyScalar(1 / totalWeight)

    const shimmer = createPulseValue(time, totalWeight, {
      amplitude: 0.34,
      base: 0.78,
      frequency: 1.04,
      phase: 0.6,
      progressGain: 0.22,
    })
    const flare = createPulseValue(time, totalWeight, {
      amplitude: 0.42,
      base: 0.62,
      frequency: 1.52,
      phase: 1.4,
      progressGain: 0.34,
    })

    this.propKeyLight.position.copy(this.tempVectorA)
    this.propAccentLight.position.copy(this.tempVectorB)
    this.propKeyLight.color.set(keyColor)
    this.propAccentLight.color.copy(this.tempColorA.set(accentColor).lerp(this.tempColorB.set('#fff7dc'), 0.22))
    this.propKeyLight.intensity = (this.lowPower ? 0.34 : 0.96) * shimmer * totalWeight
    this.propAccentLight.intensity = (this.lowPower ? 0.26 : 0.72) * flare * totalWeight
  }

  private getSceneLightPosition(
    scene: SceneKey,
    variant: 'key' | 'accent',
    target: Vector3,
  ): Vector3 {
    const anchor = this.getSceneAnchor(scene, target)

    switch (scene) {
      case 'intro':
        return anchor.add(
          variant === 'key'
            ? this.tempVectorE.set(-0.48, 1.18, 2.16)
            : this.tempVectorE.set(1.18, 0.74, 1.42),
        )
      case 'events':
        return anchor.add(
          variant === 'key'
            ? this.tempVectorE.set(-0.56, 0.92, 2.24)
            : this.tempVectorE.set(0.92, 0.32, 1.56),
        )
      case 'movement':
        return anchor.add(
          variant === 'key'
            ? this.tempVectorE.set(0, 1.22, 1.96)
            : this.tempVectorE.set(1.26, 0.24, 1.28),
        )
      case 'gallery':
        return anchor.add(
          variant === 'key'
            ? this.tempVectorE.set(-0.32, 1.08, 2.08)
            : this.tempVectorE.set(1.16, 0.48, 1.48),
        )
      case 'contact':
        return anchor.add(
          variant === 'key'
            ? this.tempVectorE.set(0.12, 1.02, 1.96)
            : this.tempVectorE.set(-1.08, 0.42, 1.34),
        )
    }
  }

  private getSceneAnchor(scene: SceneKey, target: Vector3): Vector3 {
    switch (scene) {
      case 'intro':
        return this.introStageRoot.getWorldPosition(target)
      case 'events':
        return this.eventsStageRoot.getWorldPosition(target)
      case 'movement':
        return this.movementStageRoot.getWorldPosition(target)
      case 'gallery':
        return this.galleryStageRoot.getWorldPosition(target)
      case 'contact':
        return this.contactStageRoot.getWorldPosition(target)
    }
  }

  private setSceneVisibility(intensities: Record<SceneKey, number>): void {
    this.introGroup.visible = intensities.intro > 0.01
    this.eventsGroup.visible = intensities.events > 0.01
    this.movementGroup.visible = intensities.movement > 0.01
    this.galleryGroup.visible = intensities.gallery > 0.01
    this.contactGroup.visible = intensities.contact > 0.01
  }

  private composeSceneFrame(
    intensities: Record<SceneKey, number>,
    progress: {
      pointer: PointerState
      introProgress: number
      eventsProgress: number
      movementProgress: number
      galleryProgress: number
      contactProgress: number
    },
  ): SceneFrame {
    const sceneKeys: SceneKey[] = ['intro', 'events', 'movement', 'gallery', 'contact']
    const cameraTarget = new Vector3()
    const look = new Vector3()
    const fogColor = new Color()
    const keyColor = new Color()
    const rimColor = new Color()
    const accentColor = new Color()
    const fillColor = new Color()
    let density = 0
    let total = 0

    for (const key of sceneKeys) {
      const intensity = intensities[key]
      if (intensity <= 0.001) {
        continue
      }

      const frame = this.getSceneFrame(key, progress)
      cameraTarget.addScaledVector(frame.cameraTarget, intensity)
      look.addScaledVector(frame.look, intensity)
      fogColor.add(new Color(frame.fogColor).multiplyScalar(intensity))
      keyColor.add(new Color(frame.keyColor).multiplyScalar(intensity))
      rimColor.add(new Color(frame.rimColor).multiplyScalar(intensity))
      accentColor.add(new Color(frame.accentColor).multiplyScalar(intensity))
      fillColor.add(new Color(frame.fillColor).multiplyScalar(intensity))
      density += frame.fogDensity * intensity
      total += intensity
    }

    if (total <= 0.0001) {
      return this.getSceneFrame('intro', progress)
    }

    const normalizer = 1 / total
    return {
      cameraTarget: cameraTarget.multiplyScalar(normalizer),
      look: look.multiplyScalar(normalizer),
      fogColor: `#${fogColor.multiplyScalar(normalizer).getHexString()}`,
      fogDensity: density * normalizer,
      keyColor: `#${keyColor.multiplyScalar(normalizer).getHexString()}`,
      rimColor: `#${rimColor.multiplyScalar(normalizer).getHexString()}`,
      accentColor: `#${accentColor.multiplyScalar(normalizer).getHexString()}`,
      fillColor: `#${fillColor.multiplyScalar(normalizer).getHexString()}`,
    }
  }

  private getSceneFrame(
    activeScene: SceneKey,
    progress: {
      pointer: PointerState
      introProgress: number
      eventsProgress: number
      movementProgress: number
      galleryProgress: number
      contactProgress: number
    },
  ): SceneFrame {
    const { pointer, introProgress, eventsProgress, movementProgress, galleryProgress, contactProgress } = progress
    const introTravel = softenTimelineTail(introProgress, { tailStart: 0.56, cap: 0.82, ease: easeOutQuint })
    const eventsTravel = softenTimelineTail(eventsProgress, { tailStart: 0.54, cap: 0.8, ease: easeOutQuint })
    const movementTravel = softenTimelineTail(movementProgress, { tailStart: 0.56, cap: 0.8, ease: easeOutQuint })
    const galleryTravel = softenTimelineTail(galleryProgress, { tailStart: 0.58, cap: 0.82, ease: easeOutQuint })
    const contactTravel = softenTimelineTail(contactProgress, { tailStart: 0.6, cap: 0.84, ease: easeOutQuint })

    switch (activeScene) {
      case 'intro':
        return {
          cameraTarget: new Vector3(
            this.introAnchor.x + 0.24 + pointer.x * 0.15,
            this.introAnchor.y + 0.38 + pointer.y * 0.09,
            this.introAnchor.z + 6.9 - introTravel * 0.18,
          ),
          look: new Vector3(this.introAnchor.x + 0.18, this.introAnchor.y + 0.04, this.introAnchor.z - 5.9),
          fogColor: '#0c0a09',
          fogDensity: 0.028,
          keyColor: '#fff0c9',
          rimColor: '#a3bf36',
          accentColor: '#b7ff3b',
          fillColor: '#ff8d72',
        }
      case 'events':
        return {
          cameraTarget: new Vector3(
            this.eventsAnchor.x + 0.04 + pointer.x * 0.12,
            this.eventsAnchor.y + 0.34 + pointer.y * 0.07,
            this.eventsAnchor.z + 6.6 - eventsTravel * 3.1,
          ),
          look: new Vector3(
            this.eventsAnchor.x,
            this.eventsAnchor.y - 0.05,
            this.eventsAnchor.z - 7.2 - eventsTravel * 1.1,
          ),
          fogColor: '#120907',
          fogDensity: 0.036,
          keyColor: '#ffe1cf',
          rimColor: '#ff724f',
          accentColor: '#ff8a5b',
          fillColor: '#f5efdc',
        }
      case 'movement':
        return {
          cameraTarget: new Vector3(
            this.movementAnchor.x - 0.18 + pointer.x * 0.14,
            this.movementAnchor.y + 0.74 + pointer.y * 0.08,
            this.movementAnchor.z + 6.9 - movementTravel * 0.52,
          ),
          look: new Vector3(
            this.movementAnchor.x + 0.08,
            this.movementAnchor.y + 0.24,
            this.movementAnchor.z - 5.9,
          ),
          fogColor: '#071018',
          fogDensity: 0.031,
          keyColor: '#d8f7ff',
          rimColor: '#72dcff',
          accentColor: '#50cfff',
          fillColor: '#d9fbff',
        }
      case 'gallery':
        return {
          cameraTarget: new Vector3(
            this.galleryAnchor.x - 0.14 + pointer.x * 0.08,
            this.galleryAnchor.y + 0.62 + pointer.y * 0.06,
            this.galleryAnchor.z + 6.9 - galleryTravel * 0.28,
          ),
          look: new Vector3(
            this.galleryAnchor.x,
            this.galleryAnchor.y + 0.26,
            this.galleryAnchor.z - 5.6,
          ),
          fogColor: '#140913',
          fogDensity: 0.029,
          keyColor: '#ffe0f1',
          rimColor: '#ff67c9',
          accentColor: '#ff6bcf',
          fillColor: '#ffd4eb',
        }
      case 'contact':
      default:
        return {
          cameraTarget: new Vector3(
            this.contactAnchor.x + 0.12 + pointer.x * 0.08,
            this.contactAnchor.y + 0.78 + pointer.y * 0.06,
            this.contactAnchor.z + 7.18 - contactTravel * 0.22,
          ),
          look: new Vector3(
            this.contactAnchor.x,
            this.contactAnchor.y + 0.16,
            this.contactAnchor.z - 5.2,
          ),
          fogColor: '#081414',
          fogDensity: 0.024,
          keyColor: '#dffcf7',
          rimColor: '#2fd0b5',
          accentColor: '#30d6bb',
          fillColor: '#eaf7f5',
        }
    }
  }

  private async loadMicrophones(): Promise<void> {
    try {
      const template = this.normalizeObject(
        await this.loadGlb(MICROPHONE_MODEL_URL),
        this.lowPower ? 0.42 : 0.54,
        { z: Math.PI },
      )

      const movementConfigs = this.lowPower
        ? [
            { x: -1.05, y: -0.16, z: -2.48, rotY: -0.18, rotZ: -0.08, scale: 0.34, phase: 0.2, drift: 0.09 },
            { x: 0, y: 0.08, z: -3.12, rotY: 0, rotZ: 0, scale: 0.46, phase: 0.92, drift: 0.12 },
            { x: 1.08, y: -0.06, z: -2.62, rotY: 0.16, rotZ: 0.08, scale: 0.34, phase: 1.64, drift: 0.09 },
          ]
        : [
            { x: -1.9, y: -0.2, z: -2.84, rotY: -0.24, rotZ: -0.12, scale: 0.34, phase: 0.18, drift: 0.08 },
            { x: -0.78, y: 0.12, z: -3.46, rotY: -0.08, rotZ: -0.03, scale: 0.28, phase: 0.76, drift: 0.1 },
            { x: 0, y: 0.32, z: -4.08, rotY: 0, rotZ: 0, scale: 0.5, phase: 1.34, drift: 0.14 },
            { x: 0.84, y: 0.08, z: -3.38, rotY: 0.08, rotZ: 0.04, scale: 0.28, phase: 1.92, drift: 0.1 },
            { x: 1.98, y: -0.18, z: -2.76, rotY: 0.24, rotZ: 0.12, scale: 0.34, phase: 2.48, drift: 0.08 },
          ]

      for (let index = 0; index < movementConfigs.length; index += 1) {
        const config = movementConfigs[index]
        this.addMicrophone(this.movementStageRoot, this.movementMicrophones, template, {
          baseX: config.x,
          baseY: config.y,
          baseZ: config.z,
          baseRotY: config.rotY,
          baseRotZ: config.rotZ,
          phase: config.phase,
          scale: config.scale,
          drift: config.drift,
          palette: {
            base: index === Math.floor(movementConfigs.length / 2) ? '#f5fbff' : '#e4f3fb',
            emissive: index === Math.floor(movementConfigs.length / 2) ? '#92e7ff' : '#50cfff',
            accent: index === Math.floor(movementConfigs.length / 2) ? '#d9fbff' : '#b4f3ff',
            roughness: index === Math.floor(movementConfigs.length / 2) ? 0.3 : 0.36,
            metalness: index === Math.floor(movementConfigs.length / 2) ? 0.64 : 0.58,
            clearcoat: 0.72,
            clearcoatRoughness: 0.16,
            emissiveIntensity: index === Math.floor(movementConfigs.length / 2) ? 0.12 : 0.09,
            specularIntensity: index === Math.floor(movementConfigs.length / 2) ? 1.04 : 0.96,
          },
        })
      }
    } catch {
      // If the model fails to load, the scene still renders the chapter atmospheres.
    }
  }

  private async loadMartinis(): Promise<void> {
    try {
      const template = this.normalizeObject(
        await this.loadGlb(MARTINI_MODEL_URL),
        this.lowPower ? 0.72 : 0.9,
      )

      const contactConfigs = this.lowPower
        ? [
            { x: -0.94, y: 0.44, z: -3.04, rotY: 0.12, rotZ: -0.14, scale: 0.34, phase: 1.8 },
            { x: 0.96, y: 0.52, z: -3.24, rotY: -0.12, rotZ: 0.14, scale: 0.34, phase: 2.5 },
          ]
        : [
            { x: -1.34, y: 0.4, z: -3.08, rotY: 0.16, rotZ: -0.16, scale: 0.36, phase: 1.8 },
            { x: 0.04, y: 0.92, z: -3.64, rotY: 0, rotZ: 0.04, scale: 0.42, phase: 2.5 },
            { x: 1.42, y: 0.46, z: -3.1, rotY: -0.16, rotZ: 0.16, scale: 0.36, phase: 3.2 },
          ]

      for (let index = 0; index < contactConfigs.length; index += 1) {
        const config = contactConfigs[index]
        this.addMicrophone(this.contactStageRoot, this.contactMartinis, template, {
          baseX: config.x,
          baseY: config.y,
          baseZ: config.z,
          baseRotX: 0.02,
          baseRotY: config.rotY,
          baseRotZ: config.rotZ,
          phase: config.phase,
          scale: config.scale,
          drift: 0.04,
          palette: {
            base: index === 1 ? '#fff4d8' : '#fff9ef',
            emissive: index === 1 ? '#ffb95f' : '#d8ff66',
            accent: index === 1 ? '#ffe0b6' : '#f7ffb8',
            roughness: 0.34,
            metalness: 0.42,
            clearcoat: 0.78,
            clearcoatRoughness: 0.18,
            emissiveIntensity: 0.06,
            specularIntensity: 0.9,
          },
        })
      }
    } catch {
      // The scene can still run without the martini prop.
    }
  }

  private async loadBalloons(): Promise<void> {
    if (this.lowPower) {
      return
    }

    try {
      const template = this.normalizeObject(
        await this.loadGlb(BALLOON_MODEL_URL),
        0.72,
      )

      const introConfigs = [
        { x: 0.4, y: 1.44, z: -5.78, rotY: 0.08, scale: 0.58, phase: 0.2, accent: '#fff3b0' },
        { x: 1.16, y: 1.16, z: -6.18, rotY: -0.1, scale: 0.52, phase: 0.9, accent: '#ffd7f3' },
        { x: 1.88, y: 0.94, z: -6.62, rotY: 0.06, scale: 0.48, phase: 1.6, accent: '#d9ff49' },
      ]

      for (const config of introConfigs) {
        this.addMicrophone(this.introStageRoot, this.introBalloons, template, {
          baseX: config.x,
          baseY: config.y,
          baseZ: config.z,
          baseRotX: 0.02,
          baseRotY: config.rotY,
          baseRotZ: 0,
          phase: config.phase,
          scale: config.scale,
          drift: 0.03,
          palette: {
            base: '#fffef8',
            emissive: '#d7ff59',
            accent: config.accent,
            roughness: 0.34,
            metalness: 0.28,
            clearcoat: 0.88,
            clearcoatRoughness: 0.14,
            emissiveIntensity: 0.07,
            specularIntensity: 1.02,
          },
        })
      }
    } catch {
      // The scene can still run without the balloon prop.
    }
  }

  private async loadBottles(): Promise<void> {
    try {
      const template = this.normalizeObject(
        await this.loadGlb(BOTTLE_MODEL_URL),
        this.lowPower ? 0.42 : 0.52,
      )

      const bottleConfigs = this.lowPower
        ? [
            { x: -0.78, y: 0.2, z: -3.22, rotY: 0.14, rotZ: -0.04, scale: 0.34, phase: 0.2 },
            { x: 0.1, y: 0.46, z: -3.96, rotY: 0.02, rotZ: 0.02, scale: 0.4, phase: 0.8 },
            { x: 0.98, y: 0.28, z: -4.72, rotY: -0.14, rotZ: 0.04, scale: 0.34, phase: 1.4 },
          ]
        : [
            { x: -1.18, y: 0.18, z: -3.08, rotY: 0.14, rotZ: -0.06, scale: 0.38, phase: 0.2 },
            { x: -0.28, y: 0.42, z: -3.82, rotY: 0.06, rotZ: -0.02, scale: 0.42, phase: 0.75 },
            { x: 0.68, y: 0.58, z: -4.56, rotY: -0.04, rotZ: 0.04, scale: 0.46, phase: 1.3 },
            { x: 1.58, y: 0.26, z: -5.28, rotY: -0.14, rotZ: 0.06, scale: 0.38, phase: 1.9 },
          ]

      for (let index = 0; index < bottleConfigs.length; index += 1) {
        const config = bottleConfigs[index]
        this.addMicrophone(this.eventsStageRoot, this.eventBottles, template, {
          baseX: config.x,
          baseY: config.y,
          baseZ: config.z,
          baseRotX: 0.02,
          baseRotY: config.rotY,
          baseRotZ: config.rotZ,
          phase: config.phase,
          scale: config.scale,
          drift: 0.06,
          palette: {
            base: index === 2 ? '#efe3ce' : '#ddd6c8',
            emissive: index === 2 ? '#ff8d4d' : '#d7ff5b',
            accent: index === 2 ? '#ffc999' : '#eff8b2',
            roughness: 0.42,
            metalness: 0.36,
            clearcoat: 0.64,
            clearcoatRoughness: 0.18,
            emissiveIntensity: 0.07,
            specularIntensity: 0.82,
          },
        })
      }
    } catch {
      // The scene can still run without the bottle prop.
    }
  }

  private async loadDiscoBalls(): Promise<void> {
    try {
      const template = this.normalizeObject(
        await this.loadGlb(DISCO_BALL_MODEL_URL),
        this.lowPower ? 0.66 : 0.84,
      )

      const discoConfigs = this.lowPower
        ? [
            { x: -1.16, y: 1.26, z: -2.16, scale: 0.58, phase: 0.2 },
            { x: 0.56, y: 0.88, z: -2.88, scale: 0.5, phase: 0.9 },
            { x: 1.54, y: 1.38, z: -3.52, scale: 0.6, phase: 1.6 },
          ]
        : [
            { x: -1.64, y: 1.38, z: -1.96, scale: 0.62, phase: 0.2 },
            { x: -0.32, y: 0.82, z: -2.64, scale: 0.48, phase: 0.8 },
            { x: 0.92, y: 1.12, z: -3.18, scale: 0.56, phase: 1.4 },
            { x: 1.92, y: 1.48, z: -3.84, scale: 0.68, phase: 2 },
          ]

      for (let index = 0; index < discoConfigs.length; index += 1) {
        const config = discoConfigs[index]
        this.addMicrophone(this.galleryStageRoot, this.galleryDiscoBalls, template, {
          baseX: config.x,
          baseY: config.y,
          baseZ: config.z,
          baseRotX: 0.04,
          baseRotY: 0,
          baseRotZ: 0,
          phase: config.phase,
          scale: config.scale,
          drift: 0.04,
          palette: {
            base: index % 2 === 0 ? '#f7deef' : '#f0f5ff',
            emissive: index % 2 === 0 ? '#ff6bcf' : '#6fd5ff',
            accent: index % 2 === 0 ? '#ffd7f3' : '#ddf5ff',
            roughness: 0.18,
            metalness: 0.7,
            clearcoat: 0.92,
            clearcoatRoughness: 0.08,
            emissiveIntensity: 0.09,
            specularIntensity: 1.12,
          },
        })
      }
    } catch {
      // The scene can still run without the disco ball prop.
    }
  }

  private loadGlb(url: string): Promise<Group> {
    const loader = new GLTFLoader()
    return new Promise((resolve, reject) => {
      loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject)
    })
  }

  private normalizeObject(
    template: Object3D,
    targetHeight: number,
    rotation: { x?: number; y?: number; z?: number } = {},
  ): Group {
    const clone = template.clone(true) as Group
    clone.rotation.set(rotation.x ?? 0, rotation.y ?? 0, rotation.z ?? 0)
    const box = new Box3().setFromObject(clone)
    const center = box.getCenter(new Vector3())
    clone.position.sub(center)

    const size = box.getSize(new Vector3())
    const scale = targetHeight / Math.max(size.y, 0.001)
    clone.scale.setScalar(scale)

    const groundedBox = new Box3().setFromObject(clone)
    clone.position.y -= groundedBox.min.y

    return clone
  }

  private addMicrophone(
    target: Group,
    collection: MicrophoneInstance[],
    template: Group,
    config: MicrophoneConfig,
  ): void {
    const group = this.cloneStyledModel(template, config.palette)
    target.add(group)
    collection.push({
      group,
      baseX: config.baseX,
      baseY: config.baseY,
      baseZ: config.baseZ,
      baseRotX: config.baseRotX ?? 0,
      baseRotY: config.baseRotY ?? 0,
      baseRotZ: config.baseRotZ ?? 0,
      phase: config.phase,
      scale: config.scale,
      drift: config.drift,
    })
  }

  private addPulseRing(
    target: Group,
    collection: PulseRing[],
    config: {
      baseScale: number
      color: string
      phase: number
      rotationX?: number
      spin?: number
      x: number
      y: number
      z: number
    },
  ): void {
    const material = new MeshBasicMaterial({
      blending: AdditiveBlending,
      color: new Color(config.color),
      depthWrite: false,
      opacity: 0.08,
      side: DoubleSide,
      transparent: true,
    })
    const mesh = new Mesh(
      new RingGeometry(0.72, 0.82, this.lowPower ? 40 : 64),
      material,
    )
    mesh.position.set(config.x, config.y, config.z)
    mesh.rotation.x = config.rotationX ?? 0
    target.add(mesh)
    collection.push({
      mesh,
      material,
      baseScale: config.baseScale,
      baseX: config.x,
      baseY: config.y,
      baseZ: config.z,
      phase: config.phase,
      rotationX: config.rotationX ?? 0,
      spin: config.spin ?? 0.08,
    })
  }

  private setModelOpacity(group: Group, opacity: number): void {
    const clamped = MathUtils.clamp(opacity, 0, 1)
    group.visible = clamped > 0.01

    group.traverse((child) => {
      if (!(child instanceof Mesh)) {
        return
      }

      const material = child.material
      if (Array.isArray(material)) {
        return
      }

      const baseOpacity = typeof material.userData.baseOpacity === 'number' ? material.userData.baseOpacity : 1
      material.opacity = baseOpacity * clamped
      material.transparent = material.opacity < 0.999 || baseOpacity < 1
      material.depthWrite = material.opacity > 0.94
    })
  }

  private animateMicrophonePalette(
    microphone: MicrophoneInstance,
    time: number,
    presence: number,
    timeline: number,
  ): void {
    const pulse = (Math.sin(time * 1.8 + microphone.phase * 1.3) + 1) * 0.5
    const shimmer = (Math.sin(time * 0.9 + microphone.phase * 0.7) + 1) * 0.5
    const accentMix = MathUtils.clamp(
      presence * (0.12 + pulse * 0.24 + shimmer * 0.12 + timeline * 0.34),
      0,
      0.88,
    )
    const glowMix = MathUtils.clamp(0.08 + pulse * 0.22 + timeline * 0.5, 0, 1)

    microphone.group.traverse((child) => {
      if (!(child instanceof Mesh)) {
        return
      }

      const material = child.material
      if (Array.isArray(material)) {
        return
      }

      const baseColor = material.userData.baseColor as Color | undefined
      const accentColor = material.userData.accentColor as Color | undefined
      const baseEmissive = material.userData.baseEmissive as Color | undefined
      const baseEmissiveIntensity =
        typeof material.userData.baseEmissiveIntensity === 'number'
          ? material.userData.baseEmissiveIntensity
          : 0.06
      const baseRoughness =
        typeof material.userData.baseRoughness === 'number'
          ? material.userData.baseRoughness
          : 0.42
      const baseMetalness =
        typeof material.userData.baseMetalness === 'number'
          ? material.userData.baseMetalness
          : 0.54
      const baseClearcoat =
        typeof material.userData.baseClearcoat === 'number'
          ? material.userData.baseClearcoat
          : 0.48
      const baseSpecularIntensity =
        typeof material.userData.baseSpecularIntensity === 'number'
          ? material.userData.baseSpecularIntensity
          : 0.78

      if (!baseColor || !accentColor || !baseEmissive) {
        return
      }

      material.color.copy(baseColor).lerp(accentColor, accentMix)
      material.emissive.copy(baseEmissive).lerp(accentColor, glowMix)
      material.emissiveIntensity =
        baseEmissiveIntensity * (0.85 + presence * 0.8 + pulse * 0.3 + timeline * 1.2)
      material.roughness = MathUtils.clamp(baseRoughness - presence * 0.08 - glowMix * 0.12, 0.08, 1)
      material.metalness = MathUtils.clamp(baseMetalness + pulse * 0.08 + timeline * 0.06, 0, 1)

      if (material instanceof MeshPhysicalMaterial) {
        material.clearcoat = MathUtils.clamp(baseClearcoat + glowMix * 0.18 + timeline * 0.12, 0, 1)
        material.specularIntensity = MathUtils.clamp(
          baseSpecularIntensity + presence * 0.12 + pulse * 0.08,
          0,
          1.4,
        )
      }
    })
  }

  private cloneStyledModel(template: Object3D, palette: ModelPalette): Group {
    const clone = template.clone(true) as Group
    const baseColor = new Color(palette.base)
    const emissiveColor = new Color(palette.emissive)
    const accentColor = new Color(palette.accent ?? palette.emissive)
    const opacity = palette.opacity ?? 1

    clone.traverse((child) => {
      if (!(child instanceof Mesh)) {
        return
      }

      child.geometry = child.geometry.clone()
      child.geometry.computeVertexNormals()

      child.material = new MeshPhysicalMaterial({
        color: baseColor,
        emissive: emissiveColor,
        emissiveIntensity: palette.emissiveIntensity ?? 0.06,
        roughness: palette.roughness ?? 0.42,
        metalness: palette.metalness ?? 0.54,
        clearcoat: palette.clearcoat ?? 0.48,
        clearcoatRoughness: palette.clearcoatRoughness ?? 0.22,
        specularIntensity: palette.specularIntensity ?? 0.78,
        transparent: opacity < 0.999,
        opacity,
        depthWrite: opacity >= 0.999,
      })
      child.material.userData.baseOpacity = opacity
      child.material.userData.baseColor = baseColor.clone()
      child.material.userData.baseEmissive = emissiveColor.clone()
      child.material.userData.accentColor = accentColor.clone()
      child.material.userData.baseEmissiveIntensity = palette.emissiveIntensity ?? 0.06
      child.material.userData.baseRoughness = palette.roughness ?? 0.42
      child.material.userData.baseMetalness = palette.metalness ?? 0.54
      child.material.userData.baseClearcoat = palette.clearcoat ?? 0.48
      child.material.userData.baseSpecularIntensity = palette.specularIntensity ?? 0.78
    })

    return clone
  }

}

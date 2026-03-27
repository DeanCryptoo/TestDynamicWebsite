import {
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
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
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
const FLAGS_MODEL_URL = new URL('../../3DModels/Flags.glb', import.meta.url).href
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
  phase: number
}

interface ModelPalette {
  base: string
  emissive: string
  accent?: string
  opacity?: number
  roughness?: number
  metalness?: number
  emissiveIntensity?: number
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
  private readonly keyLight = new DirectionalLight(new Color('#fff0d8'), 0.74)
  private readonly rimLight = new DirectionalLight(new Color('#ff7b59'), 0.62)
  private readonly accentLight = new PointLight(new Color('#b7ff3b'), 0.92, 26, 2)
  private readonly fillLight = new PointLight(new Color('#ff8d72'), 0.84, 22, 2)

  private readonly introStageRoot = new Group()
  private readonly eventsStageRoot = new Group()
  private readonly movementStageRoot = new Group()
  private readonly galleryStageRoot = new Group()
  private readonly contactStageRoot = new Group()

  private readonly contactRings: PulseRing[] = []
  private readonly movementMicrophones: MicrophoneInstance[] = []
  private readonly eventBottles: MicrophoneInstance[] = []
  private readonly galleryDiscoBalls: MicrophoneInstance[] = []
  private readonly contactFlags: MicrophoneInstance[] = []
  private readonly introBalloons: MicrophoneInstance[] = []

  private readonly haze: Points
  private readonly hazeMaterial: PointsMaterial
  private readonly hazePositions: Float32Array
  private readonly hazeBase: Float32Array
  private hazeThrottle = 0

  constructor(canvas: HTMLCanvasElement, sections: SectionRegistry) {
    this.sections = sections
    this.lowPower = window.matchMedia('(max-width: 860px), (pointer: coarse)').matches

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: !this.lowPower,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.lowPower ? 1 : 1.35))
    this.renderer.setClearColor(0x000000, 0)

    this.scene.fog = new FogExp2('#09070a', this.lowPower ? 0.03 : 0.026)
    this.camera.position.set(0, 0.45, 9)

    this.keyLight.position.set(4.8, 5.6, 7.4)
    this.rimLight.position.set(-4.2, 2.9, -5.6)
    this.accentLight.position.set(2.6, 1.5, 5.1)
    this.fillLight.position.set(-2.4, 0.8, 4.6)
    this.scene.add(this.ambientLight, this.keyLight, this.rimLight, this.accentLight, this.fillLight)

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

    const ringScales = this.lowPower ? [0.96, 1.34] : [0.92, 1.26, 1.62]
    for (let index = 0; index < ringScales.length; index += 1) {
      this.addContactRing(ringScales[index], index)
    }

    const hazeCount = this.lowPower ? 120 : 220
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
      this.loadFlags(),
    ])
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / Math.max(height, 1)
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.lowPower ? 1 : 1.35))
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
      0.72 + pointer.x * 0.16,
      -0.92 + pointer.y * 0.05 + travel * 0.14,
      -6.42 - travel * 1.12,
    )
    this.introStageRoot.rotation.y = 0.08 + pointer.x * 0.06 - travel * 0.16
    this.introStageRoot.rotation.z = -0.04 + arc * 0.05

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
      const orbit = createOrbitOffset(float, {
        phase: balloon.phase * 0.06,
        radiusX: 0.16 + index * 0.06,
        radiusY: 0.08 + index * 0.05,
        turns: 0.24,
      })
      const spread = createFanOffset(float, index, this.introBalloons.length, {
        spread: 0.52,
        curve: 0.8,
        ease: easeOutQuint,
      })
      const lift = createFloatMotion(time, float, {
        amplitude: 0.08 + index * 0.015,
        frequency: 0.52 + index * 0.08,
        phase: balloon.phase,
        base: 0.72,
        progressGain: 0.28,
      })
      this.setModelOpacity(balloon.group, 0.02 + presence * 0.92)
      this.animateMicrophonePalette(balloon, time, presence, float)
      balloon.group.position.set(
        balloon.baseX + spread * 0.42 + orbit.x,
        balloon.baseY + float * 0.42 + orbit.y + lift,
        balloon.baseZ - float * 0.92 + Math.abs(spread) * -0.1,
      )
      balloon.group.rotation.set(
        balloon.baseRotX + lift * 0.28,
        balloon.baseRotY + spread * 0.18 + orbit.x * 0.22,
        balloon.baseRotZ + lift * 0.34,
      )
      balloon.group.scale.setScalar(balloon.scale * (0.94 + float * 0.05 + presence * 0.05))
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
      0.26 + pointer.x * 0.08,
      -1.04 + pointer.y * 0.04 + travel * 0.08,
      -7.52 + travel * 2.1,
    )
    this.eventsStageRoot.rotation.y = -0.08 - travel * 0.24

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
      this.setModelOpacity(bottle.group, 0.02 + presence * 0.98)
      this.animateMicrophonePalette(bottle, time, presence, pass)
      bottle.group.position.set(
        bottle.baseX + spread * 0.26 + orbit.x,
        bottle.baseY + arc * 0.18 + lift,
        bottle.baseZ + pass * 3.2 - Math.abs(spread) * 0.08,
      )
      bottle.group.rotation.set(
        bottle.baseRotX + pass * 0.2 - arc * 0.04,
        bottle.baseRotY + spread * 0.1 + orbit.x * 0.14,
        bottle.baseRotZ + spread * 0.08 + arc * 0.06,
      )
      bottle.group.scale.setScalar(bottle.scale * (0.9 + presence * 0.08 + pass * 0.08))
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
      0.04 + pointer.x * 0.06,
      -1.54 + pointer.y * 0.03 + travel * 0.1,
      -5.8 + travel * 0.42,
    )
    this.movementStageRoot.rotation.y = -0.06 + pointer.x * 0.04 + travel * 0.12

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
      const arc = Math.sin(rise * Math.PI)
      const spread = 1 + rise * 0.18
      const fan = createFanOffset(rise, index, this.movementMicrophones.length, {
        spread: 0.72,
        curve: 0.86,
        ease: easeInOutCubic,
      })
      const ambient = createFloatMotion(time, rise, {
        amplitude: 0.06,
        frequency: 0.78,
        phase: mic.phase,
        base: 0.54,
        progressGain: 0.3,
      })
      this.setModelOpacity(mic.group, 0.02 + presence * 0.98)
      this.animateMicrophonePalette(mic, time, presence, rise)
      mic.group.position.set(
        mic.baseX * spread + fan * 0.24,
        mic.baseY + rise * (0.4 + Math.abs(mic.baseX) * 0.08) + arc * mic.drift * 0.34 + ambient,
        mic.baseZ - rise * 0.74 - Math.abs(fan) * 0.05,
      )
      mic.group.rotation.set(
        mic.baseRotX + rise * 0.34,
        mic.baseRotY + (index % 2 === 0 ? -1 : 1) * arc * 0.12 + fan * 0.08,
        mic.baseRotZ + (index % 2 === 0 ? -1 : 1) * rise * 0.14 + fan * 0.05,
      )
      mic.group.scale.setScalar(mic.scale * (0.82 + presence * 0.16 + rise * 0.14))
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
      this.setModelOpacity(discoBall.group, 0.02 + presence * 0.98)
      this.animateMicrophonePalette(discoBall, time, presence, hang)
      discoBall.group.position.set(
        discoBall.baseX + drift * 0.18 + orbit.x,
        discoBall.baseY - hang * 0.3 + orbit.y + bob,
        discoBall.baseZ - hang * 0.64,
      )
      discoBall.group.rotation.set(
        discoBall.baseRotX + hang * 0.08,
        discoBall.baseRotY + time * (0.38 + index * 0.04) + drift * 0.08,
        discoBall.baseRotZ + orbit.x * 0.16,
      )
      discoBall.group.scale.setScalar(discoBall.scale * (0.9 + presence * 0.08 + hang * 0.06))
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
      0.02 + pointer.x * 0.04,
      -1.24 + pointer.y * 0.03 + settle * 0.1,
      -5.42 - settle * 0.1,
    )
    this.contactStageRoot.rotation.y = 0.12 + settle * 0.12

    for (let index = 0; index < this.contactFlags.length; index += 1) {
      const flag = this.contactFlags[index]
      const cheers = softenTimelineTail(
        createStaggeredTimeline(settle, index, this.contactFlags.length, {
          ease: easeOutQuint,
          span: 0.64,
          spread: 0.18,
        }),
        { tailStart: 0.48, cap: 0.84, ease: easeOutQuint },
      )
      const arc = Math.sin(cheers * Math.PI)
      const toastSpread = createFanOffset(cheers, index, this.contactFlags.length, {
        spread: this.lowPower ? 0.92 : 1.2,
        curve: 0.82,
        ease: easeOutQuint,
      })
      const orbit = createOrbitOffset(cheers, {
        phase: flag.phase * 0.05,
        radiusX: 0.14,
        radiusY: 0.1,
        turns: 0.12,
      })
      const ambient = createFloatMotion(time, cheers, {
        amplitude: 0.05,
        frequency: 0.42,
        phase: flag.phase,
        base: 0.58,
        progressGain: 0.24,
      })
      this.setModelOpacity(flag.group, 0.02 + presence * 0.94)
      this.animateMicrophonePalette(flag, time, presence, cheers)
      flag.group.position.set(
        flag.baseX + toastSpread * 0.16 + orbit.x,
        flag.baseY + arc * 0.12 + ambient,
        flag.baseZ - cheers * 0.46 - Math.abs(toastSpread) * 0.04,
      )
      flag.group.rotation.set(
        flag.baseRotX + arc * 0.06,
        flag.baseRotY + toastSpread * 0.08 + orbit.x * 0.1,
        flag.baseRotZ + Math.sin(time * 0.8 + flag.phase) * 0.12 + orbit.y * 0.16,
      )
      flag.group.scale.setScalar(flag.scale * (0.94 + cheers * 0.06 + presence * 0.06))
    }

    for (const ring of this.contactRings) {
      const pulse = 0.88 + presence * 0.12 + settle * 0.32 + Math.sin(time * 0.58 + ring.phase) * 0.03
      ring.mesh.position.set(0, 0.72, -1.28)
      ring.mesh.rotation.z = time * 0.08 + ring.phase * 0.4
      ring.mesh.scale.setScalar(ring.baseScale * pulse)
      ring.material.opacity = 0.02 + presence * 0.08
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
            this.movementAnchor.x + 0.08 + pointer.x * 0.1,
            this.movementAnchor.y + 0.58 + pointer.y * 0.06,
            this.movementAnchor.z + 6.6 - movementTravel * 0.34,
          ),
          look: new Vector3(
            this.movementAnchor.x,
            this.movementAnchor.y + 0.1,
            this.movementAnchor.z - 5.6,
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
        this.lowPower ? 0.28 : 0.36,
        { z: Math.PI },
      )

      const movementX = this.lowPower ? [-1.7, -0.85, 0, 0.85, 1.7] : [-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4]
      for (let index = 0; index < movementX.length; index += 1) {
        const x = movementX[index]
        this.addMicrophone(this.movementStageRoot, this.movementMicrophones, template, {
          baseX: x * 0.88,
          baseY: -0.12 + (Math.abs(x) < 0.2 ? 0.06 : 0),
          baseZ: -2.15 - Math.abs(x) * 0.34,
          baseRotY: x * 0.03,
          baseRotZ: x * 0.01,
          phase: index * 0.7,
          scale: Math.abs(x) < 0.2 ? 0.28 : 0.22,
          drift: 0.08 + Math.abs(x) * 0.015,
          palette: {
            base: '#edf7fb',
            emissive: '#50cfff',
            accent: '#b4f3ff',
            roughness: 0.36,
            metalness: 0.58,
            emissiveIntensity: 0.09,
          },
        })
      }
    } catch {
      // If the model fails to load, the scene still renders the chapter atmospheres.
    }
  }

  private async loadFlags(): Promise<void> {
    try {
      const template = this.normalizeObject(
        await this.loadGlb(FLAGS_MODEL_URL),
        this.lowPower ? 0.78 : 0.96,
        { y: Math.PI * 0.5 },
      )

      const contactConfigs = this.lowPower
        ? [
            { x: -1.06, y: 0.62, z: -2.74, rotY: -0.08, rotZ: -0.06, scale: 0.36, phase: 1.8 },
            { x: 1.04, y: 0.68, z: -2.96, rotY: 0.06, rotZ: 0.04, scale: 0.34, phase: 2.5 },
          ]
        : [
            { x: -1.72, y: 0.62, z: -2.96, rotY: -0.12, rotZ: -0.08, scale: 0.34, phase: 1.8 },
            { x: 0.08, y: 0.86, z: -3.46, rotY: 0, rotZ: 0.02, scale: 0.4, phase: 2.5 },
            { x: 1.78, y: 0.64, z: -2.98, rotY: 0.12, rotZ: 0.08, scale: 0.34, phase: 3.2 },
          ]

      for (let index = 0; index < contactConfigs.length; index += 1) {
        const config = contactConfigs[index]
        this.addMicrophone(this.contactStageRoot, this.contactFlags, template, {
          baseX: config.x,
          baseY: config.y,
          baseZ: config.z,
          baseRotX: 0.04,
          baseRotY: config.rotY,
          baseRotZ: config.rotZ,
          phase: config.phase,
          scale: config.scale,
          drift: 0.04,
          palette: {
            base: index === 1 ? '#f8f4ff' : '#f0fff9',
            emissive: index === 1 ? '#7af4ff' : '#ccff00',
            accent: index === 1 ? '#d8f8ff' : '#f7ffb8',
            roughness: 0.2,
            metalness: 0.16,
            emissiveIntensity: 0.08,
          },
        })
      }
    } catch {
      // The scene can still run without the flag prop.
    }
  }

  private async loadBalloons(): Promise<void> {
    try {
      const template = this.normalizeObject(
        await this.loadGlb(BALLOON_MODEL_URL),
        this.lowPower ? 0.46 : 0.56,
      )

      const introConfigs = this.lowPower
        ? [
            { x: 1.58, y: 1.42, z: -6.18, rotY: 0.08, scale: 0.44, phase: 0.2, accent: '#fff3b0' },
            { x: 2.06, y: 1.18, z: -6.46, rotY: -0.12, scale: 0.38, phase: 0.9, accent: '#ffd7f3' },
          ]
        : [
            { x: 1.72, y: 1.62, z: -6.34, rotY: 0.12, scale: 0.52, phase: 0.2, accent: '#fff3b0' },
            { x: 2.18, y: 1.34, z: -6.68, rotY: -0.12, scale: 0.46, phase: 0.9, accent: '#ffd7f3' },
            { x: 2.54, y: 1.06, z: -7.02, rotY: 0.08, scale: 0.38, phase: 1.6, accent: '#d9ff49' },
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
            roughness: 0.12,
            metalness: 0.04,
            emissiveIntensity: 0.08,
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
        this.lowPower ? 0.34 : 0.46,
      )

      const bottleConfigs = this.lowPower
        ? [
            { x: -0.56, y: 0.22, z: -2.6, rotY: 0.18, rotZ: -0.05, scale: 0.34, phase: 0.2 },
            { x: 0.18, y: 0.42, z: -3.08, rotY: 0, rotZ: 0.02, scale: 0.44, phase: 0.8 },
            { x: 0.84, y: 0.28, z: -3.56, rotY: -0.18, rotZ: 0.05, scale: 0.34, phase: 1.4 },
          ]
        : [
            { x: -0.92, y: 0.18, z: -2.42, rotY: 0.16, rotZ: -0.08, scale: 0.34, phase: 0.2 },
            { x: -0.08, y: 0.42, z: -2.96, rotY: 0.08, rotZ: -0.02, scale: 0.3, phase: 0.75 },
            { x: 0.78, y: 0.66, z: -3.46, rotY: -0.04, rotZ: 0.04, scale: 0.46, phase: 1.3 },
            { x: 1.34, y: 0.3, z: -3.98, rotY: -0.16, rotZ: 0.08, scale: 0.34, phase: 1.9 },
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
            base: index === 2 ? '#fff2d8' : '#f4ebe2',
            emissive: index === 2 ? '#ff9558' : '#d9ff49',
            accent: index === 2 ? '#ffd0a8' : '#f8ffbb',
            roughness: 0.14,
            metalness: 0.08,
            emissiveIntensity: 0.1,
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
        this.lowPower ? 0.52 : 0.68,
      )

      const discoConfigs = this.lowPower
        ? [
            { x: -1.16, y: 1.26, z: -2.16, scale: 0.44, phase: 0.2 },
            { x: 0.56, y: 0.88, z: -2.88, scale: 0.38, phase: 0.9 },
            { x: 1.54, y: 1.38, z: -3.52, scale: 0.46, phase: 1.6 },
          ]
        : [
            { x: -1.64, y: 1.38, z: -1.96, scale: 0.46, phase: 0.2 },
            { x: -0.32, y: 0.82, z: -2.64, scale: 0.34, phase: 0.8 },
            { x: 0.92, y: 1.12, z: -3.18, scale: 0.4, phase: 1.4 },
            { x: 1.92, y: 1.48, z: -3.84, scale: 0.5, phase: 2 },
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
            emissiveIntensity: 0.09,
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

  private addContactRing(baseScale: number, index: number): void {
    const material = new MeshBasicMaterial({
      color: new Color(index % 2 === 0 ? '#34dbc0' : '#f3f7f6'),
      transparent: true,
      opacity: 0.08,
      side: DoubleSide,
    })
    const mesh = new Mesh(
      new RingGeometry(0.72, 0.82, this.lowPower ? 40 : 64),
      material,
    )
    this.contactStageRoot.add(mesh)
    this.contactRings.push({
      mesh,
      material,
      baseScale,
      phase: index * 1.4,
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

      if (!baseColor || !accentColor || !baseEmissive) {
        return
      }

      material.color.copy(baseColor).lerp(accentColor, accentMix)
      material.emissive.copy(baseEmissive).lerp(accentColor, glowMix)
      material.emissiveIntensity =
        baseEmissiveIntensity * (0.85 + presence * 0.8 + pulse * 0.3 + timeline * 1.2)
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

      child.material = new MeshStandardMaterial({
        color: baseColor,
        emissive: emissiveColor,
        emissiveIntensity: palette.emissiveIntensity ?? 0.06,
        roughness: palette.roughness ?? 0.42,
        metalness: palette.metalness ?? 0.54,
        transparent: opacity < 0.999,
        opacity,
        depthWrite: opacity >= 0.999,
      })
      child.material.userData.baseOpacity = opacity
      child.material.userData.baseColor = baseColor.clone()
      child.material.userData.baseEmissive = emissiveColor.clone()
      child.material.userData.accentColor = accentColor.clone()
      child.material.userData.baseEmissiveIntensity = palette.emissiveIntensity ?? 0.06
    })

    return clone
  }

}

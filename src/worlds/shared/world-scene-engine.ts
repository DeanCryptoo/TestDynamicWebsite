import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  Box3,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  FogExp2,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  RingGeometry,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TorusKnotGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import {
  ChapterBlendTracker,
  collectChapterState,
  createChapterBlendTarget,
  createChapterProgress,
  createFanOffset,
  createFloatMotion,
  createOrbitOffset,
  createPulseValue,
  createStaggeredTimeline,
  createTimelineEnvelope,
  softenTimelineTail,
} from '../../core/chapter-timeline'
import { easeInOutCubic, easeOutQuint } from '../../core/math'
import type { PointerState } from '../../core/pointer-tracker'
import type { ScrollFrame } from '../../core/smooth-scroll'
import { SectionRegistry } from '../../core/section-registry'
import { resolveDeviceProfile } from './device-profile'
import type {
  CameraPreset,
  ChapterDefinition,
  EffectPlacement,
  EffectPreset,
  MaterialPreset,
  ModelKey,
  MotionPresetName,
  PropPlacement,
  WorldDefinition,
} from './types'

interface UpdateInput {
  deltaTime: number
  pointer: PointerState
  scroll: ScrollFrame
  time: number
}

interface PropActor {
  group: Group
  index: number
  materials: MeshPhysicalMaterial[]
  motionPreset: MotionPresetName
  placement: PropPlacement
}

interface RingActor {
  kind: 'ring'
  material: MeshBasicMaterial
  mesh: Mesh
  placement: EffectPlacement
  preset: EffectPreset
}

interface ConeActor {
  kind: 'cone'
  material: MeshBasicMaterial
  mesh: Mesh
  placement: EffectPlacement
  preset: EffectPreset
}

interface GlowActor {
  kind: 'glow'
  material: MeshBasicMaterial
  mesh: Mesh
  placement: EffectPlacement
  preset: EffectPreset
}

interface HazeActor {
  kind: 'haze'
  material: MeshBasicMaterial
  mesh: Mesh
  placement: EffectPlacement
  preset: EffectPreset
}

interface SparkActor {
  base: Float32Array
  geometry: BufferGeometry
  kind: 'spark'
  material: PointsMaterial
  placement: EffectPlacement
  points: Points
  positions: Float32Array
  preset: EffectPreset
}

interface RibbonActor {
  attribute: BufferAttribute
  kind: 'ribbon'
  line: Line
  material: LineBasicMaterial
  placement: EffectPlacement
  positions: Float32Array
  preset: EffectPreset
}

type EffectActor = RingActor | ConeActor | GlowActor | HazeActor | SparkActor | RibbonActor

interface ChapterRuntime {
  chapter: ChapterDefinition
  effects: EffectActor[]
  group: Group
  props: PropActor[]
}

const MICROPHONE_MODEL_URL = new URL('../../../3DModels/Microphone.glb', import.meta.url).href
const BALLOON_MODEL_URL = new URL('../../../3DModels/Balloon.glb', import.meta.url).href
const BOTTLE_MODEL_URL = new URL('../../../3DModels/Bottle.glb', import.meta.url).href
const DISCO_BALL_MODEL_URL = new URL('../../../3DModels/DiscoBall.glb', import.meta.url).href
const MARTINI_MODEL_URL = new URL('../../../3DModels/MartiniGlass.glb', import.meta.url).href

const MODEL_URLS: Partial<Record<ModelKey, string>> = {
  balloon: BALLOON_MODEL_URL,
  bottle: BOTTLE_MODEL_URL,
  discoBall: DISCO_BALL_MODEL_URL,
  martini: MARTINI_MODEL_URL,
  microphone: MICROPHONE_MODEL_URL,
}

export class WorldSceneEngine {
  private readonly ambientLight = new AmbientLight(new Color('#ffffff'), 0.7)
  private readonly camera = new PerspectiveCamera(40, 1, 0.1, 160)
  private readonly device
  private readonly dust: Points
  private readonly dustBase: Float32Array
  private readonly dustGeometry = new BufferGeometry()
  private readonly dustMaterial = new PointsMaterial({
    blending: AdditiveBlending,
    depthWrite: false,
    opacity: 0.12,
    size: 0.06,
    transparent: true,
    vertexColors: true,
  })
  private readonly dustPositions: Float32Array
  private readonly group = new Group()
  private readonly keyLight = new DirectionalLight(new Color('#fff4e7'), 1)
  private readonly loader = new GLTFLoader()
  private readonly lookTarget = new Vector3()
  private readonly modelCache = new Map<string, Group>()
  private readonly renderChapterIds: string[]
  private readonly renderer: WebGLRenderer
  private readonly rimLight = new DirectionalLight(new Color('#84dff1'), 0.92)
  private readonly runtimes: ChapterRuntime[]
  private readonly scene = new Scene()
  private readonly scratchColorA = new Color()
  private readonly scratchVectorA = new Vector3()
  private readonly scratchVectorB = new Vector3()
  private readonly sections: SectionRegistry
  private readonly skyLight = new HemisphereLight(new Color('#ffffff'), new Color('#07090c'), 0.36)
  private readonly tracker: ChapterBlendTracker<string>
  private readonly accentLightA = new PointLight(new Color('#ffffff'), 0.9, 30, 2)
  private readonly accentLightB = new PointLight(new Color('#ffffff'), 0.8, 26, 2)
  private readonly propLight = new PointLight(new Color('#ffffff'), 0, 24, 2)

  constructor(canvas: HTMLCanvasElement, sections: SectionRegistry, world: WorldDefinition) {
    this.sections = sections
    this.device = resolveDeviceProfile(world.devicePolicy)
    this.renderChapterIds = world.chapters.map((chapter) => chapter.id)
    this.tracker = new ChapterBlendTracker(this.renderChapterIds, this.renderChapterIds[0])
    this.runtimes = world.chapters.map((chapter) => ({
      chapter,
      effects: [],
      group: new Group(),
      props: [],
    }))

    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: this.device.tier === 'desktop',
      canvas,
      powerPreference: this.device.tier === 'mobileLite' ? 'low-power' : 'high-performance',
    })
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = this.device.tier === 'desktop' ? 1.02 : 0.94
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.device.profile.pixelRatioCap))
    this.renderer.setClearColor(0x000000, 0)

    this.scene.fog = new FogExp2(world.theme.bgMid, 0.028)
    this.camera.position.set(0, 0.4, 8.8)
    this.keyLight.position.set(4.4, 5.4, 7.2)
    this.rimLight.position.set(-4.2, 2.8, -5.8)
    this.accentLightA.position.set(2.6, 1.8, 5.8)
    this.accentLightB.position.set(-2.8, 1.2, 5.1)
    this.scene.add(
      this.ambientLight,
      this.skyLight,
      this.keyLight,
      this.rimLight,
      this.accentLightA,
      this.accentLightB,
      this.propLight,
    )

    for (const runtime of this.runtimes) {
      runtime.group.position.fromArray(runtime.chapter.cameraPreset.anchor)
      this.group.add(runtime.group)
      this.seedEffects(runtime)
      void this.seedProps(runtime)
    }

    this.scene.add(this.group)

    const dustCount = this.device.profile.hazeCount
    this.dustBase = new Float32Array(dustCount * 3)
    this.dustPositions = new Float32Array(dustCount * 3)
    const colors = new Float32Array(dustCount * 3)

    for (let index = 0; index < dustCount; index += 1) {
      const stride = index * 3
      const radius = Math.random() * 6.4 + 1
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 6.2
      const z = -Math.random() * 140 + 12
      this.dustBase[stride] = Math.cos(theta) * radius
      this.dustBase[stride + 1] = y
      this.dustBase[stride + 2] = z
      this.dustPositions[stride] = this.dustBase[stride]
      this.dustPositions[stride + 1] = y
      this.dustPositions[stride + 2] = z
      const color = new Color(index % 2 === 0 ? world.theme.accent : world.theme.glowB)
      colors[stride] = color.r
      colors[stride + 1] = color.g
      colors[stride + 2] = color.b
    }

    this.dustGeometry.setAttribute('position', new BufferAttribute(this.dustPositions, 3))
    this.dustGeometry.setAttribute('color', new BufferAttribute(colors, 3))
    this.dust = new Points(this.dustGeometry, this.dustMaterial)
    this.scene.add(this.dust)
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / Math.max(height, 1)
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.device.profile.pixelRatioCap))
    this.renderer.setSize(width, height, false)
  }

  update({ deltaTime, pointer, scroll, time }: UpdateInput): void {
    const chapterState = collectChapterState(this.renderChapterIds, this.sections, {
      baselines: { [this.renderChapterIds[0]]: 0.02 },
      visibilityBoost: 0.08,
    })
    const blend = createChapterBlendTarget(this.renderChapterIds, chapterState.weights, {
      maxSecondaryMix: 0.42,
      secondaryEnterEnd: 0.4,
      secondaryEnterStart: 0.14,
      secondaryWeight: 1.12,
    })
    const weights = this.tracker.update(blend.target, deltaTime, {
      enterSmoothing: this.device.profile.sceneSmoothing.enter,
      exitSmoothing: this.device.profile.sceneSmoothing.exit,
    })

    for (const runtime of this.runtimes) {
      const progress = chapterState.progress[runtime.chapter.id] ?? 0
      const intensity = weights[runtime.chapter.id] ?? 0
      runtime.group.visible = intensity > 0.01
      this.updateChapterRuntime(runtime, progress, intensity, pointer, time)
    }

    this.updateDust(time, scroll.progress, pointer)
    this.updateSceneFrame(chapterState.progress, weights, pointer, time)
    this.group.position.set(pointer.x * 0.1, pointer.y * 0.08, 0)
    this.group.rotation.z = pointer.x * 0.02
    this.renderer.render(this.scene, this.camera)
  }

  private updateSceneFrame(
    progressMap: Record<string, number>,
    weights: Record<string, number>,
    pointer: PointerState,
    time: number,
  ): void {
    const cameraTarget = new Vector3()
    const lookTarget = new Vector3()
    const fogColor = new Color()
    const keyColor = new Color()
    const rimColor = new Color()
    const fillColor = new Color()
    let fogDensity = 0
    let ambientIntensity = 0
    let keyIntensity = 0
    let rimIntensity = 0
    let total = 0

    for (const runtime of this.runtimes) {
      const weight = weights[runtime.chapter.id] ?? 0
      if (weight <= 0.001) {
        continue
      }

      const travel = softenTimelineTail(
        createChapterProgress(
          progressMap[runtime.chapter.id] ?? 0,
          runtime.chapter.timing.progressStart ?? 0,
          runtime.chapter.timing.progressEnd ?? 1,
          easeInOutCubic,
        ),
        {
          cap: runtime.chapter.timing.tailCap ?? 0.86,
          tailStart: runtime.chapter.timing.tailStart ?? 0.68,
        },
      )
      const camera = this.composeCamera(runtime.chapter.cameraPreset, travel, pointer)
      cameraTarget.addScaledVector(camera.position, weight)
      lookTarget.addScaledVector(camera.look, weight)

      fogColor.add(this.scratchColorA.set(runtime.chapter.scenePreset.fogColor).multiplyScalar(weight))
      keyColor.add(this.scratchColorA.set(runtime.chapter.scenePreset.keyColor).multiplyScalar(weight))
      rimColor.add(this.scratchColorA.set(runtime.chapter.scenePreset.rimColor).multiplyScalar(weight))
      fillColor.add(this.scratchColorA.set(runtime.chapter.scenePreset.fillColor).multiplyScalar(weight))
      fogDensity += runtime.chapter.scenePreset.fogDensity * weight
      ambientIntensity += runtime.chapter.scenePreset.ambientIntensity * weight
      keyIntensity += runtime.chapter.scenePreset.keyIntensity * weight
      rimIntensity += runtime.chapter.scenePreset.rimIntensity * weight
      total += weight
    }

    if (total <= 0.0001) {
      total = 1
    }

    cameraTarget.multiplyScalar(1 / total)
    lookTarget.multiplyScalar(1 / total)
    fogColor.multiplyScalar(1 / total)
    keyColor.multiplyScalar(1 / total)
    rimColor.multiplyScalar(1 / total)
    fillColor.multiplyScalar(1 / total)

    this.camera.position.copy(cameraTarget)
    this.lookTarget.copy(lookTarget)
    this.camera.lookAt(this.lookTarget)
    ;(this.scene.fog as FogExp2).color.copy(fogColor)
    ;(this.scene.fog as FogExp2).density = fogDensity / total + (this.device.tier === 'mobileLite' ? 0.004 : 0)

    this.ambientLight.intensity = ambientIntensity / total
    this.skyLight.intensity = Math.max(0.26, ambientIntensity / total * 0.6)
    this.keyLight.color.copy(keyColor)
    this.keyLight.intensity = keyIntensity / total
    this.rimLight.color.copy(rimColor)
    this.rimLight.intensity = rimIntensity / total
    this.accentLightA.color.copy(fillColor)
    this.accentLightB.color.copy(this.scratchColorA.copy(keyColor).lerp(rimColor, 0.45))
    this.accentLightA.position.set(this.lookTarget.x + 2.7, this.lookTarget.y + 1.7, this.lookTarget.z + 5.4)
    this.accentLightB.position.set(this.lookTarget.x - 2.9, this.lookTarget.y + 1 + Math.sin(time * 0.3) * 0.4, this.lookTarget.z + 4.8)

    const primaryRuntime = this.runtimes.reduce((best, runtime) =>
      (weights[runtime.chapter.id] ?? 0) > (weights[best.chapter.id] ?? 0) ? runtime : best,
    this.runtimes[0])
    const primaryAnchor = primaryRuntime.group.getWorldPosition(this.scratchVectorA)
    this.propLight.position.copy(primaryAnchor).add(this.scratchVectorB.set(0.4, 1.2, 2.1))
    this.propLight.color.copy(this.scratchColorA.set(primaryRuntime.chapter.scenePreset.fillColor))
    this.propLight.intensity =
      this.device.profile.heroLightIntensity * (weights[primaryRuntime.chapter.id] ?? 0) * 0.92
  }

  private composeCamera(cameraPreset: CameraPreset, progress: number, pointer: PointerState): {
    look: Vector3
    position: Vector3
  } {
    const pointerGain = cameraPreset.pointerParallax ?? [0, 0, 0]
    const cameraTravel = cameraPreset.cameraTravel
    const lookTravel = cameraPreset.lookTravel ?? [0, 0, 0]

    return {
      position: new Vector3(
        cameraPreset.anchor[0] + cameraPreset.cameraOffset[0] + cameraTravel[0] * progress + pointer.x * pointerGain[0],
        cameraPreset.anchor[1] + cameraPreset.cameraOffset[1] + cameraTravel[1] * progress + pointer.y * pointerGain[1],
        cameraPreset.anchor[2] + cameraPreset.cameraOffset[2] + cameraTravel[2] * progress,
      ),
      look: new Vector3(
        cameraPreset.anchor[0] + cameraPreset.lookOffset[0] + lookTravel[0] * progress + pointer.x * pointerGain[0] * 0.3,
        cameraPreset.anchor[1] + cameraPreset.lookOffset[1] + lookTravel[1] * progress + pointer.y * pointerGain[1] * 0.3,
        cameraPreset.anchor[2] + cameraPreset.lookOffset[2] + lookTravel[2] * progress,
      ),
    }
  }

  private updateChapterRuntime(
    runtime: ChapterRuntime,
    progress: number,
    intensity: number,
    pointer: PointerState,
    time: number,
  ): void {
    const travel = softenTimelineTail(
      createChapterProgress(
        progress,
        runtime.chapter.timing.progressStart ?? 0,
        runtime.chapter.timing.progressEnd ?? 1,
        easeInOutCubic,
      ),
      {
        cap: runtime.chapter.timing.tailCap ?? 0.86,
        tailStart: runtime.chapter.timing.tailStart ?? 0.68,
      },
    )
    const drift = runtime.chapter.cameraPreset.groupDrift ?? [0, 0, 0]
    const rotation = runtime.chapter.cameraPreset.groupRotation ?? [0, 0, 0]
    runtime.group.position.set(
      runtime.chapter.cameraPreset.anchor[0] + drift[0] * travel + pointer.x * 0.08,
      runtime.chapter.cameraPreset.anchor[1] + drift[1] * travel + pointer.y * 0.06,
      runtime.chapter.cameraPreset.anchor[2] + drift[2] * travel,
    )
    runtime.group.rotation.set(rotation[0] * travel, rotation[1] * travel + pointer.x * 0.04, rotation[2] * travel)

    for (const prop of runtime.props) {
      this.updatePropActor(prop, runtime.chapter, time, travel, intensity)
    }

    for (const effect of runtime.effects) {
      this.updateEffectActor(effect, runtime.chapter, time, travel, intensity, pointer)
    }
  }

  private updatePropActor(actor: PropActor, chapter: ChapterDefinition, time: number, progress: number, intensity: number): void {
    const local = createStaggeredTimeline(progress, actor.index, Math.max(chapter.propCast.length, 1), {
      ease: easeInOutCubic,
      span: chapter.timing.staggerSpan ?? 0.68,
      spread: chapter.timing.staggerSpread ?? 0.2,
    })
    const envelope = createTimelineEnvelope(local, {
      easeIn: easeOutQuint,
      easeOut: easeInOutCubic,
      fadeInEnd: chapter.timing.fadeInEnd ?? 0.22,
      fadeInStart: chapter.timing.fadeInStart ?? 0.04,
      fadeOutEnd: chapter.timing.fadeOutEnd ?? 0.985,
      fadeOutStart: chapter.timing.fadeOutStart ?? 0.82,
    })
    const motion = this.resolveMotion(actor.motionPreset, actor.index, actor.placement, local, time, envelope)
    const opacity = MathUtils.clamp(0.02 + intensity * envelope * 0.98, 0, 1)

    actor.group.visible = opacity > 0.01
    actor.group.position.set(
      actor.placement.x + motion.position.x,
      actor.placement.y + motion.position.y,
      actor.placement.z + motion.position.z,
    )
    actor.group.rotation.set(
      (actor.placement.rotX ?? 0) + motion.rotation.x,
      (actor.placement.rotY ?? 0) + motion.rotation.y,
      (actor.placement.rotZ ?? 0) + motion.rotation.z,
    )
    actor.group.scale.setScalar(actor.placement.scale * motion.scale)

    for (const material of actor.materials) {
      this.animateMaterial(material, opacity, intensity, time, actor.index)
    }
  }

  private updateEffectActor(
    actor: EffectActor,
    chapter: ChapterDefinition,
    time: number,
    progress: number,
    intensity: number,
    pointer: PointerState,
  ): void {
    const baseScale = actor.placement.scale ?? actor.preset.size ?? 1
    const envelope = createTimelineEnvelope(progress, {
      easeIn: easeOutQuint,
      easeOut: easeInOutCubic,
      fadeInEnd: chapter.timing.fadeInEnd ?? 0.22,
      fadeInStart: chapter.timing.fadeInStart ?? 0.06,
      fadeOutEnd: chapter.timing.fadeOutEnd ?? 0.98,
      fadeOutStart: chapter.timing.fadeOutStart ?? 0.8,
      min: 0,
    })
    const visibility = MathUtils.clamp(envelope * intensity, 0, 1)
    const pulse = createPulseValue(time, progress, {
      amplitude: 0.34,
      base: 0.44,
      frequency: 1.4,
      phase: actor.placement.x * 0.6 + actor.placement.y * 0.4,
      progressGain: 0.4,
    })

    switch (actor.kind) {
      case 'ring': {
        actor.mesh.visible = visibility > 0.01
        actor.mesh.position.set(
          actor.placement.x + pointer.x * 0.14,
          actor.placement.y + pointer.y * 0.08,
          actor.placement.z - progress * 1.4,
        )
        actor.mesh.rotation.set(
          actor.placement.rotX ?? Math.PI * 0.5,
          (actor.placement.rotY ?? 0) + progress * 1.6 + time * 0.18,
          (actor.placement.rotZ ?? 0) + pulse * 0.28,
        )
        actor.mesh.scale.setScalar(baseScale * (0.8 + pulse * 0.5))
        actor.material.opacity = visibility * 0.48
        break
      }

      case 'cone': {
        actor.mesh.visible = visibility > 0.01
        actor.mesh.position.set(
          actor.placement.x + pointer.x * 0.1,
          actor.placement.y + Math.sin(time * 0.4 + actor.placement.x) * 0.12,
          actor.placement.z - progress * 0.8,
        )
        actor.mesh.rotation.set(
          (actor.placement.rotX ?? Math.PI) + pulse * 0.12,
          (actor.placement.rotY ?? 0) + progress * 0.35,
          actor.placement.rotZ ?? 0,
        )
        actor.mesh.scale.set(
          baseScale * (0.92 + pulse * 0.08),
          baseScale * (1 + pulse * 0.14),
          baseScale * (0.92 + pulse * 0.08),
        )
        actor.material.opacity = visibility * 0.15
        break
      }

      case 'glow': {
        actor.mesh.visible = visibility > 0.01
        actor.mesh.position.set(
          actor.placement.x + Math.sin(time * 0.6 + actor.placement.z) * 0.1,
          actor.placement.y + Math.cos(time * 0.4 + actor.placement.x) * 0.08,
          actor.placement.z,
        )
        actor.mesh.scale.setScalar(baseScale * (0.92 + pulse * 0.24))
        actor.material.opacity = visibility * 0.2
        break
      }

      case 'haze': {
        actor.mesh.visible = visibility > 0.01
        actor.mesh.position.set(
          actor.placement.x + pointer.x * 0.06,
          actor.placement.y + pointer.y * 0.04,
          actor.placement.z - progress * 1.8,
        )
        actor.mesh.rotation.set(
          actor.placement.rotX ?? 0,
          actor.placement.rotY ?? 0,
          (actor.placement.rotZ ?? 0) + Math.sin(time * 0.2 + actor.placement.x) * 0.08,
        )
        actor.mesh.scale.set(
          baseScale * (1.1 + pulse * 0.24),
          baseScale * (0.9 + pulse * 0.18),
          1,
        )
        actor.material.opacity = visibility * 0.12
        break
      }

      case 'spark': {
        actor.points.visible = visibility > 0.01
        actor.points.position.set(
          actor.placement.x,
          actor.placement.y + pulse * 0.22,
          actor.placement.z - progress * 0.45,
        )
        actor.points.rotation.set(0, progress * 1.1 + time * 0.1, time * 0.12)
        actor.material.opacity = visibility * 0.65
        actor.material.size = 0.038 + pulse * 0.02

        for (let index = 0; index < actor.positions.length; index += 3) {
          const x = actor.base[index]
          const y = actor.base[index + 1]
          const z = actor.base[index + 2]
          const wave = Math.sin(time * 1.8 + index * 0.04 + progress * Math.PI * 2) * 0.14
          actor.positions[index] = x * (1 + pulse * 0.35)
          actor.positions[index + 1] = y * (1 + pulse * 0.28) + wave
          actor.positions[index + 2] = z + pulse * 0.8
        }

        actor.geometry.attributes.position.needsUpdate = true
        break
      }

      case 'ribbon': {
        actor.line.visible = visibility > 0.01
        actor.line.position.set(actor.placement.x, actor.placement.y, actor.placement.z - progress * 0.65)
        actor.line.rotation.set(0, progress * 0.7, (actor.placement.rotZ ?? 0) + time * 0.08)
        actor.material.opacity = visibility * 0.36

        for (let index = 0; index < actor.positions.length; index += 3) {
          const point = index / 3
          const travel = point / Math.max(actor.positions.length / 3 - 1, 1)
          actor.positions[index + 1] =
            Math.sin(time * 0.7 + travel * Math.PI * 4 + actor.placement.x) * 0.14 +
            Math.sin(progress * Math.PI * 2 + travel * Math.PI * 2) * 0.24
          actor.positions[index + 2] = travel * 4.8 - pulse * 0.8
        }

        actor.attribute.needsUpdate = true
        break
      }
    }
  }

  private resolveMotion(
    preset: MotionPresetName,
    index: number,
    placement: PropPlacement,
    progress: number,
    time: number,
    envelope: number,
  ): { position: Vector3; rotation: Vector3; scale: number } {
    const position = new Vector3()
    const rotation = new Vector3()
    let scale = 0.94 + envelope * 0.06
    const phase = index * 0.8 + placement.x * 0.5
    const orbit = createOrbitOffset(progress, {
      phase,
      radiusX: 0.28 + index * 0.04,
      radiusY: 0.16 + index * 0.03,
      turns: 0.55 + index * 0.06,
    })
    const float = createFloatMotion(time, progress, {
      amplitude: 0.16 + index * 0.015,
      base: 0.5,
      frequency: 0.9 + index * 0.08,
      phase,
      progressGain: 0.35,
    })
    const pulse = createPulseValue(time, progress, {
      amplitude: 0.14,
      base: 0.48,
      frequency: 1.2 + index * 0.1,
      phase,
      progressGain: 0.3,
    })

    switch (preset) {
      case 'float':
        position.set(orbit.x * 0.22, float, -progress * 0.42)
        rotation.set(float * 0.14, orbit.x * 0.3, orbit.y * 0.16)
        scale = 0.98 + pulse * 0.04
        break

      case 'orbit':
        position.set(orbit.x, orbit.y * 0.8 + float * 0.5, -progress * 0.8)
        rotation.set(orbit.y * 0.3, progress * Math.PI * 0.6 + phase, orbit.x * 0.2)
        scale = 0.96 + pulse * 0.05
        break

      case 'spiral':
        position.set(orbit.x * 0.74, orbit.y * 0.55 + float * 0.4, -progress * 1.4 - index * 0.18)
        rotation.set(progress * 1.3 + phase * 0.1, progress * 1.8 + phase, orbit.x * 0.18)
        scale = 0.95 + pulse * 0.04
        break

      case 'fan': {
        const spread = createFanOffset(progress, index, Math.max(index + 1, 4), { spread: 1.5, curve: 0.9 })
        position.set(spread, float * 0.5 + Math.abs(spread) * 0.12, -progress * 0.46)
        rotation.set(0.1 + spread * 0.14, spread * 0.45, spread * 0.18)
        scale = 0.98
        break
      }

      case 'drift':
        position.set(Math.sin(time * 0.34 + phase) * 0.18, float * 0.9, -progress * 0.7)
        rotation.set(float * 0.16, Math.sin(time * 0.2 + phase) * 0.22, 0)
        scale = 0.98 + pulse * 0.02
        break

      case 'burst':
        position.set(
          Math.cos(phase) * progress * (0.9 + index * 0.1),
          Math.sin(phase * 1.3) * progress * (0.4 + index * 0.08) + float * 0.5,
          -progress * (1.4 + index * 0.2),
        )
        rotation.set(progress * 0.9, progress * 1.2 + phase, progress * 0.4)
        scale = 0.96 + envelope * 0.04
        break

      case 'stage-rise':
        position.set(orbit.x * 0.16, -0.8 + progress * 1.35 + float * 0.25, -progress * 0.36)
        rotation.set(-0.08 + float * 0.1, progress * 0.35, 0)
        scale = 0.99 + pulse * 0.03
        break

      case 'swarm':
        position.set(
          Math.cos(time * 0.6 + phase) * 0.38 * envelope,
          Math.sin(time * 0.8 + phase) * 0.28 * envelope,
          -progress * 0.95 + Math.sin(time * 0.28 + phase) * 0.2,
        )
        rotation.set(float * 0.12, time * 0.25 + phase, orbit.y * 0.2)
        scale = 0.94 + pulse * 0.04
        break

      case 'hang':
        position.set(Math.sin(time * 0.32 + phase) * 0.12, float * 0.75 + 0.18, -progress * 0.3)
        rotation.set(Math.sin(time * 0.22 + phase) * 0.08, Math.sin(time * 0.18 + phase) * 0.12, 0)
        scale = 1
        break

      case 'dissolve':
        position.set(0, float * 0.35, -progress * 1.8 - envelope * 1.2)
        rotation.set(float * 0.08, progress * 0.26, 0)
        scale = 0.96
        break
    }

    return { position, rotation, scale }
  }

  private animateMaterial(
    material: MeshPhysicalMaterial,
    opacity: number,
    intensity: number,
    time: number,
    index: number,
  ): void {
    material.opacity = opacity
    material.transparent = opacity < 0.999
    material.depthWrite = opacity > 0.88
    material.emissiveIntensity = (material.userData.baseEmissiveIntensity ?? material.emissiveIntensity ?? 0.2) *
      (0.7 + intensity * 0.55 + Math.sin(time * 0.8 + index * 0.4) * 0.05)
  }

  private updateDust(time: number, progress: number, pointer: PointerState): void {
    const attributes = this.dustGeometry.getAttribute('position') as BufferAttribute
    for (let index = 0; index < this.dustPositions.length; index += 3) {
      const x = this.dustBase[index]
      const y = this.dustBase[index + 1]
      const z = this.dustBase[index + 2]
      const parallax = Math.sin(time * 0.12 + index * 0.005)
      this.dustPositions[index] = x + pointer.x * 0.18 + parallax * 0.12
      this.dustPositions[index + 1] = y + pointer.y * 0.14 + Math.cos(time * 0.18 + index * 0.003) * 0.08
      let nextZ = z + progress * 36 + time * 1.2
      while (nextZ > 14) {
        nextZ -= 156
      }
      this.dustPositions[index + 2] = nextZ
    }
    attributes.needsUpdate = true
  }

  private seedEffects(runtime: ChapterRuntime): void {
    for (const preset of runtime.chapter.effects) {
      const placements = this.limitPlacements(
        preset.placements,
        preset.qualityRules,
        Math.max(1, this.device.profile.maxEffectInstances),
      )

      for (const placement of placements) {
        let actor: EffectActor | null = null

        switch (preset.type) {
          case 'pulse-ring':
            actor = this.createPulseRing(preset, placement)
            break
          case 'light-cone':
            actor = this.createLightCone(preset, placement)
            break
          case 'hero-glow-shell':
            actor = this.createGlowShell(preset, placement)
            break
          case 'depth-haze-plane':
            actor = this.createHazePlane(preset, placement)
            break
          case 'spark-burst':
            actor = this.createSparkBurst(preset, placement)
            break
          case 'ribbon-trail':
            actor = this.createRibbon(preset, placement)
            break
          case 'dust-field':
            actor = null
            break
        }

        if (actor) {
          runtime.effects.push(actor)
        }
      }
    }
  }

  private async seedProps(runtime: ChapterRuntime): Promise<void> {
    for (const entry of runtime.chapter.propCast) {
      const placements = this.limitPlacements(
        entry.placements,
        entry.qualityRules,
        Math.max(1, this.device.profile.maxPropInstances),
      )
      const scaleMultiplier =
        entry.qualityRules?.scaleMultiplier?.[this.device.tier] ??
        1

      for (const [index, sourcePlacement] of placements.entries()) {
        const placement = {
          ...sourcePlacement,
          scale: sourcePlacement.scale * scaleMultiplier,
        }
        const group = await this.createPropGroup(entry.model, entry.materialPreset, placement.scale)
        const materials = this.collectMaterials(group)
        runtime.group.add(group)
        runtime.props.push({
          group,
          index,
          materials,
          motionPreset: entry.motionPreset,
          placement,
        })
      }
    }
  }

  private limitPlacements<T extends { scale?: number }>(
    placements: readonly T[],
    rules: { hideOn?: readonly string[]; maxInstances?: Record<string, number> } | undefined,
    fallbackMax: number,
  ): T[] {
    if (rules?.hideOn?.includes(this.device.tier)) {
      return []
    }

    const explicitMax = rules?.maxInstances?.[this.device.tier]
    const limit = Math.max(0, Math.min(placements.length, explicitMax ?? fallbackMax))
    return placements.slice(0, limit)
  }

  private async createPropGroup(model: ModelKey, materialPreset: MaterialPreset, scale: number): Promise<Group> {
    const template = MODEL_URLS[model] ? await this.getModelTemplate(model) : this.createPrimitiveTemplate(model)
    const group = template.clone(true)
    const box = new Box3().setFromObject(group)
    const height = this.getTargetHeight(box)
    const normalizedScale = scale / Math.max(height, 0.001)
    group.scale.setScalar(normalizedScale)
    this.normalizeObject(group)

    for (const material of this.collectMaterials(group)) {
      material.color.set(materialPreset.base)
      material.emissive.set(materialPreset.emissive)
      material.emissiveIntensity = materialPreset.emissiveIntensity ?? 0.18
      material.userData.baseEmissiveIntensity = material.emissiveIntensity
      material.metalness = materialPreset.metalness ?? 0.48
      material.roughness = materialPreset.roughness ?? 0.38
      material.clearcoat = materialPreset.clearcoat ?? 0.32
      material.clearcoatRoughness = materialPreset.clearcoatRoughness ?? 0.42
      material.opacity = materialPreset.opacity ?? 1
      material.transparent = material.opacity < 0.999
      material.depthWrite = material.opacity > 0.88
      material.specularIntensity = materialPreset.specularIntensity ?? 1
      if (materialPreset.accent) {
        material.sheenColor?.set(materialPreset.accent)
      }
    }

    return group
  }

  private collectMaterials(object: Object3D): MeshPhysicalMaterial[] {
    const materials: MeshPhysicalMaterial[] = []
    object.traverse((child) => {
      if (!(child instanceof Mesh)) {
        return
      }

      if (Array.isArray(child.material)) {
        for (const item of child.material) {
          if (item instanceof MeshPhysicalMaterial) {
            materials.push(item)
          } else {
            const replacement = new MeshPhysicalMaterial().copy(item as MeshPhysicalMaterial)
            child.material = replacement
            materials.push(replacement)
          }
        }
        return
      }

      if (child.material instanceof MeshPhysicalMaterial) {
        materials.push(child.material)
      } else {
        const replacement = new MeshPhysicalMaterial().copy(child.material as MeshPhysicalMaterial)
        child.material = replacement
        materials.push(replacement)
      }
    })

    return materials
  }

  private async getModelTemplate(model: ModelKey): Promise<Group> {
    const url = MODEL_URLS[model]
    if (!url) {
      return this.createPrimitiveTemplate(model)
    }

    const cached = this.modelCache.get(url)
    if (cached) {
      return cached
    }

    const gltf = await this.loader.loadAsync(url)
    const root = gltf.scene || gltf.scenes[0]
    const group = new Group()
    group.add(root.clone(true))
    this.normalizeObject(group)
    this.modelCache.set(url, group)
    return group
  }

  private getTargetHeight(box: Box3): number {
    return Math.max(box.max.y - box.min.y, box.max.x - box.min.x, box.max.z - box.min.z)
  }

  private createPrimitiveTemplate(model: ModelKey): Group {
    const group = new Group()
    let mesh: Mesh

    switch (model) {
      case 'sphere':
      case 'orb':
        mesh = new Mesh(new SphereGeometry(0.5, 40, 40), new MeshPhysicalMaterial())
        break
      case 'box':
        mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshPhysicalMaterial())
        break
      case 'plate':
        mesh = new Mesh(new PlaneGeometry(1.4, 1.9, 1, 1), new MeshPhysicalMaterial({ side: DoubleSide }))
        break
      case 'cone':
        mesh = new Mesh(new ConeGeometry(0.5, 1.5, 28, 1, true), new MeshPhysicalMaterial({ side: DoubleSide }))
        break
      case 'ring':
        mesh = new Mesh(new TorusGeometry(0.64, 0.12, 18, 48), new MeshPhysicalMaterial())
        break
      case 'knot':
        mesh = new Mesh(new TorusKnotGeometry(0.42, 0.14, 96, 16), new MeshPhysicalMaterial())
        break
      case 'shard':
        mesh = new Mesh(new IcosahedronGeometry(0.62, 0), new MeshPhysicalMaterial())
        break
      default:
        mesh = new Mesh(new SphereGeometry(0.5, 32, 32), new MeshPhysicalMaterial())
        break
    }

    group.add(mesh)
    return group
  }

  private normalizeObject(object: Object3D): void {
    const box = new Box3().setFromObject(object)
    const center = box.getCenter(this.scratchVectorB)
    const minY = box.min.y
    object.position.sub(center)
    object.position.y -= minY

    object.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = false
        child.receiveShadow = false
        child.geometry.computeVertexNormals()
      }
    })
  }

  private createPulseRing(preset: EffectPreset, placement: EffectPlacement): RingActor {
    const geometry = new RingGeometry(0.6, 0.84, 72)
    const material = new MeshBasicMaterial({
      blending: AdditiveBlending,
      color: preset.color,
      depthWrite: false,
      opacity: 0.3,
      side: DoubleSide,
      transparent: true,
    })
    const mesh = new Mesh(geometry, material)
    mesh.rotation.x = placement.rotX ?? Math.PI * 0.5
    this.group.add(mesh)
    return { kind: 'ring', material, mesh, placement, preset }
  }

  private createLightCone(preset: EffectPreset, placement: EffectPlacement): ConeActor {
    const geometry = new ConeGeometry(0.8, 2.8, 32, 1, true)
    const material = new MeshBasicMaterial({
      blending: AdditiveBlending,
      color: preset.color,
      depthWrite: false,
      opacity: 0.12,
      side: DoubleSide,
      transparent: true,
    })
    const mesh = new Mesh(geometry, material)
    this.group.add(mesh)
    return { kind: 'cone', material, mesh, placement, preset }
  }

  private createGlowShell(preset: EffectPreset, placement: EffectPlacement): GlowActor {
    const geometry = new SphereGeometry(1, 48, 48)
    const material = new MeshBasicMaterial({
      blending: AdditiveBlending,
      color: preset.color,
      depthWrite: false,
      opacity: 0.16,
      transparent: true,
    })
    const mesh = new Mesh(geometry, material)
    this.group.add(mesh)
    return { kind: 'glow', material, mesh, placement, preset }
  }

  private createHazePlane(preset: EffectPreset, placement: EffectPlacement): HazeActor {
    const geometry = new PlaneGeometry(4.8, 2.8, 1, 1)
    const material = new MeshBasicMaterial({
      blending: AdditiveBlending,
      color: preset.color,
      depthWrite: false,
      opacity: 0.08,
      side: DoubleSide,
      transparent: true,
    })
    const mesh = new Mesh(geometry, material)
    this.group.add(mesh)
    return { kind: 'haze', material, mesh, placement, preset }
  }

  private createSparkBurst(preset: EffectPreset, placement: EffectPlacement): SparkActor {
    const count = Math.max(18, Math.round(36 * (preset.intensity ?? 1)))
    const positions = new Float32Array(count * 3)
    const base = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      const stride = index * 3
      const radius = Math.random() * (preset.size ?? 1.2)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      base[stride] = Math.cos(theta) * Math.sin(phi) * radius
      base[stride + 1] = Math.cos(phi) * radius * 0.7
      base[stride + 2] = Math.sin(theta) * Math.sin(phi) * radius
      positions[stride] = base[stride]
      positions[stride + 1] = base[stride + 1]
      positions[stride + 2] = base[stride + 2]
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    const material = new PointsMaterial({
      blending: AdditiveBlending,
      color: preset.color,
      depthWrite: false,
      opacity: 0.6,
      size: 0.05,
      transparent: true,
    })
    const points = new Points(geometry, material)
    this.group.add(points)
    return { base, geometry, kind: 'spark', material, placement, points, positions, preset }
  }

  private createRibbon(preset: EffectPreset, placement: EffectPlacement): RibbonActor {
    const points = 28
    const positions = new Float32Array(points * 3)
    for (let index = 0; index < points; index += 1) {
      const stride = index * 3
      const progress = index / Math.max(points - 1, 1)
      positions[stride] = (progress - 0.5) * (preset.size ?? 1.6)
      positions[stride + 1] = 0
      positions[stride + 2] = progress * 4.8
    }
    const geometry = new BufferGeometry()
    const attribute = new BufferAttribute(positions, 3)
    geometry.setAttribute('position', attribute)
    const material = new LineBasicMaterial({
      blending: AdditiveBlending,
      color: preset.secondaryColor ?? preset.color,
      opacity: 0.3,
      transparent: true,
    })
    const line = new Line(geometry, material)
    this.group.add(line)
    return { attribute, kind: 'ribbon', line, material, placement, positions, preset }
  }
}

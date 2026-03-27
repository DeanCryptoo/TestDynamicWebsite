import { damp } from './math'
import { isLowPowerDevice } from './runtime-profile'

export interface PointerState {
  x: number
  y: number
  targetX: number
  targetY: number
}

export class PointerTracker {
  private readonly enabled = !isLowPowerDevice()

  readonly state: PointerState = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  }

  constructor() {
    if (!this.enabled) {
      return
    }

    window.addEventListener('pointermove', this.handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', this.handlePointerLeave)
  }

  update(deltaTime: number): PointerState {
    if (!this.enabled) {
      return this.state
    }

    this.state.x = damp(this.state.x, this.state.targetX, 7, deltaTime)
    this.state.y = damp(this.state.y, this.state.targetY, 7, deltaTime)
    return this.state
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    this.state.targetX = (event.clientX / window.innerWidth) * 2 - 1
    this.state.targetY = (event.clientY / window.innerHeight) * 2 - 1
  }

  private readonly handlePointerLeave = (): void => {
    this.state.targetX = 0
    this.state.targetY = 0
  }
}

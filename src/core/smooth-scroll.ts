import { clamp, damp } from './math'

export interface ScrollFrame {
  current: number
  target: number
  velocity: number
  limit: number
  progress: number
}

export class SmoothScroll {
  readonly frame: ScrollFrame = {
    current: 0,
    target: 0,
    velocity: 0,
    limit: 0,
    progress: 0,
  }

  private readonly reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  private readonly resizeObserver: ResizeObserver
  private readonly root: HTMLElement

  constructor(root: HTMLElement) {
    this.root = root
    this.resizeObserver = new ResizeObserver(this.refresh)
    this.resizeObserver.observe(root)

    window.addEventListener('resize', this.refresh)
    this.reduceMotionQuery.addEventListener('change', this.syncToViewport)

    this.refresh()
    this.syncToViewport()
  }

  update(deltaTime: number): ScrollFrame {
    this.frame.target = clamp(window.scrollY, 0, this.frame.limit)

    const previous = this.frame.current
    const next = this.reduceMotionQuery.matches
      ? this.frame.target
      : damp(this.frame.current, this.frame.target, 11, deltaTime)

    this.frame.current = Math.abs(next - this.frame.target) < 0.025 ? this.frame.target : next
    this.frame.velocity = this.frame.current - previous
    this.frame.progress =
      this.frame.limit <= 0 ? 0 : clamp(this.frame.current / this.frame.limit, 0, 1)

    this.root.style.transform = `translate3d(0, ${-this.frame.current}px, 0)`
    return this.frame
  }

  readonly refresh = (): void => {
    const height = this.root.scrollHeight
    this.frame.limit = Math.max(0, height - window.innerHeight)
    document.body.style.height = `${height}px`
    this.syncToViewport()
  }

  private readonly syncToViewport = (): void => {
    this.frame.target = clamp(window.scrollY, 0, this.frame.limit)
    this.frame.current = this.reduceMotionQuery.matches ? this.frame.target : this.frame.current
  }
}

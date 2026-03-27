import { clamp } from './math'

export interface SectionMetrics {
  id: string
  element: HTMLElement
  top: number
  height: number
  progress: number
  visibility: number
  focus: number
}

export class SectionRegistry {
  private readonly items: SectionMetrics[]

  constructor(root: HTMLElement, selector = '[data-section]') {
    const elements = Array.from(root.querySelectorAll<HTMLElement>(selector))

    this.items = elements.map((element, index) => ({
      id: element.dataset.section ?? `section-${index + 1}`,
      element,
      top: element.offsetTop,
      height: element.offsetHeight,
      progress: 0,
      visibility: 0,
      focus: 0,
    }))
  }

  refresh(): void {
    for (const item of this.items) {
      item.top = item.element.offsetTop
      item.height = item.element.offsetHeight
    }
  }

  update(scrollY: number, viewportHeight: number): void {
    const viewportCenter = scrollY + viewportHeight * 0.5

    for (const item of this.items) {
      item.progress = clamp(
        (scrollY + viewportHeight - item.top) / (item.height + viewportHeight),
        0,
        1,
      )

      const overlap =
        Math.min(scrollY + viewportHeight, item.top + item.height) - Math.max(scrollY, item.top)
      item.visibility = clamp(overlap / Math.max(item.height, 1), 0, 1)

      const itemCenter = item.top + item.height * 0.5
      const maxDistance = (viewportHeight + item.height) * 0.5
      item.focus = clamp(1 - Math.abs(viewportCenter - itemCenter) / Math.max(maxDistance, 1), 0, 1)

      item.element.style.setProperty('--section-progress', item.progress.toFixed(4))
      item.element.style.setProperty('--section-visibility', item.visibility.toFixed(4))
      item.element.style.setProperty('--section-focus', item.focus.toFixed(4))
    }
  }

  get(id: string): SectionMetrics | undefined {
    return this.items.find((item) => item.id === id)
  }

  getMostVisible(): SectionMetrics | undefined {
    return this.items.reduce<SectionMetrics | undefined>((best, item) => {
      if (!best) {
        return item
      }

      return item.focus > best.focus ? item : best
    }, undefined)
  }
}

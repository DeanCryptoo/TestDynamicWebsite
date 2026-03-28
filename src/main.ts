const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing app root.')
}

const url = new URL(window.location.href)
const world = url.searchParams.get('world') ?? 'launcher'

const WORLD_LOADERS: Record<string, () => Promise<{ mount: (app: HTMLDivElement) => void }>> = {
  launcher: async () => {
    const module = await import('./worlds/launcher')
    return { mount: module.mountLauncherWorld }
  },
  'story-motion': async () => {
    const module = await import('./worlds/story-motion')
    return { mount: module.mountStoryMotionWorld }
  },
  pullup: async () => {
    const module = await import('./worlds/pullup')
    return { mount: module.mountPullupWorld }
  },
  luxury: async () => {
    const module = await import('./worlds/luxury')
    return { mount: module.mountLuxuryWorld }
  },
  fashion: async () => {
    const module = await import('./worlds/fashion')
    return { mount: module.mountFashionWorld }
  },
}

document.documentElement.dataset.world = world
document.body.dataset.world = world

const mountWorld = async (): Promise<void> => {
  const load = WORLD_LOADERS[world] ?? WORLD_LOADERS.launcher
  const module = await load()
  module.mount(app)
}

void mountWorld()

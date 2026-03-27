const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing app root.')
}

const url = new URL(window.location.href)
const world = url.searchParams.get('world') ?? 'launcher'

document.documentElement.dataset.world = world
document.body.dataset.world = world

const mountWorld = async (): Promise<void> => {
  switch (world) {
    case 'story-motion': {
      const { mountStoryMotionWorld } = await import('./worlds/story-motion')
      mountStoryMotionWorld(app)
      return
    }

    case 'pullup': {
      const { mountPullupWorld } = await import('./worlds/pullup')
      mountPullupWorld(app)
      return
    }

    default: {
      const { mountLauncherWorld } = await import('./worlds/launcher')
      mountLauncherWorld(app)
    }
  }
}

void mountWorld()

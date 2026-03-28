import { isLowPowerDevice } from '../../core/runtime-profile'
import type { DevicePolicy, DeviceProfile, DeviceTier } from './types'

const DEFAULT_PROFILES: Record<DeviceTier, DeviceProfile> = {
  desktop: {
    enableBlur: true,
    enableOverlay: true,
    enablePointer: true,
    hazeCount: 260,
    heroLightIntensity: 1,
    maxEffectInstances: 18,
    maxPropInstances: 16,
    pixelRatioCap: 1.35,
    sceneSmoothing: {
      enter: 2.5,
      exit: 3.2,
    },
  },
  tablet: {
    enableBlur: true,
    enableOverlay: true,
    enablePointer: true,
    hazeCount: 160,
    heroLightIntensity: 0.88,
    maxEffectInstances: 12,
    maxPropInstances: 10,
    pixelRatioCap: 1,
    sceneSmoothing: {
      enter: 2.25,
      exit: 3,
    },
  },
  mobileLite: {
    enableBlur: false,
    enableOverlay: false,
    enablePointer: false,
    hazeCount: 84,
    heroLightIntensity: 0.72,
    maxEffectInstances: 6,
    maxPropInstances: 5,
    pixelRatioCap: 0.8,
    sceneSmoothing: {
      enter: 2.05,
      exit: 2.8,
    },
  },
}

export const getDeviceTier = (): DeviceTier => {
  if (isLowPowerDevice()) {
    return 'mobileLite'
  }

  if (window.innerWidth < 1180) {
    return 'tablet'
  }

  return 'desktop'
}

export const resolveDeviceProfile = (policy?: DevicePolicy): { profile: DeviceProfile; tier: DeviceTier } => {
  const tier = getDeviceTier()
  const override = policy?.[tier]

  return {
    tier,
    profile: {
      ...DEFAULT_PROFILES[tier],
      ...override,
      sceneSmoothing: {
        ...DEFAULT_PROFILES[tier].sceneSmoothing,
        ...(override?.sceneSmoothing ?? {}),
      },
    },
  }
}

export const LOW_POWER_MEDIA_QUERY = '(max-width: 860px), (pointer: coarse)'

export const isLowPowerDevice = (): boolean => window.matchMedia(LOW_POWER_MEDIA_QUERY).matches

export const MOBILE_FRAME_INTERVAL = 1 / 30

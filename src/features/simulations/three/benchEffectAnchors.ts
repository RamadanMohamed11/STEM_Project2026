import { receiverRimHeight } from '../lib/benchLiquids'
import { benchVolumeMl, useBenchLiquidsStore } from '../state/useBenchLiquidsStore'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { snapElevation } from './benchLayout'
import { vesselEffectAnchor, type EffectAnchor } from './effects/reaction/effectAnchors'
import { BENCH_TOP, instanceTypeId, resolveEquipment } from './sceneConfig'

/** L6: where a bench vessel's reaction effects are drawn (follows drags and holder snaps). */
export function benchEffectAnchor(containerId: string): EffectAnchor | null {
  const scene = useLabSceneStore.getState()
  const at = scene.positions[containerId]
  if (!at) return null
  const lift = snapElevation(containerId, scene.relationships)
  const volume = benchVolumeMl(useBenchLiquidsStore.getState(), containerId)
  return vesselEffectAnchor(instanceTypeId(containerId), [at.x, BENCH_TOP + lift, at.z], volume, {
    rim: receiverRimHeight(containerId) ?? 0.3,
    radius: (resolveEquipment(containerId)?.footprintRadius ?? 0.15) * 0.8,
  })
}

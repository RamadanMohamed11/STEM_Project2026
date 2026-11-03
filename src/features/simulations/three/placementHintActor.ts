/**
 * The held tool always wins. Otherwise a valid selected actor keeps its
 * receiver highlighted even when the cursor temporarily crosses another
 * model. Hover is a fallback only when the selection is not actionable.
 */
export function preferredPlacementHintActor(
  draggingId: string | null,
  selectedId: string | null,
  hoveredId: string | null,
  selectedHasTarget: boolean,
  hoveredHasTarget: boolean,
): string | null {
  if (draggingId) return draggingId
  if (selectedId && selectedHasTarget) return selectedId
  if (hoveredId && hoveredHasTarget) return hoveredId
  return selectedId ?? hoveredId
}

/** Short, state-derived pointer instructions, never a simulation command. */
export interface MouseInteractionCoachInput {
  stepId: string | null
  selectedId: string | null
  hoveredId: string | null
  draggingId: string | null
  placementId: string | null
  placementValid: boolean | null
  sceneFeedback: string | null
  acceptedEvents: number
}

export interface MouseInteractionCoachResult {
  text: string
  tone: 'info' | 'warning'
}

export function getMouseInteractionCoach({
  stepId,
  selectedId,
  hoveredId,
  draggingId,
  placementId,
  placementValid,
  sceneFeedback,
  acceptedEvents,
}: MouseInteractionCoachInput): MouseInteractionCoachResult | null {
  if (placementId) {
    return {
      text:
        placementValid === false
          ? 'Red placement preview: move onto a clear section of the workbench. Click only when green, or cancel with Esc.'
          : `Move the ${placementId.replaceAll('-', ' ')} preview to a clear bench spot, then left-click to place.`,
      tone: placementValid === false ? 'warning' : 'info',
    }
  }
  if (
    sceneFeedback &&
    /invalid|collision|overlap|outside|cannot|blocked|too close|no free|failed/i.test(sceneFeedback)
  )
    return { text: sceneFeedback, tone: 'warning' }

  if (draggingId) {
    if (draggingId === 'stirring-rod')
      return {
        text: 'Guide the rod tip inside the beaker and draw complete circles; release to finish a stroke.',
        tone: 'info',
      }
    if (draggingId === 'spatula')
      return {
        text: 'Put the spatula tip into the NaCl jar to scoop, or release it over the weighing boat.',
        tone: 'info',
      }
    if (
      draggingId === 'water' ||
      draggingId === 'graduated-cylinder' ||
      draggingId === 'weighing-boat'
    )
      return {
        text: 'Move the vessel close to its highlighted receiver. Use its TILT handle to tip with the left mouse button.',
        tone: 'info',
      }
    return {
      text: 'Move the selected equipment to a clear location, then release the mouse.',
      tone: 'info',
    }
  }

  if (
    selectedId === 'water' ||
    selectedId === 'graduated-cylinder' ||
    selectedId === 'weighing-boat'
  )
    return {
      text: 'Drag the vessel body to move. Drag the visible TILT handle down to tip it with the left mouse button.',
      tone: 'info',
    }
  if (selectedId === 'spatula')
    return {
      text: 'Drag the spatula into the NaCl jar, then drop the loaded tip over the weighing boat.',
      tone: 'info',
    }
  if (selectedId === 'stirring-rod')
    return {
      text: 'Drag the stirring rod into the beaker and draw circular paths with the mouse.',
      tone: 'info',
    }
  if (selectedId)
    return {
      text: 'Left-drag to move the selected tool; release near a compatible highlighted target.',
      tone: 'info',
    }

  if (hoveredId)
    return {
      text: 'Left-click to select this tool, or hold the left mouse button to reposition it.',
      tone: 'info',
    }
  if (acceptedEvents <= 2 || stepId === 'place-beaker')
    return {
      text: 'Start with Inventory: click or drag an instrument onto the bench. Left-drag placed tools; drag TILT handles to pour.',
      tone: 'info',
    }
  return {
    text: 'Hover over a tool to discover its actions · drag the tool to move · drag its TILT handle to pour.',
    tone: 'info',
  }
}

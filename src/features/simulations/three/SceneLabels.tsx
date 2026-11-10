import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createStore, useStore } from 'zustand'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import { projectSceneLabel } from './labelProjection'

interface Label {
  children: ReactNode
  style?: CSSProperties
  center?: boolean
}
const makeLabels = () =>
  createStore(() => ({
    entries: {} as Record<string, Label>,
    elements: new Map<string, HTMLDivElement>(),
  }))
const Context = createContext<ReturnType<typeof makeLabels> | null>(null)
function useLabels() {
  const store = useContext(Context)
  if (!store) throw new Error('SceneLabel needs a SceneLabels parent.')
  return store
}
function LabelLayer() {
  const store = useLabels()
  const entries = useStore(store, (state) => state.entries)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" data-scene-label-layer>
      {Object.entries(entries).map(([id, label]) => (
        <div
          key={id}
          data-scene-label
          ref={(element) => {
            if (element) store.getState().elements.set(id, element)
            else store.getState().elements.delete(id)
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              ...(label.center ? { transform: 'translate(-50%, -50%)' } : {}),
              ...label.style,
            }}
          >
            {label.children}
          </div>
        </div>
      ))}
    </div>
  )
}

/** One DOM overlay in the application's existing React root; Canvas bridges this context. */
export function SceneLabels({ children }: { children: ReactNode }) {
  const [store] = useState(makeLabels)
  return (
    <Context.Provider value={store}>
      <div className="relative size-full">
        {children}
        <LabelLayer />
      </div>
    </Context.Provider>
  )
}

/** The supported Html subset used by our labels. No nested React roots or per-frame React state. */
export function SceneLabel({
  children,
  center,
  fullscreen,
  style,
  position,
  zIndexRange = [19, 0],
}: Label & {
  fullscreen?: boolean
  position?: ThreeElements['group']['position']
  zIndexRange?: [number, number]
}) {
  const store = useLabels(),
    id = useId()
  const group = useRef<Group>(null)
  const [point] = useState(() => new Vector3())
  useEffect(() => {
    store.setState((state) => ({
      entries: { ...state.entries, [id]: { children, center, style } },
    }))
    return () => {
      store.setState((state) => {
        const entries = { ...state.entries }
        delete entries[id]
        return { entries }
      })
    }
  }, [store, id, children, center, style])
  useFrame(({ camera, size }) => {
    const element = store.getState().elements.get(id)
    if (!element || !group.current) return
    if (fullscreen) {
      Object.assign(element.style, {
        visibility: 'visible',
        width: `${size.width}px`,
        height: `${size.height}px`,
      })
      return
    }
    group.current.updateWorldMatrix(true, false)
    group.current.getWorldPosition(point)
    const projected = projectSceneLabel(point, camera, size.width, size.height, zIndexRange)
    element.style.visibility = projected.visible ? 'visible' : 'hidden'
    element.style.transform = `translate3d(${projected.x}px,${projected.y}px,0)`
    element.style.zIndex = `${projected.zIndex}`
  })
  return <group ref={group} position={position} />
}

import { useRef, useState } from 'react'
import { AlertCircle, Captions, Film, Pause, Play, RotateCcw } from 'lucide-react'
import type { EducationalStageVideo } from '../types/learningStages.ts'

export interface EducationalVideoPlayerProps {
  video: EducationalStageVideo | undefined
  stageTitle: string
}

type PlaybackStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error'

/**
 * Accessible HTML5 educational video component with native playback controls,
 * WebVTT caption tracks, poster support, loading/error handling, and an honest
 * "Video Coming Soon" state when approved demonstration footage is not yet available.
 */
export function EducationalVideoPlayer({ video, stageTitle }: EducationalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<PlaybackStatus>('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const validSources =
    video?.status === 'available'
      ? (video.sources ?? []).filter((source) => Boolean(source.src?.trim()))
      : []
  const hasAvailableVideo = Boolean(video && video.status === 'available' && validSources.length > 0)
  const tracks = video?.tracks ?? []

  const togglePlayPause = async () => {
    const element = videoRef.current
    if (!element || status === 'error') return
    try {
      if (element.paused || element.ended) {
        await element.play()
      } else {
        element.pause()
      }
    } catch {
      setStatus('error')
    }
  }

  const handleSeek = (nextSeconds: number) => {
    const element = videoRef.current
    if (!element || !Number.isFinite(nextSeconds)) return
    const clamped = Math.max(0, Math.min(nextSeconds, duration || 0))
    element.currentTime = clamped
    setCurrentTime(clamped)
  }

  const handleRetry = () => {
    const element = videoRef.current
    if (!element) return
    setStatus('loading')
    element.load()
  }

  if (!hasAvailableVideo) {
    return (
      <div
        className="flex flex-col justify-between rounded-xl border border-line bg-canvas/75 p-5"
        aria-label={`${stageTitle} demonstration video status`}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal-dark">
              <Film size={14} aria-hidden="true" />
              Video Coming Soon
            </span>
            {video?.durationLabel && (
              <span className="text-xs font-medium text-slate">{video.durationLabel}</span>
            )}
          </div>

          <h4 className="text-sm font-semibold text-navy">
            {video?.title ?? `${stageTitle} — Demonstration Video`}
          </h4>

          <p className="text-xs leading-relaxed text-slate">
            {video?.description ??
              'An approved laboratory demonstration video for this learning stage is not available yet.'}
          </p>
        </div>

        <p className="mt-4 border-t border-line/80 pt-3 text-[11px] leading-relaxed text-ink/75">
          Use the written scientific explanation, equipment overview, and ordered steps on this page
          to review the stage now.
        </p>
      </div>
    )
  }

  return (
    <div
      className="space-y-3 rounded-xl border border-line bg-white p-4 shadow-xs"
      aria-label={`${video?.title ?? stageTitle} video player`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-dark">
            Stage Demonstration Video
          </span>
          <h4 className="text-sm font-semibold text-navy">{video?.title}</h4>
        </div>
        {tracks.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-canvas px-2.5 py-1 text-[11px] font-medium text-slate">
            <Captions size={13} aria-hidden="true" />
            Captions available ({tracks.map((track) => track.label).join(', ')})
          </span>
        )}
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-navy">
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          poster={video?.posterUrl}
          aria-label={video?.title ?? `${stageTitle} demonstration video`}
          className="h-full w-full object-contain"
          onLoadStart={() => setStatus('loading')}
          onLoadedMetadata={(event) => {
            const target = event.currentTarget
            if (Number.isFinite(target.duration)) setDuration(target.duration)
            setStatus('ready')
          }}
          onCanPlay={() => {
            setStatus((current) => (current === 'playing' ? 'playing' : 'ready'))
          }}
          onPlay={() => setStatus('playing')}
          onPause={() => setStatus('paused')}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onError={() => setStatus('error')}
        >
          {validSources.map((source) => (
            <source key={source.src} src={source.src} type={source.type ?? 'video/mp4'} />
          ))}
          {tracks.map((track) => (
            <track
              key={track.id}
              kind={track.kind ?? 'captions'}
              src={track.src}
              srcLang={track.srclang}
              label={track.label}
              default={track.default}
            />
          ))}
          Your browser does not support HTML5 video playback.
        </video>

        {status === 'loading' && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute inset-x-0 top-3 flex justify-center"
          >
            <span className="rounded-full bg-navy/85 px-3 py-1 text-xs font-medium text-white shadow">
              Loading demonstration video…
            </span>
          </div>
        )}

        {status === 'error' && (
          <div
            role="alert"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-navy/95 p-4 text-center text-white"
          >
            <AlertCircle size={24} className="text-warning" aria-hidden="true" />
            <p className="max-w-md text-xs leading-relaxed">
              The demonstration video could not be loaded. You can retry loading the video or
              continue reading the written stage guide below.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-teal px-4 py-2 text-xs font-semibold text-white hover:bg-teal-dark"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Retry Video
            </button>
          </div>
        )}
      </div>

      {/* Supplemental accessible transport controls & description */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayPause}
            disabled={status === 'error'}
            aria-label={status === 'playing' ? 'Pause demonstration video' : 'Play demonstration video'}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-canvas px-3.5 py-2 text-xs font-semibold text-navy hover:bg-teal-soft/50 disabled:opacity-50"
          >
            {status === 'playing' ? (
              <>
                <Pause size={13} aria-hidden="true" />
                Pause
              </>
            ) : (
              <>
                <Play size={13} aria-hidden="true" />
                Play
              </>
            )}
          </button>

          {duration > 0 && (
            <label className="flex items-center gap-2 text-xs text-slate">
              <span className="sr-only">Seek video position</span>
              <input
                type="range"
                min={0}
                max={Math.ceil(duration)}
                value={Math.floor(currentTime)}
                onChange={(event) => handleSeek(Number(event.target.value))}
                aria-label="Seek demonstration video timeline"
                className="h-1.5 w-28 accent-teal"
              />
            </label>
          )}
        </div>

        <p className="text-xs leading-relaxed text-slate">{video?.description}</p>
      </div>
    </div>
  )
}

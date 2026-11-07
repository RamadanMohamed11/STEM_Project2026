import { useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Info,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { SafetyMetadata } from '@/types/experiment'
import {
  SAFETY_WARNING_LEVEL_META,
  type ContextualSafetyNotice,
  type SafetyRuleStatus,
  type SafetyWarningLevel,
} from '../lib/contextualSafety.ts'

const LEVEL_STYLES: Readonly<
  Record<
    SafetyWarningLevel,
    {
      container: string
      iconWrap: string
      badge: string
      title: string
      text: string
      guidance: string
      Icon: typeof Info
    }
  >
> = {
  info: {
    container: 'border-teal/30 bg-teal-soft/45',
    iconWrap: 'bg-teal-soft text-teal-dark',
    badge: 'bg-teal-soft text-teal-dark',
    title: 'text-navy',
    text: 'text-ink/85',
    guidance: 'text-teal-dark',
    Icon: Info,
  },
  caution: {
    container: 'border-amber-300/80 bg-amber-50/90',
    iconWrap: 'bg-amber-100 text-amber-900',
    badge: 'bg-amber-100 text-amber-900',
    title: 'text-navy',
    text: 'text-ink/85',
    guidance: 'text-amber-950',
    Icon: AlertTriangle,
  },
  warning: {
    container: 'border-warning/50 bg-warning-soft/75',
    iconWrap: 'bg-warning-soft text-warning-dark',
    badge: 'bg-warning-soft text-warning-dark',
    title: 'text-navy',
    text: 'text-ink/90',
    guidance: 'text-warning-dark',
    Icon: ShieldAlert,
  },
  blocked: {
    container: 'border-danger/45 bg-danger-soft/80',
    iconWrap: 'bg-danger-soft text-danger',
    badge: 'bg-danger-soft text-danger',
    title: 'text-danger',
    text: 'text-ink/90',
    guidance: 'text-navy',
    Icon: Ban,
  },
}

export interface ContextualSafetyAlertProps {
  notice: ContextualSafetyNotice
  compact?: boolean
  onDismiss?: () => void
}

/**
 * Reusable contextual safety & operational alert supporting all 4 warning levels:
 * `info`, `caution` ("Be Careful"), `warning` ("Important Safety Warning"), and
 * `blocked` ("This Action Is Not Allowed").
 */
export function ContextualSafetyAlert({
  notice,
  compact = false,
  onDismiss,
}: ContextualSafetyAlertProps) {
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  if (dismissedId === notice.id) return null

  const style = LEVEL_STYLES[notice.level]
  const meta = SAFETY_WARNING_LEVEL_META[notice.level]
  const Icon = style.Icon

  const handleDismiss = () => {
    setDismissedId(notice.id)
    onDismiss?.()
  }

  return (
    <div
      role={meta.ariaRole}
      aria-label={`${notice.badgeLabel}: ${notice.title}`}
      data-safety-level={notice.level}
      className={`rounded-xl border ${style.container} ${compact ? 'px-3.5 py-3' : 'px-4 py-4 sm:px-5'} shadow-sm transition-colors`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-0.5 flex shrink-0 items-center justify-center rounded-lg ${compact ? 'size-7' : 'size-9'} ${style.iconWrap}`}
          >
            <Icon size={compact ? 16 : 19} aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${style.badge}`}
              >
                {notice.badgeLabel}
              </span>
              {notice.code && (
                <span className="text-[11px] font-medium text-slate">
                  Rule check · {notice.code}
                </span>
              )}
            </div>
            <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold ${style.title}`}>
              {notice.title}
            </h3>
            <p className={`${compact ? 'text-xs' : 'text-sm'} leading-relaxed ${style.text}`}>
              {notice.message}
            </p>
            {notice.actionGuidance && (
              <p
                className={`pt-0.5 ${compact ? 'text-[11px]' : 'text-xs'} font-semibold leading-relaxed ${style.guidance}`}
              >
                What to do: {notice.actionGuidance}
              </p>
            )}
          </div>
        </div>
        {notice.dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={`Dismiss ${notice.badgeLabel} notice`}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate hover:bg-black/5 hover:text-navy focus-visible:outline-teal"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

export interface SafetyNoticeProps {
  safety?: SafetyMetadata
  contextualNotice?: ContextualSafetyNotice | null
  safetyRules?: readonly SafetyRuleStatus[]
  title?: string
}

export function SafetyNotice({
  safety,
  contextualNotice,
  safetyRules,
  title = 'Safety considerations',
}: SafetyNoticeProps) {
  if (!safety && !contextualNotice && (!safetyRules || safetyRules.length === 0)) {
    return null
  }

  const higherRisk = safety ? safety.level !== 'low' : false
  const Icon = higherRisk ? ShieldAlert : ShieldCheck

  return (
    <section
      aria-labelledby="lab-safety-title"
      className="space-y-4 rounded-xl border border-line bg-white px-5 py-5 shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex size-9 items-center justify-center rounded-lg ${higherRisk ? 'bg-warning-soft text-warning-dark' : 'bg-teal-soft text-teal-dark'}`}
          >
            <Icon size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-teal">
              Lab awareness
            </p>
            <h2 id="lab-safety-title" className="text-sm font-semibold text-navy">
              {title}
            </h2>
          </div>
        </div>
        {safety && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              safety.level === 'high'
                ? 'bg-danger-soft text-danger'
                : safety.level === 'moderate'
                  ? 'bg-warning-soft text-warning-dark'
                  : 'bg-teal-soft text-teal-dark'
            }`}
          >
            {safety.level === 'high'
              ? 'High Safety Level'
              : safety.level === 'moderate'
                ? 'Moderate Safety Level'
                : 'Low-Risk Educational Activity'}
          </span>
        )}
      </div>

      {contextualNotice && <ContextualSafetyAlert notice={contextualNotice} />}

      {safety?.note && <p className="text-sm leading-relaxed text-ink/80">{safety.note}</p>}

      {safety?.recommendedPpe && safety.recommendedPpe.length > 0 && (
        <p className="text-xs text-ink/75">
          <strong>Recommended protection:</strong> {safety.recommendedPpe.join(', ')}
        </p>
      )}

      {safety?.requiresSupervision && (
        <p className="text-xs font-semibold text-ink/75">
          Follow instructor supervision in a real laboratory.
        </p>
      )}

      {safetyRules && safetyRules.length > 0 && (
        <div className="border-t border-line pt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate">
            Experiment Safety Rules
          </h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2" aria-label="Experiment safety rules">
            {safetyRules.map((rule) => (
              <li
                key={rule.id}
                className="flex items-start gap-2 rounded-lg border border-line bg-canvas/55 px-3 py-2 text-xs leading-relaxed text-ink/85"
              >
                <CheckCircle2
                  size={15}
                  aria-hidden="true"
                  className={`mt-0.5 shrink-0 ${rule.acknowledged ? 'text-teal-dark' : 'text-slate'}`}
                />
                <span>{rule.instruction}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

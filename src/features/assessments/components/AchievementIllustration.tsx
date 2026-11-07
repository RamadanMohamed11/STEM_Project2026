import type { PerformanceTier } from '../lib/performanceFeedback.ts'

interface AchievementIllustrationProps {
  tier: PerformanceTier
}

export function AchievementIllustration({ tier }: AchievementIllustrationProps) {
  if (tier === 'perfect' || tier === 'excellent') {
    return (
      <div
        aria-hidden="true"
        className="animate-subtle-float flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-soft text-teal-dark sm:size-16"
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="size-9 sm:size-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Flask body */}
          <path
            d="M20 8H28M22 8V18L12 36C10.5 38.6 12.4 42 15.5 42H32.5C35.6 42 37.5 38.6 36 36L26 18V8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Liquid level */}
          <path
            d="M15 31C18 33 22 29 26 31C30 33 32 32 33 31"
            stroke="var(--color-teal)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Measurement ticks */}
          <line x1="22" y1="24" x2="26" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="28" x2="25" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          {/* Star accent */}
          <path
            d="M37 10L38.2 13.8L42 14.5L39 17L40 21L36.5 19L33 21L34 17L31 14.5L34.8 13.8L36 10H37Z"
            fill="var(--color-warning)"
          />
        </svg>
      </div>
    )
  }

  if (tier === 'good') {
    return (
      <div
        aria-hidden="true"
        className="animate-subtle-float flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-soft/70 text-teal-dark sm:size-16"
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="size-9 sm:size-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Beaker shape */}
          <path
            d="M12 10H36M14 10V36C14 39.3 16.7 42 20 42H28C31.3 42 34 39.3 34 36V10"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Spout */}
          <path d="M12 10L9 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          {/* Liquid level */}
          <path
            d="M16 26C20 28 24 24 28 26C30 27 32 26 32 26"
            stroke="var(--color-teal)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Checkmark badge */}
          <circle cx="34" cy="16" r="8" fill="var(--color-teal)" />
          <path
            d="M31 16L33 18L37 14"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }

  // Practice tier
  return (
    <div
      aria-hidden="true"
      className="animate-subtle-float flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 sm:size-16"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="size-9 sm:size-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Open book / guide */}
        <path
          d="M8 12C13 10 19 11 24 14C29 11 35 10 40 12V36C35 34 29 35 24 38C19 35 13 34 8 36V12Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="24" y1="14" x2="24" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Small test tube accent */}
        <circle cx="36" cy="18" r="6" fill="var(--color-teal-dark)" />
        <path
          d="M34 18H38M36 16V20"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

interface ScoreRingMeterProps {
  score: number
  maxScore: number
  percentage: number
}

export function ScoreRingMeter({ score, maxScore, percentage }: ScoreRingMeterProps) {
  const safePercentage = Math.max(0, Math.min(100, Math.round(percentage)))

  const radius = 54
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius
  const targetOffset = circumference - (safePercentage / 100) * circumference

  return (
    <div
      role="progressbar"
      aria-valuenow={safePercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Score: ${safePercentage}% (${score} out of ${maxScore} correct)`}
      className="relative flex size-36 shrink-0 flex-col items-center justify-center sm:size-40"
    >
      <svg
        className="size-full -rotate-90 transform"
        viewBox="0 0 128 128"
        aria-hidden="true"
      >
        <style>{`
          @keyframes scoreRingStrokeFill {
            from {
              stroke-dashoffset: ${circumference};
            }
            to {
              stroke-dashoffset: ${targetOffset};
            }
          }
          .score-ring-animated {
            animation: scoreRingStrokeFill 0.8s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
          }
          @media (prefers-reduced-motion: reduce) {
            .score-ring-animated {
              animation: none;
            }
          }
        `}</style>
        {/* Background track */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={strokeWidth}
        />
        {/* Animated progress ring */}
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--color-teal)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={targetOffset}
          className="score-ring-animated"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold tracking-tight tabular-nums text-navy sm:text-3xl">
          {safePercentage}%
        </span>
        <span className="text-xs font-semibold tabular-nums text-slate">
          {score} / {maxScore}
        </span>
      </div>
    </div>
  )
}

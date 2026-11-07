interface CelebrationEffectProps {
  active: boolean
}

export function CelebrationEffect({ active }: CelebrationEffectProps) {
  if (!active) return null

  // 8 subtle particle shapes positioned around the card header
  const particles = [
    { id: 1, cx: 20, cy: 30, r: 4, color: '#138b85', delay: '0ms' },
    { id: 2, cx: 45, cy: 15, r: 3, color: '#dc8a38', delay: '100ms' },
    { id: 3, cx: 70, cy: 25, r: 4.5, color: '#76d5cb', delay: '150ms' },
    { id: 4, cx: 90, cy: 10, r: 3.5, color: '#138b85', delay: '50ms' },
    { id: 5, cx: 115, cy: 22, r: 4, color: '#dc8a38', delay: '200ms' },
    { id: 6, cx: 140, cy: 12, r: 3, color: '#138b85', delay: '120ms' },
    { id: 7, cx: 165, cy: 28, r: 4.5, color: '#76d5cb', delay: '80ms' },
    { id: 8, cx: 185, cy: 18, r: 3.5, color: '#dc8a38', delay: '160ms' },
  ]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-6 left-0 right-0 z-10 flex justify-center motion-reduce:hidden"
    >
      <svg
        className="h-16 w-64 overflow-visible"
        viewBox="0 0 200 50"
      >
        <style>{`
          @keyframes subtleFloatUp {
            0% {
              opacity: 0;
              transform: translateY(10px) scale(0.6);
            }
            30% {
              opacity: 0.9;
              transform: translateY(-4px) scale(1.1);
            }
            100% {
              opacity: 0;
              transform: translateY(-22px) scale(0.8);
            }
          }
          .particle-item {
            animation: subtleFloatUp 1.3s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
          }
          @media (prefers-reduced-motion: reduce) {
            .particle-item {
              animation: none;
              opacity: 0;
            }
          }
        `}</style>
        {particles.map((p) => (
          <circle
            key={p.id}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill={p.color}
            className="particle-item"
            style={{ animationDelay: p.delay }}
          />
        ))}
      </svg>
    </div>
  )
}

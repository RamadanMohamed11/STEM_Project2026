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
              transform: translateY(12px) scale(0.5) rotate(-15deg);
            }
            30% {
              opacity: 1;
              transform: translateY(-4px) scale(1.15) rotate(5deg);
            }
            70% {
              opacity: 0.85;
              transform: translateY(-16px) scale(1) rotate(-8deg);
            }
            100% {
              opacity: 0;
              transform: translateY(-32px) scale(0.7) rotate(20deg);
            }
          }
          .particle-item {
            animation: subtleFloatUp 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
        {/* Celebration Stars */}
        <path
          d="M55 20 L56.5 24 L60.5 25 L57.5 27.5 L58.5 31.5 L55 29.5 L51.5 31.5 L52.5 27.5 L49.5 25 L53.5 24 Z"
          fill="#fbbf24"
          className="particle-item"
          style={{ animationDelay: '250ms', transformOrigin: '55px 25px' }}
        />
        <path
          d="M145 22 L146.5 25.5 L150 26.5 L147.5 28.5 L148.5 32 L145 30.5 L141.5 32 L142.5 28.5 L140 26.5 L143.5 25.5 Z"
          fill="#76d5cb"
          className="particle-item"
          style={{ animationDelay: '180ms', transformOrigin: '145px 26px' }}
        />
      </svg>
    </div>
  )
}

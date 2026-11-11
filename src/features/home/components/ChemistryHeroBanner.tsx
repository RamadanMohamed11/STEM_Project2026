import { Atom, Sparkles } from 'lucide-react'

export function ChemistryHeroBanner() {
  return (
    <div
      role="img"
      aria-label="Interactive chemistry laboratory visualization showing glassware, solutions, and molecular structures"
      className="relative flex h-full min-h-[320px] w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0d1b2a] via-[#1b3a6b] to-[#0d1b2a] p-5 text-white sm:min-h-[380px] sm:p-7 lg:min-h-[460px] lg:p-8"
    >
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute -left-20 -top-20 size-60 rounded-full bg-teal/15 blur-3xl animate-pulse-glow" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 size-72 rounded-full bg-teal-light/10 blur-3xl animate-subtle-float-slow" aria-hidden="true" />

      {/* Top Header Information in Banner */}
      <div className="relative z-10 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-light/25 bg-teal/15 px-3 py-1 text-teal-light backdrop-blur-sm shadow-[0_0_12px_rgba(118,213,203,0.15)] transition-all duration-300 hover:border-teal-light/40 hover:bg-teal/25">
          <Atom size={13} className="text-teal-light animate-spin-slow" aria-hidden="true" />
          Interactive Chemistry
        </span>
        <span className="font-mono text-[10px] text-white/50">SIMULATION LAB</span>
      </div>

      {/* Main Chemistry Illustration SVG */}
      <svg
        viewBox="0 0 540 380"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full select-none"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <defs>
          {/* Subtle Grid */}
          <pattern id="chemGrid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="0.8" />
          </pattern>

          {/* Liquid Gradient */}
          <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a8c5e0" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#1b3a6b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0d1b2a" stopOpacity="0.9" />
          </linearGradient>

          {/* Amber Solute Gradient */}
          <linearGradient id="amberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.85" />
          </linearGradient>

          {/* Glass Highlight */}
          <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
          </linearGradient>

          {/* Radial Glow */}
          <radialGradient id="glow" cx="50%" cy="55%" r="45%">
            <stop offset="0%" stopColor="#1b3a6b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1b3a6b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background grid & subtle glow */}
        <rect width="540" height="380" fill="url(#chemGrid)" />
        <circle cx="270" cy="220" r="180" fill="url(#glow)" className="animate-pulse-glow" style={{ transformOrigin: '270px 220px' }} />

        {/* Ambient floating chemical ions/sparkles in background */}
        <g opacity="0.6">
          <circle cx="95" cy="85" r="2" fill="#a8c5e0" className="animate-float-particle" style={{ animationDelay: '0s' }} />
          <circle cx="165" cy="120" r="1.5" fill="#fbbf24" className="animate-float-particle-slow" style={{ animationDelay: '1s' }} />
          <circle cx="340" cy="90" r="2.5" fill="#a8c5e0" className="animate-float-particle" style={{ animationDelay: '2s' }} />
          <circle cx="485" cy="105" r="1.8" fill="#fbbf24" className="animate-float-particle-slow" style={{ animationDelay: '1.5s' }} />
          <circle cx="495" cy="230" r="2" fill="#a8c5e0" className="animate-float-particle" style={{ animationDelay: '3s' }} />
          <circle cx="50" cy="260" r="1.5" fill="#a8c5e0" className="animate-float-particle-slow" style={{ animationDelay: '2.5s' }} />
        </g>

        {/* Workbench Bench Line */}
        <line x1="30" y1="315" x2="510" y2="315" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.5" />
        <line x1="60" y1="318" x2="480" y2="318" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1" />

        {/* Molecular Structure (Top Right) */}
        <g opacity="0.75" className="transition-opacity hover:opacity-100">
          {/* Hexagon 1 */}
          <polygon
            points="420,80 445,95 445,125 420,140 395,125 395,95"
            stroke="#a8c5e0"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            fill="none"
            opacity="0.6"
          />
          {/* Hexagon 2 connected */}
          <polygon
            points="445,125 470,140 470,170 445,185 420,170 420,140"
            stroke="#a8c5e0"
            strokeWidth="1.5"
            fill="none"
            opacity="0.45"
          />
          {/* Atomic Nodes */}
          <circle cx="420" cy="80" r="4.5" fill="#a8c5e0" />
          <circle cx="445" cy="95" r="3.5" fill="#ffffff" opacity="0.8" />
          <circle cx="445" cy="125" r="4.5" fill="#a8c5e0" />
          <circle cx="420" cy="140" r="3.5" fill="#ffffff" opacity="0.8" />
          <circle cx="395" cy="125" r="4.5" fill="#a8c5e0" />
          <circle cx="395" cy="95" r="3.5" fill="#ffffff" opacity="0.8" />
          <circle cx="470" cy="140" r="3.5" fill="#a8c5e0" />
          <circle cx="470" cy="170" r="4.5" fill="#fbbf24" />
          <circle cx="445" cy="185" r="3.5" fill="#a8c5e0" />
          <circle cx="420" cy="170" r="4" fill="#ffffff" opacity="0.9" />

          {/* Chemical labels near molecule */}
          <text x="478" y="174" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="600">
            Na⁺
          </text>
          <text x="375" y="93" fill="#a8c5e0" fontSize="10" fontFamily="monospace" fontWeight="600">
            Cl⁻
          </text>
        </g>

        {/* 1. LEFT APPARATUS: Glass Beaker with Solution & Stirring Rod */}
        <g id="beakerGroup" transform="translate(70, 160)" className="transition-transform duration-300 ease-out hover:-translate-y-1 cursor-pointer">
          {/* Beaker Body */}
          <path
            d="M20 20 L20 140 Q20 152 32 152 L98 152 Q110 152 110 140 L110 20"
            stroke="#e8f1fa"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
          {/* Spout on Left */}
          <path d="M14 20 L20 20" stroke="#e8f1fa" strokeWidth="2.5" strokeLinecap="round" />

          {/* Beaker Liquid */}
          <path
            d="M22 75 Q65 72 108 75 L108 140 Q108 150 98 150 L32 150 Q22 150 22 140 Z"
            fill="url(#liquidGrad)"
            opacity="0.65"
          />

          {/* Liquid Meniscus Highlight */}
          <path d="M22 75 Q65 71 108 75" stroke="#a8c5e0" strokeWidth="2" fill="none" opacity="0.9" />

          {/* Graduation markings on beaker */}
          <line x1="94" y1="50" x2="104" y2="50" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.2" />
          <line x1="88" y1="70" x2="104" y2="70" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.2" />
          <line x1="94" y1="90" x2="104" y2="90" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.2" />
          <line x1="86" y1="110" x2="104" y2="110" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.2" />
          <text x="70" y="73" fill="#ffffff" fillOpacity="0.6" fontSize="8" fontFamily="monospace">
            150
          </text>
          <text x="68" y="113" fill="#ffffff" fillOpacity="0.6" fontSize="8" fontFamily="monospace">
            100
          </text>

          {/* Glass Stirring Rod */}
          <line
            x1="45"
            y1="-25"
            x2="90"
            y2="148"
            stroke="#ffffff"
            strokeOpacity="0.8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="45"
            y1="-25"
            x2="90"
            y2="148"
            stroke="#a8c5e0"
            strokeOpacity="0.5"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Dissolved Solute Particles in Beaker */}
          <circle cx="55" cy="115" r="2.5" fill="#fbbf24" opacity="0.85" className="animate-float-particle" style={{ animationDelay: '0.5s' }} />
          <circle cx="75" cy="130" r="2" fill="#fbbf24" opacity="0.75" className="animate-float-particle-slow" style={{ animationDelay: '1.5s' }} />
          <circle cx="45" cy="138" r="2" fill="#fbbf24" opacity="0.7" className="animate-float-particle" style={{ animationDelay: '2.2s' }} />
          <circle cx="85" cy="100" r="1.5" fill="#fbbf24" opacity="0.8" className="animate-float-particle-slow" style={{ animationDelay: '0.8s' }} />
        </g>

        {/* Reaction Vapor Sparkles rising from flask neck */}
        <g opacity="0.85">
          <circle cx="268" cy="98" r="2" fill="#a8c5e0" className="animate-bubble-rise" style={{ animationDelay: '0.2s', animationDuration: '3s' }} />
          <circle cx="274" cy="78" r="1.5" fill="#fbbf24" className="animate-bubble-rise" style={{ animationDelay: '1.2s', animationDuration: '2.6s' }} />
          <circle cx="265" cy="58" r="2.2" fill="#a8c5e0" className="animate-bubble-rise" style={{ animationDelay: '2.1s', animationDuration: '3.4s' }} />
          <path d="M272 45 L273 48 L276 49 L273 50 L272 53 L271 50 L268 49 L271 48 Z" fill="#a8c5e0" className="animate-sparkle-twinkle" style={{ transformOrigin: '272px 49px' }} />
        </g>

        {/* 2. CENTER APPARATUS: Erlenmeyer Conical Flask */}
        <g id="flaskGroup" transform="translate(205, 95)" className="transition-transform duration-300 ease-out hover:-translate-y-1 cursor-pointer">
          {/* Flask Neck & Outer Shell */}
          <path
            d="M50 25 H80 M56 25 V75 L12 185 Q4 205 28 205 H102 Q126 205 118 185 L74 75 V25"
            stroke="#e8f1fa"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.95"
          />

          {/* Flask Rim Lip */}
          <ellipse cx="65" cy="25" rx="15" ry="3.5" stroke="#e8f1fa" strokeWidth="2.5" fill="none" opacity="0.9" />

          {/* Liquid Fill with Wave */}
          <path
            d="M34 140 Q65 132 96 140 L115 186 Q122 203 102 203 H28 Q8 203 15 186 Z"
            fill="url(#liquidGrad)"
            opacity="0.8"
          />

          {/* Liquid Surface Meniscus Line */}
          <path d="M34 140 Q65 131 96 140" stroke="#a8c5e0" strokeWidth="2.5" fill="none" opacity="0.95" />

          {/* Glass Highlights / Reflection */}
          <path
            d="M58 35 V75 L30 145"
            stroke="#ffffff"
            strokeOpacity="0.25"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M24 185 Q18 198 32 198 H45"
            stroke="#ffffff"
            strokeOpacity="0.3"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Volumetric Markings */}
          <line x1="80" y1="150" x2="95" y2="150" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.2" />
          <line x1="77" y1="163" x2="99" y2="163" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.2" />
          <line x1="74" y1="176" x2="103" y2="176" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.2" />
          <text x="52" y="166" fill="#ffffff" fillOpacity="0.65" fontSize="8" fontFamily="monospace">
            200 mL
          </text>

          {/* Bubbles rising in reaction */}
          <circle
            cx="50"
            cy="180"
            r="3.5"
            stroke="#cde1f2"
            strokeWidth="1"
            fill="#a8c5e0"
            fillOpacity="0.4"
            className="animate-bubble-rise"
            style={{ animationDelay: '0s', animationDuration: '3.2s' }}
          />
          <circle
            cx="68"
            cy="165"
            r="4"
            stroke="#cde1f2"
            strokeWidth="1.2"
            fill="#a8c5e0"
            fillOpacity="0.4"
            className="animate-bubble-rise"
            style={{ animationDelay: '0.8s', animationDuration: '2.8s' }}
          />
          <circle
            cx="58"
            cy="150"
            r="2.5"
            stroke="#cde1f2"
            strokeWidth="1"
            fill="#a8c5e0"
            fillOpacity="0.5"
            className="animate-bubble-rise"
            style={{ animationDelay: '1.6s', animationDuration: '3.5s' }}
          />
          <circle
            cx="78"
            cy="178"
            r="2"
            stroke="#cde1f2"
            strokeWidth="0.8"
            fill="#a8c5e0"
            fillOpacity="0.4"
            className="animate-bubble-rise"
            style={{ animationDelay: '2.3s', animationDuration: '2.7s' }}
          />
          <circle
            cx="64"
            cy="130"
            r="2"
            stroke="#cde1f2"
            strokeWidth="0.8"
            fill="#a8c5e0"
            fillOpacity="0.4"
            className="animate-bubble-rise"
            style={{ animationDelay: '0.4s', animationDuration: '3.1s' }}
          />
        </g>

        {/* 3. RIGHT APPARATUS: Precision Graduated Cylinder */}
        <g id="cylinderGroup" transform="translate(370, 130)" className="transition-transform duration-300 ease-out hover:-translate-y-1 cursor-pointer">
          {/* Heavy Base */}
          <path
            d="M8 180 L22 170 H48 L62 180 Z"
            stroke="#e8f1fa"
            strokeWidth="2.2"
            fill="#1b3a6b"
            fillOpacity="0.7"
            opacity="0.85"
          />

          {/* Cylinder Column */}
          <rect
            x="24"
            y="20"
            width="22"
            height="150"
            rx="2"
            stroke="#e8f1fa"
            strokeWidth="2.2"
            fill="none"
            opacity="0.9"
          />

          {/* Spout Lip at top */}
          <path d="M22 20 L24 20 M46 20 L50 18" stroke="#e8f1fa" strokeWidth="2.2" strokeLinecap="round" />

          {/* Cylinder Liquid Column (e.g. 100 mL calibrated) */}
          <rect
            x="25.5"
            y="65"
            width="19"
            height="103"
            fill="url(#amberGrad)"
            opacity="0.75"
          />
          {/* Meniscus */}
          <ellipse cx="35" cy="65" rx="9.5" ry="2" fill="#fbbf24" opacity="0.9" />

          {/* Graduation ticks */}
          <line x1="24" y1="40" x2="33" y2="40" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" />
          <line x1="24" y1="50" x2="30" y2="50" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="24" y1="65" x2="35" y2="65" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="1.2" />
          <line x1="24" y1="80" x2="30" y2="80" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="24" y1="95" x2="33" y2="95" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" />
          <line x1="24" y1="110" x2="30" y2="110" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="24" y1="125" x2="33" y2="125" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" />
          <line x1="24" y1="140" x2="30" y2="140" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" />

          {/* Text mark */}
          <text x="38" y="68" fill="#ffffff" fillOpacity="0.85" fontSize="7" fontFamily="monospace" fontWeight="bold">
            100mL
          </text>
        </g>

        {/* Floating Science Measurement Badge (Center-Left) */}
        <g transform="translate(140, 60)" opacity="0.95" className="animate-subtle-float transition-all duration-300 hover:scale-105 cursor-pointer">
          <rect
            x="0"
            y="0"
            width="106"
            height="32"
            rx="8"
            fill="#0d1b2a"
            fillOpacity="0.9"
            stroke="#a8c5e0"
            strokeOpacity="0.45"
            strokeWidth="1.2"
          />
          <circle cx="16" cy="16" r="4" fill="#1b3a6b" className="animate-pulse" />
          <text x="27" y="15" fill="#ffffff" fontSize="9" fontWeight="600">
            H₂O + NaCl
          </text>
          <text x="27" y="24" fill="#a8c5e0" fontSize="7.5" fontFamily="monospace">
            Solute: 5.0 g
          </text>
        </g>
      </svg>

      {/* Bottom Status & Feature Chips */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/12 pt-4 text-xs">
        <div className="flex items-center gap-2 text-white/80">
          <span className="flex size-2 rounded-full bg-teal-light animate-pulse" aria-hidden="true" />
          <span>Real-time chemical reactions</span>
        </div>
        <div className="inline-flex items-center gap-1.5 font-medium text-white/60">
          <Sparkles size={13} className="text-teal-light" aria-hidden="true" />
          <span>Calibrated laboratory tools</span>
        </div>
      </div>
    </div>
  )
}

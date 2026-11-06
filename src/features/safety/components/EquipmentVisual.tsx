import type { EquipmentGuideVisualKey } from '../types/equipmentGuide'

interface EquipmentVisualProps {
  visualKey: EquipmentGuideVisualKey
  className?: string
}

export function EquipmentVisual({ visualKey, className = 'size-24' }: EquipmentVisualProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-canvas p-2 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 160 160"
        className="h-full w-full select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {visualKey === 'beaker' && (
          <g>
            {/* Liquid Fill */}
            <path
              d="M48 85 H112 V128 C112 133 108 136 102 136 H58 C52 136 48 133 48 128 Z"
              fill="#138b85"
              fillOpacity="0.25"
            />
            <path
              d="M48 85 C64 88 96 88 112 85"
              stroke="#138b85"
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />
            {/* Beaker Outline */}
            <path
              d="M40 32 H46 L48 40 V128 C48 134 52 138 58 138 H102 C108 138 112 134 112 128 V40 H118"
              stroke="#162635"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Graduation Markings */}
            <path d="M100 55 H110" stroke="#162635" strokeWidth="2" strokeOpacity="0.6" />
            <path d="M104 70 H110" stroke="#162635" strokeWidth="1.5" strokeOpacity="0.6" />
            <path d="M98 85 H110" stroke="#162635" strokeWidth="2" strokeOpacity="0.6" />
            <path d="M104 100 H110" stroke="#162635" strokeWidth="1.5" strokeOpacity="0.6" />
            <path d="M98 115 H110" stroke="#162635" strokeWidth="2" strokeOpacity="0.6" />
            {/* Highlight */}
            <path
              d="M54 48 V124"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.9"
            />
          </g>
        )}

        {visualKey === 'test-tube' && (
          <g>
            {/* Liquid Fill */}
            <path
              d="M68 90 H92 V124 C92 131 87 136 80 136 C73 136 68 131 68 124 Z"
              fill="#138b85"
              fillOpacity="0.3"
            />
            <path
              d="M68 90 C72 92 88 92 92 90"
              stroke="#138b85"
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />
            {/* Test Tube Body */}
            <path
              d="M66 26 H94 M68 26 V124 C68 131 73 136 80 136 C87 136 92 131 92 124 V26"
              stroke="#162635"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Glass Rim */}
            <ellipse cx="80" cy="26" rx="14" ry="3" stroke="#162635" strokeWidth="2" />
            {/* Reaction Bubbles */}
            <circle cx="76" cy="115" r="2.5" fill="#138b85" fillOpacity="0.7" />
            <circle cx="83" cy="105" r="2" fill="#138b85" fillOpacity="0.7" />
            <circle cx="78" cy="98" r="1.5" fill="#138b85" fillOpacity="0.7" />
            {/* Highlight */}
            <path
              d="M72 36 V120"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.9"
            />
          </g>
        )}

        {visualKey === 'graduated-cylinder' && (
          <g>
            {/* Base */}
            <path
              d="M52 142 H108 L102 132 H58 Z"
              fill="#cdd7dd"
              stroke="#162635"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Liquid Fill */}
            <path
              d="M68 75 H92 V132 H68 Z"
              fill="#138b85"
              fillOpacity="0.25"
            />
            {/* Meniscus Curve */}
            <path
              d="M68 75 C74 78 86 78 92 75"
              stroke="#0d6f6a"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Cylinder Tube */}
            <path
              d="M64 24 H68 M68 24 V132 M92 24 V132 M92 24 H96"
              stroke="#162635"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Bumper Ring (Yellow/Amber Guard) */}
            <rect
              x="62"
              y="38"
              width="36"
              height="8"
              rx="3"
              fill="#dc8a38"
              stroke="#995312"
              strokeWidth="1.5"
            />
            {/* Graduation Marks */}
            <path d="M84 55 H92" stroke="#162635" strokeWidth="1.5" />
            <path d="M80 65 H92" stroke="#162635" strokeWidth="2" />
            <path d="M84 75 H92" stroke="#162635" strokeWidth="1.5" />
            <path d="M80 85 H92" stroke="#162635" strokeWidth="2" />
            <path d="M84 95 H92" stroke="#162635" strokeWidth="1.5" />
            <path d="M80 105 H92" stroke="#162635" strokeWidth="2" />
            <path d="M84 115 H92" stroke="#162635" strokeWidth="1.5" />
            <path d="M80 125 H92" stroke="#162635" strokeWidth="2" />
            {/* Glass Highlight */}
            <path
              d="M72 48 V126"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeOpacity="0.9"
            />
          </g>
        )}

        {visualKey === 'stirring-rod' && (
          <g>
            {/* Beaker outline in background to show scale and context */}
            <path
              d="M50 70 V132 C50 136 54 139 59 139 H101 C106 139 110 136 110 132 V70"
              stroke="#cdd7dd"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Liquid level */}
            <path
              d="M50 95 H110 V132 C110 136 106 139 101 139 H59 C54 139 50 136 50 132 Z"
              fill="#e4f4f1"
              fillOpacity="0.6"
            />
            {/* Glass Stirring Rod placed diagonally */}
            <rect
              x="76"
              y="18"
              width="8"
              height="124"
              rx="4"
              transform="rotate(18 80 80)"
              fill="#e4f4f1"
              stroke="#162635"
              strokeWidth="2.5"
            />
            {/* Highlight along rod */}
            <line
              x1="78"
              y1="22"
              x2="78"
              y2="138"
              transform="rotate(18 80 80)"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Subtle motion ripples */}
            <path
              d="M68 116 C76 113 88 119 96 115"
              stroke="#138b85"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity="0.7"
            />
          </g>
        )}

        {visualKey === 'digital-balance' && (
          <g>
            {/* Weighing Pan */}
            <ellipse cx="80" cy="62" rx="36" ry="9" fill="#edf1f3" stroke="#546572" strokeWidth="2" />
            <path d="M44 62 V66 C44 71 60 75 80 75 C100 75 116 71 116 66 V62" fill="#cdd7dd" stroke="#546572" strokeWidth="1.5" />
            {/* Pan Pillar */}
            <rect x="76" y="74" width="8" height="12" fill="#546572" />
            {/* Balance Housing Body */}
            <rect
              x="32"
              y="84"
              width="96"
              height="50"
              rx="6"
              fill="#ffffff"
              stroke="#162635"
              strokeWidth="2.5"
            />
            {/* LCD Screen */}
            <rect
              x="42"
              y="94"
              width="50"
              height="24"
              rx="3"
              fill="#162635"
              stroke="#546572"
              strokeWidth="1"
            />
            {/* Digital Display Text */}
            <text
              x="67"
              y="110"
              fill="#76d5cb"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              0.00 g
            </text>
            {/* Tare Button */}
            <circle cx="106" cy="100" r="6" fill="#138b85" />
            <text x="106" y="102" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">
              T
            </text>
            {/* Power Button */}
            <circle cx="106" cy="116" r="5" fill="#edf1f3" stroke="#546572" strokeWidth="1" />
            {/* Level feet */}
            <rect x="38" y="134" width="10" height="4" rx="1" fill="#162635" />
            <rect x="112" y="134" width="10" height="4" rx="1" fill="#162635" />
          </g>
        )}

        {visualKey === 'spatula' && (
          <g>
            {/* Spatula placed at an angle */}
            {/* Flat blade end */}
            <path
              d="M26 130 L45 115 L52 122 L33 137 Z"
              fill="#cdd7dd"
              stroke="#162635"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Central rod shaft */}
            <path
              d="M48 118 L114 54"
              stroke="#162635"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M48 118 L114 54"
              stroke="#edf1f3"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Scoop spoon end */}
            <path
              d="M110 58 C115 52 130 32 138 28 C140 34 132 50 120 54 Z"
              fill="#cdd7dd"
              stroke="#162635"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Specimen powder crystals being scooped */}
            <circle cx="130" cy="36" r="2" fill="#138b85" />
            <circle cx="127" cy="40" r="1.5" fill="#138b85" />
            <circle cx="133" cy="41" r="1.5" fill="#138b85" />
            {/* Light reflection */}
            <path
              d="M60 106 L104 64"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
          </g>
        )}

        {visualKey === 'dropper-pipette' && (
          <g>
            {/* Rubber bulb on top */}
            <path
              d="M72 48 C64 42 64 24 80 24 C96 24 96 42 88 48 Z"
              fill="#dc8a38"
              stroke="#995312"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Glass collar */}
            <rect x="74" y="48" width="12" height="4" rx="1" fill="#cdd7dd" stroke="#162635" strokeWidth="1.5" />
            {/* Glass body */}
            <path
              d="M75 52 V108 L78 126 H82 L85 108 V52 Z"
              fill="#e4f4f1"
              fillOpacity="0.4"
              stroke="#162635"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Liquid inside pipette */}
            <path
              d="M76 80 V108 L78 126 H82 L84 108 V80 Z"
              fill="#138b85"
              fillOpacity="0.3"
            />
            {/* Highlight */}
            <path
              d="M77 56 V104"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity="0.9"
            />
            {/* Droplet hanging/forming */}
            <path
              d="M80 132 C78 135 77 138 77 141 C77 143 78.5 145 80 145 C81.5 145 83 143 83 141 C83 138 82 135 80 132 Z"
              fill="#138b85"
              stroke="#0d6f6a"
              strokeWidth="1.2"
            />
          </g>
        )}

        {visualKey === 'chemical-container' && (
          <g>
            {/* Cap */}
            <rect
              x="66"
              y="28"
              width="28"
              height="14"
              rx="2"
              fill="#162635"
              stroke="#162635"
              strokeWidth="1.5"
            />
            {/* Bottle Neck */}
            <rect x="70" y="42" width="20" height="10" fill="#edf1f3" stroke="#162635" strokeWidth="2.5" />
            {/* Bottle Body */}
            <path
              d="M70 52 L54 66 C50 70 50 74 50 80 V128 C50 134 54 138 60 138 H100 C106 138 110 134 110 128 V80 C110 74 110 70 106 66 L90 52 Z"
              fill="#edf1f3"
              stroke="#162635"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Chemical Label */}
            <rect
              x="58"
              y="82"
              width="44"
              height="42"
              rx="2"
              fill="#ffffff"
              stroke="#cdd7dd"
              strokeWidth="1.2"
            />
            {/* Label text indicator lines */}
            <rect x="62" y="88" width="24" height="3" rx="1" fill="#138b85" />
            <rect x="62" y="94" width="36" height="2" rx="0.5" fill="#546572" />
            <rect x="62" y="98" width="30" height="2" rx="0.5" fill="#546572" />
            {/* Mini Hazard Diamond */}
            <rect
              x="76"
              y="108"
              width="9"
              height="9"
              transform="rotate(45 80.5 112.5)"
              fill="#fff2e3"
              stroke="#dc8a38"
              strokeWidth="1"
            />
            {/* Bottle glass highlight */}
            <path
              d="M56 78 V126"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.9"
            />
          </g>
        )}
      </svg>
    </div>
  )
}

import type { ToolVisualKey } from '../types/toolsAndMaterials'

interface ToolAndMaterialVisualProps {
  visual: ToolVisualKey
  className?: string
  altText?: string
}

export function ToolAndMaterialVisual({
  visual,
  className = 'size-20',
  altText,
}: ToolAndMaterialVisualProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-canvas p-2 ${className}`}
      role="img"
      aria-label={altText ?? `${visual} illustration`}
    >
      <svg
        viewBox="0 0 160 160"
        className="h-full w-full select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {visual === 'beaker' && (
          <g>
            {/* Liquid Fill */}
            <path
              d="M48 85 H112 V128 C112 133 108 136 102 136 H58 C52 136 48 133 48 128 Z"
              fill="#1b3a6b"
              fillOpacity="0.25"
            />
            <path
              d="M48 85 C64 88 96 88 112 85"
              stroke="#1b3a6b"
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />
            {/* Beaker Outline */}
            <path
              d="M40 32 H46 L48 40 V128 C48 134 52 138 58 138 H102 C108 138 112 134 112 128 V40 H118"
              stroke="#0d1b2a"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Graduation Markings */}
            <path d="M100 55 H110" stroke="#0d1b2a" strokeWidth="2" strokeOpacity="0.6" />
            <path d="M104 70 H110" stroke="#0d1b2a" strokeWidth="1.5" strokeOpacity="0.6" />
            <path d="M98 85 H110" stroke="#0d1b2a" strokeWidth="2" strokeOpacity="0.6" />
            <path d="M104 100 H110" stroke="#0d1b2a" strokeWidth="1.5" strokeOpacity="0.6" />
            <path d="M98 115 H110" stroke="#0d1b2a" strokeWidth="2" strokeOpacity="0.6" />
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

        {visual === 'graduated-cylinder' && (
          <g>
            {/* Base */}
            <path
              d="M52 142 H108 L102 132 H58 Z"
              fill="#a8c5e0"
              stroke="#0d1b2a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Liquid Fill */}
            <path d="M68 75 H92 V132 H68 Z" fill="#1b3a6b" fillOpacity="0.25" />
            {/* Meniscus Curve */}
            <path
              d="M68 75 C74 78 86 78 92 75"
              stroke="#0d1b2a"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Cylinder Tube */}
            <path
              d="M64 24 H68 M68 24 V132 M92 24 V132 M92 24 H96"
              stroke="#0d1b2a"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Bumper Guard */}
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
            <path d="M84 55 H92" stroke="#0d1b2a" strokeWidth="1.5" />
            <path d="M80 65 H92" stroke="#0d1b2a" strokeWidth="2" />
            <path d="M84 75 H92" stroke="#0d1b2a" strokeWidth="1.5" />
            <path d="M80 85 H92" stroke="#0d1b2a" strokeWidth="2" />
            <path d="M84 95 H92" stroke="#0d1b2a" strokeWidth="1.5" />
            <path d="M80 105 H92" stroke="#0d1b2a" strokeWidth="2" />
            <path d="M84 115 H92" stroke="#0d1b2a" strokeWidth="1.5" />
            <path d="M80 125 H92" stroke="#0d1b2a" strokeWidth="2" />
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

        {visual === 'stirring-rod' && (
          <g>
            {/* Beaker outline context */}
            <path
              d="M50 70 V132 C50 136 54 139 59 139 H101 C106 139 110 136 110 132 V70"
              stroke="#a8c5e0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Liquid level */}
            <path
              d="M50 95 H110 V132 C110 136 106 139 101 139 H59 C54 139 50 136 50 132 Z"
              fill="#e8f1fa"
              fillOpacity="0.6"
            />
            {/* Glass Stirring Rod */}
            <rect
              x="76"
              y="18"
              width="8"
              height="124"
              rx="4"
              transform="rotate(18 80 80)"
              fill="#e8f1fa"
              stroke="#0d1b2a"
              strokeWidth="2.5"
            />
            {/* Highlight */}
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
            {/* Motion ripples */}
            <path
              d="M68 116 C76 113 88 119 96 115"
              stroke="#1b3a6b"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity="0.7"
            />
          </g>
        )}

        {visual === 'digital-balance' && (
          <g>
            {/* Weighing Pan */}
            <ellipse
              cx="80"
              cy="62"
              rx="36"
              ry="9"
              fill="#cde1f2"
              stroke="#3d5a80"
              strokeWidth="2"
            />
            <path
              d="M44 62 V66 C44 71 60 75 80 75 C100 75 116 71 116 66 V62"
              fill="#a8c5e0"
              stroke="#3d5a80"
              strokeWidth="1.5"
            />
            <rect x="76" y="74" width="8" height="12" fill="#3d5a80" />
            {/* Balance Housing Body */}
            <rect
              x="32"
              y="84"
              width="96"
              height="50"
              rx="6"
              fill="#ffffff"
              stroke="#0d1b2a"
              strokeWidth="2.5"
            />
            {/* LCD Screen */}
            <rect
              x="42"
              y="94"
              width="50"
              height="24"
              rx="3"
              fill="#0d1b2a"
              stroke="#3d5a80"
              strokeWidth="1"
            />
            {/* Display Text */}
            <text
              x="67"
              y="110"
              fill="#a8c5e0"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              0.00 g
            </text>
            {/* Tare Button */}
            <circle cx="106" cy="100" r="6" fill="#1b3a6b" />
            <text
              x="106"
              y="102"
              fill="#ffffff"
              fontSize="4.5"
              fontWeight="bold"
              textAnchor="middle"
            >
              T
            </text>
            <circle cx="106" cy="116" r="5" fill="#cde1f2" stroke="#3d5a80" strokeWidth="1" />
            {/* Feet */}
            <rect x="38" y="134" width="10" height="4" rx="1" fill="#0d1b2a" />
            <rect x="112" y="134" width="10" height="4" rx="1" fill="#0d1b2a" />
          </g>
        )}

        {visual === 'spatula' && (
          <g>
            {/* Flat blade end */}
            <path
              d="M26 130 L45 115 L52 122 L33 137 Z"
              fill="#a8c5e0"
              stroke="#0d1b2a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Shaft */}
            <path d="M48 118 L114 54" stroke="#0d1b2a" strokeWidth="4" strokeLinecap="round" />
            <path d="M48 118 L114 54" stroke="#cde1f2" strokeWidth="2" strokeLinecap="round" />
            {/* Scoop end */}
            <path
              d="M110 58 C115 52 130 32 138 28 C140 34 132 50 120 54 Z"
              fill="#a8c5e0"
              stroke="#0d1b2a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Powder crystals */}
            <circle cx="130" cy="36" r="2" fill="#1b3a6b" />
            <circle cx="127" cy="40" r="1.5" fill="#1b3a6b" />
            <circle cx="133" cy="41" r="1.5" fill="#1b3a6b" />
            {/* Highlight */}
            <path
              d="M60 106 L104 64"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
          </g>
        )}

        {visual === 'weighing-boat' && (
          <g>
            {/* Soft Shadow */}
            <ellipse cx="80" cy="116" rx="46" ry="10" fill="#3d5a80" opacity="0.16" />
            {/* Outer dish perimeter */}
            <path
              d="M34 82 L52 108 H108 L126 82 L104 64 H56 Z"
              fill="#cde1f2"
              stroke="#0d1b2a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Inner dish cavity */}
            <path
              d="M44 84 L56 102 H104 L116 84 L100 70 H60 Z"
              fill="#ffffff"
              stroke="#3d5a80"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Salt crystal heap */}
            <path
              d="M62 96 C68 86 92 86 98 96 H62 Z"
              fill="#a8c5e0"
              stroke="#3d5a80"
              strokeWidth="1"
            />
            <circle cx="74" cy="91" r="2" fill="#1b3a6b" />
            <circle cx="82" cy="89" r="1.8" fill="#1b3a6b" />
            <circle cx="88" cy="92" r="1.5" fill="#1b3a6b" />
            <circle cx="78" cy="94" r="1.5" fill="#1b3a6b" />
            {/* Highlight */}
            <path
              d="M48 84 L58 98"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.9"
            />
          </g>
        )}

        {visual === 'water' && (
          <g>
            {/* Cap */}
            <rect
              x="68"
              y="22"
              width="24"
              height="10"
              rx="2"
              fill="#1b3a6b"
              stroke="#0d1b2a"
              strokeWidth="2"
            />
            {/* Bottle Neck */}
            <rect x="72" y="32" width="16" height="8" fill="#cde1f2" stroke="#0d1b2a" strokeWidth="2" />
            {/* Bottle Body */}
            <path
              d="M72 40 L52 54 C48 57 48 62 48 68 V126 C48 132 52 136 58 136 H102 C108 136 112 132 112 126 V68 C112 62 112 57 108 54 L88 40 Z"
              fill="#e8f1fa"
              stroke="#0d1b2a"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Water Fill Level */}
            <path
              d="M49 76 H111 V126 C111 131 107 135 101 135 H59 C53 135 49 131 49 126 Z"
              fill="#1b3a6b"
              fillOpacity="0.25"
            />
            {/* Meniscus */}
            <path d="M49 76 C65 80 95 80 111 76" stroke="#1b3a6b" strokeWidth="1.8" />
            {/* Water Droplet Badge */}
            <circle cx="80" cy="102" r="14" fill="#ffffff" stroke="#a8c5e0" strokeWidth="1.2" />
            <path
              d="M80 94 C76 99 73 103 73 106 C73 110 76 112 80 112 C84 112 87 110 87 106 C87 103 84 99 80 94 Z"
              fill="#1b3a6b"
            />
            {/* Glass Highlight */}
            <path
              d="M54 62 V124"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.9"
            />
          </g>
        )}

        {visual === 'sodium-chloride' && (
          <g>
            {/* Reagent Jar Cap */}
            <rect
              x="54"
              y="26"
              width="52"
              height="16"
              rx="3"
              fill="#0d1b2a"
              stroke="#0d1b2a"
              strokeWidth="2"
            />
            {/* Ridges on cap */}
            <path d="M64 28 V40 M74 28 V40 M86 28 V40 M96 28 V40" stroke="#3d5a80" strokeWidth="1.5" />
            {/* Jar Body */}
            <rect
              x="50"
              y="42"
              width="60"
              height="96"
              rx="4"
              fill="#cde1f2"
              stroke="#0d1b2a"
              strokeWidth="2.5"
            />
            {/* Salt Solid Content */}
            <path
              d="M52 82 H108 V134 C108 136 106 137 104 137 H56 C54 137 52 136 52 134 Z"
              fill="#ffffff"
            />
            {/* Label */}
            <rect
              x="56"
              y="60"
              width="48"
              height="44"
              rx="2"
              fill="#ffffff"
              stroke="#a8c5e0"
              strokeWidth="1.2"
            />
            <rect x="60" y="66" width="20" height="3" rx="1" fill="#1b3a6b" />
            {/* Formula Text */}
            <text
              x="80"
              y="86"
              fill="#0d1b2a"
              fontSize="12"
              fontFamily="sans-serif"
              fontWeight="bold"
              textAnchor="middle"
            >
              NaCl
            </text>
            <text
              x="80"
              y="97"
              fill="#3d5a80"
              fontSize="6"
              fontFamily="sans-serif"
              textAnchor="middle"
            >
              Sodium Chloride
            </text>
            {/* Highlight */}
            <path
              d="M54 50 V130"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.8"
            />
          </g>
        )}
      </svg>
    </div>
  )
}

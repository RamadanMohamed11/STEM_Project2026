import type { EquipmentVisual } from '@/types/laboratory'

interface LaboratoryEquipmentPreviewProps {
  visual: EquipmentVisual
  className?: string
}

/** Reusable diagram artwork used in inventory and the non-interactive reference bench. */
export function LaboratoryEquipmentPreview({
  visual,
  className = '',
}: LaboratoryEquipmentPreviewProps) {
  return (
    <svg
      viewBox="0 0 136 152"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {visual === 'beaker' && (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="68" cy="137" rx="40" ry="5" fill="#3d5a80" opacity=".14" />
          <path
            d="M27 25H109M32 25L39 131Q68 141 97 131L104 25"
            stroke="#0d1b2a"
            strokeWidth="3.2"
          />
          <path
            d="M35 80Q68 85 101 80L96 126Q68 135 40 126Z"
            fill="#cde1f2"
            fillOpacity=".48"
            stroke="#1b3a6b"
            strokeWidth="1.3"
          />
          <path d="M35 80Q68 86 101 80" stroke="#1b3a6b" strokeWidth="2" />
          <path
            d="M86 53H97M86 64H97M89 75H98M89 91H99M89 104H97"
            stroke="#3d5a80"
            strokeWidth="1.5"
          />
          <path d="M30 25L24 31" stroke="#0d1b2a" strokeWidth="2.4" />
          <path d="M46 36L50 108" stroke="white" strokeOpacity=".65" strokeWidth="3" />
        </g>
      )}
      {visual === 'graduated-cylinder' && (
        <g strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="69" cy="138" rx="38" ry="5" fill="#3d5a80" opacity=".14" />
          <path d="M55 15H83M58 15V116Q69 126 80 116V15" stroke="#0d1b2a" strokeWidth="3" />
          <path
            d="M59 66Q69 71 79 66V115Q69 123 59 115Z"
            fill="#cde1f2"
            fillOpacity=".65"
            stroke="#1b3a6b"
            strokeWidth="1.4"
          />
          <path d="M59 66Q69 71 79 66" stroke="#1b3a6b" strokeWidth="2" />
          <path
            d="M59 31H69M59 42H65M59 53H69M59 64H65M59 75H69M59 86H65M59 97H69M59 108H65"
            stroke="#3d5a80"
            strokeWidth="1.2"
          />
          <path d="M69 122V132M45 133H93" stroke="#0d1b2a" strokeWidth="3.5" />
          <path d="M63 23V56" stroke="white" strokeOpacity=".65" strokeWidth="2" />
        </g>
      )}
      {visual === 'stirring-rod' && (
        <g strokeLinecap="round">
          <ellipse cx="66" cy="138" rx="39" ry="5" fill="#3d5a80" opacity=".12" />
          <path d="M45 127L91 20" stroke="#3d5a80" strokeWidth="9" />
          <path d="M45 127L91 20" stroke="#a8c5e0" strokeWidth="5" />
          <path d="M49 116L88 24" stroke="white" strokeOpacity=".88" strokeWidth="1.7" />
          <circle cx="91" cy="20" r="4.5" fill="#a8c5e0" stroke="#3d5a80" strokeWidth="1.3" />
          <circle cx="45" cy="127" r="4.5" fill="#a8c5e0" stroke="#3d5a80" strokeWidth="1.3" />
        </g>
      )}
      {visual === 'digital-balance' && (
        <g strokeLinejoin="round">
          <ellipse cx="68" cy="139" rx="53" ry="5" fill="#3d5a80" opacity=".15" />
          <path
            d="M26 70H110L120 127Q68 136 16 127Z"
            fill="#cde1f2"
            stroke="#0d1b2a"
            strokeWidth="2.8"
          />
          <path d="M33 69L40 60H97L104 69Z" fill="#cde1f2" stroke="#0d1b2a" strokeWidth="2" />
          <ellipse cx="68" cy="59" rx="34" ry="6" fill="#e8f1fa" stroke="#0d1b2a" strokeWidth="2" />
          <path d="M35 91H86V115H35Z" fill="#0d1b2a" stroke="#3d5a80" strokeWidth="2" />
          <path d="M44 102H77" stroke="#a8c5e0" strokeWidth="2" strokeDasharray="5 3" />
          <circle cx="101" cy="105" r="5" fill="#e8f1fa" stroke="#0d1b2a" strokeWidth="1.5" />
        </g>
      )}
      {visual === 'water' && (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="68" cy="140" rx="37" ry="5" fill="#3d5a80" opacity=".14" />
          <path
            d="M52 24V14H83V24L91 34V128Q68 139 45 128V34Z"
            fill="#cde1f2"
            fillOpacity=".6"
            stroke="#0d1b2a"
            strokeWidth="3"
          />
          <path d="M51 19H84" stroke="#0d1b2a" strokeWidth="4" />
          <path d="M48 68H88V126Q68 134 48 126Z" fill="#cde1f2" fillOpacity=".65" />
          <path d="M48 68Q68 74 88 68" stroke="#1b3a6b" strokeWidth="1.8" />
          <rect x="49" y="85" width="38" height="25" rx="3" fill="#e8f1fa" stroke="#cde1f2" />
          <path d="M61 99Q66 92 68 87Q72 94 76 99Q76 106 68 106Q60 106 61 99Z" fill="#1b3a6b" />
        </g>
      )}
      {visual === 'sodium-chloride' && (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="68" cy="139" rx="42" ry="5" fill="#3d5a80" opacity=".14" />
          <path d="M38 42H98V127Q68 137 38 127Z" fill="#e8f1fa" stroke="#0d1b2a" strokeWidth="3" />
          <path d="M34 32H102V44H34Z" fill="#3d5a80" stroke="#0d1b2a" strokeWidth="2.5" />
          <path d="M45 78Q68 73 91 78V119Q68 128 45 119Z" fill="#e8f1fa" />
          <rect x="43" y="64" width="50" height="39" rx="3" fill="#e8f1fa" stroke="#cde1f2" />
          <path d="M58 81H78M62 88H74" stroke="#3d5a80" strokeWidth="2" />
          <path d="M55 111L60 108L65 112L70 107L76 112L80 108" stroke="#a8c5e0" strokeWidth="2" />
        </g>
      )}
    </svg>
  )
}

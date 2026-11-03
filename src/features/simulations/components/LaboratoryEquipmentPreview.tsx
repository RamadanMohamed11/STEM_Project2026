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
          <ellipse cx="68" cy="137" rx="40" ry="5" fill="#71818c" opacity=".14" />
          <path
            d="M27 25H109M32 25L39 131Q68 141 97 131L104 25"
            stroke="#3b5e70"
            strokeWidth="3.2"
          />
          <path
            d="M35 80Q68 85 101 80L96 126Q68 135 40 126Z"
            fill="#81ced7"
            fillOpacity=".48"
            stroke="#168ca3"
            strokeWidth="1.3"
          />
          <path d="M35 80Q68 86 101 80" stroke="#168ca3" strokeWidth="2" />
          <path
            d="M86 53H97M86 64H97M89 75H98M89 91H99M89 104H97"
            stroke="#6e8997"
            strokeWidth="1.5"
          />
          <path d="M30 25L24 31" stroke="#3b5e70" strokeWidth="2.4" />
          <path d="M46 36L50 108" stroke="white" strokeOpacity=".65" strokeWidth="3" />
        </g>
      )}
      {visual === 'graduated-cylinder' && (
        <g strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="69" cy="138" rx="38" ry="5" fill="#71818c" opacity=".14" />
          <path d="M55 15H83M58 15V116Q69 126 80 116V15" stroke="#3b5e70" strokeWidth="3" />
          <path
            d="M59 66Q69 71 79 66V115Q69 123 59 115Z"
            fill="#8acfd6"
            fillOpacity=".65"
            stroke="#168ca3"
            strokeWidth="1.4"
          />
          <path d="M59 66Q69 71 79 66" stroke="#168ca3" strokeWidth="2" />
          <path
            d="M59 31H69M59 42H65M59 53H69M59 64H65M59 75H69M59 86H65M59 97H69M59 108H65"
            stroke="#577685"
            strokeWidth="1.2"
          />
          <path d="M69 122V132M45 133H93" stroke="#3b5e70" strokeWidth="3.5" />
          <path d="M63 23V56" stroke="white" strokeOpacity=".65" strokeWidth="2" />
        </g>
      )}
      {visual === 'stirring-rod' && (
        <g strokeLinecap="round">
          <ellipse cx="66" cy="138" rx="39" ry="5" fill="#71818c" opacity=".12" />
          <path d="M45 127L91 20" stroke="#51798c" strokeWidth="9" />
          <path d="M45 127L91 20" stroke="#bdd8df" strokeWidth="5" />
          <path d="M49 116L88 24" stroke="white" strokeOpacity=".88" strokeWidth="1.7" />
          <circle cx="91" cy="20" r="4.5" fill="#c2dce3" stroke="#51798c" strokeWidth="1.3" />
          <circle cx="45" cy="127" r="4.5" fill="#c2dce3" stroke="#51798c" strokeWidth="1.3" />
        </g>
      )}
      {visual === 'digital-balance' && (
        <g strokeLinejoin="round">
          <ellipse cx="68" cy="139" rx="53" ry="5" fill="#71818c" opacity=".15" />
          <path
            d="M26 70H110L120 127Q68 136 16 127Z"
            fill="#b7c8d0"
            stroke="#3b5e70"
            strokeWidth="2.8"
          />
          <path d="M33 69L40 60H97L104 69Z" fill="#dae4e8" stroke="#3b5e70" strokeWidth="2" />
          <ellipse cx="68" cy="59" rx="34" ry="6" fill="#eef4f6" stroke="#3b5e70" strokeWidth="2" />
          <path d="M35 91H86V115H35Z" fill="#294b55" stroke="#476877" strokeWidth="2" />
          <path d="M44 102H77" stroke="#7acdbb" strokeWidth="2" strokeDasharray="5 3" />
          <circle cx="101" cy="105" r="5" fill="#f4f6f7" stroke="#3b5e70" strokeWidth="1.5" />
        </g>
      )}
      {visual === 'water' && (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="68" cy="140" rx="37" ry="5" fill="#71818c" opacity=".14" />
          <path
            d="M52 24V14H83V24L91 34V128Q68 139 45 128V34Z"
            fill="#d9e9ec"
            fillOpacity=".6"
            stroke="#3b5e70"
            strokeWidth="3"
          />
          <path d="M51 19H84" stroke="#3b5e70" strokeWidth="4" />
          <path d="M48 68H88V126Q68 134 48 126Z" fill="#8bd2db" fillOpacity=".65" />
          <path d="M48 68Q68 74 88 68" stroke="#168ca3" strokeWidth="1.8" />
          <rect x="49" y="85" width="38" height="25" rx="3" fill="#f7fafb" stroke="#b9d3d9" />
          <path d="M61 99Q66 92 68 87Q72 94 76 99Q76 106 68 106Q60 106 61 99Z" fill="#138b85" />
        </g>
      )}
      {visual === 'sodium-chloride' && (
        <g strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx="68" cy="139" rx="42" ry="5" fill="#71818c" opacity=".14" />
          <path d="M38 42H98V127Q68 137 38 127Z" fill="#e9eef0" stroke="#3b5e70" strokeWidth="3" />
          <path d="M34 32H102V44H34Z" fill="#66818b" stroke="#3b5e70" strokeWidth="2.5" />
          <path d="M45 78Q68 73 91 78V119Q68 128 45 119Z" fill="#f8fafb" />
          <rect x="43" y="64" width="50" height="39" rx="3" fill="#f8fafb" stroke="#cbd7d9" />
          <path d="M58 81H78M62 88H74" stroke="#71818c" strokeWidth="2" />
          <path d="M55 111L60 108L65 112L70 107L76 112L80 108" stroke="#b5c3c7" strokeWidth="2" />
        </g>
      )}
    </svg>
  )
}

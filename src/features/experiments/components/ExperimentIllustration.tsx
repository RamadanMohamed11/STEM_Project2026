import type { ExperimentIllustrationKey } from '@/types/experiment'

interface ExperimentIllustrationProps {
  illustration: ExperimentIllustrationKey
}

/** Maintained, accessible-adjacent scientific sketches; no external images or implied measurements. */
export function ExperimentIllustration({ illustration }: ExperimentIllustrationProps) {
  return (
    <svg
      viewBox="0 0 440 208"
      className="h-full w-full"
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
    >
      <path d="M30 171H410" stroke="#cdd7dd" strokeWidth="1.5" />
      <path d="M42 34H90M350 34H398" stroke="#cbd6d8" strokeDasharray="4 6" />
      {illustration === 'salt-dissolution' && (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M160 51H279L267 170H172L160 51Z" stroke="#274657" strokeWidth="3" />
          <path
            d="M173 104Q201 98 222 104T267 104L260 163H178L173 104Z"
            fill="#b5e3df"
            stroke="#138b85"
            strokeWidth="1.7"
          />
          <path d="M173 103Q219 110 267 103" stroke="#138b85" strokeWidth="2" />
          <path
            d="M190 128L194 132M233 137L236 140M217 154L220 157"
            stroke="#138b85"
            strokeWidth="2"
          />
          <path d="M113 53L179 94" stroke="#274657" strokeWidth="6" />
          <path d="M177 92Q184 99 194 94" stroke="#71818c" strokeWidth="3" />
          <path
            d="M187 106L189 110M196 111L198 115M181 116L184 120"
            stroke="#dc8a38"
            strokeWidth="3"
          />
          <path d="M119 85H146M120 93H135" stroke="#71818c" strokeWidth="1.3" />
          <circle cx="312" cy="79" r="2.7" fill="#138b85" />
          <path d="M318 79H343" stroke="#138b85" strokeWidth="1.5" />
        </g>
      )}
      {illustration === 'liquid-volume' && (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M186 31H254M197 31V166Q220 177 243 166V31" stroke="#274657" strokeWidth="3" />
          <path
            d="M198 111Q221 118 242 111V166Q220 175 198 166Z"
            fill="#b5e3df"
            stroke="#138b85"
            strokeWidth="1.8"
          />
          <path d="M198 111Q220 119 242 111" stroke="#138b85" strokeWidth="2.1" />
          <path
            d="M198 44H214M198 54H208M198 64H214M198 74H208M198 84H214M198 94H208M198 104H214M198 124H214M198 134H208M198 144H214M198 154H208"
            stroke="#71818c"
            strokeWidth="1.5"
          />
          <path d="M177 169H263M220 174V183M195 184H245" stroke="#274657" strokeWidth="3" />
          <path d="M264 115H324M314 109L324 115L314 121" stroke="#138b85" strokeWidth="1.7" />
          <circle cx="147" cy="110" r="3" fill="#dc8a38" />
          <path d="M155 110H185" stroke="#dc8a38" strokeWidth="1.5" />
        </g>
      )}
      {illustration === 'ph-indicators' && (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M128 65V150Q128 167 144 167Q160 167 160 150V65M205 65V150Q205 167 221 167Q237 167 237 150V65M282 65V150Q282 167 298 167Q314 167 314 150V65"
            stroke="#274657"
            strokeWidth="3"
          />
          <path
            d="M129 117H159V150Q159 166 144 166Q129 166 129 150Z"
            fill="#e8b5a0"
            stroke="#a95d4a"
            strokeWidth="1.7"
          />
          <path
            d="M206 107H236V150Q236 166 221 166Q206 166 206 150Z"
            fill="#b5e3df"
            stroke="#138b85"
            strokeWidth="1.7"
          />
          <path
            d="M283 121H313V150Q313 166 298 166Q283 166 283 150Z"
            fill="#c7bfe5"
            stroke="#8e7db5"
            strokeWidth="1.7"
          />
          <path d="M125 64H163M202 64H240M279 64H317" stroke="#274657" strokeWidth="3" />
          <path d="M98 167H344M106 178H336" stroke="#274657" strokeWidth="3" />
          <path d="M144 48V34M221 48V34M298 48V34" stroke="#71818c" strokeDasharray="3 5" />
          <circle cx="144" cy="28" r="4" fill="#a95d4a" />
          <circle cx="221" cy="28" r="4" fill="#138b85" />
          <circle cx="298" cy="28" r="4" fill="#8e7db5" />
        </g>
      )}
    </svg>
  )
}

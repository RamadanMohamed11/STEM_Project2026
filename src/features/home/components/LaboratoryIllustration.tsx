export function LaboratoryIllustration() {
  return (
    <div className="relative h-full min-h-[305px] overflow-hidden bg-navy text-white sm:min-h-[335px]">
      <div className="absolute inset-x-7 top-7 z-10 flex items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65 sm:inset-x-9 sm:top-8">
        <span>Lab / Concept study</span>
        <span>FIG. 01</span>
      </div>

      <svg
        viewBox="0 0 480 308"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <defs>
          <pattern id="labGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" stroke="#fff" strokeOpacity=".06" strokeWidth=".7" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="480" height="308" fill="url(#labGrid)" />
        <path d="M56 248H420" stroke="#fff" strokeOpacity=".21" />
        <path d="M136 84H337" stroke="#fff" strokeOpacity=".15" strokeDasharray="3 7" />
        <path d="M245 57V267" stroke="#fff" strokeOpacity=".15" strokeDasharray="3 7" />

        {/* Illustrative laboratory glassware; no sample readings are implied. */}
        <path
          d="M218 72H273M232 72V144L165 235Q154 252 175 252H316Q337 252 325 235L259 144V72"
          stroke="#e7f8f5"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M197 204C225 191 264 218 296 198L324 238Q330 247 315 247H176Q166 247 174 237Z"
          fill="#138b85"
          fillOpacity=".68"
          stroke="#76d5cb"
          strokeOpacity=".7"
          strokeWidth="1.5"
        />
        <path d="M229 99H263" stroke="#76d5cb" strokeOpacity=".7" strokeWidth="1.5" />
        <path
          d="M283 174H313M283 184H305M283 194H310"
          stroke="#fff"
          strokeOpacity=".5"
          strokeWidth="1.4"
        />
        <circle cx="229" cy="222" r="5" stroke="#d0f5ef" strokeOpacity=".8" />
        <circle cx="256" cy="232" r="3.5" stroke="#d0f5ef" strokeOpacity=".8" />
        <circle cx="271" cy="217" r="2.5" stroke="#d0f5ef" strokeOpacity=".8" />

        <path d="M173 183H104V153H73" stroke="#76d5cb" strokeOpacity=".65" strokeWidth="1.2" />
        <circle cx="173" cy="183" r="3" fill="#76d5cb" />
        <path d="M293 119H352V103H394" stroke="#76d5cb" strokeOpacity=".65" strokeWidth="1.2" />
        <circle cx="293" cy="119" r="3" fill="#76d5cb" />
        <path d="M103 266H163M329 266H383" stroke="#fff" strokeOpacity=".25" />
        <path
          d="M100 262V270M163 262V270M329 262V270M386 262V270"
          stroke="#fff"
          strokeOpacity=".25"
        />
      </svg>

      <div className="absolute top-[40%] start-[7%] text-[10px] leading-relaxed tracking-[0.08em] text-teal-light sm:start-[9%]">
        OBSERVE
        <span className="block text-white/55">01 / Process</span>
      </div>
      <div className="absolute top-[27%] end-[6%] text-[10px] leading-relaxed tracking-[0.08em] text-teal-light sm:end-[8%]">
        UNDERSTAND
        <span className="block text-white/55">02 / Insight</span>
      </div>
      <div className="absolute inset-x-7 bottom-6 flex justify-between gap-4 border-t border-white/15 pt-4 text-[11px] text-white/65 sm:inset-x-9">
        <span>Illustrative study</span>
        <span>Learning through observation</span>
      </div>
    </div>
  )
}

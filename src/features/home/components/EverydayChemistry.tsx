import { Layers, ShieldAlert, Sparkles, Utensils } from 'lucide-react'

interface EverydayItem {
  id: string
  title: string
  subtitle: string
  icon: typeof Utensils
  iconBg: string
  iconColor: string
  tag: string
  observation: string
  science: string
}

const everydayExamples: EverydayItem[] = [
  {
    id: 'cooking',
    title: 'Cooking Food',
    subtitle: 'Heat and Chemical Reactions',
    icon: Utensils,
    iconBg: 'bg-warning-soft',
    iconColor: 'text-warning-dark',
    tag: 'Thermal Reactions',
    observation: 'Why does an egg turn solid when cooked, and why does bread crust turn golden brown?',
    science:
      'Heat causes chemical reactions that change the shape of food proteins (denaturation) and caramelize sugars. These changes create new textures, colors, and flavors that cannot be reversed.',
  },
  {
    id: 'rusting',
    title: 'Rusting Iron',
    subtitle: 'Oxidation in Damp Air',
    icon: ShieldAlert,
    iconBg: 'bg-teal-soft',
    iconColor: 'text-teal-dark',
    tag: 'Oxidation',
    observation: 'Why do iron nails, bicycle chains, and outdoor fences develop a crumbly reddish-brown coating?',
    science:
      'This is oxidation in action. Iron metal slowly reacts with oxygen gas and moisture in the atmosphere to form a new chemical compound: iron oxide, commonly known as rust.',
  },
  {
    id: 'soap',
    title: 'Cleaning with Soap',
    subtitle: 'Molecules That Trap Oil',
    icon: Sparkles,
    iconBg: 'bg-teal-soft',
    iconColor: 'text-teal-dark',
    tag: 'Surfactants',
    observation: 'Why does plain water fail to rinse grease away, but soapy water cleans it instantly?',
    science:
      'Soap molecules have two ends: a water-loving head and an oil-loving tail. The tail clings to greasy dirt, while the head binds to water, pulling the grease into the water so it rinses away.',
  },
  {
    id: 'materials',
    title: 'Everyday Materials',
    subtitle: 'Properties and Uses',
    icon: Layers,
    iconBg: 'bg-surface-muted',
    iconColor: 'text-navy',
    tag: 'Material Science',
    observation: 'Why are cooking pots made of metal, but their handles are made of heat-resistant plastic or silicone?',
    science:
      'Chemists choose materials for their properties. Metals conduct heat rapidly to cook food evenly, while heat-resistant polymers (plastics) insulate against heat to protect your hands.',
  },
]

export function EverydayChemistry() {
  return (
    <section aria-labelledby="everyday-heading">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-teal">
            Real-World Science
          </p>
          <h2
            id="everyday-heading"
            className="text-2xl font-bold tracking-tight text-navy sm:text-3xl"
          >
            Chemistry in Everyday Life
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-ink/75">
          Chemistry is not just inside laboratories. Chemical reactions and material properties shape
          the world around you every single day.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {everydayExamples.map((item) => {
          const Icon = item.icon
          return (
            <article
              key={item.id}
              className="group flex flex-col justify-between rounded-xl border border-line bg-white p-5 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:border-teal/30 hover:shadow-md sm:p-6"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`flex size-11 items-center justify-center rounded-xl transition-transform duration-300 ease-out group-hover:scale-110 ${item.iconBg} ${item.iconColor}`}
                  >
                    <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="rounded-md border border-line bg-canvas px-2 py-0.5 text-[11px] font-semibold text-slate">
                    {item.tag}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-navy sm:text-lg">
                  {item.title}
                </h3>
                <p className="text-xs font-medium text-teal-dark">{item.subtitle}</p>

                <div className="mt-3.5 rounded-lg border border-line/60 bg-canvas/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate">
                    What you see:
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink/80">{item.observation}</p>
                </div>

                <div className="mt-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-dark">
                    The science behind it:
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink/75 sm:text-sm">
                    {item.science}
                  </p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

type Resource = {
  icon: string
  title: string
  description: string
  href: string
}

function ResourceCard({ r }: { r: Resource }) {
  return (
    <a
      className="group rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg transition hover:scale-[1.01] hover:bg-white/45"
      href={r.href}
      target="_blank"
      rel="noreferrer"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/60 ring-1 ring-white/35">
          <span className="text-lg" aria-hidden="true">
            {r.icon}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-800">{r.title}</div>
          <div className="mt-1 text-xs leading-relaxed text-gray-700">{r.description}</div>
          <div className="mt-3 text-[11px] font-semibold text-gray-600 underline decoration-gray-400/50 underline-offset-4">
            Open resource
          </div>
        </div>
      </div>
    </a>
  )
}

export function ResourcesPage() {
  const healthAwareness: Resource[] = [
    {
      icon: '🩺',
      title: 'PCOS / PCOD overview (NHS)',
      description: 'Symptoms, diagnosis and treatment pathways in clear language.',
      href: 'https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/',
    },
    {
      icon: '🩸',
      title: 'Menstrual health education (WHO)',
      description: 'Foundational menstrual health information and awareness resources.',
      href: 'https://www.who.int/health-topics/menstrual-health',
    },
  ]

  const mentalHealth: Resource[] = [
    {
      icon: '🧘',
      title: 'Stress management basics (WHO)',
      description: 'Practical guidance to reduce stress and build resilience.',
      href: 'https://www.who.int/news-room/questions-and-answers/item/stress',
    },
    {
      icon: '💬',
      title: 'Emotional wellbeing resources (NHS)',
      description: 'Self-care tools and advice for emotional wellbeing.',
      href: 'https://www.nhs.uk/mental-health/',
    },
  ]

  const official: Resource[] = [
    {
      icon: '🌍',
      title: 'Women’s health (WHO)',
      description: 'Official women’s health topic page and references.',
      href: 'https://www.who.int/health-topics/women-s-health',
    },
    {
      icon: '🇮🇳',
      title: 'Ministry of Health & Family Welfare (India)',
      description: 'Government health programs, advisories and official information.',
      href: 'https://www.mohfw.gov.in/',
    },
    {
      icon: '🏥',
      title: 'NHS Women’s health',
      description: 'Trusted UK health information for women.',
      href: 'https://www.nhs.uk/live-well/',
    },
  ]

  const emergency: Resource[] = [
    {
      icon: '☎️',
      title: 'Emergency support (placeholder)',
      description: 'If you are in danger or need urgent care, contact local emergency services.',
      href: 'https://www.who.int/health-topics/emergencies',
    },
    {
      icon: '🤝',
      title: 'Support helpline (placeholder)',
      description: 'Find local women’s support lines and community services in your region.',
      href: 'https://www.unwomen.org/en/what-we-do/ending-violence-against-women',
    },
  ]

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">
          Resources
        </h1>
        <p className="max-w-3xl text-sm text-gray-700">
          Trusted links for awareness, support, and official women’s health guidance.
        </p>
      </div>

      <div className="mt-6 space-y-7">
        <section>
          <div className="text-sm font-semibold text-gray-700">Health Awareness</div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {healthAwareness.map((r) => (
              <ResourceCard key={r.href} r={r} />
            ))}
          </div>
        </section>

        <section>
          <div className="text-sm font-semibold text-gray-700">Mental Health Support</div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {mentalHealth.map((r) => (
              <ResourceCard key={r.href} r={r} />
            ))}
          </div>
        </section>

        <section>
          <div className="text-sm font-semibold text-gray-700">
            Government / Official Health Sites
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {official.map((r) => (
              <ResourceCard key={r.href} r={r} />
            ))}
          </div>
        </section>

        <section>
          <div className="text-sm font-semibold text-gray-700">Emergency / Support</div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {emergency.map((r) => (
              <ResourceCard key={r.href} r={r} />
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-600">
            If this is an emergency, please seek immediate medical care.
          </div>
        </section>
      </div>
    </div>
  )
}


import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ModuleContent } from '@/types/module'

interface ModulePageProps {
  module: ModuleContent
  priorityContent?: ReactNode
  heroAside?: ReactNode
  heroSupplement?: ReactNode
  hideInfoSections?: boolean
  children?: ReactNode
}

export function ModulePage({
  module,
  priorityContent,
  heroAside,
  heroSupplement,
  hideInfoSections = false,
  children,
}: ModulePageProps) {
  return (
    <article className="module-page">
      <section
        className={heroAside ? 'hero-card hero-card--with-aside fade-rise' : 'hero-card fade-rise'}
      >
        <div className="hero-card__main">
          <p className="hero-card__eyebrow">{module.id.toUpperCase()}</p>
          <h1>{module.title}</h1>
          <p className="hero-card__subtitle">{module.subtitle}</p>
          <p className="hero-card__description">{module.description}</p>
          {heroSupplement ? (
            <div className="hero-card__supplement">{heroSupplement}</div>
          ) : null}
          <div className="hero-card__actions">
            {module.actions.map((action) => (
              <Link key={action.label} to={action.to} className="cta-button">
                {action.label}
              </Link>
            ))}
          </div>
        </div>
        {heroAside}
      </section>

      {priorityContent}

      {!hideInfoSections ? (
        <>
          <section className="stat-grid fade-rise" aria-label={`${module.title} metrics`}>
            {module.stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <p className="stat-card__label">{stat.label}</p>
                <p className="stat-card__value">{stat.value}</p>
              </div>
            ))}
          </section>

          <section
            className="feature-grid fade-rise"
            aria-label={`${module.title} highlights`}
          >
            {module.highlights.map((highlight) => (
              <section key={highlight.title} className="feature-card">
                <h2>{highlight.title}</h2>
                <p>{highlight.description}</p>
              </section>
            ))}
          </section>
        </>
      ) : null}

      {children}
    </article>
  )
}

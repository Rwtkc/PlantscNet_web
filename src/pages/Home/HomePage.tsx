import { Link } from 'react-router-dom'
import { toAssetPath } from '@/app/base'
import HomeStatsBand from '@/components/home/HomeStatsBand'
import '@/styles/home.css'

export default function HomePage() {
  return (
    <article className="home-portal">
      <section className="home-hero home-hero--balanced fade-rise">
        <div className="home-hero__main">
          <p className="home-hero__eyebrow">PLANTSCNET PORTAL</p>
          <h1>
            <span className="home-hero__title-line home-hero__title-line--primary">
              Plant single-cell networks
            </span>
            <span className="home-hero__title-line home-hero__title-line--sub">
              across species and tissues
            </span>
          </h1>
          <p className="home-hero__subtitle">
            PlantscNet brings together species-level regulatory network resources for
            browsing, TF-target searching, data download, and project contact.
          </p>
          <p className="home-hero__description">
            Use the portal to move quickly from species and tissue coverage to ranked
            regulatory edges, downloadable result tables, and maintainer contact
            without reading the full project workflow first.
          </p>
          <div className="home-hero__actions home-hero__actions--bottom">
            <Link to="/browse" className="cta-button cta-button--solid">
              Browse Species
            </Link>
            <Link to="/search" className="cta-button">
              Search TF/Target
            </Link>
            <Link to="/download" className="cta-button">
              Download Data
            </Link>
          </div>
        </div>

        <div className="home-hero__logo-panel home-hero__logo-panel--bare" aria-label="PlantscNet logo panel">
          <img
            className="home-hero__logo-image"
            src={toAssetPath('PlantscNet_logo.webp')}
            alt="PlantscNet logo"
            width={720}
            height={531}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </section>

      <HomeStatsBand />

      <section className="home-utility-grid fade-rise" aria-label="Portal summary">
        <section className="home-utility-card">
          <p className="home-utility-card__eyebrow">What PlantscNet Provides</p>
          <h2>A structured portal for species-level network exploration.</h2>
          <p>
            Browse species and tissue coverage, search TF-target relationships, and
            download ranked network outputs from the same portal.
          </p>
        </section>

        <section className="home-utility-card">
          <p className="home-utility-card__eyebrow">Data Scope</p>
          <h2>Built around plant single-cell regulatory network exploration.</h2>
          <p>
            The current portal surfaces 10 species and 13 tissue categories so users can
            move directly into browsing and retrieval without extra filtering setup.
          </p>
        </section>

        <section className="home-utility-card home-utility-card--contact">
          <p className="home-utility-card__eyebrow">Affiliation</p>
          <h2>Jilin Agricultural University</h2>
          <p>Changchun, Jilin, China</p>
          <a className="home-utility-card__contact-link" href="mailto:cuicui001116@163.com">
            First author: cuicui001116@163.com
          </a>
        </section>
      </section>
    </article>
  )
}

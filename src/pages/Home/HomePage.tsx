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
            browsing, TF-target search, gene prioritization, and data download.
          </p>
          <p className="home-hero__description">
            Use the portal to move from plant species and tissue context to inferred
            regulatory relationships, candidate genes, and downloadable resources for
            follow-up biological interpretation.
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
          <h2>A plant single-cell regulatory network database.</h2>
          <p>
            Browse species and tissues, search TF-target relationships, prioritize
            candidate genes, and download regulatory network resources from one portal.
          </p>
        </section>

        <section className="home-utility-card">
          <p className="home-utility-card__eyebrow">Data Scope</p>
          <h2>Covering scRNA and scATAC regulatory evidence.</h2>
          <p>
            The current portal includes regulatory network resources for 30 scRNA
            species and 4 scATAC species, supporting cross-species comparison and
            gene-level biological interpretation.
          </p>
        </section>

        <section className="home-utility-card home-utility-card--contact">
          <p className="home-utility-card__eyebrow">Affiliation</p>
          <div className="home-affiliation-list">
            <div className="home-affiliation-item">
              <h2>Jilin Agricultural University</h2>
              <p>Changchun, Jilin, China</p>
            </div>
            <div className="home-affiliation-item">
              <h2>Rice Research Institute, Guangdong Academy of Agricultural Sciences</h2>
              <p>Guangzhou, Guangdong, China</p>
            </div>
          </div>
          <a className="home-utility-card__contact-link" href="mailto:cuicui001116@163.com">
            First author: cuicui001116@163.com
          </a>
        </section>
      </section>
    </article>
  )
}

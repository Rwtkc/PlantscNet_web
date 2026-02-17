import { useState } from 'react'
import { ModulePage } from '@/components/ModulePage'
import { moduleContent } from '@/app/module-content'

const speciesOptions = [
  'Arabidopsis thaliana',
  'Brassica rapa',
  'Fragaria vesca',
  'Gossypium arboreum',
  'Gossypium hirsutum',
  'Glycine max',
  'Oryza sative',
  'Populus trichocarpa',
  'Solanum lycopersicum',
  'Zea mays',
]

const tissueOptions = [
  'All',
  'Root',
  'Leaf',
  'Callus',
  'Ear',
  'Embryo',
  'Endosperm',
  'Meiotic Cells',
  'Nodule',
  'Opposite SDX cells',
  'Shoot Apical Meristem',
  'Tension SDX cells',
  'Vertical SDX cells',
  'young inflorescences',
]

export default function BrowsePage() {
  const browse = moduleContent.browse
  const defaultSpecies = speciesOptions[0]
  const defaultTissue = tissueOptions[0]
  const [isTreeExpanded, setIsTreeExpanded] = useState(false)
  const [selectedSpecies, setSelectedSpecies] = useState(defaultSpecies)
  const [selectedTissue, setSelectedTissue] = useState(defaultTissue)

  const handleTreeToggle = () => {
    setIsTreeExpanded((previous) => {
      const next = !previous
      if (next) {
        setSelectedSpecies(defaultSpecies)
        setSelectedTissue(defaultTissue)
      }
      return next
    })
  }

  return (
    <ModulePage
      module={browse}
      hideInfoSections
      heroSupplement={
        <section className="browse-hero-fill" aria-label="Browse quick scope">
          <div className="browse-hero-fill__chips">
            <span>10 Species</span>
            <span>13 Tissues + All</span>
            <span>D3 Slot Ready</span>
          </div>
          <p>
            Select a species and tissue in the Browse Tree below to define the
            visualization scope and lock dataset context before rendering.
          </p>
        </section>
      }
      heroAside={
        <aside className="browse-hero-aside" aria-label="Browse key metrics and highlights">
          <section className="browse-hero-aside__stats">
            {browse.stats.map((stat) => (
              <div key={stat.label} className="browse-hero-card browse-hero-card--stat">
                <p className="stat-card__label">{stat.label}</p>
                <p className="stat-card__value">{stat.value}</p>
              </div>
            ))}
          </section>
          <section className="browse-hero-aside__highlights">
            {browse.highlights.map((highlight) => (
              <div key={highlight.title} className="browse-hero-card">
                <h2>{highlight.title}</h2>
                <p>{highlight.description}</p>
              </div>
            ))}
          </section>
        </aside>
      }
      priorityContent={
        <section className="browse-priority fade-rise">
          <section className="tree-toolbar" aria-label="Browse tree filters">
            <div className="tree-toolbar__head">
              <h2>Browse Tree</h2>
              <button
                type="button"
                className="tree-toolbar__toggle"
                onClick={handleTreeToggle}
                aria-expanded={isTreeExpanded}
              >
                {isTreeExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {!isTreeExpanded ? (
              <p className="tree-toolbar__hint">
                Tree is collapsed. Expand to select species and tissue.
              </p>
            ) : (
              <div className="tree-toolbar__groups">
                <div className="tree-group">
                  <details open>
                    <summary>Species (10)</summary>
                    <ul className="tree-list">
                      {speciesOptions.map((species) => (
                        <li key={species}>
                          <label className="tree-item">
                            <input
                              type="radio"
                              name="species-option"
                              value={species}
                              checked={selectedSpecies === species}
                              onChange={() => {
                                setSelectedSpecies(species)
                              }}
                            />
                            <span>{species}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>

                <div className="tree-group">
                  <details open>
                    <summary>Tissues (All + 13)</summary>
                    <ul className="tree-list">
                      {tissueOptions.map((tissue) => (
                        <li key={tissue}>
                          <label className="tree-item">
                            <input
                              type="radio"
                              name="tissue-option"
                              value={tissue}
                              checked={selectedTissue === tissue}
                              onChange={() => {
                                setSelectedTissue(tissue)
                              }}
                            />
                            <span>{tissue}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </div>
            )}
          </section>

          <section className="viz-panel" aria-label="D3 visualization area placeholder">
            <h2>D3 Visualization</h2>
            {!isTreeExpanded ? (
              <>
                <p className="viz-panel__meta">
                  Tree is collapsed. Showing global statistics chart placeholder.
                </p>
                <div className="viz-placeholder" role="img" aria-label="D3 overview placeholder">
                  Global statistics visualization placeholder
                </div>
              </>
            ) : (
              <>
                <p className="viz-panel__meta">
                  Current selection: <strong>{selectedSpecies}</strong> /{' '}
                  <strong>{selectedTissue}</strong>
                </p>
                <div className="viz-placeholder" role="img" aria-label="D3 placeholder">
                  D3 image area placeholder
                </div>
              </>
            )}
          </section>
        </section>
      }
    />
  )
}

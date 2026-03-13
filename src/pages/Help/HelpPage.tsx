import { ModulePage } from '@/components/ModulePage'
import { moduleContent } from '@/app/module-content'

const moduleGuides = [
  {
    title: 'Browse',
    question: 'Which species, tissues, or biological samples already contain regulatory information relevant to my question?',
    focus:
      'Browse is the starting point when the biological objective is still broad. It helps you move from a species-level view to individual samples, so you can quickly see whether a tissue, developmental context, or experimental collection contains the regulatory landscape you want to inspect.',
    interpretation: [
      'The species and sample cards help you decide whether a regulatory network is available for a given biological system before you invest time in gene-level interpretation.',
      'The network preview gives a compact view of high-confidence transcription factor to target relationships, which is useful for sensing the dominant regulatory structure of the selected species or sample.',
      'Sample details help relate each network back to its biological source, making it easier to judge whether a signal is likely to reflect a tissue program, a cell-state transition, or a species-specific feature.',
    ],
    workflow:
      'Use Browse first when you want context. Once you identify the species or sample most relevant to your biological hypothesis, move to Search to examine specific transcription factors or target genes.',
  },
  {
    title: 'Search',
    question: 'Does a transcription factor or target gene participate in a regulatory relationship within the selected species?',
    focus:
      'Search is the gene-centered module. It is most useful when you already have a candidate regulator, a marker gene, or a downstream effector and want to ask whether that gene appears in the inferred regulatory network of one species.',
    interpretation: [
      'Integrated network results summarize regulatory relationships retained in the final combined network, which is helpful when you want an overall species-level view of likely regulation.',
      'Sample-derived results show where the same relationship still appears in individual samples, allowing you to connect a regulator-target pair back to specific biological material.',
      'The score shown with each result should be read as a measure of support within the inferred network, not as direct proof of molecular binding or experimental causality.',
    ],
    workflow:
      'Use Search after you already know the species of interest. It is especially helpful for checking whether known developmental regulators, stress-associated factors, or lineage markers are embedded in the inferred network.',
  },
  {
    title: 'Download',
    question: 'Which files should I retrieve if I want to continue biological interpretation outside the web portal?',
    focus:
      'Download is the handoff point from visual inspection to deeper analysis. It gathers the major species-level resources required for downstream exploration, including motif-related files, transcription factor lists, and final regulatory network tables.',
    interpretation: [
      'The final regulatory network file is the most direct resource for examining inferred transcription factor to target connections outside the page.',
      'The TF list helps define the regulatory actors considered in the species, which is useful when building candidate regulator panels or comparing regulators across taxa.',
      'Motif and ranking-related files support follow-up interpretation of regulatory evidence and can be used when you want to revisit the biological plausibility of inferred regulators.',
    ],
    workflow:
      'Use Download after you have identified the species and regulatory relationships worth following. It is the most suitable module when you are preparing figures, supplementary tables, comparative species analyses, or additional biological annotation work.',
  },
]

export default function HelpPage() {
  return (
    <ModulePage module={moduleContent.help} hideInfoSections>
      <section className="extra-card fade-rise">
        <h2>How to read the portal</h2>
        <p className="help-intro">
          PlantscNet is most useful when read as a biological workflow rather than as a set of
          isolated pages. In most studies, the practical order is: first define the relevant
          species and sample context in <strong>Browse</strong>, then test specific regulatory
          hypotheses in <strong>Search</strong>, and finally retrieve species-level resources from
          <strong> Download</strong> for deeper interpretation.
        </p>
      </section>

      <section className="help-guide-list fade-rise" aria-label="Module guide">
        {moduleGuides.map((guide) => (
          <article key={guide.title} className="help-guide-card">
            <header className="help-guide-card__header">
              <p className="help-guide-card__eyebrow">Module</p>
              <h2>{guide.title}</h2>
            </header>

            <div className="help-guide-card__block">
              <h3>Biological question</h3>
              <p>{guide.question}</p>
            </div>

            <div className="help-guide-card__block">
              <h3>Primary function</h3>
              <p>{guide.focus}</p>
            </div>

            <div className="help-guide-card__block">
              <h3>How to interpret the page</h3>
              <ul className="help-guide-card__list">
                {guide.interpretation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="help-guide-card__block">
              <h3>When to use it next</h3>
              <p>{guide.workflow}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="extra-card fade-rise">
        <h2>Reading principle</h2>
        <p className="help-intro">
          The regulatory relationships shown in PlantscNet are best understood as inferred
          associations derived from the available single-cell data and regulatory workflow. They
          are valuable for prioritizing candidate regulators, target genes, tissues, and species
          for follow-up interpretation, but they should still be weighed together with prior
          biological knowledge and experimental evidence.
        </p>
      </section>

      <section className="help-meta-grid fade-rise" aria-label="Platform notes">
        <article className="extra-card">
          <h2>Platform overview</h2>
          <p className="help-intro">
            PlantscNet is a web portal built to organize, display, and distribute plant
            single-cell regulatory resources in a form that can be inspected directly in the
            browser. The page interface is implemented with React, TypeScript, and Vite, while the
            server side uses Express to read species files, return regulatory records, and provide
            download assets.
          </p>
          <p className="help-intro">
            In practical terms, the frontend is responsible for presenting species, tissues, genes,
            and regulatory links in an interpretable layout, whereas the backend connects those
            views to the curated species-level files stored on the deployment server.
          </p>
        </article>

        <article className="extra-card">
          <h2>Questions and contact</h2>
          <p className="help-intro">
            If you find a questionable regulatory relationship, inconsistent annotation, missing
            download file, or any biological interpretation that needs clarification, you can
            contact us through the <strong>Contact</strong> page or by email.
          </p>
          <p className="help-intro">
            Email:{' '}
            <a className="help-link" href="mailto:cuicui001116@163.com">
              cuicui001116@163.com
            </a>
          </p>
        </article>
      </section>
    </ModulePage>
  )
}

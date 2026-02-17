import { ModulePage } from '@/components/ModulePage'
import { moduleContent } from '@/app/module-content'

const faqs = [
  {
    q: 'How often are network models updated?',
    a: 'Production models are refreshed weekly, with hotfix releases for critical curation issues.',
  },
  {
    q: 'Can I pin a specific data release?',
    a: 'Yes. Use versioned archives in the Download module and reference manifest checksums.',
  },
  {
    q: 'Where should I report annotation mismatches?',
    a: 'Open a request from Contact and include the dataset ID plus expected annotation evidence.',
  },
]

export default function HelpPage() {
  return (
    <ModulePage module={moduleContent.help}>
      <section className="extra-card fade-rise">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </ModulePage>
  )
}

import { ModulePage } from '@/components/ModulePage'
import { moduleContent } from '@/app/module-content'

export default function ContactPage() {
  return (
    <ModulePage module={moduleContent.contact}>
      <section className="extra-card fade-rise">
        <h2>Submit a Request</h2>
        <form className="contact-form">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" placeholder="Your name" />

          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="you@lab.org" />

          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Describe your dataset or support request"
          />

          <button type="button" className="cta-button cta-button--solid">
            Send Request
          </button>
        </form>
      </section>
    </ModulePage>
  )
}

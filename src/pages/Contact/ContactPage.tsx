import { useState, type ChangeEvent, type FormEvent } from 'react'
import { ModulePage } from '@/components/ModulePage'
import { moduleContent } from '@/app/module-content'
import '@/styles/contact.css'
import { ContactLocationMap } from './ContactLocationMap'
import { submitContactRequest } from './contact.api'

export default function ContactPage() {
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  )
  const [submitMessage, setSubmitMessage] = useState('')

  function handleFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.currentTarget

    if (submitState !== 'idle') {
      setSubmitState('idle')
      setSubmitMessage('')
    }

    setFormValues((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = formValues.name.trim()
    const email = formValues.email.trim()
    const message = formValues.message.trim()

    if (!name || !email || !message) {
      setSubmitState('error')
      setSubmitMessage('Please complete name, email, and message before sending.')
      return
    }

    setSubmitState('submitting')
    setSubmitMessage('')

    try {
      const response = await submitContactRequest({
        name,
        email,
        message,
      })

      setFormValues({
        name: '',
        email: '',
        message: '',
      })
      setSubmitState('success')
      setSubmitMessage(
        response?.message ?? 'Request sent successfully. We will review it shortly.',
      )
    } catch (error) {
      setSubmitState('error')
      setSubmitMessage(
        error instanceof Error ? error.message : 'Failed to send your request.',
      )
    }
  }

  return (
    <ModulePage module={moduleContent.contact} hideInfoSections>
      <ContactLocationMap />

      <section className="extra-card fade-rise">
        <h2>Submit a Request</h2>
        <form
          className="contact-form"
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
        >
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            placeholder="Your name"
            value={formValues.name}
            onChange={handleFieldChange}
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@lab.org"
            value={formValues.email}
            onChange={handleFieldChange}
          />

          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Describe your dataset or support request"
            value={formValues.message}
            onChange={handleFieldChange}
          />

          {submitMessage ? (
            <div
              className={`contact-form__status contact-form__status--${submitState === 'error' ? 'error' : 'success'}`}
              role="status"
              aria-live="polite"
            >
              <strong>
                {submitState === 'error' ? 'Request failed' : 'Request sent'}
              </strong>
              <span>{submitMessage}</span>
            </div>
          ) : null}

          <button
            type="submit"
            className="cta-button cta-button--solid"
            disabled={submitState === 'submitting'}
          >
            {submitState === 'submitting'
              ? 'Sending...'
              : submitState === 'success'
                ? 'Sent'
                : 'Send Request'}
          </button>
        </form>
      </section>
    </ModulePage>
  )
}

import { toApiPath } from '@/app/base'
import { fetchJson } from '@/app/http'

interface ContactRequestPayload {
  name: string
  email: string
  message: string
}

interface ContactRequestResponse {
  ok: boolean
  message: string
}

export async function submitContactRequest(payload: ContactRequestPayload) {
  return fetchJson<ContactRequestResponse>(toApiPath('/contact/request'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    errorMessage: 'Failed to send your request.',
    parseErrorMessage: true,
  })
}

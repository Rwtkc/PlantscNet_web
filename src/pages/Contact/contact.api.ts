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
  const response = await fetch('/api/contact/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  let parsedResponse: ContactRequestResponse | null = null

  try {
    parsedResponse = JSON.parse(responseText) as ContactRequestResponse
  } catch {
    parsedResponse = null
  }

  if (!response.ok) {
    throw new Error(parsedResponse?.message ?? 'Failed to send your request.')
  }

  return parsedResponse
}

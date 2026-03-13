type FetchJsonInit = RequestInit & {
  errorMessage?: string
  parseErrorMessage?: boolean
}

export async function fetchJson<T>(input: RequestInfo | URL, init: FetchJsonInit = {}) {
  const { errorMessage, parseErrorMessage = false, ...requestInit } = init
  const response = await fetch(input, requestInit)

  if (!response.ok) {
    let message =
      errorMessage ??
      `Request failed${typeof input === 'string' ? ` for ${input}` : ` with status ${response.status}`}`

    if (parseErrorMessage) {
      try {
        const payload = (await response.json()) as { error?: string; message?: string }
        if (payload.error || payload.message) {
          message = payload.error ?? payload.message ?? message
        }
      } catch {
        // Keep the default message when the response body is not JSON.
      }
    }

    throw new Error(message)
  }

  return (await response.json()) as T
}

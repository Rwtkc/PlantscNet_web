import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@/styles/tokens.css'
import '@/styles/globals.css'
import { router } from '@/app/router'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element "#root" was not found.')
}

createRoot(rootElement).render(
  <StrictMode>
    <Suspense fallback={<div className="route-loading">Loading module...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  </StrictMode>,
)

import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { getCurrentAppPath, toAppPath } from '@/app/base'
import { resetSessionStateForReload } from '@/app/session'
import '@/styles/tokens.css'
import '@/styles/globals.css'
import { createAppRouter } from '@/app/router'

const homePath = toAppPath('/home')

if (resetSessionStateForReload() && getCurrentAppPath() !== '/home') {
  window.history.replaceState(null, '', homePath)
}

const router = createAppRouter()

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

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ModulePage } from '@/components/ModulePage'
import { moduleContent } from '@/app/module-content'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const globalsCss = readFileSync(path.resolve(currentDir, '../styles/globals.css'), 'utf8')

describe('ModulePage', () => {
  it('renders module content and actions', () => {
    render(
      <MemoryRouter>
        <ModulePage module={moduleContent.home} />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: moduleContent.home.title }),
    ).toBeInTheDocument()
    expect(screen.getByText(moduleContent.home.subtitle)).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: moduleContent.home.actions[0].label,
      }),
    ).toBeInTheDocument()
  })

  it('defines the app shell as full-bleed by default', () => {
    expect(globalsCss).toMatch(
      /\.app-shell\s*\{[\s\S]*width:\s*100%;[\s\S]*min-height:\s*100vh;[\s\S]*margin:\s*0;[\s\S]*border:\s*0;[\s\S]*border-radius:\s*0;[\s\S]*box-shadow:\s*none;/,
    )
  })
})

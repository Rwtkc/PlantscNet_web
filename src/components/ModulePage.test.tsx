import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ModulePage } from '@/components/ModulePage'
import { moduleContent } from '@/app/module-content'

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
})

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppLayout } from '@/layouts/AppLayout'
import HomePage from '@/pages/Home/HomePage'

describe('HomePage', () => {
  it('renders the shorter headline and coverage visualization', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(container.querySelector('.home-hero--balanced')).not.toBeNull()
    const titleLines = container.querySelectorAll('.home-hero__title-line')
    expect(titleLines).toHaveLength(2)
    expect(titleLines[0]?.classList.contains('home-hero__title-line--primary')).toBe(true)
    expect(titleLines[1]?.classList.contains('home-hero__title-line--sub')).toBe(true)
    expect(titleLines[0]?.textContent).toBe('Plant single-cell networks')
    expect(titleLines[1]?.textContent).toBe('across species and tissues')
    expect(container.querySelector('.home-hero__logo-panel--bare')).not.toBeNull()
    expect(container.querySelector('.home-hero__actions--bottom')).not.toBeNull()
    expect(
      screen.getByRole('heading', { name: /Plant single-cell networks/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/across species and tissues/i)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /PlantscNet logo/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/PlantscNet coverage map/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Portal Modules')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Start from the module that matches your task.'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: /A structured portal for species-level network exploration\./i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Portal Scope')).toBeInTheDocument()
    expect(screen.getByText('Tissue Representation')).toBeInTheDocument()
    expect(screen.getByText('Structured around PlantscNet portal coverage.')).toBeInTheDocument()
    expect(screen.getByText('All 13 tissues remain visible in the indexed collection.')).toBeInTheDocument()
    expect(container.querySelectorAll('.home-stats-card__figure')).toHaveLength(6)
    expect(screen.getByText('Eudicot species')).toBeInTheDocument()
    expect(screen.getByText('Monocot species')).toBeInTheDocument()
    expect(screen.getByText('Integrated Network Size')).toBeInTheDocument()
    expect(screen.getAllByText('Integrated final networks').length).toBeGreaterThan(0)
    expect(screen.getByText('pySCENIC-derived')).toBeInTheDocument()
    expect(screen.getAllByText('8').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    expect(screen.getByText('Leaf')).toBeInTheDocument()
    expect(screen.getByText('Meiotic Cells')).toBeInTheDocument()
    expect(screen.getByText('Arabidopsis thaliana')).toBeInTheDocument()
    expect(screen.getByText('Zea mays')).toBeInTheDocument()
    expect(screen.getByText('Brassica rapa')).toBeInTheDocument()
    expect(screen.getByText('Fragaria vesca')).toBeInTheDocument()
    expect(screen.getByText('Gossypium arboreum')).toBeInTheDocument()
    expect(screen.getByText('Solanum lycopersicum')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Final network size across the 10 PlantscNet species.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Counts summarize sample entries tracked in the current portal dataset.'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Edge counts are taken from each species-level'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: /Final network origin split/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: /Tissue representation dot matrix/i }),
    ).not.toBeInTheDocument()
    expect(container.querySelector('.home-tissue-overview')).toBeNull()
    expect(
      screen.getByRole('img', { name: /Tissue representation vertical lollipop chart/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('57')).toBeInTheDocument()
    expect(screen.getByText('19')).toBeInTheDocument()
    const rootLollipopLabel = screen
      .getAllByText('Root')
      .find((node) => node.tagName.toLowerCase() === 'text')
    expect(rootLollipopLabel?.getAttribute('transform')).toContain('rotate(')
    expect(
      screen.getByRole('img', { name: /Integrated final network size bars/i }),
    ).toBeInTheDocument()
    expect(container.querySelector('.home-stats-bars--network-size')).not.toBeNull()
    expect(container.querySelector('.home-stats-card__chart--network-size')).not.toBeNull()
    expect(screen.getByText('Affiliation')).toBeInTheDocument()
    expect(screen.getByText('Jilin Agricultural University')).toBeInTheDocument()
    expect(screen.getByText('Changchun, Jilin, China')).toBeInTheDocument()
    expect(screen.getByText('First author: cuicui001116@163.com')).toBeInTheDocument()
    expect(screen.queryByText('PlantscNet authors')).not.toBeInTheDocument()
    expect(screen.queryByText('Yuling Cui')).not.toBeInTheDocument()
  })

  it('does not advertise the frontend stack in the footer', () => {
    const currentYear = new Date().getFullYear().toString()

    const { container } = render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )
    const footer = container.querySelector('.footer-note')

    expect(screen.getByRole('img', { name: /PlantscNet mini logo/i })).toBeInTheDocument()
    expect(container.querySelectorAll('.nav-link__icon')).toHaveLength(6)
    expect(footer?.textContent).toContain('PlantscNet | Jilin Agricultural University | Changchun, Jilin, China')
    expect(footer?.textContent).toContain(currentYear)
    expect(footer?.textContent).not.toContain('First author:')
    expect(screen.queryByText(/Built with React, TypeScript, Vite, and pnpm/i)).not.toBeInTheDocument()
  })

  it('shows custom tooltips when hovering individual chart items', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(container.querySelector('title')).toBeNull()

    const networkLabel = screen
      .getAllByText('Arabidopsis thaliana')
      .find((node) => node.tagName.toLowerCase() === 'text')
    const networkRow = networkLabel?.closest('g')
    const networkHitbox = networkRow?.querySelector('.home-stats-bars__hitbox')
    expect(networkRow).not.toBeNull()
    expect(networkHitbox).not.toBeNull()
    expect(screen.queryByText('1,042,452 edges')).not.toBeInTheDocument()
    fireEvent.mouseMove(networkHitbox!, { clientX: 240, clientY: 120 })
    expect(screen.getByText('1,042,452 edges')).toBeInTheDocument()
    fireEvent.mouseLeave(networkHitbox!)
    expect(screen.queryByText('1,042,452 edges')).not.toBeInTheDocument()

    const rootLollipopLabel = screen
      .getAllByText('Root')
      .find((node) => node.tagName.toLowerCase() === 'text')
    const rootItem = rootLollipopLabel?.closest('g')
    const rootHitbox = rootItem?.querySelector('.home-stats-lollipop__hitline')
    expect(rootItem).not.toBeNull()
    expect(rootHitbox).not.toBeNull()
    fireEvent.mouseMove(rootHitbox!, { clientX: 96, clientY: 142 })
    expect(screen.getByText('57 samples')).toBeInTheDocument()
  })
})

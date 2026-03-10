import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomeCoverageMap } from '@/components/HomeCoverageMap'

const species = [
  'Arabidopsis thaliana',
  'Brassica rapa',
  'Fragaria vesca',
  'Gossypium arboreum',
  'Gossypium hirsutum',
  'Glycine max',
  'Oryza sativa',
  'Populus trichocarpa',
  'Solanum lycopersicum',
  'Zea mays',
]

const tissues = [
  'Root',
  'Leaf',
  'Callus',
  'Ear',
  'Embryo',
  'Endosperm',
  'Meiotic Cells',
  'Nodule',
  'Opposite SDX cells',
  'Shoot Apical Meristem',
  'Tension SDX cells',
  'Vertical SDX cells',
  'young inflorescences',
]

describe('HomeCoverageMap', () => {
  it('renders as a lightweight hover map without a selected-node panel', () => {
    const { container } = render(<HomeCoverageMap species={species} tissues={tissues} />)

    expect(container.querySelector('.home-coverage-card--responsive')).not.toBeNull()
    expect(container.querySelector('.home-coverage-map--responsive')).not.toBeNull()
    expect(screen.queryByText('Selected node')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('separates Zea mays and Vertical SDX cells labels on the left side', () => {
    const { container } = render(<HomeCoverageMap species={species} tissues={tissues} />)

    const zeaLabel = Array.from(container.querySelectorAll('text')).find(
      (node) => node.textContent === 'Zea mays',
    )
    const verticalLabel = Array.from(container.querySelectorAll('text')).find(
      (node) => node.textContent === 'Vertical SDX cells',
    )

    expect(zeaLabel).not.toBeUndefined()
    expect(verticalLabel).not.toBeUndefined()

    const zeaY = Number(zeaLabel?.getAttribute('y'))
    const verticalY = Number(verticalLabel?.getAttribute('y'))
    expect(Math.abs(zeaY - verticalY)).toBeGreaterThanOrEqual(18)
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('globals.css units', () => {
  it('uses rem for semantic sizing and keeps only hairline px values', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')
    const pxValues = css.match(/\b\d+(?:\.\d+)?px\b/g) ?? []
    const disallowed = pxValues.filter(
      (value) => value !== '1px' && value !== '2px' && value !== '2.5px' && value !== '3px',
    )

    expect(disallowed).toEqual([])
  })

  it('keeps the home network-size species labels at the larger dedicated size', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(
      /\.home-stats-bars--network-size \.home-stats-bars__label\s*\{\s*font-size:\s*1rem;/,
    )
  })

  it('anchors the vertical lollipop x-axis labels from a shared top-aligned end point', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(
      /\.home-stats-lollipop__label\s*\{[^}]*font-size:\s*0\.9rem;[^}]*text-anchor:\s*end;[^}]*dominant-baseline:\s*text-after-edge;/s,
    )
  })

  it('uses chart-specific entrance animations for bars and lollipops', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(
      /\.home-stats-bars__fill\s*\{[^}]*transform-box:\s*fill-box;[^}]*transform-origin:\s*left center;[^}]*animation:\s*chartGrowX 900ms\b/s,
    )
    expect(css).toMatch(
      /\.home-stats-lollipop__stem\s*\{[^}]*transform-box:\s*fill-box;[^}]*transform-origin:\s*center bottom;[^}]*animation:\s*chartGrowY 860ms\b/s,
    )
    expect(css).toMatch(
      /\.home-stats-lollipop__dot\s*\{[^}]*transform-box:\s*fill-box;[^}]*transform-origin:\s*center center;[^}]*animation:\s*chartPopIn 420ms\b/s,
    )
    expect(css).toMatch(/@keyframes\s+chartGrowX\s*\{/)
    expect(css).toMatch(/@keyframes\s+chartGrowY\s*\{/)
    expect(css).toMatch(/@keyframes\s+chartPopIn\s*\{/)
  })

  it('keeps the affiliation card on the shared utility-card background', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).not.toMatch(/\.home-utility-card--contact\s*\{[^}]*background:/s)
  })

  it('matches the lower home utility grid widths to the upper stats band layout', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(
      /\.home-utility-grid\s*\{[^}]*grid-template-columns:\s*0\.96fr 1\.18fr 1\.04fr;/s,
    )
  })

  it('adds item-level hover highlighting to the bar and lollipop charts', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(
      /\.home-stats-bars__row\.is-active \.home-stats-bars__track\s*\{[^}]*fill:/s,
    )
    expect(css).toMatch(
      /\.home-stats-bars__row\.is-active \.home-stats-bars__fill\s*\{[^}]*drop-shadow/s,
    )
    expect(css).toMatch(
      /\.home-stats-lollipop__item\.is-active \.home-stats-lollipop__value,\s*\.home-stats-lollipop__item\.is-active \.home-stats-lollipop__label\s*\{[^}]*fill:/s,
    )
    expect(css).toMatch(
      /\.home-stats-lollipop__item\.is-active \.home-stats-lollipop__dot\s*\{[^}]*drop-shadow/s,
    )
  })

  it('caps the hero logo more tightly on 2K-and-up displays without changing the base size', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(/\.home-hero__logo-image\s*\{[^}]*width:\s*min\(75%, 40rem\);/s)
    expect(css).toMatch(
      /@media \(min-width:\s*120rem\)\s*\{[^}]*\.home-hero__logo-image\s*\{[^}]*width:\s*min\(68%, 30rem\);/s,
    )
  })

  it('keeps the hero primary CTA on the same light base as the secondary buttons', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(/\.cta-button\s*\{[^}]*background:\s*rgba\(238, 252, 232, 0\.95\);/s)
    expect(css).toMatch(
      /\.cta-button--solid\s*\{[^}]*background:\s*rgba\(238, 252, 232, 0\.95\);[^}]*color:\s*var\(--accent-deep\);[^}]*border:\s*1px solid rgba\(31, 111, 65, 0\.35\);/s,
    )
    expect(css).toMatch(
      /\.cta-button--solid:hover\s*\{[^}]*background:\s*rgba\(226, 245, 220, 0\.96\);/s,
    )
  })

  it('gives browse sample children an obvious button-like affordance', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(
      /\.browse-sample-button\s*\{[^}]*border:\s*1px solid rgba\(31, 111, 65, 0\.14\);[^}]*border-left:\s*2px solid rgba\(31, 111, 65, 0\.22\);[^}]*border-radius:\s*0\.72rem;[^}]*background:\s*rgba\(247, 251, 243, 0\.84\);[^}]*box-shadow:\s*0 0\.4rem 1rem -0\.95rem rgba\(21, 73, 42, 0\.45\);/s,
    )
    expect(css).toMatch(
      /\.browse-sample-button:hover\s*\{[^}]*border-color:\s*rgba\(31, 111, 65, 0\.24\);[^}]*border-left-color:\s*rgba\(31, 111, 65, 0\.44\);[^}]*background:\s*rgba\(236, 247, 231, 0\.96\);/s,
    )
  })

  it('draws a tree connector line beside expanded browse child nodes', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(
      /\.browse-sample-list\s*\{[^}]*padding-left:\s*1rem;/s,
    )
    expect(css).toMatch(
      /\.browse-sample-item\s*\{[^}]*position:\s*relative;[^}]*padding-left:\s*0\.9rem;/s,
    )
    expect(css).toMatch(
      /\.browse-sample-item::before\s*\{[^}]*width:\s*0\.72rem;[^}]*border-top:\s*2\.5px solid var\(--accent-soft\);/s,
    )
    expect(css).toMatch(
      /\.browse-sample-item::after\s*\{[^}]*border-left:\s*2\.5px solid var\(--accent-soft\);/s,
    )
    expect(css).toMatch(
      /\.browse-sample-item:last-child::after\s*\{[^}]*bottom:\s*50%;/s,
    )
  })

  it('makes the active browse donut slice feel visibly lifted above the rest', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(
      /\.browse-pie-sector--active\s*\{[^}]*transform:\s*translate\(var\(--sector-shift-x\), var\(--sector-shift-y\)\) scale\(1\.06\);/s,
    )
    expect(css).toMatch(
      /\.browse-pie-sector--active\s*\{[^}]*filter:\s*saturate\(1\.14\) brightness\(1\.1\) drop-shadow\(0 0\.55rem 0\.85rem rgba\(24, 76, 42, 0\.22\)\);/s,
    )
  })

  it('gives the browse donut a larger footprint and tighter multi-line center label support', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(/\.browse-pie-chart\s*\{[^}]*width:\s*min\(100%, 14\.75rem\);/s)
    expect(css).toMatch(
      /\.browse-pie-chart__center-text\s*\{[^}]*width:\s*5\.9rem;[^}]*transform:\s*translate\(-50%, -50%\);/s,
    )
    expect(css).toMatch(
      /\.browse-pie-chart__center-text--long\s*\{[^}]*width:\s*6\.2rem;/s,
    )
    expect(css).toMatch(/\.browse-pie-chart__center-line\s*\{[^}]*display:\s*block;/s)
  })

  it('keeps the default browse stage on an obvious diagonal placeholder surface', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(
      /\.browse-main__placeholder\s*\{[^}]*min-height:\s*calc\(var\(--browse-pane-height\)\s*-\s*2\.3rem\);/s,
    )
    expect(css).toMatch(
      /\.browse-main__placeholder\s*\{[^}]*background-color:\s*rgba\(243, 249, 239, 0\.94\);/s,
    )
    expect(css).toMatch(
      /\.browse-main__placeholder\s*\{[^}]*repeating-linear-gradient\(\s*-45deg,\s*rgba\(50, 120, 75, 0\.11\)\s*0,\s*rgba\(50, 120, 75, 0\.11\)\s*0\.75rem,\s*rgba\(243, 249, 239, 0\)\s*0\.75rem,\s*rgba\(243, 249, 239, 0\)\s*1\.5rem/s,
    )
  })

  it('uses one document scroll for browse details while keeping the sidebar sticky', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(
      /\.browse-page__sidebar\s*\{[^}]*position:\s*sticky;[^}]*top:\s*1rem;/s,
    )
    expect(css).toMatch(
      /\.browse-explorer\s*\{[^}]*max-height:\s*calc\(100vh\s*-\s*2rem\);[^}]*overflow:\s*hidden;/s,
    )
    expect(css).toMatch(
      /\.browse-page__main\s*\{[^}]*height:\s*auto;[^}]*min-width:\s*0;/s,
    )
    expect(css).toMatch(
      /\.browse-page__main\s*\{[^}]*overflow-y:\s*visible;/s,
    )
    expect(css).toMatch(
      /\.browse-explorer__body\s*\{[^}]*overflow-y:\s*auto;/s,
    )
  })

  it('centers both headers and cell values in the browse metadata table', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')

    expect(css).toMatch(
      /\.browse-metadata-table th,\s*\.browse-metadata-table td\s*\{[^}]*text-align:\s*center;/s,
    )
  })

  it('applies a site-wide soft green scrollbar theme for page and nested scroll areas', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')
    const tokens = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')

    expect(tokens).toMatch(/--scrollbar-track:\s*rgba\(228, 241, 223, 0\.82\);/)
    expect(tokens).toMatch(/--scrollbar-thumb:\s*rgba\(122, 182, 132, 0\.92\);/)
    expect(css).toMatch(/html\s*\{[^}]*scrollbar-color:\s*var\(--scrollbar-thumb\) var\(--scrollbar-track\);/s)
    expect(css).toMatch(
      /body,\s*\*\s*\{[^}]*scrollbar-width:\s*thin;[^}]*scrollbar-color:\s*var\(--scrollbar-thumb\) var\(--scrollbar-track\);/s,
    )
    expect(css).toMatch(/\*::-webkit-scrollbar\s*\{[^}]*width:\s*0\.72rem;[^}]*height:\s*0\.72rem;/s)
    expect(css).toMatch(/\*::-webkit-scrollbar-thumb\s*\{[^}]*border-radius:\s*999rem;/s)
  })

})

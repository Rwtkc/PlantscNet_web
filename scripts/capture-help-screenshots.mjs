import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PLANTSCNET_SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:5173'
const outputDir = path.resolve('public-static/help')

async function waitForSettledPage(page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(900)
}

async function saveViewport(page, fileName) {
  await page.screenshot({
    path: path.join(outputDir, fileName),
    fullPage: false,
  })
  console.log(`saved ${fileName}`)
}

async function saveElement(locator, fileName) {
  await locator.screenshot({
    path: path.join(outputDir, fileName),
  })
  console.log(`saved ${fileName}`)
}

async function gotoPage(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' })
  await waitForSettledPage(page)
}

async function clickIfVisible(locator, timeout = 2500) {
  try {
    await locator.waitFor({ state: 'visible', timeout })
    await locator.click()
    return true
  } catch {
    return false
  }
}

async function captureSearchResults(page) {
  await gotoPage(page, '/search')
  const tfCard = page.locator('.search-module-card').first()
  await tfCard.locator('.search-picker__trigger').click()
  await tfCard.locator('[role="option"]').first().waitFor({ state: 'visible', timeout: 15000 })
  await tfCard.locator('[role="option"]').filter({ hasText: 'Actinidia chinensis' }).click()
  await tfCard.locator('input.query-input').fill('Actinidia03244')
  await page.waitForTimeout(500)
  await saveViewport(page, 'search-form.png')

  await tfCard.getByRole('button', { name: 'Search by TF' }).click()
  await page.locator('.search-results-grid').waitFor({ state: 'visible', timeout: 15000 })
  await page.waitForTimeout(2500)
  await saveElement(page.locator('.search-results-grid'), 'search-results.png')
}

async function captureBrowseNetworkPreview(page) {
  const networkPanel = page.locator('.browse-network-preview').last()
  await networkPanel.waitFor({ state: 'visible', timeout: 45000 })
  await page.waitForTimeout(2500)
  await networkPanel.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)

  const stage = networkPanel.locator('.browse-network-preview__stage')
  const stageBox = await stage.boundingBox()

  if (stageBox) {
    await page.mouse.move(stageBox.x + stageBox.width / 2, stageBox.y + stageBox.height / 2)
    await page.mouse.wheel(0, -900)
    await page.waitForTimeout(700)
  }

  await saveElement(page.locator('.browse-panel').filter({ has: networkPanel }).last(), 'browse-network-preview.png')
}

async function captureToolsResults(page) {
  await gotoPage(page, '/tools')
  await saveViewport(page, 'tools-form-empty.png')

  await clickIfVisible(page.getByRole('button', { name: 'Fill Example' }))
  await page.locator('textarea').fill(
    ['AL1G10220', 'AL1G45940', 'AL3G48760', 'AL6G48090', 'AL6G19430'].join('\n'),
  )
  await page.waitForTimeout(500)
  await saveViewport(page, 'tools-form-example.png')

  if (await clickIfVisible(page.getByRole('button', { name: 'Run prioritization' }))) {
    await page.getByText('Complete').waitFor({ timeout: 90000 }).catch(() => null)
    await page.waitForTimeout(1200)
    const results = page.locator('.tools-results').last()
    await results.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null)
    await saveElement(results, 'tools-neighborhood-results.png')
  }

  await clickIfVisible(page.getByRole('button', { name: 'Context Hub' }))
  await page.waitForTimeout(500)
  await clickIfVisible(page.getByRole('button', { name: 'Fill Example' }))
  await page.locator('textarea').fill(
    ['AL1G10220', 'AL1G45940', 'AL3G48760', 'AL6G48090', 'AL6G19430'].join('\n'),
  )
  if (await clickIfVisible(page.getByRole('button', { name: 'Run prioritization' }))) {
    await page.getByText('Complete').waitFor({ timeout: 90000 }).catch(() => null)
    await page.waitForTimeout(1200)
    const results = page.locator('.tools-results').last()
    await results.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null)
    await saveElement(results, 'tools-context-hub-results.png')
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
  })

  page.setDefaultTimeout(15000)

  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  try {
    await gotoPage(page, '/home')
    await saveViewport(page, 'home-overview.png')

    await gotoPage(page, '/browse')
    await saveViewport(page, 'browse-overview.png')
    await clickIfVisible(page.getByText('Arabidopsis thaliana').first())
    await page.waitForTimeout(2500)
    await saveViewport(page, 'browse-species-detail.png')
    await captureBrowseNetworkPreview(page)

    await captureSearchResults(page)
    await captureToolsResults(page)

    await gotoPage(page, '/download')
    await page.waitForTimeout(2500)
    await saveViewport(page, 'download-overview.png')
    await clickIfVisible(page.getByRole('button', { name: /Arabidopsis thaliana/i }))
    await page.waitForTimeout(700)
    await saveViewport(page, 'download-expanded.png')

    await gotoPage(page, '/contact')
    await page.waitForTimeout(3500)
    await saveViewport(page, 'contact-map.png')
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

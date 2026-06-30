import { chromium } from 'playwright'

const DEFAULT_PAGE_URL = '/#/article-figure'
const DEFAULT_VIEWPORT = { height: 1200, width: 1600 }
const MIN_EXPORT_WIDTH = 100
const SCREENSHOT_SELECTOR = '.article-figure-sheet'

export class ArticleFigureExportError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.name = 'ArticleFigureExportError'
    this.statusCode = statusCode
  }
}

export function parseArticleFigureExportWidth(value) {
  const width = Number.parseInt(String(value ?? ''), 10)

  if (!Number.isFinite(width) || width < MIN_EXPORT_WIDTH) {
    throw new ArticleFigureExportError(`PNG width must be an integer greater than or equal to ${MIN_EXPORT_WIDTH}.`, 400)
  }

  return Math.round(width)
}

export function buildExpectedAppOrigin(protocol, host) {
  return `${protocol}://${host}`
}

export function resolveArticleFigurePageUrl({ expectedOrigin, requestedPageUrl }) {
  if (!requestedPageUrl) {
    return `${expectedOrigin}${DEFAULT_PAGE_URL}`
  }

  let parsedUrl
  let expectedUrl

  try {
    parsedUrl = new URL(requestedPageUrl)
    expectedUrl = new URL(expectedOrigin)
  } catch {
    throw new ArticleFigureExportError('Invalid article figure page URL.', 400)
  }

  if (
    parsedUrl.protocol !== expectedUrl.protocol ||
    parsedUrl.hostname.toLowerCase() !== expectedUrl.hostname.toLowerCase()
  ) {
    throw new ArticleFigureExportError(
      'Article figure export only allows page URLs on the current site host.',
      400,
    )
  }

  const hashPath = parsedUrl.hash.replace(/^#/, '') || '/'
  if (!hashPath.startsWith('/article-figure')) {
    throw new ArticleFigureExportError('Article figure export only supports the article-figure page.', 400)
  }

  return parsedUrl.toString()
}

function getScreenshotClipSize(box) {
  return {
    height: Math.ceil(box.y + box.height) - Math.floor(box.y),
    width: Math.ceil(box.x + box.width) - Math.floor(box.x),
  }
}

async function prepareArticleFigurePage(page, pageUrl) {
  await page.goto(pageUrl, { waitUntil: 'networkidle' })

  const sheet = page.locator(SCREENSHOT_SELECTOR)
  await sheet.waitFor({ state: 'visible' })
  await page.waitForFunction((selector) => {
    const node = document.querySelector(selector)
    if (!node) {
      return false
    }

    if ('fonts' in document && document.fonts.status !== 'loaded') {
      return false
    }

    const images = Array.from(node.querySelectorAll('img'))
    return images.every((image) => image.complete)
  }, SCREENSHOT_SELECTOR)
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })

  return sheet
}

async function measureArticleFigure(browser, pageUrl) {
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    viewport: DEFAULT_VIEWPORT,
  })

  try {
    const page = await context.newPage()
    const sheet = await prepareArticleFigurePage(page, pageUrl)
    const box = await sheet.boundingBox()

    if (!box) {
      throw new ArticleFigureExportError('Could not locate article figure content for export.', 500)
    }

    return getScreenshotClipSize(box)
  } finally {
    await context.close()
  }
}

function normalizePlaywrightLaunchError(error) {
  if (error instanceof Error && /browserType\.launch/.test(error.message)) {
    return new ArticleFigureExportError(
      'Chromium is unavailable for export. Run `pnpm exec playwright install chromium` on this machine.',
      500,
    )
  }

  return error
}

export async function renderArticleFigurePng({ pageUrl, width }) {
  let browser

  try {
    browser = await chromium.launch({ headless: true })
    const screenshotSize = await measureArticleFigure(browser, pageUrl)
    const deviceScaleFactor = width / screenshotSize.width
    const context = await browser.newContext({
      deviceScaleFactor,
      viewport: DEFAULT_VIEWPORT,
    })

    try {
      const page = await context.newPage()
      const sheet = await prepareArticleFigurePage(page, pageUrl)
      return await sheet.screenshot({
        scale: 'device',
        type: 'png',
      })
    } finally {
      await context.close()
    }
  } catch (error) {
    throw normalizePlaywrightLaunchError(error)
  } finally {
    await browser?.close()
  }
}

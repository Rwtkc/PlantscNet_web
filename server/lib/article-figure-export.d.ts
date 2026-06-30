export class ArticleFigureExportError extends Error {
  constructor(message: string, statusCode?: number)
  statusCode: number
}

export function parseArticleFigureExportWidth(value: unknown): number

export function buildExpectedAppOrigin(protocol: string, host: string): string

export function resolveArticleFigurePageUrl(input: {
  expectedOrigin: string
  requestedPageUrl?: string | null
}): string

export function renderArticleFigurePng(input: {
  pageUrl: string
  width: number
}): Promise<Buffer>

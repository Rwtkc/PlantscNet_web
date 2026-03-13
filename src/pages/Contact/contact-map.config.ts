export const contactLocation = {
  name: 'College of Life Sciences, Jilin Agricultural University',
  address: 'Jilin Agricultural University, Changchun, Jilin, China',
  poiId: 'B01AF12N7M',
  coordinates: {
    lat: 43.817,
    lng: 125.451,
  },
  zoom: 18,
}

const hardcodedContactMapConfig = {
  key: '2680c031d1dd79c61d481adf65aa5b0e',
  securityJsCode: '22cf2316f89f123486662ba2491cefce',
}

export interface ContactMapEnv {
  VITE_AMAP_JS_API_KEY?: string
  VITE_AMAP_SECURITY_JS_CODE?: string
}

export interface ResolvedContactMapConfig {
  isConfigured: boolean
  key: string | null
  securityJsCode: string | null
  errorMessage: string | null
}

function normalizeEnvValue(value: string | undefined) {
  const normalized = value?.trim()
  if (!normalized) {
    return null
  }

  return normalized
}

export function resolveContactMapConfig(
  env: ContactMapEnv = import.meta.env as ContactMapEnv,
): ResolvedContactMapConfig {
  const key =
    normalizeEnvValue(hardcodedContactMapConfig.key) ??
    normalizeEnvValue(env.VITE_AMAP_JS_API_KEY)
  const securityJsCode =
    normalizeEnvValue(hardcodedContactMapConfig.securityJsCode) ??
    normalizeEnvValue(env.VITE_AMAP_SECURITY_JS_CODE)
  const missingEnvVars = [
    !key ? 'VITE_AMAP_JS_API_KEY' : null,
    !securityJsCode ? 'VITE_AMAP_SECURITY_JS_CODE' : null,
  ].filter((envVar): envVar is string => Boolean(envVar))

  if (missingEnvVars.length > 0) {
    return {
      isConfigured: false,
      key,
      securityJsCode,
      errorMessage: `AMap JS API is not configured. Missing ${missingEnvVars.join(' and ')}.`,
    }
  }

  return {
    isConfigured: true,
    key,
    securityJsCode,
    errorMessage: null,
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function buildContactMapInfoContent(resolvedAddress?: string | null) {
  const normalizedAddress = resolvedAddress?.trim()
  const address =
    normalizedAddress && normalizedAddress.length > 0
      ? normalizedAddress
      : contactLocation.address

  return [
    '<section class="contact-map-infowindow">',
    '<p class="contact-map-infowindow__eyebrow">PlantScNet contact</p>',
    `<h3 class="contact-map-infowindow__title">${escapeHtml(contactLocation.name)}</h3>`,
    `<p class="contact-map-infowindow__address">${escapeHtml(address)}</p>`,
    '</section>',
  ].join('')
}

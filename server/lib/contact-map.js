const amapStaticMapEndpoint = 'https://restapi.amap.com/v3/staticmap'

const contactLocation = {
  name: 'College of Life Sciences, Jilin Agricultural University',
  address: 'Jilin Agricultural University, Changchun, Jilin, China',
  coordinates: [125.451, 43.817],
}

const amapKey = '2680c031d1dd79c61d481adf65aa5b0e'

function buildStaticMapUrl() {
  const [lng, lat] = contactLocation.coordinates
  const markers = `mid,0x2F7D4A,C:${lng},${lat}`
  const labels = `吉林农大生命科学学院,0,1,14,0xFFFFFF,0x2F7D4A:${lng},${lat}`
  const search = new URLSearchParams({
    key: amapKey,
    location: `${lng},${lat}`,
    zoom: '16',
    size: '1200*420',
    scale: '2',
    traffic: '1',
    markers,
    labels,
  })

  return `${amapStaticMapEndpoint}?${search.toString()}`
}

export function getContactLocationMeta() {
  return contactLocation
}

export async function fetchContactStaticMap() {
  const response = await fetch(buildStaticMapUrl())

  if (!response.ok) {
    throw new Error(`Failed to fetch AMap static image (${response.status}).`)
  }

  const contentType = response.headers.get('content-type') ?? 'image/png'
  const arrayBuffer = await response.arrayBuffer()

  return {
    contentType,
    buffer: Buffer.from(arrayBuffer),
  }
}

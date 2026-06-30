export type ScopeDatum = {
  label: string
  value: number
  eyebrow: string
}

export type ChartDatum = {
  label: string
  value: number
  tone?: 'deep' | 'soft'
}

export const homeScopeStats: ScopeDatum[] = [
  {
    label: 'Species',
    value: 30,
    eyebrow: 'Portal scope',
  },
  {
    label: 'scRNA species',
    value: 30,
    eyebrow: 'Data type',
  },
  {
    label: 'scATAC species',
    value: 4,
    eyebrow: 'Data type',
  },
  {
    label: 'Eudicot species',
    value: 20,
    eyebrow: 'Major clade',
  },
  {
    label: 'Monocot species',
    value: 9,
    eyebrow: 'Major clade',
  },
  {
    label: 'Green alga',
    value: 1,
    eyebrow: 'Other lineage',
  },
]

export const tissueRepresentation: ChartDatum[] = [
  { label: 'Root', value: 137, tone: 'deep' },
  { label: 'Leaf', value: 35, tone: 'deep' },
  { label: 'Seed', value: 18, tone: 'soft' },
  { label: 'Nodule', value: 16, tone: 'soft' },
  { label: 'Bud', value: 8, tone: 'soft' },
  { label: 'Embryo', value: 8, tone: 'soft' },
  { label: 'Shoot', value: 6, tone: 'soft' },
  { label: 'Shoot Apical Meristem', value: 5, tone: 'soft' },
  { label: 'Epidermis Fiber', value: 5, tone: 'soft' },
  { label: 'Opposite SDX cells', value: 4, tone: 'soft' },
  { label: 'Tension SDX cells', value: 4, tone: 'soft' },
  { label: 'Vertical SDX cells', value: 4, tone: 'soft' },
  { label: 'Young inflorescences', value: 4, tone: 'soft' },
]

export const integratedNetworkSizes: ChartDatum[] = [
  { label: 'Arabidopsis thaliana', value: 3201513, tone: 'deep' },
  { label: 'Glycine max', value: 2528872, tone: 'deep' },
  { label: 'Brassica oleracea', value: 1748060, tone: 'deep' },
  { label: 'Zea mays', value: 570179, tone: 'deep' },
  { label: 'Arabidopsis lyrata', value: 410710, tone: 'deep' },
  { label: 'Populus trichocarpa', value: 303413, tone: 'deep' },
  { label: 'Oryza sativa', value: 293089, tone: 'deep' },
  { label: 'Lotus japonicus', value: 227651, tone: 'soft' },
  { label: 'Capsella rubella', value: 189916, tone: 'soft' },
  { label: 'Sorghum bicolor', value: 1413, tone: 'soft' },
]

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCompactCount(value: number) {
  return compactFormatter.format(value)
}

export function formatExactCount(value: number) {
  return value.toLocaleString('en-US')
}

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
    value: 10,
    eyebrow: 'Portal scope',
  },
  {
    label: 'Tissues',
    value: 13,
    eyebrow: 'Tracked categories',
  },
  {
    label: 'Eudicot species',
    value: 8,
    eyebrow: 'Major clade',
  },
  {
    label: 'Monocot species',
    value: 2,
    eyebrow: 'Major clade',
  },
  {
    label: 'Integrated final networks',
    value: 6,
    eyebrow: 'XGBoost-derived',
  },
  {
    label: 'Single-sample final networks',
    value: 4,
    eyebrow: 'pySCENIC-derived',
  },
]

export const tissueRepresentation: ChartDatum[] = [
  { label: 'Root', value: 57, tone: 'deep' },
  { label: 'Leaf', value: 19, tone: 'deep' },
  { label: 'Embryo', value: 8, tone: 'soft' },
  { label: 'Opposite SDX cells', value: 4, tone: 'soft' },
  { label: 'Tension SDX cells', value: 4, tone: 'soft' },
  { label: 'Endosperm', value: 4, tone: 'soft' },
  { label: 'Vertical SDX cells', value: 4, tone: 'soft' },
  { label: 'young inflorescences', value: 4, tone: 'soft' },
  { label: 'Callus', value: 2, tone: 'soft' },
  { label: 'Shoot Apical Meristem', value: 2, tone: 'soft' },
  { label: 'Nodule', value: 2, tone: 'soft' },
  { label: 'Ear', value: 1, tone: 'soft' },
  { label: 'Meiotic Cells', value: 1, tone: 'soft' },
]

export const integratedNetworkSizes: ChartDatum[] = [
  { label: 'Arabidopsis thaliana', value: 1042452, tone: 'deep' },
  { label: 'Glycine max', value: 105282, tone: 'deep' },
  { label: 'Brassica rapa', value: 80890, tone: 'soft' },
  { label: 'Oryza sativa', value: 76133, tone: 'deep' },
  { label: 'Zea mays', value: 70532, tone: 'deep' },
  { label: 'Populus trichocarpa', value: 40737, tone: 'deep' },
  { label: 'Gossypium hirsutum', value: 30634, tone: 'deep' },
  { label: 'Fragaria vesca', value: 20051, tone: 'soft' },
  { label: 'Gossypium arboreum', value: 14722, tone: 'soft' },
  { label: 'Solanum lycopersicum', value: 9790, tone: 'soft' },
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

export const speciesCatalog = [
  { id: 'ath', label: 'Arabidopsis thaliana' },
  { id: 'bra', label: 'Brassica rapa' },
  { id: 'fve', label: 'Fragaria vesca' },
  { id: 'gar', label: 'Gossypium arboreum' },
  { id: 'ghi', label: 'Gossypium hirsutum' },
  { id: 'gly', label: 'Glycine max' },
  { id: 'osa', label: 'Oryza sativa' },
  { id: 'ptr', label: 'Populus trichocarpa' },
  { id: 'sly', label: 'Solanum lycopersicum' },
  { id: 'zea', label: 'Zea mays' },
]

export const speciesById = new Map(speciesCatalog.map((species) => [species.id, species]))

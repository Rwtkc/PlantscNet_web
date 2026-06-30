import type { DataModality } from '@/pages/Browse/browse.types'
import type { SearchMode } from './search.types'

type SearchExampleBySpecies = Record<string, Record<SearchMode, string>>

const SEARCH_EXAMPLES: Record<DataModality, SearchExampleBySpecies> = {
  rna: {
    ach: { tf: 'Actinidia03244', target: 'Actinidia09086' },
    aly: { tf: 'AL3G17850', target: 'AL8G11610' },
    ath: { tf: 'AT2G38470', target: 'AT3G55980' },
    bdi: { tf: 'Bradi1g00219', target: 'Bradi5g03472' },
    bol: { tf: 'gene-LOC106316844', target: 'gene-LOC106313926' },
    bra: { tf: 'ARF11', target: 'LOC103831986' },
    cas: { tf: 'Csa00382s290', target: 'Csa01g020330' },
    cre: { tf: 'Cre07.g353500', target: 'Cre17.g729000' },
    cro: { tf: 'CRO_01G004530', target: 'CRO_03G030770' },
    cru: { tf: 'Carub.0001s3031', target: 'Carub.0001s1963' },
    egr: { tf: 'Eucgr.A00102', target: 'Eucgr.E00554' },
    esa: { tf: 'Thhalv10000026m.g', target: 'Thhalv10010354m.g' },
    fve: { tf: 'gene00738-v1.0-hybrid', target: 'gene25039-v1.0-hybrid' },
    gar: { tf: 'Cotton_A_00064', target: 'Cotton_A_33119' },
    ghi: { tf: 'Gh_A01G0151', target: 'Gh_D08G1578' },
    gly: { tf: 'GLYMA_15G166200', target: 'GLYMA_09G095400' },
    lja: { tf: 'LotjaGi3g1v0004200', target: 'LotjaGi6g1v0329200' },
    mes: { tf: 'Manes.01G065200', target: 'Manes.03G154700' },
    mtr: { tf: 'Medtr8g028655', target: 'Medtr6g018390' },
    osa: { tf: 'LOC_OS01G61080', target: 'LOC_OS03G18740' },
    pha: { tf: 'Pahal.A00033', target: 'Pahal.D03488' },
    phe: { tf: 'PH02Gene00916', target: 'PH02Gene07887' },
    ptr: { tf: 'POTRI.003G150800', target: 'POTRI.008G213400' },
    pvu: { tf: 'Phvul.001G008200', target: 'Phvul.010G000600' },
    sbi: { tf: 'SOBIC.003G008700', target: 'SOBIC.007G153700' },
    sly: { tf: 'Solyc01g008230.2', target: 'Solyc02g089560.2' },
    spa: { tf: 'Tp1g00020', target: 'Tp2g13110' },
    svi: { tf: 'Sevir.1G003600', target: 'Sevir.6G101200' },
    tae: { tf: 'TraesCS1A03G0081500', target: 'TraesCS1A03G0672700' },
    zea: { tf: 'GRMZM2G060253', target: 'GRMZM2G004924' },
  },
  atac: {
    ath: { tf: 'AT2G46590', target: 'AT4G25500' },
    gly: { tf: 'GLYMA_16G021000', target: 'GLYMA_01G058200' },
    osa: { tf: 'LOC_OS01G61080', target: 'LOC_OS06G44980' },
    zea: { tf: 'GRMZM2G096358', target: 'GRMZM2G053458' },
  },
}

export function getSearchExample(
  modality: DataModality,
  mode: SearchMode,
  speciesId: string | undefined,
  availableSpeciesIds: string[],
) {
  const examples = SEARCH_EXAMPLES[modality]
  const preferredSpeciesId = speciesId && examples[speciesId] ? speciesId : availableSpeciesIds.find((id) => examples[id])

  if (!preferredSpeciesId) {
    return null
  }

  const query = examples[preferredSpeciesId]?.[mode]

  return query ? { speciesId: preferredSpeciesId, query } : null
}

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  __resetBrowseDataCacheForTests,
  getSampleDetail,
  parseSampleInformationLine,
  parseTfTargetCount,
} from './browse-data.js'

describe('browse data parsing', () => {
  let tempRoot = ''

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'plantscnet-browse-'))
    process.env.PLANTSCNET_DATA_DIR = path.join(tempRoot, 'data')
    process.env.PLANTSCNET_SPECIES_META_DIR = path.join(tempRoot, 'species_meta_data')
    __resetBrowseDataCacheForTests()
  })

  afterEach(async () => {
    __resetBrowseDataCacheForTests()
    delete process.env.PLANTSCNET_DATA_DIR
    delete process.env.PLANTSCNET_SPECIES_META_DIR

    if (tempRoot) {
      await fs.rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('parses standard sample information rows', () => {
    const record = parseSampleInformationLine(
      { id: 'ath', label: 'Arabidopsis thaliana' },
      'tf_target_GSE161332_PRJNA677901.txt SRP292306 Leaf PMID: 33955487',
    )

    expect(record).toEqual({
      speciesId: 'ath',
      speciesLabel: 'Arabidopsis thaliana',
      fileName: 'tf_target_GSE161332_PRJNA677901.txt',
      sampleId: 'SRP292306',
      tissue: 'Leaf',
      pubmedId: '33955487',
    })
  })

  it('parses sample information rows with an extra accession token', () => {
    const record = parseSampleInformationLine(
      { id: 'osa', label: 'Oryza sativa' },
      'SRX7814224.txt GSM4363200 SRX7814224 Root 33352304',
    )

    expect(record).toEqual({
      speciesId: 'osa',
      speciesLabel: 'Oryza sativa',
      fileName: 'SRX7814224.txt',
      sampleId: 'SRX7814224',
      tissue: 'Root',
      pubmedId: '33352304',
    })
  })

  it('prefers SRX-style accessions over GSM accessions for ghi-like rows', () => {
    const record = parseSampleInformationLine(
      { id: 'ghi', label: 'Gossypium hirsutum' },
      'tf_target_GSM7785433_PRJNA1018465.txt GSM7785433 SRX21818849 Leaf 37849250',
    )

    expect(record).toEqual({
      speciesId: 'ghi',
      speciesLabel: 'Gossypium hirsutum',
      fileName: 'tf_target_GSM7785433_PRJNA1018465.txt',
      sampleId: 'SRX21818849',
      tissue: 'Leaf',
      pubmedId: '37849250',
    })
  })

  it('counts tf-target rows after the header line', () => {
    expect(parseTfTargetCount('TF\ttarget\nAT1\tAT2\nAT3\tAT4\n')).toBe(2)
  })

  it('loads sample detail rows and metadata using a lowercase species meta directory', async () => {
    const dataDir = path.join(tempRoot, 'data', 'ath')
    const metaDir = path.join(tempRoot, 'species_meta_data', 'ath', 'SRP292306')

    await fs.mkdir(dataDir, { recursive: true })
    await fs.mkdir(metaDir, { recursive: true })

    await fs.writeFile(
      path.join(dataDir, 'sample_imformation.txt'),
      'tf_target_GSE161332_PRJNA677901.txt SRP292306 Leaf PMID: 33955487\n',
      'utf8',
    )
    await fs.writeFile(
      path.join(dataDir, 'tf_target_GSE161332_PRJNA677901.txt'),
      [
        'TF\ttarget\timportance_score',
        ...Array.from({ length: 12 }, (_, index) => `AT1G0106${index}\tAT2G2499${index}\t${0.8 + index / 1000}`),
      ].join('\n'),
      'utf8',
    )
    await fs.writeFile(
      path.join(metaDir, 'meta_data.json'),
      JSON.stringify({
        organism: 'Arabidopsis thaliana',
        experimentType: 'Expression profiling by high throughput sequencing',
        platform: '10x Genomics',
        datasetId: 'SRP292306',
        citation: 'Example citation',
        cells: '6250',
      }),
      'utf8',
    )

    const detail = await getSampleDetail('ath', 'SRP292306', { page: 2, pageSize: 10 })

    expect(detail).toEqual({
      sample: {
        speciesId: 'ath',
        speciesLabel: 'Arabidopsis thaliana',
        sampleId: 'SRP292306',
        tissue: 'Leaf',
        pubmedId: '33955487',
        fileName: 'tf_target_GSE161332_PRJNA677901.txt',
        datasetId: 'SRP292306',
        cells: '6250',
      },
      metadata: {
        organism: 'Arabidopsis thaliana',
        experimentType: 'Expression profiling by high throughput sequencing',
        platform: '10x Genomics',
        datasetId: 'SRP292306',
        citation: 'Example citation',
        cells: '6250',
      },
      rows: [
        {
          sampleId: 'SRP292306',
          datasetId: 'SRP292306',
          species: 'Arabidopsis thaliana',
          tissue: 'Leaf',
          cells: '6250',
          tf: 'AT1G010610',
          target: 'AT2G249910',
          importanceScore: '0.81',
        },
        {
          sampleId: 'SRP292306',
          datasetId: 'SRP292306',
          species: 'Arabidopsis thaliana',
          tissue: 'Leaf',
          cells: '6250',
          tf: 'AT1G010611',
          target: 'AT2G249911',
          importanceScore: '0.811',
        },
      ],
      pagination: {
        page: 2,
        pageSize: 10,
        totalRows: 12,
        totalPages: 2,
      },
    })
  })
})

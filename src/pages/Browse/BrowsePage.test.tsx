import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BrowsePage, { __resetBrowsePageCacheForTests } from '@/pages/Browse/BrowsePage'

const athSamples = [
  ['tf_target_GSE158761_PRJNA666436.txt', 'SRP285817', 'Root', '33822225'],
  ['tf_target_GSE161332_PRJNA677901.txt', 'SRP292306', 'Leaf', '33955487'],
  ['tf_target_GSM5194423_PRJNA716169.txt', 'SRX10404398', 'Embryo', '35605192'],
  ['tf_target_GSE188001_PRJNA800001.txt', 'SRP300001', 'Leaf', '35605192'],
  ['tf_target_GSE188002_PRJNA800002.txt', 'SRP300002', 'Root', '35605192'],
  ['tf_target_GSE188003_PRJNA800003.txt', 'SRP300003', 'Callus', '35605192'],
  ['tf_target_GSE188004_PRJNA800004.txt', 'SRP300004', 'Endosperm', '35605192'],
  ['tf_target_GSE188005_PRJNA800005.txt', 'SRP300005', 'Young inflorescences', '35605192'],
  ['tf_target_GSE188006_PRJNA800006.txt', 'SRP300006', 'Root', '35605192'],
  ['tf_target_GSE188007_PRJNA800007.txt', 'SRP300007', 'Leaf', '35605192'],
  ['tf_target_GSE188008_PRJNA800008.txt', 'SRP300008', 'Embryo', '35605192'],
  ['tf_target_GSE188009_PRJNA800009.txt', 'SRP300009', 'Callus', '35605192'],
] as const

const zeaSamples = [
  ['tf_target_GSE121039_PRJNA495390.txt', 'SRP164771', 'Meiotic Cells', '30948545'],
  ['tf_target_GSE173087_PRJNA454730.txt', 'SRP145013', 'Root', '34855479'],
  ['tf_target_GSM4774629_GSE157759.txt', 'SRX9102558', 'Leaf', '33955497'],
  ['tf_target_GSM4774630_GSE157759.txt', 'SRX9102559', 'Leaf', '33955497'],
] as const

const athSampleRecords = athSamples.map(([fileName, sampleId, tissue, pubmedId]) => ({
  speciesId: 'ath',
  speciesLabel: 'Arabidopsis thaliana',
  fileName,
  sampleId,
  tissue,
  pubmedId,
}))

const zeaSampleRecords = zeaSamples.map(([fileName, sampleId, tissue, pubmedId]) => ({
  speciesId: 'zea',
  speciesLabel: 'Zea mays',
  fileName,
  sampleId,
  tissue,
  pubmedId,
}))

const browseIndexResponse = {
  species: [
    { id: 'ath', label: 'Arabidopsis thaliana', sampleCount: athSampleRecords.length },
    { id: 'zea', label: 'Zea mays', sampleCount: zeaSampleRecords.length },
  ],
  samples: [...athSampleRecords, ...zeaSampleRecords],
}

const athTfTargetByFile: Record<string, string> = Object.fromEntries(
  athSamples.map(([fileName], index) => [
    fileName,
    [
      'TF\ttarget\timportance_score',
      `AT${index + 1}\tAT${index + 101}\t0.8`,
      `AT${index + 1}\tAT${index + 201}\t0.7`,
      `AT${index + 1}\tAT${index + 301}\t0.6`,
    ].join('\n'),
  ]),
)

const athTfTargetCounts = Object.fromEntries(
  Object.keys(athTfTargetByFile).map((fileName) => [fileName, 3]),
)

const zeaTfTargetCounts = Object.fromEntries(
  zeaSamples.map(([fileName], index) => [fileName, index + 2]),
)

const athSampleDetailResponse = {
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
    citation:
      'Kim JY, Symeonidi E, Pang TY, Denyer T et al. Distinct identities of leaf phloem cells revealed by single cell transcriptomics. Plant Cell 2021 May 5;33(3):511-530. PMID: 33955487',
    cells: '6250',
  },
  rows: Array.from({ length: 20 }, (_, index) => ({
    sampleId: 'SRP292306',
    datasetId: 'SRP292306',
    species: 'Arabidopsis thaliana',
    tissue: 'Leaf',
    cells: '6250',
    tf: `AT1G0106${index}`,
    target: `AT2G2499${index}`,
    importanceScore: `${0.8 + index / 1000}`,
  })),
}

const athSampleDetailPage1 = {
  sample: athSampleDetailResponse.sample,
  metadata: athSampleDetailResponse.metadata,
  rows: athSampleDetailResponse.rows.slice(0, 10),
  pagination: {
    page: 1,
    pageSize: 10,
    totalRows: 120,
    totalPages: 12,
  },
}

const athSampleDetailPage2 = {
  sample: athSampleDetailResponse.sample,
  metadata: athSampleDetailResponse.metadata,
  rows: athSampleDetailResponse.rows.slice(10, 20),
  pagination: {
    page: 2,
    pageSize: 10,
    totalRows: 120,
    totalPages: 12,
  },
}

const zeaSampleDetailResponse = {
  sample: {
    speciesId: 'zea',
    speciesLabel: 'Zea mays',
    sampleId: 'SRX9102558',
    tissue: 'Leaf',
    pubmedId: '33955497',
    fileName: 'tf_target_GSM4774629_GSE157759.txt',
    datasetId: 'SRX9102558',
    cells: 6658,
  },
  metadata: {
    organism: 'Zea mays',
    experimentType: 'Expression profiling by high throughput sequencing',
    platform: '10x Genomics',
    datasetId: 'SRX9102558',
    citation:
      'Bezrutczyk M, Zollner NR, Kruse CPS, Hartwig T et al. Evidence for phloem loading via the abaxial bundle sheath cells in maize leaves. Plant Cell 2021;33(3):531-547. PMID: 33955497',
    cells: 6658,
  },
  rows: [
    {
      sampleId: 'SRX9102558',
      datasetId: 'SRX9102558',
      species: 'Zea mays',
      tissue: 'Leaf',
      cells: 6658,
      tf: 'Zm00001eb000010',
      target: 'Zm00001eb000020',
      importanceScore: '0.921',
    },
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    totalRows: 1,
    totalPages: 1,
  },
}

function jsonResponse(data: unknown) {
  return {
    ok: true,
    json: async () => data,
    text: async () => JSON.stringify(data),
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe('BrowsePage', () => {
  const fetchMock = vi.fn<
    (
      input: RequestInfo | URL,
    ) => Promise<{ ok: boolean; json: () => Promise<unknown>; text: () => Promise<string> }>
  >()
  let deferredPage2Response:
    | ReturnType<
        typeof createDeferred<{
          ok: boolean
          json: () => Promise<unknown>
          text: () => Promise<string>
        }>
      >
    | null = null

  beforeEach(() => {
    __resetBrowsePageCacheForTests()

    fetchMock.mockImplementation(async (input) => {
      const url = String(input)

      if (url.includes('/api/browse/index')) {
        return jsonResponse(browseIndexResponse)
      }

      if (url.includes('/api/browse/species/ath/tf-target-counts')) {
        return jsonResponse(athTfTargetCounts)
      }

      if (url.includes('/api/browse/species/zea/tf-target-counts')) {
        return jsonResponse(zeaTfTargetCounts)
      }

      if (url.includes('/api/browse/species/ath/samples/SRP292306?page=2&pageSize=10')) {
        if (deferredPage2Response) {
          return deferredPage2Response.promise
        }
        return jsonResponse(athSampleDetailPage2)
      }

      if (url.includes('/api/browse/species/ath/samples/SRP292306?page=1&pageSize=10')) {
        return jsonResponse(athSampleDetailPage1)
      }

      if (url.includes('/api/browse/species/zea/samples/SRX9102558?page=1&pageSize=10')) {
        return jsonResponse(zeaSampleDetailResponse)
      }

      return jsonResponse({})
    })

    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    __resetBrowsePageCacheForTests()
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    deferredPage2Response = null
    cleanup()
  })

  it('renders a fixed explorer layout without the old browse hero block', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    expect(container.querySelector('.browse-page')).not.toBeNull()
    expect(container.querySelector('.browse-page__sidebar')).not.toBeNull()
    expect(container.querySelector('.browse-page__main')).not.toBeNull()
    expect(container.querySelector('.browse-explorer')).not.toBeNull()
    expect(container.querySelector('.browse-explorer__body')).not.toBeNull()
    expect(screen.queryByText('Browse Repository')).not.toBeInTheDocument()
    expect(screen.queryByText('Open Search Module')).not.toBeInTheDocument()
    expect(screen.queryByText('D3 graph area')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Explore species- and tissue-resolved sample collections across the PlantscNet resource.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Switch between species-first and tissue-first views without linking the two.'),
    ).not.toBeInTheDocument()
    expect(within(container).getByRole('tab', { name: 'By species' })).toBeInTheDocument()
    expect(within(container).getByRole('tab', { name: 'By tissue' })).toBeInTheDocument()
    expect(within(container).getByRole('img', { name: /D3 stage placeholder/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })
  })

  it('expands sample ids directly under species nodes in species mode', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    fireEvent.click(within(explorer!).getByRole('button', { name: /Zea mays/i }))

    expect(await screen.findByRole('button', { name: 'SRP164771' })).toBeInTheDocument()
    expect(within(explorer!).getByRole('button', { name: 'SRX9102558' })).toBeInTheDocument()
    expect(within(explorer!).getByRole('button', { name: 'SRX9102559' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SRP164771' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'SRX9102558' })).toHaveAttribute('aria-pressed', 'false')

    expect(screen.queryByText('Select a species')).not.toBeInTheDocument()
    expect(screen.queryByText('Species mode')).not.toBeInTheDocument()
  })

  it('shows tissue-grouped sample ids across species independently of the species mode', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    fireEvent.click(within(explorer!).getByRole('button', { name: /Zea mays/i }))
    fireEvent.click(within(container).getByRole('tab', { name: 'By tissue' }))

    fireEvent.click(within(explorer!).getByRole('button', { name: /Leaf/i }))

    expect(await screen.findByText('Arabidopsis thaliana | SRP292306')).toBeInTheDocument()
    expect(screen.getByText('Zea mays | SRX9102558')).toBeInTheDocument()
    expect(screen.getByText('Zea mays | SRX9102559')).toBeInTheDocument()

    expect(screen.queryByText('Select a tissue')).not.toBeInTheDocument()
    expect(screen.queryByText('Tissue mode')).not.toBeInTheDocument()
  })

  it('allows single-selecting one sample id at a time from expanded sample lists', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    fireEvent.click(within(explorer!).getByRole('button', { name: /Zea mays/i }))

    const firstSample = await screen.findByRole('button', { name: 'SRX9102558' })
    const secondSample = screen.getByRole('button', { name: 'SRX9102559' })

    fireEvent.click(firstSample)

    expect(firstSample).toHaveAttribute('aria-pressed', 'true')
    expect(secondSample).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(secondSample)

    expect(firstSample).toHaveAttribute('aria-pressed', 'false')
    expect(secondSample).toHaveAttribute('aria-pressed', 'true')
  })

  it('clears the sample selection when the same sample is clicked again', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    fireEvent.click(within(explorer!).getByRole('button', { name: /Zea mays/i }))

    const sample = await screen.findByRole('button', { name: 'SRX9102558' })

    fireEvent.click(sample)
    expect(sample).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(sample)
    expect(sample).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches to a standalone sample detail view in species mode', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    fireEvent.click(within(explorer!).getByRole('button', { name: /Arabidopsis thaliana/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'SRP292306' }))

    expect(await screen.findByText('Sample overview')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'SRP292306' })).toBeInTheDocument()
    expect(screen.getByText('10x Genomics')).toBeInTheDocument()
    expect(screen.getByLabelText('Sample metadata overview')).toBeInTheDocument()
    expect(screen.getAllByText('6250').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'TF-target table' })).toBeInTheDocument()
    expect(screen.queryByText('Rosette leaf')).not.toBeInTheDocument()
    expect(screen.queryByText('Dataset DRP009643')).not.toBeInTheDocument()
    expect(screen.queryByText('tf_target_GSE161332_PRJNA677901.txt')).not.toBeInTheDocument()

    const detailTable = screen.getByRole('table')
    expect(within(detailTable).getByRole('columnheader', { name: 'Sample ID' })).toBeInTheDocument()
    expect(
      within(detailTable).queryByRole('columnheader', { name: 'Dataset ID' }),
    ).not.toBeInTheDocument()
    expect(within(detailTable).queryByText('AT1G010610')).not.toBeInTheDocument()
    expect(within(detailTable).getByText('AT1G01060')).toBeInTheDocument()
    expect(within(detailTable).getByText('AT2G24990')).toBeInTheDocument()
    expect(within(detailTable).getByText('0.8000')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 12' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Page 6' })).not.toBeInTheDocument()
    expect(screen.getByText('…')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }))

    await waitFor(() => {
      expect(within(screen.getByRole('table')).getByText('AT1G010610')).toBeInTheDocument()
    })
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).includes('/api/browse/species/ath/samples/SRP292306?page=2&pageSize=10'),
      ),
    ).toBe(true)

    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).includes('/api/browse/species/ath/samples/SRP292306?page=1&pageSize=10'),
      ),
    ).toBe(true)

    const pageJumpInput = screen.getByLabelText('Page')
    fireEvent.change(pageJumpInput, { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))

    await waitFor(() => {
      expect(within(screen.getByRole('table')).getByText('AT1G010610')).toBeInTheDocument()
    })
  })

  it('keeps the sample detail view mounted while the next TF-target page is loading', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    fireEvent.click(within(explorer!).getByRole('button', { name: /Arabidopsis thaliana/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'SRP292306' }))

    expect(await screen.findByRole('heading', { name: 'SRP292306' })).toBeInTheDocument()
    expect(screen.getByText('AT1G01060')).toBeInTheDocument()

    deferredPage2Response = createDeferred()
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }))

    expect(screen.getByRole('heading', { name: 'SRP292306' })).toBeInTheDocument()
    expect(screen.getByText('AT1G01060')).toBeInTheDocument()
    expect(screen.getByLabelText('Loading next TF-target page')).toBeInTheDocument()
    expect(screen.queryByText('Loading page...')).not.toBeInTheDocument()
    expect(screen.queryByText('Loading sample detail...')).not.toBeInTheDocument()

    deferredPage2Response.resolve(jsonResponse(athSampleDetailPage2))

    await waitFor(() => {
      expect(screen.getByText('AT1G010610')).toBeInTheDocument()
    })
  })

  it('switches to the same standalone sample detail view in tissue mode', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    fireEvent.click(within(container).getByRole('tab', { name: 'By tissue' }))
    fireEvent.click(within(explorer!).getByRole('button', { name: /Leaf/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Zea mays | SRX9102558' }))

    expect(await screen.findByText('Sample overview')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'SRX9102558' })).toBeInTheDocument()
    expect(screen.getAllByText('Zea mays').length).toBeGreaterThan(0)
    expect(screen.getAllByText('6658').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'TF-target table' })).toBeInTheDocument()
    expect(screen.getByText('Zm00001eb000010')).toBeInTheDocument()
    expect(screen.getByText('Zm00001eb000020')).toBeInTheDocument()

    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).includes('/api/browse/species/zea/samples/SRX9102558?page=1&pageSize=10'),
      ),
    ).toBe(true)
  })

  it('renders species-linked composition and metadata table without the network preview module', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    fireEvent.click(within(explorer!).getByRole('button', { name: /Arabidopsis thaliana/i }))

    expect(await screen.findByRole('heading', { name: 'Tissue composition' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sample metadata' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'High-confidence network preview' })).toBeNull()

    expect(screen.getAllByText('Root').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Leaf').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Embryo').length).toBeGreaterThan(0)

    expect(screen.getByRole('columnheader', { name: 'Species' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'NCBI ID' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Tissues' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Data Type' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'TF-target number' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Pubmed ID' })).toBeInTheDocument()
    expect(screen.getAllByText('scRNA-seq').length).toBeGreaterThan(0)
    expect(screen.getByText('33822225')).toBeInTheDocument()

    expect(screen.queryByLabelText('High-confidence TF-target network preview')).toBeNull()
  })

  it('renders tissue-linked overview, species composition, and metadata in tissue mode', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    fireEvent.click(within(container).getByRole('tab', { name: 'By tissue' }))
    fireEvent.click(within(explorer!).getByRole('button', { name: /Leaf/i }))

    expect(
      await screen.findByRole('heading', {
        name: 'Leaf',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/selected PlantscNet tissue/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Species composition' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sample metadata' })).toBeInTheDocument()
    expect(screen.getAllByText('Arabidopsis thaliana').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Zea mays').length).toBeGreaterThan(0)

    const chart = screen.getByLabelText('Tissue species composition')
    expect(
      within(chart).getByRole('button', { name: /Arabidopsis thaliana: 3 samples/i }),
    ).toBeInTheDocument()
    expect(within(chart).getByRole('button', { name: /Zea mays: 2 samples/i })).toBeInTheDocument()

    const metadataTable = screen.getByRole('table')
    expect(within(metadataTable).getByText('SRP292306')).toBeInTheDocument()
    expect(within(metadataTable).getByText('SRX9102558')).toBeInTheDocument()
    expect(within(metadataTable).queryByText('SRP285817')).not.toBeInTheDocument()
  })

  it('loads tf-target counts for every species represented in a tissue overview', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    fireEvent.click(within(container).getByRole('tab', { name: 'By tissue' }))
    fireEvent.click(within(explorer!).getByRole('button', { name: /Leaf/i }))

    await screen.findByRole('heading', { name: 'Leaf' })

    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).includes('/api/browse/species/ath/tf-target-counts'),
      ),
    ).toBe(true)
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).includes('/api/browse/species/zea/tf-target-counts'),
      ),
    ).toBe(true)
  })

  it('renders the species overview immediately while detail files are still loading', async () => {
    let releaseDetails!: () => void
    const detailsReady = new Promise<void>((resolve) => {
      releaseDetails = resolve
    })

    fetchMock.mockImplementation(async (input) => {
      const url = String(input)

      if (url.includes('/api/browse/index')) {
        return jsonResponse(browseIndexResponse)
      }

      if (url.includes('/api/browse/species/ath/tf-target-counts')) {
        await detailsReady
        return jsonResponse(athTfTargetCounts)
      }

      if (url.includes('/api/browse/species/zea/tf-target-counts')) {
        await detailsReady
        return jsonResponse(zeaTfTargetCounts)
      }

      return jsonResponse({})
    })

    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    fireEvent.click(within(explorer!).getByRole('button', { name: /Arabidopsis thaliana/i }))

    expect(await screen.findByRole('heading', { name: 'Tissue composition' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sample metadata' })).toBeInTheDocument()
    expect(screen.queryByText('Loading network preview...')).toBeNull()

    releaseDetails()

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'High-confidence network preview' })).toBeNull()
    })
  })

  it('animates and highlights tissue composition segments on hover', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    fireEvent.click(within(explorer!).getByRole('button', { name: /Arabidopsis thaliana/i }))

    const chart = await screen.findByLabelText('Species tissue composition')
    const rootSegment = within(chart).getByRole('button', { name: /Root: 3 samples/i })

    expect(rootSegment).toHaveClass('browse-pie-sector')
    expect(rootSegment).not.toHaveClass('browse-pie-sector--active')

    fireEvent.mouseEnter(rootSegment)
    expect(rootSegment).toHaveClass('browse-pie-sector--active')

    fireEvent.mouseLeave(rootSegment)
    expect(rootSegment).not.toHaveClass('browse-pie-sector--active')
  })

  it('renders tissue composition as a donut with center text and no center card', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    fireEvent.click(within(explorer!).getByRole('button', { name: /Arabidopsis thaliana/i }))

    const chart = await screen.findByLabelText('Species tissue composition')
    const rootSegment = within(chart).getByRole('button', { name: /Root: 3 samples/i })
    const firstSectorPath = rootSegment.getAttribute('d')
    const centerText = container.querySelector('.browse-pie-chart__center-text') as HTMLElement | null

    expect(firstSectorPath).toBeTruthy()
    expect(firstSectorPath).not.toContain('M 90 90')
    expect(container.querySelector('.browse-pie-chart__center')).toBeNull()
    expect(centerText).not.toBeNull()
    expect(within(centerText!).getByText('12')).toBeInTheDocument()
    expect(within(centerText!).getByText('samples')).toBeInTheDocument()

    fireEvent.mouseEnter(rootSegment)
    expect(within(centerText!).getByText('3')).toBeInTheDocument()
    expect(within(centerText!).getByText('Root')).toBeInTheDocument()
  })

  it('splits long active tissue names into centered lines inside the donut hole', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    fireEvent.click(within(explorer!).getByRole('button', { name: /Arabidopsis thaliana/i }))

    const chart = await screen.findByLabelText('Species tissue composition')
    const longLabelSegment = within(chart).getByRole('button', {
      name: /Young inflorescences: 1 sample/i,
    })
    const centerText = container.querySelector('.browse-pie-chart__center-text') as HTMLElement | null

    fireEvent.mouseEnter(longLabelSegment)

    expect(centerText).toHaveClass('browse-pie-chart__center-text--long')
    expect(within(centerText!).getByLabelText('Young inflorescences')).toBeInTheDocument()
    expect(within(centerText!).getByText('Young')).toBeInTheDocument()
    expect(within(centerText!).getByText('inflorescences')).toBeInTheDocument()
  })

  it('renders a visible donut ring for species with a single tissue sample', async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input)

      if (url.includes('/api/browse/index')) {
        return jsonResponse({
          species: [{ id: 'bra', label: 'Brassica rapa', sampleCount: 1 }],
          samples: [
            {
              speciesId: 'bra',
              speciesLabel: 'Brassica rapa',
              fileName: 'tf_target_single.txt',
              sampleId: 'SRP000001',
              tissue: 'Leaf',
              pubmedId: '12345678',
            },
          ],
        })
      }

      if (url.includes('/api/browse/species/bra/tf-target-counts')) {
        return jsonResponse({ 'tf_target_single.txt': 2 })
      }

      return jsonResponse({})
    })

    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    fireEvent.click(within(explorer!).getByRole('button', { name: /Brassica rapa/i }))

    const chart = await screen.findByLabelText('Species tissue composition')
    const onlySegment = within(chart).getByRole('button', { name: /Leaf: 1 sample/i })

    expect(onlySegment.tagName.toLowerCase()).toBe('circle')
    expect(onlySegment.getAttribute('style')).toContain('stroke: rgb(47, 129, 76)')
  })

  it('paginates species metadata rows in groups of 10', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    fireEvent.click(within(explorer!).getByRole('button', { name: /Arabidopsis thaliana/i }))

    expect(await screen.findByRole('button', { name: 'Page 2' })).toBeInTheDocument()
    const metadataTable = screen.getByRole('table')

    expect(within(metadataTable).getByText('SRP300007')).toBeInTheDocument()
    expect(within(metadataTable).queryByText('SRP300008')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }))

    expect(await within(metadataTable).findByText('SRP300008')).toBeInTheDocument()
    expect(within(metadataTable).getByText('SRP300009')).toBeInTheDocument()
    expect(within(metadataTable).queryByText('SRP285817')).not.toBeInTheDocument()
  })

  it('reuses cached species details when reopening the same species', async () => {
    const { container } = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    const explorer = container.querySelector('.browse-explorer__body') as HTMLElement | null
    expect(explorer).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    const speciesToggle = within(explorer!).getByRole('button', { name: /Arabidopsis thaliana/i })

    fireEvent.click(speciesToggle)
    await screen.findByRole('heading', { name: 'Tissue composition' })

    const athDetailCallsAfterFirstOpen = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes('/api/browse/species/ath/tf-target-counts'),
    ).length

    fireEvent.click(speciesToggle)
    fireEvent.click(speciesToggle)

    await screen.findByRole('heading', { name: 'Tissue composition' })

    const athDetailCallsAfterSecondOpen = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes('/api/browse/species/ath/tf-target-counts'),
    ).length

    expect(athDetailCallsAfterSecondOpen).toBe(athDetailCallsAfterFirstOpen)
  })

  it('reuses the browse index cache after the page is unmounted and mounted again', async () => {
    const firstRender = render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/browse/index')
    })

    firstRender.unmount()

    const browseIndexCallsAfterFirstMount = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes('/api/browse/index'),
    ).length

    render(
      <MemoryRouter>
        <BrowsePage />
      </MemoryRouter>,
    )

    await screen.findByRole('tab', { name: 'By species' })

    const browseIndexCallsAfterSecondMount = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes('/api/browse/index'),
    ).length

    expect(browseIndexCallsAfterSecondMount).toBe(browseIndexCallsAfterFirstMount)
  })
})

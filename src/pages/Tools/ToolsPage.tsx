import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ModulePage } from '@/components/ModulePage'
import { moduleContent } from '@/app/module-content'
import '@/styles/tools.css'
import {
  createGenePriorityJob,
  fetchGenePriorityJob,
  fetchToolNetworkIndex,
} from './tools.api'
import type {
  GenePriorityJob,
  GenePriorityTool,
  NetworkSource,
  ToolNetworkIndex,
} from './tools.types'
import type { DataModality } from '@/pages/Browse/browse.types'
import { SearchSpeciesPicker } from '@/pages/Search/components/SearchSpeciesPicker'
import { summarizeJob, ToolsResult } from './components/ToolsResult'
import { getToolExampleGenes } from './tool.examples'

const toolOptions: Array<{ id: GenePriorityTool; label: string; description: string }> = [
  {
    id: 'gba',
    label: 'Neighborhood',
    description: 'Ranks submitted seed genes and new candidates by direct network support.',
  },
  {
    id: 'context',
    label: 'Context Hub',
    description: 'Ranks hub genes whose neighbors are enriched for the submitted gene set.',
  },
]

function formatSourceLabel(source: NetworkSource) {
  return source === 'integrated' ? 'Integrated network' : 'Sample network'
}

function getFirstUsableSpecies(index: ToolNetworkIndex | null, source: NetworkSource) {
  return (
    index?.species.find((species) =>
      source === 'integrated' ? species.integratedAvailable : species.samples.length > 0,
    ) ?? null
  )
}

function getSelectedSpecies(index: ToolNetworkIndex | null, speciesId: string) {
  return index?.species.find((species) => species.speciesId === speciesId) ?? null
}

export default function ToolsPage() {
  const [modality, setModality] = useState<DataModality>('rna')
  const [tool, setTool] = useState<GenePriorityTool>('gba')
  const [source, setSource] = useState<NetworkSource>('integrated')
  const [networkIndex, setNetworkIndex] = useState<ToolNetworkIndex | null>(null)
  const [speciesId, setSpeciesId] = useState('')
  const [sampleId, setSampleId] = useState('')
  const [genes, setGenes] = useState('')
  const [job, setJob] = useState<GenePriorityJob | null>(null)
  const [loadingNetworks, setLoadingNetworks] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedSpecies = useMemo(
    () => getSelectedSpecies(networkIndex, speciesId),
    [networkIndex, speciesId],
  )

  const speciesOptions = useMemo(
    () =>
      networkIndex?.species.map((species) => ({
        id: species.speciesId,
        label: species.speciesLabel,
      })) ?? [],
    [networkIndex],
  )

  const sampleOptions = useMemo(
    () =>
      selectedSpecies?.samples.map((sample) => ({
        id: sample.sampleId,
        label: `${sample.sampleId} · ${sample.tissue}`,
      })) ?? [],
    [selectedSpecies],
  )

  useEffect(() => {
    const controller = new AbortController()

    setLoadingNetworks(true)
    setError(null)

    fetchToolNetworkIndex(modality, controller.signal)
      .then((payload) => {
        const firstSpecies = getFirstUsableSpecies(payload, source)
        setNetworkIndex(payload)
        setSpeciesId(firstSpecies?.speciesId ?? '')
        setSampleId(firstSpecies?.samples[0]?.sampleId ?? '')
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load networks.')
          setNetworkIndex(null)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingNetworks(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [modality, source])

  useEffect(() => {
    if (!selectedSpecies) {
      return
    }

    if (source === 'sample' && !selectedSpecies.samples.some((sample) => sample.sampleId === sampleId)) {
      setSampleId(selectedSpecies.samples[0]?.sampleId ?? '')
    }
  }, [sampleId, selectedSpecies, source])

  useEffect(() => {
    if (!job || job.status === 'complete' || job.status === 'failed') {
      return
    }

    const controller = new AbortController()
    const timer = window.setInterval(() => {
      fetchGenePriorityJob(job.jobId, controller.signal)
        .then(setJob)
        .catch(() => {})
    }, 2000)

    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [job])

  function clearCurrentInputs() {
    setGenes('')
    setJob(null)
    setError(null)
  }

  function handleModalityChange(nextModality: DataModality) {
    if (nextModality === modality) {
      return
    }

    clearCurrentInputs()
    setModality(nextModality)
  }

  function handleToolChange(nextTool: GenePriorityTool) {
    if (nextTool === tool) {
      return
    }

    clearCurrentInputs()
    setTool(nextTool)
  }

  function handleSourceChange(nextSource: NetworkSource) {
    if (nextSource === source) {
      return
    }

    clearCurrentInputs()
    setSource(nextSource)
    const firstSpecies = getFirstUsableSpecies(networkIndex, nextSource)
    setSpeciesId(firstSpecies?.speciesId ?? '')
    setSampleId(firstSpecies?.samples[0]?.sampleId ?? '')
  }

  function handleSpeciesChange(nextSpeciesId: string) {
    if (nextSpeciesId === speciesId) {
      return
    }

    const nextSpecies = getSelectedSpecies(networkIndex, nextSpeciesId)
    clearCurrentInputs()
    setSpeciesId(nextSpeciesId)
    setSampleId(nextSpecies?.samples[0]?.sampleId ?? '')
  }

  function handleSampleChange(nextSampleId: string) {
    if (nextSampleId === sampleId) {
      return
    }

    clearCurrentInputs()
    setSampleId(nextSampleId)
  }

  function handleExampleClick() {
    if (!speciesId) {
      setError('Select a species before loading example genes.')
      return
    }

    const exampleGenes = getToolExampleGenes(speciesId)
    if (!exampleGenes.length) {
      setGenes('')
      setJob(null)
      setError(`No preset example genes are available for ${selectedSpecies?.speciesLabel ?? 'this species'}.`)
      return
    }

    setGenes(exampleGenes.slice(0, 5).join('\n'))
    setJob(null)
    setError(null)
  }

  async function handleSubmit() {
    if (!speciesId) {
      setError('Select a species before running the tool.')
      return
    }

    if (source === 'sample' && !sampleId) {
      setError('Select a sample network before running the tool.')
      return
    }

    if (source === 'integrated' && !selectedSpecies?.integratedAvailable) {
      setError('The selected species does not have an integrated network for this data type.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const nextJob = await createGenePriorityJob(tool, {
        modality,
        speciesId,
        source,
        sampleId: source === 'sample' ? sampleId : undefined,
        genes,
      })
      setJob(nextJob)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to start job.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModulePage module={moduleContent.tools} hideInfoSections>
      <section className="tools-workbench extra-card fade-rise">
        <div className="tools-workbench__controls">
          <ControlGroup label="Data type">
            <SegmentButton active={modality === 'rna'} onClick={() => handleModalityChange('rna')}>
              scRNA
            </SegmentButton>
            <SegmentButton active={modality === 'atac'} onClick={() => handleModalityChange('atac')}>
              scATAC
            </SegmentButton>
          </ControlGroup>

          <ControlGroup label="Method">
            {toolOptions.map((option) => (
              <SegmentButton
                key={option.id}
                active={tool === option.id}
                onClick={() => handleToolChange(option.id)}
              >
                {option.label}
              </SegmentButton>
            ))}
          </ControlGroup>

          <ControlGroup label="Network source">
            <SegmentButton active={source === 'integrated'} onClick={() => handleSourceChange('integrated')}>
              Integrated
            </SegmentButton>
            <SegmentButton active={source === 'sample'} onClick={() => handleSourceChange('sample')}>
              Sample
            </SegmentButton>
          </ControlGroup>
        </div>

        <div className="tools-form-grid">
          <label className="tools-field">
            <span>Species</span>
            <SearchSpeciesPicker
              options={speciesOptions}
              value={speciesId}
              onChange={handleSpeciesChange}
              placeholder={loadingNetworks ? 'Loading species' : 'Select a species'}
            />
          </label>

          {source === 'sample' ? (
            <label className="tools-field">
              <span>Sample network</span>
              <SearchSpeciesPicker
                options={sampleOptions}
                value={sampleId}
                onChange={handleSampleChange}
                placeholder="Select a sample network"
                ariaLabel="Sample network options"
              />
            </label>
          ) : (
            <div className="tools-field">
              <span>{formatSourceLabel(source)}</span>
              <div className="tools-source-card">
                <strong>{selectedSpecies?.integratedAvailable ? 'Available' : 'Not available'}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="tools-method-copy">
          <strong>{toolOptions.find((option) => option.id === tool)?.label}</strong>
          <p>{toolOptions.find((option) => option.id === tool)?.description}</p>
        </div>

        <label className="tools-field tools-field--textarea">
          <span className="tools-field__row">
            <span>Gene list</span>
            <button
              type="button"
              className="search-example-button"
              onClick={handleExampleClick}
            >
              Fill Example
            </button>
          </span>
          <textarea
            value={genes}
            onChange={(event) => setGenes(event.target.value)}
            placeholder="Paste one gene per line"
            spellCheck={false}
          />
        </label>

        <div className="tools-actions">
          <button className="cta-button cta-button--solid" type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Starting...' : 'Run prioritization'}
          </button>
          <span className="tools-status">{job ? summarizeJob(job) : null}</span>
        </div>

        {error ? <p className="tools-error">{error}</p> : null}
      </section>

      {job ? <ToolsResult job={job} /> : null}
    </ModulePage>
  )
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="tools-control-group">
      <p>{label}</p>
      <div className="tools-segmented">{children}</div>
    </div>
  )
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={active ? 'tools-segmented__button tools-segmented__button--active' : 'tools-segmented__button'}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

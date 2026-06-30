import type {
  SpeciesNetworkPreviewLink,
  SpeciesNetworkPreviewNode,
  SpeciesNetworkPreviewResponse,
} from '../browse.types'

export function buildSingleSampleLinkWidth(
  links: SpeciesNetworkPreviewLink[],
): (link: SpeciesNetworkPreviewLink) => number {
  const finiteScores = links
    .map((link) => link.probability)
    .filter((score) => Number.isFinite(score) && score >= 0)

  if (finiteScores.length === 0) {
    return () => 1.8
  }

  const minScore = Math.min(...finiteScores)
  const maxScore = Math.max(...finiteScores)
  const minLog = Math.log1p(minScore)
  const maxLog = Math.log1p(maxScore)

  if (maxLog <= minLog) {
    return () => 2.4
  }

  return (link) => {
    const safeScore = Number.isFinite(link.probability) ? Math.max(link.probability, 0) : minScore
    const normalized = (Math.log1p(safeScore) - minLog) / (maxLog - minLog)

    return 1.2 + normalized * 3
  }
}

export function getNetworkPreviewCopy(
  preview: SpeciesNetworkPreviewResponse,
  tfFilter: string,
) {
  const isSingleSampleSource = preview.sourceKind === 'single-sample'
  const isSampleAggregateSource = preview.sourceKind === 'sample-aggregate'
  const normalizedTfFilter = tfFilter.trim().toLowerCase()
  const previewTitle = isSampleAggregateSource
    ? 'Sample-derived network preview'
    : isSingleSampleSource
    ? 'pySCENIC importance score preview'
    : 'Probability-based network preview'
  const thresholdLabel = isSampleAggregateSource
    ? 'Minimum samples'
    : isSingleSampleSource
    ? 'Importance score'
    : 'Probability'
  const metricFilterLabel = isSampleAggregateSource
    ? 'sample count'
    : isSingleSampleSource
    ? 'importance score'
    : 'Probability'
  const previewAriaLabel = isSampleAggregateSource
    ? 'Sample-derived force-directed network preview'
    : isSingleSampleSource
    ? 'pySCENIC importance score force-directed network preview'
    : 'Probability-based force-directed network preview'
  const hasFocusedTfNode =
    normalizedTfFilter.length > 0 &&
    preview.nodes.some(
      (node: SpeciesNetworkPreviewNode) =>
        node.type === 'tf' && node.id.toLowerCase() === normalizedTfFilter,
    )

  return {
    isSampleAggregateSource,
    isSingleSampleSource,
    normalizedTfFilter,
    previewTitle,
    thresholdLabel,
    metricFilterLabel,
    previewAriaLabel,
    hasFocusedTfNode,
  }
}

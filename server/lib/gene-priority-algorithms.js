import { forEachNetworkEdge } from './gene-priority-network.js'
import {
  formatLogProbability,
  formatProbability,
  hypergeometricLogPmf,
  mannWhitneyAuc,
} from './gene-priority-math.js'

function addWeightedGuideLink(guideLinks, gene, guide, weight) {
  const links = guideLinks.get(gene) ?? new Map()
  const previousWeight = links.get(guide) ?? 0
  links.set(guide, Math.max(previousWeight, weight))
  guideLinks.set(gene, links)
}

function increment(map, key, value = 1) {
  map.set(key, (map.get(key) ?? 0) + value)
}

function splitGenes(rawGenes, maxGenes) {
  return Array.from(
    new Set(
      String(rawGenes ?? '')
        .split(/[\s,;]+/)
        .map((gene) => gene.trim())
        .filter(Boolean),
    ),
  ).slice(0, maxGenes)
}

function formatScore(value) {
  return Number.isFinite(value) ? Number(value.toFixed(5)) : 0
}

export async function runGbaPriority({ genes, network }) {
  const queryGenes = splitGenes(genes, 500)
  const guideSet = new Set(queryGenes)
  const allGenes = new Set()
  const scores = new Map()
  const guideLinks = new Map()
  let edgeCount = 0

  await forEachNetworkEdge(network.filePath, ({ source, target, weight }) => {
    edgeCount += 1
    allGenes.add(source)
    allGenes.add(target)

    if (guideSet.has(target)) {
      increment(scores, source, weight)
      addWeightedGuideLink(guideLinks, source, target, weight)
    }

    if (guideSet.has(source)) {
      increment(scores, target, weight)
      addWeightedGuideLink(guideLinks, target, source, weight)
    }
  })

  const validGuideGenes = queryGenes.filter((gene) => allGenes.has(gene))

  if (validGuideGenes.length === 0) {
    throw new Error('None of the input genes were found in the selected network.')
  }

  const validGuideSet = new Set(validGuideGenes)
  const rankedGenes = Array.from(allGenes)
    .map((gene) => ({
      gene,
      score: scores.get(gene) ?? 0,
      supportCount: guideLinks.get(gene)?.size ?? 0,
    }))
    .sort((left, right) => right.score - left.score || left.gene.localeCompare(right.gene))

  const positiveScores = validGuideGenes.map((gene) => scores.get(gene) ?? 0)
  const negativeScores = rankedGenes
    .filter((row) => !validGuideSet.has(row.gene))
    .map((row) => row.score)
  const aucResult = mannWhitneyAuc(positiveScores, negativeScores)

  const coreRows = rankedGenes
    .filter((row) => validGuideSet.has(row.gene))
    .map((row, index) => ({
      rank: index + 1,
      gene: row.gene,
      score: formatScore(row.score),
      connectedGuideGenes: row.supportCount,
      validGuideGenes: validGuideGenes.length,
    }))

  const candidateRows = rankedGenes
    .filter((row) => !validGuideSet.has(row.gene) && row.supportCount > 0)
    .slice(0, 100)
    .map((row, index) => ({
      rank: index + 1,
      gene: row.gene,
      score: formatScore(row.score),
      connectedGuideGenes: row.supportCount,
      validGuideGenes: validGuideGenes.length,
    }))

  const coreSif = buildSifRows(coreRows, guideLinks)
  const candidateSif = buildSifRows(candidateRows, guideLinks)

  return {
    tool: 'gba',
    queryGeneCount: queryGenes.length,
    validGuideGeneCount: validGuideGenes.length,
    totalNetworkGenes: allGenes.size,
    totalNetworkEdges: edgeCount,
    auc: Number(aucResult.auc.toFixed(4)),
    pValue: formatProbability(aucResult.pValue),
    coreRows,
    candidateRows,
    allCandidateCount: rankedGenes.filter(
      (row) => !validGuideSet.has(row.gene) && row.supportCount > 0,
    ).length,
    files: {
      coreFunction: toGbaTable(coreRows),
      newpathgene: toGbaTable(candidateRows),
      allNewCandidateGene: toGbaTable(
        rankedGenes
          .filter((row) => !validGuideSet.has(row.gene) && row.supportCount > 0)
          .map((row, index) => ({
            rank: index + 1,
            gene: row.gene,
            score: formatScore(row.score),
            connectedGuideGenes: row.supportCount,
            validGuideGenes: validGuideGenes.length,
          })),
      ),
      auc: `${Number(aucResult.auc.toFixed(4))}\t${formatProbability(aucResult.pValue)}\n`,
      coreSif,
      candidateSif,
    },
  }
}

export async function runContextPriority({ genes, network }) {
  const queryGenes = splitGenes(genes, 1000)
  const degSet = new Set(queryGenes)
  const allGenes = new Set()
  const degreeCounts = new Map()
  const degLinkCounts = new Map()
  let edgeCount = 0

  await forEachNetworkEdge(network.filePath, ({ source, target }) => {
    edgeCount += 1
    allGenes.add(source)
    allGenes.add(target)
    increment(degreeCounts, source)
    increment(degreeCounts, target)

    if (degSet.has(target)) {
      increment(degLinkCounts, source)
    }

    if (degSet.has(source)) {
      increment(degLinkCounts, target)
    }
  })

  const validDegGenes = queryGenes.filter((gene) => allGenes.has(gene))

  if (validDegGenes.length === 0) {
    throw new Error('None of the input genes were found in the selected network.')
  }

  const population = allGenes.size
  const draws = validDegGenes.length
  const rows = Array.from(allGenes)
    .map((gene) => {
      const degree = degreeCounts.get(gene) ?? 0
      const linksInDeg = degLinkCounts.get(gene) ?? 0
      const logPValue = hypergeometricLogPmf(linksInDeg, population, degree, draws)

      return {
        gene,
        logPValue,
        pValue: Math.exp(logPValue),
        isDeg: degSet.has(gene),
        linksToHub: degree,
        linksInDeg,
      }
    })
    .sort(
      (left, right) =>
        left.logPValue - right.logPValue || right.linksInDeg - left.linksInDeg || left.gene.localeCompare(right.gene),
    )
    .slice(0, 100)
    .map((row, index) => ({
      rank: index + 1,
      gene: row.gene,
      pValue: formatLogProbability(row.logPValue),
      isDeg: row.isDeg,
      linksToHub: row.linksToHub,
      linksInDeg: row.linksInDeg,
    }))

  return {
    tool: 'context',
    queryGeneCount: queryGenes.length,
    validDegGeneCount: validDegGenes.length,
    totalNetworkGenes: allGenes.size,
    totalNetworkEdges: edgeCount,
    hubRows: rows,
    files: {
      contexthub: rows
        .map((row) =>
          [
            row.rank,
            row.gene,
            row.pValue,
            row.isDeg ? 'T' : '-',
            row.linksToHub,
            row.linksInDeg,
          ].join('\t'),
        )
        .join('\n'),
    },
  }
}

function buildSifRows(rows, guideLinks) {
  return rows
    .flatMap((row) =>
      Array.from(guideLinks.get(row.gene) ?? []).map(
        ([guide, weight]) => `${row.gene}\t${weight}\t${guide}`,
      ),
    )
    .join('\n')
}

function toGbaTable(rows) {
  return rows
    .map((row) =>
      [
        row.rank,
        row.gene,
        row.score,
        `${row.connectedGuideGenes}/${row.validGuideGenes}`,
      ].join('\t'),
    )
    .join('\n')
}

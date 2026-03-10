import { scaleOrdinal } from 'd3'
import { useMemo } from 'react'

interface HomeCoverageMapProps {
  species: string[]
  tissues: string[]
}

interface CoverageNode {
  id: string
  category: 'species' | 'tissues'
  label: string
  x: number
  y: number
  textX: number
  textY: number
  textAnchor: 'start' | 'middle' | 'end'
}

const viewBoxWidth = 760
const viewBoxHeight = 520
const centerX = 380
const centerY = 248
const speciesRadius = 196
const tissueRadius = 126

function buildRingNodes(
  labels: string[],
  category: 'species' | 'tissues',
  radius: number,
  startDegrees: number,
  endDegrees: number,
  labelOffset: number,
): CoverageNode[] {
  const total = labels.length
  return labels.map((label, index) => {
    const progress = total === 1 ? 0.5 : index / (total - 1)
    const angleDegrees = startDegrees + (endDegrees - startDegrees) * progress
    const angle = (angleDegrees * Math.PI) / 180
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    const textX = centerX + Math.cos(angle) * (radius + labelOffset)
    const textY = centerY + Math.sin(angle) * (radius + labelOffset)

    let textAnchor: CoverageNode['textAnchor'] = 'middle'
    if (Math.cos(angle) > 0.22) textAnchor = 'start'
    if (Math.cos(angle) < -0.22) textAnchor = 'end'

    return {
      id: `${label}-${index}`,
      category,
      label,
      x,
      y,
      textX,
      textY,
      textAnchor,
    }
  })
}

function spreadLabelPositions(nodes: CoverageNode[]): CoverageNode[] {
  const adjusted = nodes.map((node) => ({ ...node }))
  const groups: CoverageNode['textAnchor'][] = ['end', 'middle', 'start']
  const minGapByCategory = {
    species: 26,
    tissues: 18,
  }

  for (const anchor of groups) {
    const bucket = adjusted
      .filter((node) => node.textAnchor === anchor)
      .sort((a, b) => a.textY - b.textY)

    for (let index = 1; index < bucket.length; index += 1) {
      const previous = bucket[index - 1]
      const current = bucket[index]
      const minGap = Math.max(
        minGapByCategory[previous.category],
        minGapByCategory[current.category],
      )
      if (current.textY - previous.textY < minGap) {
        current.textY = previous.textY + minGap
      }
    }

    for (let index = bucket.length - 2; index >= 0; index -= 1) {
      const next = bucket[index + 1]
      const current = bucket[index]
      const minGap = Math.max(
        minGapByCategory[next.category],
        minGapByCategory[current.category],
      )
      if (next.textY - current.textY < minGap) {
        current.textY = next.textY - minGap
      }
    }
  }

  return adjusted
}

export function HomeCoverageMap({ species, tissues }: HomeCoverageMapProps) {
  const { speciesNodes, tissueNodes } = useMemo(() => {
    const rawSpeciesNodes = buildRingNodes(species, 'species', speciesRadius, -158, 158, 34)
    const rawTissueNodes = buildRingNodes(tissues, 'tissues', tissueRadius, -170, 170, 16)
    const spreadNodes = spreadLabelPositions([...rawSpeciesNodes, ...rawTissueNodes])
    const spreadNodeMap = new Map(spreadNodes.map((node) => [node.id, node]))
    const mappedSpecies = rawSpeciesNodes.map((node) => spreadNodeMap.get(node.id) ?? node)
    const mappedTissues = rawTissueNodes.map((node) => spreadNodeMap.get(node.id) ?? node)

    return {
      speciesNodes: mappedSpecies,
      tissueNodes: mappedTissues,
    }
  }, [species, tissues])

  const fillScale = scaleOrdinal<string, string>()
    .domain(['species', 'tissues'])
    .range(['rgba(42, 129, 78, 0.90)', 'rgba(107, 165, 92, 0.85)'])

  const strokeScale = scaleOrdinal<string, string>()
    .domain(['species', 'tissues'])
    .range(['rgba(28, 94, 58, 0.70)', 'rgba(61, 116, 51, 0.58)'])

  return (
    <section className="home-coverage-card home-coverage-card--responsive">
      <div className="home-coverage-card__header">
        <p className="home-coverage-card__eyebrow">Coverage Map</p>
        <h2>10 species and 13 tissues, shown as one readable portal map.</h2>
      </div>

      <svg
        className="home-coverage-map home-coverage-map--responsive"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        role="img"
        aria-label="PlantscNet coverage map"
      >
        <defs>
          <radialGradient id="coverage-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(76, 144, 91, 0.34)" />
            <stop offset="100%" stopColor="rgba(76, 144, 91, 0)" />
          </radialGradient>
        </defs>

        <circle cx={centerX} cy={centerY} r="208" className="home-coverage-map__ring home-coverage-map__ring--outer" />
        <circle cx={centerX} cy={centerY} r="136" className="home-coverage-map__ring home-coverage-map__ring--inner" />
        <circle cx={centerX} cy={centerY} r="104" fill="url(#coverage-center-glow)" />

        {speciesNodes.map((node) => (
          <g key={node.id} className="home-coverage-map__node-group">
            <line
              x1={centerX}
              y1={centerY}
              x2={node.x}
              y2={node.y}
              className="home-coverage-map__link home-coverage-map__link--species"
            />
            <circle
              cx={node.x}
              cy={node.y}
              r="7.5"
              fill={fillScale('species')}
              stroke={strokeScale('species')}
              strokeWidth="1.4"
            />
            <text
              x={node.textX}
              y={node.textY}
              textAnchor={node.textAnchor}
              className="home-coverage-map__label home-coverage-map__label--species"
            >
              {node.label}
            </text>
          </g>
        ))}

        {tissueNodes.map((node) => (
          <g key={node.id} className="home-coverage-map__node-group">
            <line
              x1={centerX}
              y1={centerY}
              x2={node.x}
              y2={node.y}
              className="home-coverage-map__link home-coverage-map__link--tissue"
            />
            <circle
              cx={node.x}
              cy={node.y}
              r="5.7"
              fill={fillScale('tissues')}
              stroke={strokeScale('tissues')}
              strokeWidth="1.2"
            />
            <text
              x={node.textX}
              y={node.textY}
              textAnchor={node.textAnchor}
              className="home-coverage-map__label home-coverage-map__label--tissue"
            >
              {node.label}
            </text>
          </g>
        ))}

        <g transform={`translate(${centerX}, ${centerY})`}>
          <circle r="46" className="home-coverage-map__hub" />
          <text y="-4" textAnchor="middle" className="home-coverage-map__hub-title">
            PlantscNet
          </text>
          <text y="18" textAnchor="middle" className="home-coverage-map__hub-subtitle">
            Portal center
          </text>
        </g>
      </svg>

      <div className="home-coverage-card__legend" aria-hidden="true">
        <span className="home-coverage-chip home-coverage-chip--species">10 species</span>
        <span className="home-coverage-chip home-coverage-chip--tissues">13 tissues</span>
      </div>
    </section>
  )
}

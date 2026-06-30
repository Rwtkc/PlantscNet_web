import * as d3 from 'd3'

interface NetworkNode {
  group: 'target' | 'tf'
  id: string
  label?: string
  x: number
  y: number
}

const networkNodes: NetworkNode[] = [
  { group: 'tf', id: 'tf-1', label: 'LOC_OsXXg0101', x: 80, y: 58 },
  { group: 'tf', id: 'tf-2', label: 'LOC_OsXXg0202', x: 103, y: 46 },
  { group: 'tf', id: 'tf-3', label: 'LOC_OsXXg0303', x: 106, y: 74 },
  { group: 'target', id: 't-1', x: 42, y: 24 },
  { group: 'target', id: 't-2', x: 63, y: 20 },
  { group: 'target', id: 't-3', x: 129, y: 21 },
  { group: 'target', id: 't-4', x: 150, y: 35 },
  { group: 'target', id: 't-5', x: 44, y: 58 },
  { group: 'target', id: 't-6', x: 54, y: 87 },
  { group: 'target', id: 't-7', x: 88, y: 92 },
  { group: 'target', id: 't-8', x: 134, y: 88 },
  { group: 'target', id: 't-9', x: 154, y: 67 },
]

const networkLinks = [
  { source: 'tf-1', target: 't-1' },
  { source: 'tf-1', target: 't-2' },
  { source: 'tf-1', target: 't-4' },
  { source: 'tf-1', target: 't-5' },
  { source: 'tf-1', target: 't-6' },
  { source: 'tf-1', target: 't-8' },
  { source: 'tf-2', target: 't-3' },
  { source: 'tf-2', target: 't-4' },
  { source: 'tf-2', target: 't-7' },
  { source: 'tf-2', target: 't-9' },
  { source: 'tf-3', target: 't-5' },
  { source: 'tf-3', target: 't-6' },
  { source: 'tf-3', target: 't-8' },
  { source: 'tf-3', target: 't-9' },
]

const nodeById = new Map(networkNodes.map((node) => [node.id, node]))
const edgeLine = d3.line().curve(d3.curveBasis)

function edgePath(sourceId: string, targetId: string, index: number) {
  const source = nodeById.get(sourceId)
  const target = nodeById.get(targetId)

  if (!source || !target) {
    return ''
  }

  const bend = index % 2 === 0 ? -8 : 8
  return (
    edgeLine([
      [source.x, source.y],
      [(source.x + target.x) / 2, (source.y + target.y) / 2 + bend],
      [target.x, target.y],
    ]) ?? ''
  )
}

export function BrowseNetworkPreview() {
  return (
    <svg
      className="article-figure-browse-network"
      viewBox="0 0 180 110"
      role="img"
      aria-label="Static rice regulatory network preview"
    >
      <g className="article-figure-browse-network__edges">
        {networkLinks.map((link, index) => (
          <path
            className="article-figure-browse-network__edge"
            d={edgePath(link.source, link.target, index)}
            fill="none"
            key={`${link.source}-${link.target}`}
            stroke="#9fb1da"
            strokeLinecap="round"
            strokeWidth="1.25"
          />
        ))}
      </g>
      <g className="article-figure-browse-network__nodes">
        {networkNodes.map((node) => (
          <g
            className={`article-figure-browse-network__node article-figure-browse-network__node--${node.group}`}
            key={node.id}
            transform={`translate(${node.x.toString()} ${node.y.toString()})`}
          >
            <circle
              r={node.group === 'tf' ? 7.6 : 5.2}
              fill={node.group === 'tf' ? '#e8ca44' : '#a8c98a'}
              stroke={node.group === 'tf' ? '#b49d2f' : '#6f955d'}
              strokeWidth="1.6"
            />
            {node.label ? (
              <text
                x="9"
                y="3"
                fill="#183a25"
                fontFamily="Montserrat"
                fontSize="7"
                fontWeight="800"
                paintOrder="stroke"
                stroke="#f8fbf5"
                strokeWidth="3"
              >
                {node.label}
              </text>
            ) : null}
          </g>
        ))}
      </g>
    </svg>
  )
}

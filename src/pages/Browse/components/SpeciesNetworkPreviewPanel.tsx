import { useEffect, useRef, useState } from 'react'
import {
  drag,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  select,
  zoom,
  zoomIdentity,
} from 'd3'
import { defaultNetworkLimit } from '../browse.constants'
import type {
  SpeciesNetworkPreviewLink,
  SpeciesNetworkPreviewNode,
  SpeciesNetworkPreviewResponse,
} from '../browse.types'
import { normalizeNetworkLimit, normalizeNetworkThreshold } from '../browse.utils'
import { buildSingleSampleLinkWidth, getNetworkPreviewCopy } from './species-network-preview.utils'

export function SpeciesNetworkPreviewPanel({
  preview,
  isLoading,
  threshold,
  defaultThreshold,
  limit,
  tfFilter,
  onApplyFilters,
  onResetFilters,
  onFitView,
}: {
  preview: SpeciesNetworkPreviewResponse
  isLoading: boolean
  threshold: number
  defaultThreshold: number
  limit: number
  tfFilter: string
  onApplyFilters: (nextFilters: {
    threshold: number
    limit: number
    tfFilter: string
  }) => void
  onResetFilters: () => void
  onFitView: () => void
}) {
  const {
    hasFocusedTfNode,
    isSingleSampleSource,
    metricFilterLabel,
    normalizedTfFilter,
    previewAriaLabel,
    previewTitle,
    thresholdLabel,
  } = getNetworkPreviewCopy(preview, tfFilter)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const fitViewRef = useRef<(() => void) | null>(null)
  const [thresholdInput, setThresholdInput] = useState(String(threshold))
  const [limitInput, setLimitInput] = useState(String(limit))
  const [tfInput, setTfInput] = useState(tfFilter)

  useEffect(() => {
    setThresholdInput(String(threshold))
  }, [threshold])

  useEffect(() => {
    setLimitInput(String(limit))
  }, [limit])

  useEffect(() => {
    setTfInput(tfFilter)
  }, [tfFilter])

  useEffect(() => {
    if (
      !stageRef.current ||
      !canvasRef.current ||
      !svgRef.current ||
      !Array.isArray(preview.nodes) ||
      !Array.isArray(preview.links)
    ) {
      return
    }

    const width = 960
    const height = 560
    const stage = stageRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) {
      return
    }
    const canvasContext = context

    const svg = select(svgRef.current)
    svg.selectAll('*').remove()
    svg.attr('viewBox', `0 0 ${width} ${height}`)
    svg.attr('preserveAspectRatio', 'xMidYMid meet')
    svg.style('opacity', 0)

    const root = svg
      .append('g')
      .attr('class', 'browse-network-preview__root')
      .style('opacity', 0)
    const nodeLayer = root.append('g').attr('class', 'browse-network-preview__nodes')

    const nodes = preview.nodes.map((node) => ({ ...node }))
    const links = preview.links.map((link) => ({ ...link }))
    const nodeCount = nodes.length
    const linkCount = links.length
    const isVeryLargeGraph = nodeCount > 1400 || linkCount > 5000
    const isLargeGraph = nodeCount > 700 || linkCount > 2200
    const isFocusedTfNode = (node: SpeciesNetworkPreviewNode) =>
      normalizedTfFilter.length > 0 &&
      node.type === 'tf' &&
      node.id.toLowerCase() === normalizedTfFilter
    const linkWidth =
      preview.sourceKind === 'single-sample'
        ? buildSingleSampleLinkWidth(links)
        : (link: SpeciesNetworkPreviewLink) => Math.max(1.2, link.probability * 2.1)
    const chargeStrength = isVeryLargeGraph ? -42 : isLargeGraph ? -60 : -90
    const linkStrength = isVeryLargeGraph ? 0.18 : isLargeGraph ? 0.22 : 0.28
    const tfCollisionRadius = isVeryLargeGraph ? 18 : isLargeGraph ? 22 : 26
    const targetCollisionRadius = isVeryLargeGraph ? 9 : isLargeGraph ? 11 : 13
    const focusTfCollisionRadius = isVeryLargeGraph ? 24 : isLargeGraph ? 29 : 34
    const initialFreezeDelay = isVeryLargeGraph ? 1100 : isLargeGraph ? 1250 : 1450
    const dragFreezeDelay = isVeryLargeGraph ? 240 : isLargeGraph ? 320 : 420
    const devicePixelRatio = window.devicePixelRatio || 1
    let currentZoomTransform = zoomIdentity
    let viewportScale = 1
    let viewportOffsetX = 0
    let viewportOffsetY = 0

    function syncCanvasViewport() {
      const bounds = stage.getBoundingClientRect()
      const stageWidth = Math.max(bounds.width, 1)
      const stageHeight = Math.max(bounds.height, 1)

      viewportScale = Math.min(stageWidth / width, stageHeight / height)
      viewportOffsetX = (stageWidth - width * viewportScale) / 2
      viewportOffsetY = (stageHeight - height * viewportScale) / 2

      canvas.width = Math.round(stageWidth * devicePixelRatio)
      canvas.height = Math.round(stageHeight * devicePixelRatio)
    }

    syncCanvasViewport()
    canvas.style.opacity = '0'

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.06, 2.5])
      .on('zoom', (event) => {
        currentZoomTransform = event.transform
        root.attr('transform', event.transform.toString())
        drawCanvasLinks()
      })

    svg.call(zoomBehavior)

    function fitToView() {
      if (nodes.length === 0) {
        revealGraph()
        root.style('opacity', 1)
        return
      }

      const xs = nodes.map((node) => node.x ?? 0)
      const ys = nodes.map((node) => node.y ?? 0)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      const graphWidth = Math.max(maxX - minX, 1)
      const graphHeight = Math.max(maxY - minY, 1)
      const padding = 72
      const scale = Math.min(
        2.5,
        Math.max(
          0.06,
          Math.min((width - padding * 2) / graphWidth, (height - padding * 2) / graphHeight),
        ),
      )
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      const transform = zoomIdentity
        .translate(width / 2 - centerX * scale, height / 2 - centerY * scale)
        .scale(scale)

      svg.call(zoomBehavior.transform, transform)
      revealGraph()
      root.style('opacity', 1)
    }

    const simulation = forceSimulation<SpeciesNetworkPreviewNode>(nodes)
      .force(
        'link',
        forceLink<SpeciesNetworkPreviewNode, SpeciesNetworkPreviewLink>(links)
          .id((node) => node.id)
          .distance((link) => {
            const sourceNode = typeof link.source === 'string' ? null : link.source
            return sourceNode?.type === 'tf' ? 64 : 52
          })
          .strength(linkStrength),
      )
      .force('charge', forceManyBody().strength(chargeStrength))
      .force('center', forceCenter(width / 2, height / 2))
      .force(
        'collide',
        forceCollide<SpeciesNetworkPreviewNode>().radius((node) =>
          isFocusedTfNode(node)
            ? focusTfCollisionRadius
            : node.type === 'tf'
              ? tfCollisionRadius
              : targetCollisionRadius,
        ),
      )

    const nodeSelection = nodeLayer
      .selectAll<SVGGElement, SpeciesNetworkPreviewNode>('g')
      .data(nodes)
      .join('g')
      .attr('class', (node) =>
        node.type === 'tf'
          ? isFocusedTfNode(node)
            ? 'browse-network-preview__node browse-network-preview__node--tf browse-network-preview__node--focus-tf'
            : 'browse-network-preview__node browse-network-preview__node--tf'
          : 'browse-network-preview__node browse-network-preview__node--target',
      )
      .call(
        drag<SVGGElement, SpeciesNetworkPreviewNode>()
          .on('start', (event, node) => {
            clearFreezeTimeout()
            if (!event.active) {
              simulation.alpha(Math.max(simulation.alpha(), 0.16)).alphaTarget(0.12).restart()
            }
            node.fx = node.x
            node.fy = node.y
          })
          .on('drag', (event, node) => {
            node.fx = event.x
            node.fy = event.y
          })
          .on('end', (event, node) => {
            if (!event.active) {
              simulation.alphaTarget(0)
              scheduleFreeze(dragFreezeDelay, false)
            }
            node.fx = null
            node.fy = null
          }),
      )

    nodeSelection
      .append('circle')
      .attr('class', 'browse-network-preview__dot')
      .attr('r', (node) => (isFocusedTfNode(node) ? 15.5 : node.type === 'tf' ? 12 : 6.5))

    nodeSelection
      .filter((node) => node.type === 'tf')
      .append('text')
      .attr('class', 'browse-network-preview__label browse-network-preview__label--tf')
      .attr('x', (node) => (isFocusedTfNode(node) ? 19 : 16))
      .attr('y', 4)
      .text((node) => node.id)

    const transientTargetLabel = nodeLayer
      .append('text')
      .attr(
        'class',
        'browse-network-preview__label browse-network-preview__label--target browse-network-preview__label--target-active',
      )
      .style('opacity', 0)
      .attr('aria-hidden', 'true')

    nodeSelection
      .attr('tabindex', (node) => (node.type === 'tf' ? 0 : -1))
      .attr('role', (node) => (node.type === 'tf' ? 'button' : null))
      .attr('aria-label', (node) =>
        node.type === 'tf' ? `Focus network on TF ${node.id}` : `Target gene ${node.id}`,
      )
      .style('cursor', (node) => (node.type === 'tf' ? 'pointer' : null))
    const nodeElements = nodeSelection.nodes() as SVGGElement[]
    const nodeElementsById = new Map(nodes.map((node, index) => [node.id, nodeElements[index]]))
    const relatedNodeIdsById = new Map<string, Set<string>>()
    const relatedLinkIndexesById = new Map<string, number[]>()

    nodes.forEach((node) => {
      relatedNodeIdsById.set(node.id, new Set([node.id]))
      relatedLinkIndexesById.set(node.id, [])
    })

    links.forEach((link, index) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      relatedNodeIdsById.get(sourceId)?.add(targetId)
      relatedNodeIdsById.get(targetId)?.add(sourceId)
      relatedLinkIndexesById.get(sourceId)?.push(index)
      relatedLinkIndexesById.get(targetId)?.push(index)
    })

    let highlightedNodeId: string | null = null
    let highlightedRelatedNodeIds: string[] = []
    let highlightedLinkIndexes: number[] = []
    let highlightedTargetNode: SpeciesNetworkPreviewNode | null = null
    let hasFitted = false
    let freezeTimeoutId: number | null = null
    let isGraphVisible = false

    function revealGraph() {
      if (isGraphVisible) {
        return
      }

      canvas.style.opacity = '1'
      svg.style('opacity', 1)
      root.style('opacity', 1)
      isGraphVisible = true
    }

    function drawCanvasLinks() {
      canvasContext.setTransform(1, 0, 0, 1, 0, 0)
      canvasContext.clearRect(0, 0, canvas.width, canvas.height)
      canvasContext.setTransform(
        devicePixelRatio * viewportScale,
        0,
        0,
        devicePixelRatio * viewportScale,
        devicePixelRatio * viewportOffsetX,
        devicePixelRatio * viewportOffsetY,
      )
      canvasContext.translate(currentZoomTransform.x, currentZoomTransform.y)
      canvasContext.scale(currentZoomTransform.k, currentZoomTransform.k)
      canvasContext.lineCap = 'round'

      const isFocusMode = highlightedNodeId !== null
      const highlightedLinkIndexSet = new Set(highlightedLinkIndexes)

      links.forEach((link, index) => {
        const sourceNode = typeof link.source === 'string' ? null : link.source
        const targetNode = typeof link.target === 'string' ? null : link.target

        if (!sourceNode || !targetNode) {
          return
        }

        const isActive = highlightedLinkIndexSet.has(index)

        canvasContext.globalAlpha = isFocusMode && !isActive ? 0.12 : 1
        canvasContext.strokeStyle = isActive
          ? 'rgba(74, 104, 203, 0.9)'
          : 'rgba(92, 121, 214, 0.48)'
        canvasContext.lineWidth = linkWidth(link)
        canvasContext.beginPath()
        canvasContext.moveTo(sourceNode.x ?? 0, sourceNode.y ?? 0)
        canvasContext.lineTo(targetNode.x ?? 0, targetNode.y ?? 0)
        canvasContext.stroke()
      })

      canvasContext.globalAlpha = 1
    }

    function clearFreezeTimeout() {
      if (freezeTimeoutId !== null) {
        window.clearTimeout(freezeTimeoutId)
        freezeTimeoutId = null
      }
    }

    function renderPositions() {
      nodeSelection.attr('transform', (node) => `translate(${node.x ?? 0}, ${node.y ?? 0})`)
      if (highlightedTargetNode) {
        transientTargetLabel
          .attr('x', (highlightedTargetNode.x ?? 0) + 10)
          .attr('y', (highlightedTargetNode.y ?? 0) + 4)
      }
      drawCanvasLinks()
    }

    function freezeSimulation(shouldFitView: boolean) {
      clearFreezeTimeout()
      renderPositions()
      if (shouldFitView && !hasFitted) {
        hasFitted = true
        fitToView()
      } else {
        revealGraph()
        root.style('opacity', 1)
      }
      simulation.stop()
    }

    function scheduleFreeze(delay: number, shouldFitView: boolean) {
      clearFreezeTimeout()
      freezeTimeoutId = window.setTimeout(() => {
        freezeSimulation(shouldFitView)
      }, delay)
    }

    function clearHighlight() {
      if (highlightedNodeId) {
        nodeElementsById.get(highlightedNodeId)?.classList.remove('is-active')
      }

      highlightedRelatedNodeIds.forEach((relatedNodeId) => {
        nodeElementsById.get(relatedNodeId)?.classList.remove('is-related')
      })

      highlightedNodeId = null
      highlightedRelatedNodeIds = []
      highlightedLinkIndexes = []
      highlightedTargetNode = null
      transientTargetLabel.style('opacity', 0).text('')
      root.classed('is-focus-mode', false)
      drawCanvasLinks()
    }

    function setHighlight(node: SpeciesNetworkPreviewNode | null) {
      if (!node) {
        clearHighlight()
        return
      }

      if (highlightedNodeId === node.id) {
        return
      }

      clearHighlight()
      root.classed('is-focus-mode', true)

      const relatedNodeIds = Array.from(relatedNodeIdsById.get(node.id) ?? [])
      const relatedLinkIndexes = relatedLinkIndexesById.get(node.id) ?? []

      highlightedNodeId = node.id
      highlightedRelatedNodeIds = relatedNodeIds.filter((relatedNodeId) => relatedNodeId !== node.id)
      highlightedLinkIndexes = [...relatedLinkIndexes]

      nodeElementsById.get(node.id)?.classList.add('is-active')

      highlightedRelatedNodeIds.forEach((relatedNodeId) => {
        nodeElementsById.get(relatedNodeId)?.classList.add('is-related')
      })

      if (node.type === 'target') {
        highlightedTargetNode = node
        transientTargetLabel
          .attr('x', (node.x ?? 0) + 10)
          .attr('y', (node.y ?? 0) + 4)
          .text(node.id)
          .style('opacity', 1)
      }

      drawCanvasLinks()
    }

    nodeSelection
      .on('mouseenter', (_event, node) => setHighlight(node))
      .on('mouseleave', () => setHighlight(null))
      .on('focusin', (_event, node) => setHighlight(node))
      .on('focusout', () => setHighlight(null))
      .on('click', (_event, node) => {
        if (node.type === 'tf') {
          setTfInput(node.id)
          onApplyFilters({
            threshold,
            limit,
            tfFilter: node.id,
          })
        }
      })
      .on('keydown', (event, node) => {
        if (node.type === 'tf' && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          setTfInput(node.id)
          onApplyFilters({
            threshold,
            limit,
            tfFilter: node.id,
          })
        }
      })

    fitViewRef.current = fitToView
    scheduleFreeze(initialFreezeDelay, true)
    renderPositions()

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasViewport()
      drawCanvasLinks()
    })

    resizeObserver.observe(stage)

    simulation.on('tick', () => {
      renderPositions()

      if (!hasFitted && simulation.alpha() < 0.22) {
        hasFitted = true
        fitToView()
      }

      if (simulation.alpha() < 0.045) {
        freezeSimulation(false)
      }
    })

    return () => {
      resizeObserver.disconnect()
      clearFreezeTimeout()
      clearHighlight()
      fitViewRef.current = null
      simulation.stop()
    }
  }, [limit, onApplyFilters, preview, threshold])

  const summaryLabel = tfFilter
    ? `Showing ${preview.totalLinks} of ${preview.totalAvailableLinks} edges for TF ${tfFilter} at ${thresholdLabel} >= ${threshold}.`
    : `Showing ${preview.totalLinks} of ${preview.totalAvailableLinks} edges at ${thresholdLabel} >= ${threshold}.`

  const sourceNote = isSingleSampleSource
    ? 'Single-sample species use pySCENIC / GRNBoost importance scores rather than calibrated probabilities.'
    : 'Integrated species previews use model-derived edge probabilities.'

  function applyFilters() {
    onApplyFilters({
      threshold: normalizeNetworkThreshold(
        thresholdInput,
        threshold,
        isSingleSampleSource ? Number.POSITIVE_INFINITY : 1,
      ),
      limit: normalizeNetworkLimit(limitInput, limit),
      tfFilter: tfInput.trim(),
    })
  }

  return (
    <div className="browse-panel">
      <div className="browse-panel__header">
        <h2>{previewTitle}</h2>
        <p>{summaryLabel}</p>
        <p>{sourceNote}</p>
      </div>

      <div className="browse-network-preview__controls">
        <label className="browse-network-preview__control">
          <span>{thresholdLabel}</span>
          <input
            type="number"
            min={0}
            max={isSingleSampleSource ? undefined : 1}
            step="0.01"
            inputMode="decimal"
            aria-label={thresholdLabel}
            value={thresholdInput}
            onChange={(event) => {
              setThresholdInput(event.target.value)
            }}
          />
        </label>
        <label className="browse-network-preview__control">
          <span>Top N</span>
          <input
            type="number"
            min={1}
            step="1"
            inputMode="numeric"
            aria-label="Top N"
            value={limitInput}
            onChange={(event) => {
              setLimitInput(event.target.value)
            }}
          />
        </label>
        <label className="browse-network-preview__control browse-network-preview__control--wide">
          <span>Focus TF</span>
          <input
            type="text"
            value={tfInput}
            placeholder="Search TF"
            onChange={(event) => {
              setTfInput(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                applyFilters()
              }
            }}
          />
        </label>
        <div className="browse-network-preview__actions">
          <button
            type="button"
            className="browse-network-preview__action-button"
            onClick={applyFilters}
          >
            Apply
          </button>
          <button
            type="button"
            className="browse-network-preview__action-button browse-network-preview__action-button--ghost"
            onClick={() => {
              setThresholdInput(String(defaultThreshold))
              setLimitInput(String(defaultNetworkLimit))
              setTfInput('')
              onResetFilters()
            }}
            disabled={
              threshold === defaultThreshold &&
              limit === defaultNetworkLimit &&
              tfFilter.length === 0
            }
          >
            Reset
          </button>
          <button
            type="button"
            className="browse-network-preview__action-button browse-network-preview__action-button--ghost"
            onClick={() => {
              fitViewRef.current?.()
              onFitView()
            }}
          >
            Fit view
          </button>
        </div>
      </div>

      <div className="browse-network-preview">
        <div className="browse-network-preview__legend" aria-hidden="true">
          {hasFocusedTfNode ? (
            <span className="browse-network-preview__legend-item">
              <span className="browse-network-preview__legend-dot browse-network-preview__legend-dot--focus-tf" />
              Focused TF
            </span>
          ) : null}
          <span className="browse-network-preview__legend-item">
            <span className="browse-network-preview__legend-dot browse-network-preview__legend-dot--tf" />
            TFs
          </span>
          <span className="browse-network-preview__legend-item">
            <span className="browse-network-preview__legend-dot browse-network-preview__legend-dot--target" />
            Target genes
          </span>
        </div>
        <div ref={stageRef} className="browse-network-preview__stage">
          <canvas ref={canvasRef} className="browse-network-preview__canvas" aria-hidden="true" />
          <svg
            ref={svgRef}
            className="browse-network-preview__svg"
            role="img"
            aria-label={previewAriaLabel}
          />
          {preview.totalLinks === 0 ? (
            <div className="browse-network-preview__empty">
              No regulatory edges match the current {metricFilterLabel.toLowerCase()} filters.
            </div>
          ) : null}
          {isLoading ? (
            <div
              className="browse-network-preview__loading"
              aria-label="Loading filtered species network preview"
            >
              <span className="browse-table-wrap__spinner" aria-hidden="true" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}



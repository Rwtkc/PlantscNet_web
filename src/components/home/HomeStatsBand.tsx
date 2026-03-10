import { useRef, useState, type FocusEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { max, scaleBand, scaleLinear } from 'd3'
import {
  formatCompactCount,
  formatExactCount,
  homeScopeStats,
  integratedNetworkSizes,
  tissueRepresentation,
  type ChartDatum,
} from '@/pages/Home/homeStats'

type HorizontalBarChartProps = {
  data: ChartDatum[]
  ariaLabel: string
  valueFormatter?: (value: number) => string
  labelWidth?: number
  rounded?: boolean
  rowHeight?: number
  barHeight?: number
  className?: string
}

type ChartTooltipData = {
  label: string
  value: number
  unit: string
  x: number
  y: number
  frameWidth: number
  frameHeight: number
}

function clamp(value: number, min: number, maxValue: number) {
  return Math.min(Math.max(value, min), maxValue)
}

function ChartTooltip({ tooltip }: { tooltip: ChartTooltipData | null }) {
  if (!tooltip) {
    return null
  }

  const tooltipWidth = 168
  const tooltipHeight = 64
  const gap = 14
  const left = clamp(
    tooltip.x + gap,
    8,
    Math.max(8, tooltip.frameWidth - tooltipWidth - 8),
  )
  const top = clamp(
    tooltip.y + gap,
    8,
    Math.max(8, tooltip.frameHeight - tooltipHeight - 8),
  )

  return (
    <div
      className="home-stats-tooltip"
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
    >
      <p className="home-stats-tooltip__label">{tooltip.label}</p>
      <p className="home-stats-tooltip__value">
        {formatExactCount(tooltip.value)} {tooltip.unit}
      </p>
    </div>
  )
}

function HorizontalBarChart({
  data,
  ariaLabel,
  valueFormatter = formatCompactCount,
  labelWidth = 132,
  rounded = true,
  rowHeight = 24,
  barHeight = 10,
  className,
}: HorizontalBarChartProps) {
  const [tooltip, setTooltip] = useState<ChartTooltipData | null>(null)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const width = 520
  const valueWidth = 52
  const innerWidth = width - labelWidth - valueWidth
  const chartHeight = data.length * rowHeight
  const barScale = scaleLinear()
    .domain([0, max(data, (item) => item.value) ?? 0])
    .range([0, innerWidth])
  const yScale = scaleBand<string>()
    .domain(data.map((item) => item.label))
    .range([0, chartHeight])
    .paddingInner(0.36)

  const showTooltip = (
    item: ChartDatum,
    event:
      | ReactMouseEvent<SVGRectElement>
      | FocusEvent<SVGRectElement>,
  ) => {
    const frameRect = frameRef.current?.getBoundingClientRect()
    const frameWidth = frameRect?.width ?? width
    const frameHeight = frameRect?.height ?? chartHeight
    const clientX = 'clientX' in event ? event.clientX : frameWidth / 2
    const clientY = 'clientY' in event ? event.clientY : frameHeight / 2

    setActiveLabel(item.label)
    setTooltip({
      label: item.label,
      value: item.value,
      unit: 'edges',
      x: clientX - (frameRect?.left ?? 0),
      y: clientY - (frameRect?.top ?? 0),
      frameWidth,
      frameHeight,
    })
  }

  const clearTooltip = () => {
    setActiveLabel(null)
    setTooltip(null)
  }

  return (
    <div className="home-stats-chart-frame" ref={frameRef}>
      <svg
        className={`home-stats-bars ${className ?? ''}`.trim()}
        viewBox={`0 0 ${width} ${chartHeight}`}
        role="img"
        aria-label={ariaLabel}
      >
        {data.map((item, index) => {
          const y = yScale(item.label) ?? index * rowHeight
          const barY = y + (rowHeight - barHeight) / 2
          const isActive = activeLabel === item.label

          return (
            <g
              className={`home-stats-bars__row${isActive ? ' is-active' : ''}`}
              key={item.label}
              transform={`translate(0 ${y})`}
            >
              <text className="home-stats-bars__label" x={0} y={rowHeight / 2}>
                {item.label}
              </text>
              <rect
                className="home-stats-bars__track"
                x={labelWidth}
                y={(rowHeight - barHeight) / 2}
                width={innerWidth}
                height={barHeight}
                rx={rounded ? 999 : 4}
                ry={rounded ? 999 : 4}
              />
              <rect
                className={`home-stats-bars__fill home-stats-bars__fill--${item.tone ?? 'soft'}`}
                x={labelWidth}
                y={barY - y}
                width={barScale(item.value)}
                height={barHeight}
                rx={rounded ? 999 : 4}
                ry={rounded ? 999 : 4}
                style={{ animationDelay: `${index * 36}ms` }}
              />
              <rect
                className="home-stats-bars__hitbox"
                x={labelWidth}
                y={Math.max(0, (rowHeight - barHeight) / 2 - 6)}
                width={innerWidth}
                height={barHeight + 12}
                rx={rounded ? 999 : 4}
                ry={rounded ? 999 : 4}
                tabIndex={0}
                onMouseMove={(event) => showTooltip(item, event)}
                onFocus={(event) => showTooltip(item, event)}
                onMouseLeave={clearTooltip}
                onBlur={clearTooltip}
              />
              <text className="home-stats-bars__value" x={labelWidth + innerWidth + 8} y={rowHeight / 2}>
                {valueFormatter(item.value)}
              </text>
            </g>
          )
        })}
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </div>
  )
}

function TissueVerticalLollipopChart({ data }: { data: ChartDatum[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltipData | null>(null)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const width = 520
  const height = 390
  const topPadding = 28
  const bottomPadding = 125
  const sidePadding = 18
  const yScale = scaleLinear()
    .domain([0, max(data, (item) => item.value) ?? 0])
    .range([height - bottomPadding, topPadding])
  const xScale = scaleBand<string>()
    .domain(data.map((item) => item.label))
    .range([sidePadding, width - sidePadding])
    .paddingInner(0.34)
    .paddingOuter(0.18)

  const showTooltip = (
    item: ChartDatum,
    event:
      | ReactMouseEvent<SVGLineElement | SVGCircleElement>
      | FocusEvent<SVGLineElement | SVGCircleElement>,
  ) => {
    const frameRect = frameRef.current?.getBoundingClientRect()
    const frameWidth = frameRect?.width ?? width
    const frameHeight = frameRect?.height ?? height
    const clientX = 'clientX' in event ? event.clientX : frameWidth / 2
    const clientY = 'clientY' in event ? event.clientY : frameHeight / 2

    setActiveLabel(item.label)
    setTooltip({
      label: item.label,
      value: item.value,
      unit: 'samples',
      x: clientX - (frameRect?.left ?? 0),
      y: clientY - (frameRect?.top ?? 0),
      frameWidth,
      frameHeight,
    })
  }

  const clearTooltip = () => {
    setActiveLabel(null)
    setTooltip(null)
  }

  return (
    <div className="home-stats-chart-frame" ref={frameRef}>
      <svg
        className="home-stats-lollipop"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Tissue representation vertical lollipop chart"
      >
        <line
          className="home-stats-lollipop__baseline"
          x1={sidePadding}
          x2={width - sidePadding}
          y1={height - bottomPadding}
          y2={height - bottomPadding}
        />
        {data.map((item, index) => {
          const bandStart = xScale(item.label) ?? 0
          const bandWidth = xScale.bandwidth()
          const cx = bandStart + bandWidth / 2
          const cy = yScale(item.value)
          const isActive = activeLabel === item.label

          return (
            <g
              className={`home-stats-lollipop__item${isActive ? ' is-active' : ''}`}
              key={item.label}
            >
              <line
                className={`home-stats-lollipop__stem home-stats-lollipop__stem--${item.tone ?? 'soft'}`}
                x1={cx}
                x2={cx}
                y1={height - bottomPadding}
                y2={cy}
                style={{ animationDelay: `${index * 36}ms` }}
              />
              <circle
                className={`home-stats-lollipop__dot home-stats-lollipop__dot--${item.tone ?? 'soft'}`}
                cx={cx}
                cy={cy}
                r={5.5}
                style={{ animationDelay: `${index * 36 + 80}ms` }}
              />
              <text className="home-stats-lollipop__value" x={cx} y={cy - 12}>
                {item.value}
              </text>
              <text
                className="home-stats-lollipop__label"
                x={cx + 8}
                y={height - bottomPadding + 15}
                transform={`rotate(-45 ${cx + 8} ${height - bottomPadding + 15})`}
              >
                {item.label}
              </text>
              <line
                className="home-stats-lollipop__hitline"
                x1={cx}
                x2={cx}
                y1={height - bottomPadding}
                y2={cy}
                tabIndex={0}
                onMouseMove={(event) => showTooltip(item, event)}
                onFocus={(event) => showTooltip(item, event)}
                onMouseLeave={clearTooltip}
                onBlur={clearTooltip}
              />
              <circle
                className="home-stats-lollipop__hitdot"
                cx={cx}
                cy={cy}
                r={12}
                tabIndex={0}
                onMouseMove={(event) => showTooltip(item, event)}
                onFocus={(event) => showTooltip(item, event)}
                onMouseLeave={clearTooltip}
                onBlur={clearTooltip}
              />
            </g>
          )
        })}
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </div>
  )
}

export default function HomeStatsBand() {
  return (
    <section className="home-stats-band fade-rise" aria-label="Portal statistics">
      <section className="home-stats-card">
        <p className="home-stats-card__eyebrow">Portal Scope</p>
        <h2 className="home-stats-card__title--compact">Structured around PlantscNet portal coverage.</h2>
        <div className="home-stats-card__figures">
          {homeScopeStats.map((stat) => (
            <article className="home-stats-card__figure" key={stat.label}>
              <p className="home-stats-card__figure-eyebrow">{stat.eyebrow}</p>
              <p className="home-stats-card__figure-value">{stat.value}</p>
              <p className="home-stats-card__figure-label">{stat.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-stats-card">
        <p className="home-stats-card__eyebrow">Tissue Representation</p>
        <h2 className="home-stats-card__title--compact">All 13 tissues remain visible in the indexed collection.</h2>
        <TissueVerticalLollipopChart data={tissueRepresentation} />
      </section>

      <section className="home-stats-card">
        <p className="home-stats-card__eyebrow">Integrated Network Size</p>
        <h2>Final network size across the 10 PlantscNet species.</h2>
        <div className="home-stats-card__chart home-stats-card__chart--network-size">
          <HorizontalBarChart
            ariaLabel="Integrated final network size bars"
            data={integratedNetworkSizes}
            labelWidth={214}
            rounded={false}
            rowHeight={44}
            barHeight={12}
            className="home-stats-bars--network-size"
          />
        </div>
      </section>
    </section>
  )
}

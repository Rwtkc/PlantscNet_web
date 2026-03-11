import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import type { TissueCompositionItem } from '../browse.types'
import { describeSector, formatCountLabel, splitCenterLabel } from '../browse.utils'

export function TissueCompositionChart({
  items,
  heading,
  ariaLabel,
  summary,
}: {
  items: TissueCompositionItem[]
  heading: string
  ariaLabel: string
  summary: string
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const outerRadius = 80
  const innerRadius = 43

  const segments = useMemo(() => {
    let current = 0

    return items.map((item) => {
      const startAngle = total === 0 ? 0 : (current / total) * 360
      current += item.value
      const endAngle = total === 0 ? 0 : (current / total) * 360
      const sweep = Math.max(endAngle - startAngle, 0.001)

      return {
        ...item,
        startAngle,
        endAngle,
        sweep,
        midAngle: startAngle + sweep / 2,
      }
    })
  }, [items, total])

  const activeItem = activeIndex === null ? null : segments[activeIndex]
  const centerLabel = activeItem ? activeItem.label : 'samples'
  const centerLabelLines = splitCenterLabel(centerLabel)
  const centerLabelIsLong = centerLabelLines.length >= 3 || centerLabel.length >= 16

  return (
    <div className="browse-panel browse-panel--chart">
      <div className="browse-panel__header">
        <h2>{heading}</h2>
        <p>{summary || `${total} total samples`}</p>
      </div>

      <div className="browse-pie-layout">
        <div className="browse-pie-chart" aria-label={ariaLabel}>
          <svg className="browse-pie-chart__svg" viewBox="0 0 180 180">
            <g>
              {segments.map((item, index) => {
                const isActive = activeIndex === index
                const shiftDistance = isActive ? 6 : 0
                const shiftRadians = ((item.midAngle - 90) * Math.PI) / 180
                const shiftX = Math.cos(shiftRadians) * shiftDistance
                const shiftY = Math.sin(shiftRadians) * shiftDistance
                const isFullDonut = segments.length === 1

                const commonProps = {
                  className: isActive
                    ? 'browse-pie-sector browse-pie-sector--active'
                    : 'browse-pie-sector',
                  role: 'button' as const,
                  tabIndex: 0,
                  'aria-label': `${item.label}: ${formatCountLabel(item.value)}`,
                  style: {
                    '--sector-shift-x': `${shiftX}px`,
                    '--sector-shift-y': `${shiftY}px`,
                  } as CSSProperties,
                  onMouseEnter: () => setActiveIndex(index),
                  onMouseLeave: () => setActiveIndex(null),
                  onFocus: () => setActiveIndex(index),
                  onBlur: () => setActiveIndex(null),
                }

                if (isFullDonut) {
                  return (
                    <circle
                      key={item.label}
                      {...commonProps}
                      cx={90}
                      cy={90}
                      r={(outerRadius + innerRadius) / 2}
                      fill="none"
                      style={
                        {
                          ...commonProps.style,
                          stroke: item.color,
                          strokeWidth: `${outerRadius - innerRadius}px`,
                        } as CSSProperties
                      }
                      strokeWidth={outerRadius - innerRadius}
                    />
                  )
                }

                return (
                  <path
                    key={item.label}
                    {...commonProps}
                    d={describeSector(
                      90,
                      90,
                      outerRadius,
                      innerRadius,
                      item.startAngle,
                      item.endAngle,
                    )}
                    fill={item.color}
                  />
                )
              })}
            </g>
          </svg>

          <div
            className={
              centerLabelIsLong
                ? 'browse-pie-chart__center-text browse-pie-chart__center-text--long'
                : 'browse-pie-chart__center-text'
            }
          >
            <strong>{activeItem ? activeItem.value : total}</strong>
            <span aria-label={centerLabel}>
              {centerLabelLines.map((line) => (
                <span key={line} className="browse-pie-chart__center-line">
                  {line}
                </span>
              ))}
            </span>
          </div>
        </div>

        <ul className="browse-pie-legend">
          {segments.map((item, index) => (
            <li key={item.label}>
              <button
                type="button"
                className={
                  activeIndex === index
                    ? 'browse-pie-legend__button browse-pie-legend__button--active'
                    : 'browse-pie-legend__button'
                }
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
              >
                <span
                  className="browse-pie-legend__swatch"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="browse-pie-legend__label">{item.label}</span>
                <span className="browse-pie-legend__value">{formatCountLabel(item.value)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}



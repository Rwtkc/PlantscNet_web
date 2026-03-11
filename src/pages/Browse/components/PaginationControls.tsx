import { useEffect, useState } from 'react'
import { buildPaginationItems, clampPage } from '../browse.utils'

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const items = buildPaginationItems(currentPage, totalPages)

  return (
    <div className="browse-table-pagination__controls">
      {items.map((item) => {
        if (typeof item !== 'number') {
          return (
            <span key={item} className="browse-table-pagination__ellipsis" aria-hidden="true">
              …
            </span>
          )
        }

        return (
          <button
            key={item}
            type="button"
            className={
              currentPage === item
                ? 'browse-table-pagination__button browse-table-pagination__button--active'
                : 'browse-table-pagination__button'
            }
            aria-current={currentPage === item ? 'page' : undefined}
            aria-label={`Page ${item}`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

export function SampleDetailPaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const items = buildPaginationItems(currentPage, totalPages)
  const [pageInput, setPageInput] = useState(String(currentPage))

  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  function submitPageJump() {
    const parsed = Number(pageInput)

    if (!Number.isFinite(parsed)) {
      setPageInput(String(currentPage))
      return
    }

    onPageChange(clampPage(Math.trunc(parsed), totalPages))
  }

  return (
    <div className="browse-table-pagination__controls">
      <div className="browse-table-pagination__buttons">
        {items.map((item) => {
          if (typeof item !== 'number') {
            return (
              <span key={item} className="browse-table-pagination__ellipsis" aria-hidden="true">
                …
              </span>
            )
          }

          return (
            <button
              key={item}
              type="button"
              className={
                currentPage === item
                  ? 'browse-table-pagination__button browse-table-pagination__button--active'
                  : 'browse-table-pagination__button'
              }
              aria-current={currentPage === item ? 'page' : undefined}
              aria-label={`Page ${item}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          )
        })}
      </div>
      <div className="browse-table-pagination__jump">
        <label className="browse-table-pagination__jump-label" htmlFor="browse-sample-page-jump">
          Page
        </label>
        <input
          id="browse-sample-page-jump"
          type="number"
          min={1}
          max={totalPages}
          inputMode="numeric"
          className="browse-table-pagination__jump-input"
          value={pageInput}
          onChange={(event) => {
            setPageInput(event.target.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submitPageJump()
            }
          }}
        />
        <button
          type="button"
          className="browse-table-pagination__jump-button"
          onClick={submitPageJump}
        >
          Go
        </button>
      </div>
    </div>
  )
}



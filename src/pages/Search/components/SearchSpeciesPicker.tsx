import { useEffect, useMemo, useRef, useState } from 'react'
import { searchSpeciesLabelById } from '../search.constants'
import type { SearchSpeciesOption } from '../search.types'

export function SearchSpeciesPicker({
  options,
  value,
  onChange,
  placeholder = 'Select a species',
}: {
  options: SearchSpeciesOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const selectedLabel = useMemo(
    () =>
      options.find((option) => option.id === value)?.label ??
      searchSpeciesLabelById[value] ??
      null,
    [options, value],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="search-picker" ref={rootRef}>
      <button
        type="button"
        className="query-input search-picker__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current)
        }}
      >
        <span
          className={`search-picker__text${selectedLabel ? '' : ' search-picker__text--placeholder'}`}
        >
          {selectedLabel ?? placeholder}
        </span>
      </button>

      {open ? (
        <div className="search-picker__menu" role="listbox" aria-label="Species options">
          {options.map((option) => {
            const selected = option.id === value

            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={`search-picker__option${selected ? ' search-picker__option--selected' : ''}`}
                onClick={() => {
                  onChange(option.id)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { searchSpeciesLabelById } from '../search.constants'
import type { SearchSpeciesOption } from '../search.types'

export function SearchSpeciesPicker({
  options,
  value,
  onChange,
  placeholder = 'Select a species',
  ariaLabel = 'Species options',
}: {
  options: SearchSpeciesOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom')
  const [menuMaxHeight, setMenuMaxHeight] = useState(288)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const selectedLabel = useMemo(
    () =>
      options.find((option) => option.id === value)?.label ??
      searchSpeciesLabelById[value] ??
      null,
    [options, value],
  )

  useLayoutEffect(() => {
    if (!open) {
      return
    }

    function updateMenuPlacement() {
      const trigger = triggerRef.current
      const menu = menuRef.current
      if (!trigger || !menu) {
        return
      }

      const gap = 6
      const viewportPadding = 12
      const triggerRect = trigger.getBoundingClientRect()
      const availableBelow = window.innerHeight - triggerRect.bottom - viewportPadding
      const availableAbove = triggerRect.top - viewportPadding
      const desiredHeight = Math.min(menu.scrollHeight, 288)

      if (availableBelow >= desiredHeight || availableBelow >= availableAbove) {
        setPlacement('bottom')
        setMenuMaxHeight(Math.max(120, availableBelow - gap))
        return
      }

      setPlacement('top')
      setMenuMaxHeight(Math.max(120, availableAbove - gap))
    }

    updateMenuPlacement()
    window.addEventListener('resize', updateMenuPlacement)
    window.addEventListener('scroll', updateMenuPlacement, true)

    return () => {
      window.removeEventListener('resize', updateMenuPlacement)
      window.removeEventListener('scroll', updateMenuPlacement, true)
    }
  }, [open, options.length])

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
    <div className={open ? 'search-picker search-picker--open' : 'search-picker'} ref={rootRef}>
      <button
        type="button"
        className="query-input search-picker__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        ref={triggerRef}
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
        <div
          className={`search-picker__menu search-picker__menu--${placement}`}
          role="listbox"
          aria-label={ariaLabel}
          ref={menuRef}
          style={{ maxHeight: `${menuMaxHeight}px` }}
        >
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

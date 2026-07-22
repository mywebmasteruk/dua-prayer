"use client"

import { useCallback, useMemo, useState } from "react"

export function useAdminSelection<TId extends string | number>(allIds: TId[]) {
  const [selected, setSelected] = useState<Set<TId>>(new Set())

  const toggle = useCallback((id: TId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.size === allIds.length ? new Set() : new Set(allIds)))
  }, [allIds])

  const clear = useCallback(() => setSelected(new Set()), [])

  const allSelected = allIds.length > 0 && selected.size === allIds.length
  const someSelected = selected.size > 0 && selected.size < allIds.length

  return useMemo(
    () => ({
      selected,
      toggle,
      toggleAll,
      clear,
      allSelected,
      someSelected,
      selectedCount: selected.size,
    }),
    [allIds.length, allSelected, clear, selected, someSelected, toggle, toggleAll],
  )
}

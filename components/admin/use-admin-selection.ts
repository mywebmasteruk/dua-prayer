"use client"

import { useCallback, useMemo, useState } from "react"

export function useAdminSelection<TId extends string | number>(allIds: TId[]) {
  const [selected, setSelected] = useState<Set<TId>>(new Set())

  const allIdSet = useMemo(() => new Set(allIds), [allIds])

  // A filter change swaps out `allIds` without touching `selected`, so it can
  // hold IDs that are no longer visible. Count only the IDs still present in the
  // current list — otherwise the header checkbox and "N selected" bar report a
  // selection that doesn't match the rows the bulk actions would act on.
  const effectiveSelected = useMemo(() => {
    const next = new Set<TId>()
    for (const id of selected) {
      if (allIdSet.has(id)) next.add(id)
    }
    return next
  }, [selected, allIdSet])

  const toggle = useCallback((id: TId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const allVisibleSelected = allIds.length > 0 && allIds.every((id) => prev.has(id))
      return allVisibleSelected ? new Set() : new Set(allIds)
    })
  }, [allIds])

  const clear = useCallback(() => setSelected(new Set()), [])

  const selectedCount = effectiveSelected.size
  const allSelected = allIds.length > 0 && selectedCount === allIds.length
  const someSelected = selectedCount > 0 && selectedCount < allIds.length

  return useMemo(
    () => ({
      selected: effectiveSelected,
      toggle,
      toggleAll,
      clear,
      allSelected,
      someSelected,
      selectedCount,
    }),
    [allSelected, clear, effectiveSelected, selectedCount, someSelected, toggle, toggleAll],
  )
}

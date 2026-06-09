import type { ChannelItem } from "@/components/channel-list"
import type { Category, Dua } from "@/lib/types/dua"

function getChannelDescription(category: Category) {
  const description = category.description?.trim()
  if (description) return description
  return `Duas and collective ameen in ${category.name.toLowerCase()}.`
}

export function getChannels(categories: Category[], duas: Dua[]): ChannelItem[] {
  const counts = new Map<number, { duas: number; ameens: number }>()

  for (const dua of duas) {
    if (!dua.category_id) continue
    const current = counts.get(dua.category_id) ?? { duas: 0, ameens: 0 }
    counts.set(dua.category_id, { duas: current.duas + 1, ameens: current.ameens + dua.likes })
  }

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: getChannelDescription(category),
    duaCount: counts.get(category.id)?.duas ?? 0,
    ameenCount: counts.get(category.id)?.ameens ?? 0,
    sortOrder: category.sort_order,
    createdAt: category.created_at,
  }))
}

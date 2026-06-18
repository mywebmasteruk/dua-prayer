import type { ChannelItem } from "@/components/channel-list"
import { channelHandleFromName, normalizeChannelHandle } from "@/lib/channel-types"
import type { Category, Dua } from "@/lib/types/dua"

function getChannelDescription(category: Category) {
  const description = category.description?.trim()
  if (description) return description
  return `Duas and collective ameen in ${category.name.toLowerCase()}.`
}

export function getChannelHandle(category: Pick<Category, "name" | "handle">) {
  const handle = category.handle?.trim()
  // Normalize stored handles the same way they are normalized at write time,
  // so legacy/manually-edited values render consistently.
  if (handle) return normalizeChannelHandle(handle)
  return channelHandleFromName(category.name)
}

export function getChannels(categories: Category[], duas: Dua[]): ChannelItem[] {
  // Topic categories are counted by category_id; community channels by
  // channel_id (a dua's space), since the two axes are now independent.
  const categoryCounts = new Map<number, { duas: number; ameens: number }>()
  const channelCounts = new Map<number, { duas: number; ameens: number }>()

  const tally = (map: Map<number, { duas: number; ameens: number }>, id: number, likes: number) => {
    const current = map.get(id) ?? { duas: 0, ameens: 0 }
    map.set(id, { duas: current.duas + 1, ameens: current.ameens + likes })
  }

  for (const dua of duas) {
    if (dua.category_id) tally(categoryCounts, dua.category_id, dua.likes)
    if (dua.channel_id) tally(channelCounts, dua.channel_id, dua.likes)
  }

  return categories.map((category) => {
    const counts = category.channel_type === "user" ? channelCounts : categoryCounts
    return {
      id: category.id,
      name: category.name,
      handle: getChannelHandle(category),
      description: getChannelDescription(category),
      channelType: category.channel_type,
      isVerified: category.is_verified && category.status === "approved",
      duaCount: counts.get(category.id)?.duas ?? 0,
      ameenCount: counts.get(category.id)?.ameens ?? 0,
      sortOrder: category.sort_order,
      createdAt: category.created_at,
    }
  })
}

import type { ChannelItem } from "@/components/channel-list"
import { channelHandleFromName } from "@/lib/channel-types"
import type { Category, Dua } from "@/lib/types/dua"

function getChannelDescription(category: Category) {
  const description = category.description?.trim()
  if (description) return description
  return `Duas and collective ameen in ${category.name.toLowerCase()}.`
}

export function getChannelHandle(category: Pick<Category, "name" | "handle">) {
  const handle = category.handle?.trim()
  if (handle) return handle.toLowerCase().replace(/^@+/, "")
  return channelHandleFromName(category.name)
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
    handle: getChannelHandle(category),
    description: getChannelDescription(category),
    channelType: category.channel_type,
    isVerified: category.is_verified && category.status === "approved",
    duaCount: counts.get(category.id)?.duas ?? 0,
    ameenCount: counts.get(category.id)?.ameens ?? 0,
    sortOrder: category.sort_order,
    createdAt: category.created_at,
  }))
}

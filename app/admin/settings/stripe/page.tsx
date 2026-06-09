import { redirect } from "next/navigation"

export default function AdminStripeSettingsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const query = new URLSearchParams()
  query.set("tab", "stripe")
  for (const [key, value] of Object.entries(params)) {
    if (key === "tab" || value === undefined) continue
    if (Array.isArray(value)) {
      for (const entry of value) query.append(key, entry)
    } else {
      query.set(key, value)
    }
  }
  redirect(`/admin/integration?${query.toString()}`)
}

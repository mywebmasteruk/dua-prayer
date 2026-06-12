import { redirect } from "next/navigation"

export default function AdminBotsPage() {
  redirect("/admin?tab=bots")
}

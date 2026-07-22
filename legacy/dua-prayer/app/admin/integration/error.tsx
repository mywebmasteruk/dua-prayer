"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Plug } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminIntegrationError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin integration route error:", error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <Plug className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold text-foreground">Integration unavailable</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        The server could not render the Integration page. This is usually a temporary database or
        environment configuration issue.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/settings">Back to settings</Link>
        </Button>
      </div>
    </div>
  )
}

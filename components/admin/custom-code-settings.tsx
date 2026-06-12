"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { AdminSection } from "@/components/admin/admin-section"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { saveCustomCode } from "@/app/actions/custom-code"
import type { CustomCode } from "@/lib/custom-code-server"

export function CustomCodeSettings({ initialCode }: { initialCode: CustomCode }) {
  const [code, setCode] = useState(initialCode)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    const result = await saveCustomCode(code)
    setIsSaving(false)

    if ("error" in result && result.error) {
      toast({ title: "Could not save custom code", description: result.error, variant: "destructive" })
      return
    }

    toast({ title: "Custom code saved", description: "Header and footer code will be injected on the next page load." })
  }

  return (
    <AdminSection
      title="Custom Code"
      description="Inject tracking scripts, analytics tags, or any HTML into the page header and footer."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="custom-code-header" className="text-sm font-semibold text-foreground">
              Header code
            </Label>
            <p className="text-xs leading-5 text-muted-foreground">
              Injected at the top of <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;body&gt;</code>. Use for
              Google Tag Manager, analytics initialization, or &lt;noscript&gt; fallbacks.
            </p>
          </div>
          <Textarea
            id="custom-code-header"
            value={code.header}
            onChange={(e) => setCode((prev) => ({ ...prev, header: e.target.value }))}
            rows={8}
            placeholder={"<!-- e.g. Google Tag Manager -->\n<script>(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXX');</script>"}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="custom-code-footer" className="text-sm font-semibold text-foreground">
              Footer code
            </Label>
            <p className="text-xs leading-5 text-muted-foreground">
              Injected at the bottom of <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;body&gt;</code>. Use
              for conversion pixels, chat widgets, or deferred scripts.
            </p>
          </div>
          <Textarea
            id="custom-code-footer"
            value={code.footer}
            onChange={(e) => setCode((prev) => ({ ...prev, footer: e.target.value }))}
            rows={8}
            placeholder={"<!-- e.g. Meta Pixel -->\n<script>!function(f,b,e,v,n,t,s){...}(window, document,'script', 'https://connect.facebook.net/en_US/fbevents.js');</script>"}
            className="font-mono text-xs"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              "Save custom code"
            )}
          </Button>
        </div>
      </form>
    </AdminSection>
  )
}

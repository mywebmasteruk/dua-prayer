"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { updatePassword } from "@/app/actions/auth"

export function ResetPasswordForm() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await updatePassword(formData)
    } catch (e) {
      if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) {
        toast({ title: "Error", description: e.message, variant: "destructive" })
      }
    }
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

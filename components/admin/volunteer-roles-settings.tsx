"use client"

import { useState } from "react"
import { Shield, Users } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminSection } from "@/components/admin/admin-section"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminTableShell } from "@/components/admin/admin-table-shell"
import {
  updateVolunteerTier,
  type ActiveVolunteerRecord,
} from "@/app/actions/volunteers"
import { PERMISSION_LABELS, ROLE_PERMISSIONS } from "@/lib/admin-permissions"
import { MEMBER_ROLE_LABELS, MEMBER_ROLES, type MemberRole } from "@/lib/volunteer-types"
import {
  VOLUNTEER_CAPABILITY_MATRIX,
  VOLUNTEER_TIER_LABELS,
  VOLUNTEER_TIER_ORDER,
  VOLUNTEER_TIER_RESPONSIBILITIES,
  VOLUNTEER_TIER_SUMMARY,
} from "@/lib/volunteer-tiers"

type VolunteerRolesSettingsProps = {
  volunteers: ActiveVolunteerRecord[]
  canManageTiers: boolean
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function tierTone(tier: MemberRole): "success" | "warning" | "neutral" {
  if (tier === "admin") return "success"
  if (tier === "moderator") return "warning"
  return "neutral"
}

export function VolunteerRolesSettings({ volunteers, canManageTiers }: VolunteerRolesSettingsProps) {
  const [roster, setRoster] = useState(volunteers)
  const [busyId, setBusyId] = useState<string | null>(null)

  const handleTierChange = async (volunteer: ActiveVolunteerRecord, tier: MemberRole) => {
    if (!canManageTiers || tier === volunteer.memberRole) return

    setBusyId(volunteer.id)
    const result = await updateVolunteerTier({ userId: volunteer.id, tier })
    setBusyId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not update tier", description: result.error, variant: "destructive" })
      return
    }

    setRoster((prev) =>
      prev.map((item) => (item.id === volunteer.id ? { ...item, memberRole: tier } : item)),
    )
    toast({
      title: "Tier updated",
      description: `${volunteer.email} is now ${MEMBER_ROLE_LABELS[tier]}.`,
    })
  }

  return (
    <div className="space-y-8">
      <AdminSection
        title="Volunteer tiers"
        description="Three levels of responsibility. Capabilities map to existing admin permissions — super admin access is unchanged."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {VOLUNTEER_TIER_ORDER.map((tier) => {
            const adminRole = tier
            const permissions = ROLE_PERMISSIONS[adminRole]

            return (
              <div
                key={tier}
                className="flex flex-col rounded-xl border border-border/70 bg-card p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{VOLUNTEER_TIER_LABELS[tier]}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{VOLUNTEER_TIER_SUMMARY[tier]}</p>
                  </div>
                </div>

                <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                  {VOLUNTEER_TIER_RESPONSIBILITIES[tier].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-primary" aria-hidden="true">
                        ·
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Admin access today
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-foreground">
                    {permissions.length === 0 ? (
                      <li>No admin permissions</li>
                    ) : (
                      permissions.map((permission) => (
                        <li key={permission}>{PERMISSION_LABELS[permission]}</li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </AdminSection>

      <AdminSection title="Capability matrix" description="How each area maps across tiers.">
        <AdminTableShell>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-2">Area</TableHead>
                <TableHead className="py-2">Helper</TableHead>
                <TableHead className="py-2">Supervisor</TableHead>
                <TableHead className="py-2">Manager</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {VOLUNTEER_CAPABILITY_MATRIX.map((row) => (
                <TableRow key={row.area} className="text-sm align-top">
                  <TableCell className="py-3 font-medium">{row.label}</TableCell>
                  <TableCell className="py-3 text-muted-foreground">{row.helper}</TableCell>
                  <TableCell className="py-3 text-muted-foreground">{row.supervisor}</TableCell>
                  <TableCell className="py-3 text-muted-foreground">{row.manager}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableShell>
      </AdminSection>

      <AdminSection
        title="Active volunteers"
        description={
          canManageTiers
            ? "Change a volunteer's tier anytime. New approvals default to Helper."
            : "Roster is read-only at your access level."
        }
      >
        {roster.length === 0 ? (
          <AdminEmptyState
            title="No active volunteers yet"
            description="Approved applicants appear here with their assigned tier."
          />
        ) : (
          <AdminTableShell>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-2">Volunteer</TableHead>
                  <TableHead className="py-2">Tier</TableHead>
                  <TableHead className="hidden py-2 sm:table-cell">Approved</TableHead>
                  {canManageTiers ? <TableHead className="py-2">Assign tier</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((volunteer) => {
                  const isBusy = busyId === volunteer.id

                  return (
                    <TableRow key={volunteer.id} className="text-sm">
                      <TableCell className="py-2">
                        <p className="truncate font-medium" title={volunteer.email || volunteer.id}>
                          {volunteer.email || volunteer.id}
                        </p>
                        {volunteer.displayName ? (
                          <p className="truncate text-xs text-muted-foreground">{volunteer.displayName}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="py-2">
                        <AdminStatusBadge
                          label={MEMBER_ROLE_LABELS[volunteer.memberRole]}
                          tone={tierTone(volunteer.memberRole)}
                        />
                      </TableCell>
                      <TableCell className="hidden py-2 text-muted-foreground sm:table-cell">
                        {formatDate(volunteer.reviewedAt)}
                      </TableCell>
                      {canManageTiers ? (
                        <TableCell className="py-2">
                          <div className="max-w-[200px]">
                            <Label htmlFor={`tier-${volunteer.id}`} className="sr-only">
                              Tier for {volunteer.email}
                            </Label>
                            <Select
                              value={volunteer.memberRole}
                              onValueChange={(value) =>
                                void handleTierChange(volunteer, value as MemberRole)
                              }
                              disabled={isBusy}
                            >
                              <SelectTrigger id={`tier-${volunteer.id}`} className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {MEMBER_ROLES.map((tier) => (
                                  <SelectItem key={tier} value={tier}>
                                    {MEMBER_ROLE_LABELS[tier]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </AdminTableShell>
        )}

        {!canManageTiers && roster.length > 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            Only managers can change volunteer tiers.
          </p>
        ) : null}
      </AdminSection>
    </div>
  )
}

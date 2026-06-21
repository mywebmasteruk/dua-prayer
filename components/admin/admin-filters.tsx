"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Category } from "@/lib/types/dua"
import { AdminToolbar } from "@/components/admin/admin-toolbar"

interface AdminFiltersProps {
  categories: Category[]
  resultCount?: number
}

export function AdminFilters({ categories, resultCount }: AdminFiltersProps) {
  const router = useNavigationRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [language, setLanguage] = useState(searchParams.get("language") || "")

  useEffect(() => {
    setSearch(searchParams.get("search") || "")
    setStatus(searchParams.get("status") || "")
    setCategory(searchParams.get("category") || "")
    setLanguage(searchParams.get("language") || "")
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search })
  }

  const updateFilters = (updates: { search?: string; status?: string; category?: string; language?: string }) => {
    const params = new URLSearchParams()

    for (const [key, value] of Array.from(searchParams.entries())) {
      if (!Object.keys(updates).includes(key)) {
        params.set(key, value)
      }
    }

    if (updates.search !== undefined) {
      if (updates.search) {
        params.set("search", updates.search)
      } else {
        params.delete("search")
      }
    }

    if (updates.status !== undefined) {
      if (updates.status && updates.status !== "all") {
        params.set("status", updates.status)
      } else {
        params.delete("status")
      }
    }

    if (updates.category !== undefined) {
      if (updates.category && updates.category !== "all") {
        params.set("category", updates.category)
      } else {
        params.delete("category")
      }
    }

    if (updates.language !== undefined) {
      if (updates.language && updates.language !== "all") {
        params.set("language", updates.language)
      } else {
        params.delete("language")
      }
    }

    const url = `/admin${params.toString() ? `?${params.toString()}` : ""}`
    router.push(url)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    updateFilters({ status: value })
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    updateFilters({ category: value })
  }

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
    updateFilters({ language: value })
  }

  const handleReset = () => {
    setSearch("")
    setStatus("")
    setCategory("")
    setLanguage("")
    router.push("/admin")
  }

  const hasActiveFilters = Boolean(
    search ||
      (status && status !== "all") ||
      (category && category !== "all") ||
      (language && language !== "all"),
  )

  return (
    <AdminToolbar
      count={
        typeof resultCount === "number"
          ? `${resultCount} dua${resultCount === 1 ? "" : "s"}`
          : undefined
      }
    >
      <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search duas…"
            className="h-9 pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search duas"
          />
        </div>
        <Button type="submit" size="sm" className="h-9 shrink-0">
          Search
        </Button>
      </form>

      <Select value={status || "all"} onValueChange={handleStatusChange}>
        <SelectTrigger className="h-9 w-full sm:w-[148px]" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="unpublished">Unpublished</SelectItem>
          <SelectItem value="flagged">Flagged</SelectItem>
        </SelectContent>
      </Select>

      <Select value={category || "all"} onValueChange={handleCategoryChange}>
        <SelectTrigger className="h-9 w-full sm:w-[168px]" aria-label="Filter by category">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories
            .filter((cat) => cat.channel_type === "category")
            .map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <Select value={language || "all"} onValueChange={handleLanguageChange}>
        <SelectTrigger className="h-9 w-full sm:w-[148px]" aria-label="Filter by language">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All languages</SelectItem>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ar">Arabic</SelectItem>
          <SelectItem value="es">Spanish</SelectItem>
          <SelectItem value="ur">Urdu</SelectItem>
          <SelectItem value="fr">French</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters ? (
        <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0" onClick={handleReset}>
          Reset
        </Button>
      ) : null}
    </AdminToolbar>
  )
}

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

interface AdminFiltersProps {
  categories: Category[]
}

export function AdminFilters({ categories }: AdminFiltersProps) {
  const router = useNavigationRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "")

  // Initialize filters from URL on component mount
  useEffect(() => {
    setSearch(searchParams.get("search") || "")
    setStatus(searchParams.get("status") || "")
    setCategory(searchParams.get("category") || "")
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search })
  }

  const updateFilters = (updates: { search?: string; status?: string; category?: string }) => {
    const params = new URLSearchParams()

    // Preserve existing params that aren't being updated
    for (const [key, value] of Array.from(searchParams.entries())) {
      if (!Object.keys(updates).includes(key)) {
        params.set(key, value)
      }
    }

    // Add updated params
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

  const handleReset = () => {
    setSearch("")
    setStatus("")
    setCategory("")
    router.push("/admin")
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search duas..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="unpublished">Unpublished</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

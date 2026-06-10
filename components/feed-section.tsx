"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Category, Dua } from "@/lib/types/dua"
import { detectLanguage, type DuaLanguage } from "@/lib/detect-language"
import { FeedFilters, type LangFilter, type LangPill } from "@/components/feed-filters"
import { DuaList } from "@/components/dua-list"
import { FeedPagination } from "@/components/feed-pagination"
import { NewDuasBanner } from "@/components/new-duas-banner"
import { useHomeSearch } from "@/components/home-search-provider"
import { useNewDuasPoll } from "@/hooks/use-new-duas-poll"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import type { HomeEmptyCopy } from "@/lib/site-copy"

interface FeedSectionProps {
  duas: Dua[]
  categories: Category[]
  topCategories: Category[]
  pageSize: number
  feedActive?: boolean
  emptyCopy?: Pick<HomeEmptyCopy, "homeFeedEmptyTitle" | "homeFeedEmptyDescription">
}

function resolveVisibleCategories(topCategories: Category[], allCategories: Category[], activeCategory: string) {
  if (activeCategory === "all") return topCategories

  if (topCategories.some((category) => category.id.toString() === activeCategory)) {
    return topCategories
  }

  const active = allCategories.find((category) => category.id.toString() === activeCategory)
  if (!active) return topCategories

  const next = [...topCategories]
  if (next.length >= 3) next[2] = active
  else next.push(active)
  return next
}

function readFiltersFromUrl() {
  if (typeof window === "undefined") {
    return { category: "all", lang: "all" as LangFilter, page: 1 }
  }

  const params = new URLSearchParams(window.location.search)
  const langParam = params.get("lang")
  const lang: LangFilter = langParam === "en" || langParam === "ar" ? langParam : "all"

  return {
    category: params.get("category") || "all",
    lang,
    page: Math.max(1, Number.parseInt(params.get("page") ?? "1") || 1),
  }
}

function syncFiltersToUrl(category: string, lang: LangFilter, page: number) {
  const params = new URLSearchParams(window.location.search)

  if (category !== "all") params.set("category", category)
  else params.delete("category")

  if (lang !== "all") params.set("lang", lang)
  else params.delete("lang")

  if (page > 1) params.set("page", String(page))
  else params.delete("page")

  const query = params.toString()
  const nextUrl = query ? `/?${query}` : "/"
  const currentUrl = `${window.location.pathname}${window.location.search}`

  if (currentUrl !== nextUrl) {
    window.history.replaceState(window.history.state, "", nextUrl)
  }
}

function matchesLanguage(text: string, lang: LangFilter) {
  if (lang === "all") return true
  return detectLanguage(text) === (lang as DuaLanguage)
}

function matchesSearch(dua: Dua, searchQuery: string, categories: Category[]) {
  const trimmed = searchQuery.trim().toLowerCase()
  if (!trimmed) return true

  const categoryName =
    dua.category_name ?? categories.find((category) => category.id === dua.category_id)?.name ?? ""

  return dua.text.toLowerCase().includes(trimmed) || categoryName.toLowerCase().includes(trimmed)
}

export function FeedSection({
  duas,
  categories,
  topCategories,
  pageSize,
  feedActive = true,
  emptyCopy,
}: FeedSectionProps) {
  const { query: searchQuery } = useHomeSearch()
  const router = useNavigationRouter()
  const [category, setCategory] = useState("all")
  const [lang, setLang] = useState<LangFilter>("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    const initial = readFiltersFromUrl()
    setCategory(initial.category)
    setLang(initial.lang)
    setPage(initial.page)
  }, [])

  const visibleCategories = useMemo(
    () => resolveVisibleCategories(topCategories, categories, category),
    [categories, category, topCategories],
  )

  const filteredDuas = useMemo(() => {
    return duas.filter((dua) => {
      if (category !== "all" && dua.category_id?.toString() !== category) return false
      if (!matchesLanguage(dua.text, lang)) return false
      if (!matchesSearch(dua, searchQuery, categories)) return false
      return true
    })
  }, [category, categories, duas, lang, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredDuas.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paginatedDuas = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDuas.slice(start, start + pageSize)
  }, [currentPage, filteredDuas, pageSize])

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [currentPage, page])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const updateFilters = useCallback(
    (nextCategory: string, nextLang: LangFilter, nextPage: number) => {
      setCategory(nextCategory)
      setLang(nextLang)
      setPage(nextPage)
      syncFiltersToUrl(nextCategory, nextLang, nextPage)
    },
    [],
  )

  const handleCategoryChange = useCallback(
    (value: string) => updateFilters(value, lang, 1),
    [lang, updateFilters],
  )

  const handleLangChange = useCallback(
    (value: LangPill) => {
      const nextLang: LangFilter = lang === value ? "all" : value
      updateFilters(category, nextLang, 1)
    },
    [category, lang, updateFilters],
  )

  const handlePageChange = useCallback(
    (nextPage: number) => updateFilters(category, lang, nextPage),
    [category, lang, updateFilters],
  )

  const isDefaultFeedView =
    feedActive &&
    currentPage === 1 &&
    category === "all" &&
    lang === "all" &&
    searchQuery.trim() === ""

  const newestSeenCreatedAt = filteredDuas[0]?.created_at ?? null

  const { count: newDuasCount, dismiss: dismissNewDuasBanner } = useNewDuasPoll({
    enabled: isDefaultFeedView,
    sinceCreatedAt: newestSeenCreatedAt,
  })

  const handleShowNewDuas = useCallback(() => {
    dismissNewDuasBanner()

    if (page !== 1) {
      updateFilters(category, lang, 1)
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
    router.refresh()
  }, [category, dismissNewDuasBanner, lang, page, router, updateFilters])

  return (
    <>
      <FeedFilters
        categories={visibleCategories}
        activeCategory={category}
        activeLang={lang}
        onCategoryChange={handleCategoryChange}
        onLangChange={handleLangChange}
      />

      <NewDuasBanner count={newDuasCount} onShow={handleShowNewDuas} />

      <section className="min-h-[280px]">
        <DuaList
          duas={paginatedDuas}
          emptyTitle={emptyCopy?.homeFeedEmptyTitle}
          emptyDescription={emptyCopy?.homeFeedEmptyDescription}
        />
      </section>

      <section className="bg-white px-4 py-3 sm:px-5 sm:py-4">
        <FeedPagination
          page={currentPage}
          total={filteredDuas.length}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </section>
    </>
  )
}

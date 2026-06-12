"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getFeedDuas } from "@/app/actions/duas"
import type { Category, Dua } from "@/lib/types/dua"
import { getChannelHandle } from "@/lib/channels"
import { detectLanguage, type DuaLanguage } from "@/lib/detect-language"
import { FeedFilters, type LangFilter, type LangPill } from "@/components/feed-filters"
import { DuaList } from "@/components/dua-list"
import { FeedPagination } from "@/components/feed-pagination"
import { NewDuasBanner } from "@/components/new-duas-banner"
import { useHomeSearch } from "@/components/home-search-provider"
import { matchesHashtag, normalizeHashtag } from "@/lib/hashtags"
import { useNewDuasPoll } from "@/hooks/use-new-duas-poll"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import type { HomeEmptyCopy } from "@/lib/site-copy"

interface FeedSectionProps {
  duas: Dua[]
  categories: Category[]
  topCategories: Category[]
  pageSize: number
  /** Total published duas on the server (the duas prop is only the first batch). */
  total: number
  feedActive?: boolean
  emptyCopy?: Pick<HomeEmptyCopy, "homeFeedEmptyTitle" | "homeFeedEmptyDescription">
  /** Pre-select a channel handle on mount (used by /channel/[handle] page). */
  initialCategory?: string
}

function resolveVisibleCategories(topCategories: Category[], allCategories: Category[], activeHandle: string) {
  if (activeHandle === "all") return topCategories

  if (topCategories.some((category) => getChannelHandle(category) === activeHandle)) {
    return topCategories
  }

  const active = allCategories.find((category) => getChannelHandle(category) === activeHandle)
  if (!active) return topCategories

  const next = [...topCategories]
  if (next.length >= 3) next[2] = active
  else next.push(active)
  return next
}

function readFiltersFromUrl() {
  if (typeof window === "undefined") {
    return { category: "all", lang: "all" as LangFilter, page: 1, tag: "" }
  }

  const params = new URLSearchParams(window.location.search)
  const langParam = params.get("lang")
  const lang: LangFilter = langParam === "en" || langParam === "ar" ? langParam : "all"

  return {
    category: params.get("category") || "all",
    lang,
    page: Math.max(1, Number.parseInt(params.get("page") ?? "1") || 1),
    tag: normalizeHashtag(params.get("tag") ?? ""),
  }
}

function syncFiltersToUrl(lang: LangFilter, page: number, tag: string) {
  const params = new URLSearchParams(window.location.search)

  // Category is now path-based (/channel/handle) — clean up any legacy param
  params.delete("category")

  if (lang !== "all") params.set("lang", lang)
  else params.delete("lang")

  if (page > 1) params.set("page", String(page))
  else params.delete("page")

  if (tag) params.set("tag", tag)
  else params.delete("tag")

  const query = params.toString()
  const pathname = window.location.pathname
  const nextUrl = query ? `${pathname}?${query}` : pathname
  const currentUrl = `${pathname}${window.location.search}`

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
  total,
  feedActive = true,
  emptyCopy,
  initialCategory,
}: FeedSectionProps) {
  const { query: searchQuery } = useHomeSearch()
  const router = useNavigationRouter()
  const [category, setCategory] = useState("all")
  const [lang, setLang] = useState<LangFilter>("all")
  const [page, setPage] = useState(1)
  const [tag, setTag] = useState("")
  const [extraDuas, setExtraDuas] = useState<Dua[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  // Server count can shrink (duas unpublished) below the total prop captured
  // at render; track the freshest count and stop loading on an empty batch so
  // the loader can never spin forever chasing a stale total.
  const [liveTotal, setLiveTotal] = useState(total)
  const [exhausted, setExhausted] = useState(false)

  useEffect(() => {
    setLiveTotal(total)
    setExhausted(false)
  }, [total])

  useEffect(() => {
    // Channel page: category is fixed by the route, skip URL migration
    if (initialCategory) {
      setCategory(initialCategory)
      return
    }

    const initial = readFiltersFromUrl()
    let resolvedCategory = initial.category

    // Migrate legacy numeric ?category=<id> to handle
    if (resolvedCategory !== "all" && /^\d+$/.test(resolvedCategory)) {
      const match = categories.find((c) => c.id.toString() === resolvedCategory)
      resolvedCategory = match ? getChannelHandle(match) : "all"
    }

    // Redirect legacy ?category=<handle> to path-based /channel/<handle>
    if (resolvedCategory !== "all") {
      const params = new URLSearchParams(window.location.search)
      params.delete("category")
      const query = params.toString()
      router.replace(`/channel/${resolvedCategory}${query ? `?${query}` : ""}`)
      return
    }

    setCategory("all")
    setLang(initial.lang)
    setPage(initial.page)
    setTag(initial.tag)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleCategories = useMemo(
    () => resolveVisibleCategories(topCategories, categories, category),
    [categories, category, topCategories],
  )

  // The duas prop is the newest server batch; extraDuas holds older batches
  // loaded on demand. Dedupe by id — new submissions shift batch offsets.
  const allDuas = useMemo(() => {
    if (extraDuas.length === 0) return duas
    const seen = new Set(duas.map((dua) => dua.id))
    return [...duas, ...extraDuas.filter((dua) => !seen.has(dua.id))]
  }, [duas, extraDuas])

  const categoryIdByHandle = useMemo(() => {
    const map = new Map<string, number>()
    for (const cat of categories) map.set(getChannelHandle(cat), cat.id)
    return map
  }, [categories])

  const filteredDuas = useMemo(() => {
    const activeCategoryId = category !== "all" ? categoryIdByHandle.get(category) : undefined
    return allDuas.filter((dua) => {
      if (activeCategoryId !== undefined && dua.category_id !== activeCategoryId) return false
      if (tag && !matchesHashtag(dua.text, tag)) return false
      if (!matchesLanguage(dua.text, lang)) return false
      if (!matchesSearch(dua, searchQuery, categories)) return false
      return true
    })
  }, [allDuas, category, categoryIdByHandle, categories, lang, searchQuery, tag])

  const filtersActive =
    category !== "all" || lang !== "all" || tag !== "" || searchQuery.trim() !== ""
  const allLoaded = exhausted || allDuas.length >= liveTotal

  // Language/hashtag/search filters run on the client (they analyze the dua
  // text), so they need the full dataset; otherwise load just enough batches
  // to cover the page the user is on.
  useEffect(() => {
    if (allLoaded || isLoadingMore || !feedActive) return
    const needed = filtersActive ? liveTotal : Math.min(page * pageSize, liveTotal)
    if (allDuas.length >= needed) return

    let cancelled = false
    setIsLoadingMore(true)
    getFeedDuas({ offset: allDuas.length })
      .then((result) => {
        if (cancelled) return
        setLiveTotal(result.total)
        if (result.duas.length === 0) {
          setExhausted(true)
          return
        }
        setExtraDuas((previous) => {
          const seen = new Set([...duas, ...previous].map((dua) => dua.id))
          const fresh = result.duas.filter((dua) => !seen.has(dua.id))
          // An all-duplicates batch means offsets shifted and there is nothing
          // new to fetch — treat it as exhausted rather than refetching.
          if (fresh.length === 0) {
            setExhausted(true)
            return previous
          }
          return [...previous, ...fresh]
        })
      })
      .catch((error) => console.error("Error loading more duas:", error))
      .finally(() => {
        if (!cancelled) setIsLoadingMore(false)
      })

    return () => {
      cancelled = true
    }
  }, [allDuas.length, allLoaded, duas, feedActive, filtersActive, isLoadingMore, page, pageSize, liveTotal])

  // Unfiltered: trust the server count so pages past the loaded batches stay
  // reachable. Filtered (or exhausted): the local count is the real one.
  const paginationTotal =
    filtersActive || exhausted
      ? filteredDuas.length
      : Math.max(liveTotal, filteredDuas.length)
  const totalPages = Math.max(1, Math.ceil(paginationTotal / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paginatedDuas = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDuas.slice(start, start + pageSize)
  }, [currentPage, filteredDuas, pageSize])

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [currentPage, page])

  // Reset to page 1 when the search changes — but not on mount, where this
  // would clobber the page just read from a ?page=N deep link.
  const isFirstSearchEffect = useRef(true)
  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false
      return
    }
    setPage(1)
  }, [searchQuery])

  const updateFilters = useCallback(
    (nextLang: LangFilter, nextPage: number) => {
      setLang(nextLang)
      setPage(nextPage)
      syncFiltersToUrl(nextLang, nextPage, tag)
    },
    [tag],
  )

  const handleCategoryChange = useCallback(
    (value: string) => {
      if (value !== "all") {
        window.history.pushState(null, "", `/channel/${value}`)
        setCategory(value)
        setPage(1)
      } else {
        window.history.pushState(null, "", "/")
        setCategory("all")
        updateFilters(lang, 1)
      }
    },
    [lang, updateFilters],
  )

  const handleLangChange = useCallback(
    (value: LangPill) => {
      const nextLang: LangFilter = lang === value ? "all" : value
      updateFilters(nextLang, 1)
    },
    [lang, updateFilters],
  )

  const handlePageChange = useCallback(
    (nextPage: number) => updateFilters(lang, nextPage),
    [lang, updateFilters],
  )

  const clearTagFilter = useCallback(() => {
    setTag("")
    setPage(1)
    syncFiltersToUrl(lang, 1, "")
  }, [lang])

  const isDefaultFeedView =
    feedActive &&
    currentPage === 1 &&
    category === "all" &&
    lang === "all" &&
    tag === "" &&
    searchQuery.trim() === ""

  const newestSeenCreatedAt = filteredDuas[0]?.created_at ?? null

  const { count: newDuasCount, dismiss: dismissNewDuasBanner } = useNewDuasPoll({
    enabled: isDefaultFeedView,
    sinceCreatedAt: newestSeenCreatedAt,
  })

  const handleShowNewDuas = useCallback(() => {
    dismissNewDuasBanner()

    if (page !== 1) {
      updateFilters(lang, 1)
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

      {tag ? (
        <div className="border-t border-border/60 bg-primary/5 px-4 py-2.5 text-sm text-foreground sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate font-medium">Showing duas tagged #{tag}</span>
            <button
              type="button"
              onClick={clearTagFilter}
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

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
          total={paginationTotal}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </section>
    </>
  )
}

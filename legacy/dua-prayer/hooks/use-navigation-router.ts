"use client"

import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useNavigation } from "@/components/navigation-provider"
import { shouldStartNavigation } from "@/lib/navigation"

type NavigationRouter = ReturnType<typeof useRouter>

export function useNavigationRouter(): NavigationRouter {
  const router = useRouter()
  const { startNavigation } = useNavigation()

  const push = useCallback<NavigationRouter["push"]>(
    (href, options) => {
      if (shouldStartNavigation(href)) startNavigation()
      return router.push(href, options)
    },
    [router, startNavigation],
  )

  const replace = useCallback<NavigationRouter["replace"]>(
    (href, options) => {
      if (shouldStartNavigation(href)) startNavigation()
      return router.replace(href, options)
    },
    [router, startNavigation],
  )

  return useMemo(
    () => ({
      ...router,
      push,
      replace,
    }),
    [push, replace, router],
  )
}

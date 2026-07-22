import { getBetaBannerSettings } from "@/lib/site-settings-server"
import { renderBannerRichText, sanitizeBannerColor } from "@/lib/banner-rich-text"

export async function BetaBanner() {
  const settings = await getBetaBannerSettings()
  if (!settings.enabled) return null

  return (
    <div
      className="w-full px-3 py-1.5 text-center text-xs font-medium leading-5 text-slate-900 sm:text-sm"
      style={{ backgroundColor: sanitizeBannerColor(settings.bgColor) }}
      role="status"
    >
      <span className="mx-auto block max-w-5xl">{renderBannerRichText(settings.message)}</span>
    </div>
  )
}

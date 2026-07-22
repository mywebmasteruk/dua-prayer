export type FooterLink = {
  label: string;
  href: string;
  openInNewTab: boolean;
};

export const FOOTER_LINKS_SETTING_KEY = 'footer.links';

export const FOOTER_LINK_DEFAULTS: ReadonlyArray<FooterLink> = [
  { label: 'Home', href: '/', openInNewTab: false },
  { label: 'Channels', href: '/channels', openInNewTab: false },
  { label: 'Support', href: '/donate', openInNewTab: false },
  { label: 'Volunteer', href: '/volunteer', openInNewTab: false },
  { label: 'About', href: '/about', openInNewTab: false },
  { label: 'Safety', href: '/safety', openInNewTab: false },
  { label: 'Resources', href: '/resources', openInNewTab: false },
];

function sanitizeLink(raw: unknown): FooterLink | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const label = typeof obj.label === 'string' ? obj.label.trim() : '';
  const href = typeof obj.href === 'string' ? obj.href.trim() : '';
  if (!label || !href) return null;
  return {
    label,
    href,
    openInNewTab: obj.openInNewTab === true,
  };
}

export function parseFooterLinks(value: string | null | undefined): FooterLink[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeLink)
      .filter((link): link is FooterLink => link !== null);
  } catch {
    return [];
  }
}

export function resolveFooterLinks(
  value: string | null | undefined,
): ReadonlyArray<FooterLink> {
  const saved = parseFooterLinks(value);
  return saved.length > 0 ? saved : FOOTER_LINK_DEFAULTS;
}

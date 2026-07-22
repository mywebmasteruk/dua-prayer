# @kit/analytics

## Non-Negotiables

1. Client: `import { analytics } from '@kit/analytics'` / Server: `import { analytics } from '@kit/analytics/server'`
2. NEVER track PII (emails, names, IPs) in event properties
3. Page views and user identification are handled centrally in the `AnalyticsProvider` — don't call `trackPageView` or `identify` ad-hoc in feature components
4. NEVER create custom providers without implementing the full `AnalyticsService` interface

## Exemplar

- `apps/web/components/analytics-provider.tsx` — provider setup with plugin registration

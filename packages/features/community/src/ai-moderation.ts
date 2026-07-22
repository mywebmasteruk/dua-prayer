export type ModerationSeverity = 'safe' | 'review' | 'block';

export type ModerationResult = {
  flagged: boolean;
  severity: ModerationSeverity;
  reason: string;
  source: 'local' | 'provider' | 'disabled' | 'error';
};

export type AiModerationSettings = {
  enabled: boolean;
  apiKey: string | null;
  model: string;
  baseUrl: string;
  timeoutMs: number;
};

const LOCAL_BLOCK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern:
      /\b(kill|murder|slaughter|assassinate)\s+(you|him|her|them|everyone|people)\b/i,
    reason: 'Threatening violent language',
  },
  {
    pattern:
      /\b(i\s+will|i'm\s+going\s+to|im\s+going\s+to)\s+(kill|murder|destroy|hurt)\b/i,
    reason: 'Threatening violent language',
  },
  {
    pattern: /\b(go\s+kill\s+yourself|kys)\b/i,
    reason: 'Self-harm harassment',
  },
];

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function localModeration(text: string): ModerationResult | null {
  for (const item of LOCAL_BLOCK_PATTERNS) {
    if (item.pattern.test(text)) {
      return {
        flagged: true,
        severity: 'block',
        reason: item.reason,
        source: 'local',
      };
    }
  }

  return null;
}

async function callProviderModeration(
  text: string,
  settings: AiModerationSettings,
): Promise<Omit<ModerationResult, 'source'>> {
  if (!settings.apiKey) {
    return {
      flagged: true,
      severity: 'review',
      reason: 'AI moderation is enabled but no API key is configured.',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), settings.timeoutMs);

  try {
    const response = await fetch(
      `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: settings.model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are a conservative content moderation classifier. Return JSON only with keys flagged, severity (safe|review|block), reason.',
            },
            {
              role: 'user',
              content: `Moderate this public dua/prayer request for abuse, hate, threats, sexual content, or doxxing. Do not flag sincere hardship prayers.\n\n${JSON.stringify(text)}`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Provider HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content) as {
      flagged?: unknown;
      severity?: unknown;
      reason?: unknown;
    };
    const severity =
      parsed.severity === 'safe' ||
      parsed.severity === 'review' ||
      parsed.severity === 'block'
        ? parsed.severity
        : parsed.flagged === true
          ? 'review'
          : 'safe';

    return {
      flagged: severity !== 'safe' || parsed.flagged === true,
      severity,
      reason:
        typeof parsed.reason === 'string' && parsed.reason.trim()
          ? parsed.reason.trim().slice(0, 240)
          : 'Moderation policy matched.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function evaluateDuaModeration(input: {
  text: string;
  settings: AiModerationSettings;
}): Promise<ModerationResult> {
  const normalized = normalizeText(input.text);
  const local = localModeration(normalized);

  if (local) return local;

  if (!input.settings.enabled) {
    return {
      flagged: false,
      severity: 'safe',
      reason: 'AI moderation disabled.',
      source: 'disabled',
    };
  }

  try {
    const result = await callProviderModeration(normalized, input.settings);

    return { ...result, source: 'provider' };
  } catch {
    return {
      flagged: false,
      severity: 'safe',
      reason: 'AI moderation was unavailable; published without an AI check.',
      source: 'error',
    };
  }
}

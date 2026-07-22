import 'server-only';

import type { AiModerationSettings } from '../ai-moderation';

export type AiChatSettings = Pick<
  AiModerationSettings,
  'apiKey' | 'baseUrl' | 'model' | 'timeoutMs'
>;

/**
 * OpenAI-compatible chat completions helper (same settings shape as AI moderation).
 */
export async function callAiChatCompletions(input: {
  settings: AiChatSettings;
  system: string;
  user: string;
  timeoutMs?: number;
}): Promise<string> {
  const { settings, system, user } = input;

  if (!settings.apiKey?.trim()) {
    throw new Error(
      'AI is not configured. Save an API key under Admin → Settings (AI moderation) before running dua bots.',
    );
  }

  const timeoutMs = input.timeoutMs ?? settings.timeoutMs ?? 8000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `AI chat failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('AI chat returned an empty response.');
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

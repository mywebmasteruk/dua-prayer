export type AiProvider =
  | "none"
  | "openai"
  | "anthropic"
  | "google"
  | "mistral"
  | "groq"
  | "together"
  | "deepseek"
  | "xai"
  | "perplexity"
  | "cohere"
  | "openrouter"
  | "ollama"

export type ProviderFormat = "openai" | "anthropic" | "google" | "cohere"

export type ProviderMeta = {
  id: AiProvider
  label: string
  apiBase: string
  modelsEndpoint: string | null
  keyPlaceholder: string
  requiresApiKey: boolean
  fallbackModels: string[]
  defaultModel: string
  format: ProviderFormat
  supportsJsonMode: boolean
}

export const PROVIDER_CATALOG: Readonly<Record<Exclude<AiProvider, "none">, ProviderMeta>> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    apiBase: "https://api.openai.com/v1",
    modelsEndpoint: "https://api.openai.com/v1/models",
    keyPlaceholder: "sk-…",
    requiresApiKey: true,
    fallbackModels: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    defaultModel: "gpt-4o-mini",
    format: "openai",
    supportsJsonMode: true,
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    apiBase: "https://api.anthropic.com",
    modelsEndpoint: null,
    keyPlaceholder: "sk-ant-…",
    requiresApiKey: true,
    fallbackModels: [
      "claude-opus-4-8",
      "claude-sonnet-4-6",
      "claude-haiku-4-5-20251001",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ],
    defaultModel: "claude-sonnet-4-6",
    format: "anthropic",
    supportsJsonMode: false,
  },
  google: {
    id: "google",
    label: "Google Gemini",
    apiBase: "https://generativelanguage.googleapis.com/v1beta",
    modelsEndpoint: "https://generativelanguage.googleapis.com/v1beta/models",
    keyPlaceholder: "AIza…",
    requiresApiKey: true,
    fallbackModels: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro", "gemini-1.5-flash"],
    defaultModel: "gemini-2.0-flash",
    format: "google",
    supportsJsonMode: false,
  },
  mistral: {
    id: "mistral",
    label: "Mistral AI",
    apiBase: "https://api.mistral.ai/v1",
    modelsEndpoint: "https://api.mistral.ai/v1/models",
    keyPlaceholder: "…",
    requiresApiKey: true,
    fallbackModels: ["mistral-large-latest", "mistral-small-latest", "open-mixtral-8x22b", "open-mistral-7b"],
    defaultModel: "mistral-large-latest",
    format: "openai",
    supportsJsonMode: false,
  },
  groq: {
    id: "groq",
    label: "Groq",
    apiBase: "https://api.groq.com/openai/v1",
    modelsEndpoint: "https://api.groq.com/openai/v1/models",
    keyPlaceholder: "gsk_…",
    requiresApiKey: true,
    fallbackModels: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "gemma2-9b-it",
      "mixtral-8x7b-32768",
    ],
    defaultModel: "llama-3.3-70b-versatile",
    format: "openai",
    supportsJsonMode: true,
  },
  together: {
    id: "together",
    label: "Together AI",
    apiBase: "https://api.together.xyz/v1",
    modelsEndpoint: "https://api.together.xyz/v1/models",
    keyPlaceholder: "…",
    requiresApiKey: true,
    fallbackModels: [
      "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "Qwen/Qwen2.5-72B-Instruct-Turbo",
    ],
    defaultModel: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    format: "openai",
    supportsJsonMode: false,
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    apiBase: "https://api.deepseek.com",
    modelsEndpoint: "https://api.deepseek.com/models",
    keyPlaceholder: "sk-…",
    requiresApiKey: true,
    fallbackModels: ["deepseek-chat", "deepseek-reasoner"],
    defaultModel: "deepseek-chat",
    format: "openai",
    supportsJsonMode: true,
  },
  xai: {
    id: "xai",
    label: "xAI (Grok)",
    apiBase: "https://api.x.ai/v1",
    modelsEndpoint: "https://api.x.ai/v1/models",
    keyPlaceholder: "xai-…",
    requiresApiKey: true,
    fallbackModels: ["grok-3", "grok-3-mini", "grok-2", "grok-2-mini"],
    defaultModel: "grok-3-mini",
    format: "openai",
    supportsJsonMode: false,
  },
  perplexity: {
    id: "perplexity",
    label: "Perplexity",
    apiBase: "https://api.perplexity.ai",
    modelsEndpoint: null,
    keyPlaceholder: "pplx-…",
    requiresApiKey: true,
    fallbackModels: ["sonar-pro", "sonar", "sonar-reasoning", "sonar-reasoning-pro", "sonar-deep-research"],
    defaultModel: "sonar-pro",
    format: "openai",
    supportsJsonMode: false,
  },
  cohere: {
    id: "cohere",
    label: "Cohere",
    apiBase: "https://api.cohere.com/v2",
    modelsEndpoint: "https://api.cohere.com/v2/models",
    keyPlaceholder: "…",
    requiresApiKey: true,
    fallbackModels: ["command-a-03-2025", "command-r-plus", "command-r", "command-r7b-12-2024"],
    defaultModel: "command-r-plus",
    format: "cohere",
    supportsJsonMode: false,
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    apiBase: "https://openrouter.ai/api/v1",
    modelsEndpoint: "https://openrouter.ai/api/v1/models",
    keyPlaceholder: "sk-or-v1-…",
    requiresApiKey: true,
    fallbackModels: [
      "anthropic/claude-sonnet-4-5",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "google/gemini-2.0-flash-001",
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-chat",
      "mistralai/mistral-large",
      "x-ai/grok-2-1212",
    ],
    defaultModel: "openai/gpt-4o-mini",
    format: "openai",
    supportsJsonMode: false,
  },
  ollama: {
    id: "ollama",
    label: "Ollama (local)",
    apiBase: "http://localhost:11434/v1",
    modelsEndpoint: "http://localhost:11434/api/tags",
    keyPlaceholder: "No key needed",
    requiresApiKey: false,
    fallbackModels: ["llama3.2", "llama3.1", "phi4", "mistral", "qwen2.5"],
    defaultModel: "llama3.2",
    format: "openai",
    supportsJsonMode: false,
  },
}

export const AI_PROVIDER_IDS: AiProvider[] = [
  "none",
  "openai",
  "anthropic",
  "google",
  "mistral",
  "groq",
  "together",
  "deepseek",
  "xai",
  "perplexity",
  "cohere",
  "openrouter",
  "ollama",
]

export type DuaBotStatus = 'active' | 'paused';

export type DuaBotRow = {
  id: number;
  name: string;
  description: string;
  status: string;
  frequency_minutes: number;
  source_type: string;
  rss_urls: string[];
  keywords: string[];
  categories: string[];
  tone: string;
  language: string;
  system_prompt: string;
  max_duas_per_run: number;
  target_category_id: number | null;
  publish_mode: string;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

import type { User } from '@supabase/supabase-js';

export interface WithoutTimestamps<T> = Omit<T, 'created_at' | 'updated_at'>;
export interface WithoutSystemFields<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

export interface DBWebinar {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface DBKnowledgeBase {
  id: string;
  webinar_id: string;
  campaign_outline: Record<string, any>;
  audience_data: Record<string, any>;
  ultimate_client_goals: Record<string, any>;
  webinar_value_proposition: Record<string, any>;
  webinar_summary: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DBTopic {
  id: string;
  webinar_id: string;
  name: string;
  description: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}
export interface DBSlide {
  id: string;
  webinar_id: string;
  title: string;
  subtitle?: string;
  content?: string;
  type: 'intro' | 'agenda' | 'content';
  // type: 'intro' | 'story' | 'pain' | 'solution' | 'offer' | 'close';
  notes: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}
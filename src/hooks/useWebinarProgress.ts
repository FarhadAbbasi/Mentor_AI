import { useState, useEffect } from 'react';
import { useWebinarStore } from '../stores/webinarStore';
import * as queries from '../lib/database/queries';

export interface WebinarProgress {
  status: 'draft' | 'published';
  knowledgeBase: {
    exists: boolean;
    isComplete: boolean;
  };
  topics: {
    count: number;
    withDescriptions: number;
  };
  product: {
    exists: boolean;
    hasPrice: boolean;
    bonusesCount: number;
  };
  slides: {
    count: number;
    withContent: number;
  };
  knowledgeSources: {
    count: number;
    byType: {
      text: number;
      image: number;
    };
  };
}

export function useWebinarProgress() {
  const { currentWebinarId } = useWebinarStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<WebinarProgress | null>(null);

  useEffect(() => {
    if (!currentWebinarId) return;

    const fetchProgress = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await queries.getWebinarWithProgress(currentWebinarId);
        
        setProgress({
          status: data.status,
          knowledgeBase: {
            exists: Boolean(data.knowledge_bases?.length),
            isComplete: Boolean(data.knowledge_bases?.[0]?.campaign_outline?.productName),
          },
          topics: {
            count: data.topics?.length || 0,
            withDescriptions: data.topics?.filter(t => t.description)?.length || 0,
          },
          product: {
            exists: Boolean(data.products?.length),
            hasPrice: Boolean(data.products?.[0]?.special_price),
            bonusesCount: data.products?.[0]?.bonuses?.length || 0,
          },
          slides: {
            count: data.slides?.length || 0,
            withContent: data.slides?.filter(s => s.content)?.length || 0,
          },
          knowledgeSources: {
            count: data.knowledge_sources?.length || 0,
            byType: {
              text: data.knowledge_sources?.filter(s => s.source_type === 'text')?.length || 0,
              image: data.knowledge_sources?.filter(s => s.source_type === 'image')?.length || 0,
            },
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch progress');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [currentWebinarId]);

  return { progress, loading, error };
}
import { useState, useCallback } from 'react';
import { useWebinarStore } from '../stores/webinarStore';
import * as knowledgeDB from '../lib/database/knowledgeBase';
import type { WebinarData } from '../types/webinar';

export function useKnowledgeBase() {
  const { currentWebinarId } = useWebinarStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveKnowledgeBase = useCallback(async (data: WebinarData) => {
    if (!currentWebinarId) {
      setError('No webinar selected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Save knowledge base
      const knowledgeBase = await knowledgeDB.saveKnowledgeBase(currentWebinarId, {
        campaign_outline: {},
        audience_data: {},
        ultimate_client_goals: {},
        webinar_value_proposition: {},
        webinar_summary: {}
      });

      // Save topics
      if (data.topics.length > 0) {
        await knowledgeDB.saveTopics(currentWebinarId, 
          data.topics.map((topic, index) => ({
            name: topic.name,
            description: topic.description,
            order_index: index
          }))
        );
      }

      return knowledgeBase;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save knowledge base');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentWebinarId]);

  return {
    saveKnowledgeBase,
    loading,
    error,
    clearError: () => setError(null)
  };
}
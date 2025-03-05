import { useState, useCallback } from 'react';
import { useWebinarStore } from '../stores/webinarStore';
import * as queries from '../lib/database/queries';
import type { DBTopic, DBSlide } from '../lib/database/types';

export function useWebinarContent() {
  const { currentWebinarId } = useWebinarStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(async (): Promise<DBTopic[]> => {
    if (!currentWebinarId) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const topics = await queries.getTopics(currentWebinarId);
      return topics;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topics');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentWebinarId]);

  const reorderTopics = useCallback(async (topics: { id: string; order_index: number }[]) => {
    setLoading(true);
    setError(null);
    
    try {
      await queries.reorderTopics(topics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder topics');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSlides = useCallback(async (): Promise<DBSlide[]> => {
    if (!currentWebinarId) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const slides = await queries.getSlides(currentWebinarId);
      return slides;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch slides');
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentWebinarId]);

  const updateSlide = useCallback(async (
    slideId: string,
    updates: Partial<Omit<DBSlide, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const slide = await queries.updateSlide(slideId, updates);
      return slide;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update slide');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderSlides = useCallback(async (slides: { id: string; order_index: number }[]) => {
    setLoading(true);
    setError(null);
    
    try {
      await queries.reorderSlides(slides);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder slides');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchTopics,
    reorderTopics,
    fetchSlides,
    updateSlide,
    reorderSlides,
    loading,
    error,
    clearError: () => setError(null)
  };
}
import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import * as webinarDB from '../lib/database/webinar';
import type { WebinarData } from '../types/webinar';
import type { DBWebinar } from '../lib/database/types';

export function useWebinar() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFirstWebinar = useCallback(async (): Promise<DBWebinar | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const webinar = await webinarDB.createWebinar(user.id);
      return webinar;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webinar');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    createFirstWebinar,
    loading,
    error,
    clearError: () => setError(null)
  };
}
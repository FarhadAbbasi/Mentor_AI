import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import * as authDB from '../lib/database/auth';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { user } = await authDB.signInWithEmail(email, password);
      setUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { user } = await authDB.signUpWithEmail(email, password);
      setUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await authDB.signOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  return {
    signIn,
    signUp,
    signOut,
    loading,
    error,
    clearError: () => setError(null)
  };
}
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { checkAdminStatus } from '../lib/auth';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  signIn: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: false,
  error: null,
  signUp: async (email: string, password: string, tier = 'Free') => {
    set({ loading: true, error: null });
    try {
      // Sign up the user using Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
  
      // Check if the user is an admin using the checkAdminStatus function
      const { user } = data;
      const isAdmin = checkAdminStatus(user); // Use the provided function to determine admin status
  
      // Insert the new user into the 'users' table (correct table name)
      const { error: dbError } = await supabase.from('users').insert([
        {
          id: user?.id, // Use the user's ID from Supabase auth
          email: user?.email,
          isAdmin, // Set the isAdmin field based on the checkAdminStatus function
          Tier: tier, // Set the Tier field
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
  
      if (dbError) throw dbError;
  
      // Update state with the new user
      set({ user, isAdmin, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to sign up',
        loading: false,
      });
    }
  },
  
  
  
  signIn: async (email: string, password: string, isAdmin = false) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const isAdminUser = checkAdminStatus(data.user);
      set({ user: data.user, isAdmin: isAdminUser, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sign in',
        loading: false 
      });
    }
  },
  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, isAdmin: false, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sign out',
        loading: false 
      });
    }
  }
}));
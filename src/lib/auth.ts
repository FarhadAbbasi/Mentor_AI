import { User } from '@supabase/supabase-js';

export function isAdminEmail(email: string): boolean {
  return email?.toLowerCase().endsWith('@thementorprogram.xyz');
}

export function checkAdminStatus(user: User | null): boolean {
  return user?.email ? isAdminEmail(user.email) : false;
}
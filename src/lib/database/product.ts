import { supabase } from '../supabase';
import type { DBProduct, DBBonus } from './types';

export async function saveProduct(
  webinarId: string,
  product: Omit<DBProduct, 'id' | 'webinar_id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('products')
    .insert([{ ...product, webinar_id: webinarId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveBonuses(
  productId: string,
  bonuses: Omit<DBBonus, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]
) {
  const { data, error } = await supabase
    .from('bonuses')
    .insert(bonuses.map(bonus => ({ ...bonus, product_id: productId })))
    .select();

  if (error) throw error;
  return data;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<DBProduct, 'id' | 'webinar_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
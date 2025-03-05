import { supabase } from '../supabase';

interface User {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
  created_at: string;
}

export async function listUsers(): Promise<User[]> {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error);
    throw new Error(error.message);
  }

  return data.users || [];
}


export async function updateUser(userId: string, updates: Record<string, any>): Promise<User> {
  const { data, error } = await supabase
    .rpc('update_user', { 
      p_user_id: userId,
      p_user_metadata: updates
    }, {
      count: 'exact'
    });

  if (error) {
    console.error('Error updating user:', error);
    throw new Error(error.message);
  }

  if (!data?.[0]) {
    throw new Error('Failed to update user');
  }

  return data[0];
}

export async function deleteUser(userId: string): Promise<{ deleted_user_id: string }> {
  const { data, error } = await supabase
    .rpc('delete_user', { 
      p_user_id: userId 
    }, {
      count: 'exact'
    });

  if (error) {
    console.error('Error deleting user:', error);
    throw new Error(error.message);
  }

  if (!data?.[0]) {
    throw new Error('Failed to delete user');
  }

  return data[0];
}
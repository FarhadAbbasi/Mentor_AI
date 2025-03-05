import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import * as adminAPI from '../../lib/database/admin';
import { motion } from 'framer-motion';

interface User {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
  };
  created_at: string;
}

interface UserSettings {
  id: string;
  user_id: string;
  max_webinars: number;
}

interface UserWithSettings extends User {
  settings: UserSettings;
  webinar_count: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserWithSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const users = await adminAPI.listUsers();

      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*');
      if (settingsError) throw settingsError;

      const { data: webinarCounts, error: webinarError } = await supabase
        .from('webinars')
        .select('user_id, count')
        .group('user_id');
      if (webinarError) throw webinarError;

      const enhancedUsers = users.map(user => ({
        ...user,
        settings: settings?.find(s => s.user_id === user.id) || { max_webinars: 3 },
        webinar_count: webinarCounts?.find(w => w.user_id === user.id)?.count || 0
      }));

      setUsers(enhancedUsers);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserName = async (userId: string, name: string) => {
    setSaving(userId);
    try {
      await adminAPI.updateUser(userId, {
        user_metadata: { name }
      });
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, user_metadata: { ...user.user_metadata, name } }
          : user
      ));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setSaving(null);
    }
  };

  const updateMaxWebinars = async (userId: string, change: number) => {
    setSaving(userId);
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newMax = Math.max(0, (user.settings?.max_webinars || 3) + change);
      
      const { error } = await supabase
        .from('user_settings')
        .update({ max_webinars: newMax })
        .eq('user_id', userId);
      
      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, settings: { ...user.settings, max_webinars: newMax } }
          : user
      ));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update limit');
    } finally {
      setSaving(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setSaving(userId);
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-400 hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Password
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Webinar Limit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Active Webinars
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map((user) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-700/50"
              >
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={user.user_metadata?.name || ''}
                    onChange={(e) => updateUserName(user.id, e.target.value)}
                    className="bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-teal-500 rounded px-2 py-1"
                    placeholder="Enter name"
                  />
                </td>
                <td className="px-6 py-4 text-white">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {/* Implement password reset */}}
                    className="text-teal-400 hover:text-teal-300 text-sm"
                  >
                    Reset Password
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateMaxWebinars(user.id, -1)}
                      className="p-1 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
                      disabled={saving === user.id}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white w-8 text-center">
                      {saving === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        user.settings?.max_webinars || 3
                      )}
                    </span>
                    <button
                      onClick={() => updateMaxWebinars(user.id, 1)}
                      className="p-1 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
                      disabled={saving === user.id}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-white">
                  {user.webinar_count}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="text-red-400 hover:text-red-300"
                    disabled={saving === user.id}
                  >
                    {saving === user.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
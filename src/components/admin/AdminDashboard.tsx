import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NavigationMenu } from '../navigation/NavigationMenu';
import { AdminThemes } from './AdminThemes';
import { AdminAvatars } from './AdminAvatars';
import { UserManagement } from './UserManagement';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'themes' | 'avatars' | 'users'>('themes');

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <NavigationMenu onManageKnowledge={() => {}} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-2">Manage themes and avatars</p>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-6 py-2 rounded-lg ${
              activeTab === 'themes'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Themes
          </button>
          <button
            onClick={() => setActiveTab('avatars')}
            className={`px-6 py-2 rounded-lg ${
              activeTab === 'avatars'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Avatars
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-lg ${
              activeTab === 'users'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Users
          </button>
        </div>

        {activeTab === 'themes' ? <AdminThemes /> : 
         activeTab === 'avatars' ? <AdminAvatars /> :
         <UserManagement />}
      </div>
    </div>
  );
}
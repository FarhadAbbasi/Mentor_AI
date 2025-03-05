import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function UserMenu() {
  const { signOut } = useAuthStore();

  return (
    <button
      onClick={signOut}
      className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      <span>Sign Out</span>
    </button>
  );
}
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

interface Avatar {
  id: string;
  name: string;
  heygen_avatar_id: string;
  preview_video_url: string;
  preview_photo_url: string;
  gender: 'male' | 'female';
}

export function AdminAvatars() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAvatar, setNewAvatar] = useState<Partial<Avatar>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState<Avatar | null>(null);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatars = async () => {
      setError(null);
      const { data, error } = await supabase
        .from('avatars')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching avatars:', error);
        setError('Failed to load avatars');
        return;
      }

      setAvatars(data || []);
      setLoading(false);
    };

    fetchAvatars();
  }, []);

  const handleCreate = async () => {
    if (!newAvatar.name || !newAvatar.heygen_avatar_id || 
        !newAvatar.preview_video_url || !newAvatar.preview_photo_url || 
        !newAvatar.gender) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    const { error } = await supabase
      .from('avatars')
      .insert([newAvatar]);

    if (error) {
      console.error('Error creating avatar:', error);
      setError('Failed to create avatar');
      return;
    }

    setNewAvatar({});
    setShowForm(false);
    fetchAvatars();
  };

  const handleEdit = (avatar: Avatar) => {
    setEditingAvatar(avatar);
    setFlippedCard(avatar.id);
  };

  const handleUpdate = async () => {
    if (!editingAvatar) return;

    setError(null);
    const { error } = await supabase
      .from('avatars')
      .update(editingAvatar)
      .eq('id', editingAvatar.id);

    if (error) {
      console.error('Error updating avatar:', error);
      setError('Failed to update avatar');
      return;
    }

    setEditingAvatar(null);
    setFlippedCard(null);
    fetchAvatars();
  };

  const handleCancel = () => {
    setEditingAvatar(null);
    setFlippedCard(null);
    setNewAvatar({});
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const { error } = await supabase
      .from('avatars')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting avatar:', error);
      setError('Failed to delete avatar');
      return;
    }

    fetchAvatars();
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

      <button
        onClick={() => setShowForm(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
      >
        <Plus className="w-5 h-5" />
        <span>Add Avatar</span>
      </button>

      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <input
            type="text"
            value={editingAvatar?.name || newAvatar.name || ''}
            onChange={(e) => editingAvatar
              ? setEditingAvatar({ ...editingAvatar, name: e.target.value })
              : setNewAvatar({ ...newAvatar, name: e.target.value })
            }
            placeholder="Avatar Name"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
          />
          <input
            type="text"
            value={editingAvatar?.heygen_avatar_id || newAvatar.heygen_avatar_id || ''}
            onChange={(e) => editingAvatar
              ? setEditingAvatar({ ...editingAvatar, heygen_avatar_id: e.target.value })
              : setNewAvatar({ ...newAvatar, heygen_avatar_id: e.target.value })
            }
            placeholder="Heygen Avatar ID"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
          />
          <input
            type="text"
            value={editingAvatar?.preview_video_url || newAvatar.preview_video_url || ''}
            onChange={(e) => editingAvatar
              ? setEditingAvatar({ ...editingAvatar, preview_video_url: e.target.value })
              : setNewAvatar({ ...newAvatar, preview_video_url: e.target.value })
            }
            placeholder="Preview Video URL"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
          />
          <input
            type="text"
            value={editingAvatar?.preview_photo_url || newAvatar.preview_photo_url || ''}
            onChange={(e) => editingAvatar
              ? setEditingAvatar({ ...editingAvatar, preview_photo_url: e.target.value })
              : setNewAvatar({ ...newAvatar, preview_photo_url: e.target.value })
            }
            placeholder="Preview Photo URL"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
          />
          <select
            value={editingAvatar?.gender || newAvatar.gender || ''}
            onChange={(e) => editingAvatar
              ? setEditingAvatar({ ...editingAvatar, gender: e.target.value as 'male' | 'female' })
              : setNewAvatar({ ...newAvatar, gender: e.target.value as 'male' | 'female' })
            }
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={editingAvatar ? handleUpdate : handleCreate}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {editingAvatar ? 'Update Avatar' : 'Create Avatar'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {avatars.map((avatar) => (
          <motion.div 
            key={avatar.id}
            className="relative h-[280px] perspective-1000"
            initial={false}
          >
            <motion.div
              className="w-full h-full"
              animate={{ rotateY: flippedCard === avatar.id ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front of card */}
              <div className="absolute w-full h-full backface-hidden bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={avatar.preview_photo_url}
                  alt={avatar.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-white">{avatar.name}</h3>
                      <p className="text-sm text-gray-400">{avatar.gender}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(avatar)}
                        className="text-teal-400 hover:text-teal-300"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(avatar.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Back of card (Edit form) */}
              <div 
                className="absolute w-full h-full overflow-y-auto backface-hidden bg-gray-800 rounded-lg p-6 rotate-y-180"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Edit Avatar</h3>
                  <button
                    onClick={() => setFlippedCard(null)}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    value={avatar.name}
                    onChange={(e) => setEditingAvatar({ ...avatar, name: e.target.value })}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                    placeholder="Avatar Name"
                  />
                  <input
                    type="text"
                    value={avatar.heygen_avatar_id}
                    onChange={(e) => setEditingAvatar({ ...avatar, heygen_avatar_id: e.target.value })}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                    placeholder="Heygen Avatar ID"
                  />
                  <input
                    type="text"
                    value={avatar.preview_video_url}
                    onChange={(e) => setEditingAvatar({ ...avatar, preview_video_url: e.target.value })}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                    placeholder="Preview Video URL"
                  />
                  <input
                    type="text"
                    value={avatar.preview_photo_url}
                    onChange={(e) => setEditingAvatar({ ...avatar, preview_photo_url: e.target.value })}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                    placeholder="Preview Photo URL"
                  />
                  <select
                    value={avatar.gender}
                    onChange={(e) => setEditingAvatar({ ...avatar, gender: e.target.value as 'male' | 'female' })}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => setFlippedCard(null)}
                      className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
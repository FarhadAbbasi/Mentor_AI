import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview_url: string;
  opening_template_id: string;
  agenda_template_id: string;
  content_template_id: string;
  offer_template_id: string;
  closing_template_id: string;
}

export function AdminThemes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTheme, setNewTheme] = useState<Partial<Theme>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchThemes = async () => {
    setError(null);
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching themes:', error);
      setError('Failed to load themes');
      return;
    }

    console.log('Fetched themes:', data);
    setThemes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleCreate = async () => {
    if (!newTheme.name || !newTheme.preview_url || 
        !newTheme.opening_template_id || !newTheme.agenda_template_id || 
        !newTheme.content_template_id || !newTheme.offer_template_id || 
        !newTheme.closing_template_id) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    const { error } = await supabase
      .from('themes')
      .insert([newTheme])
      .select();

    if (error) {
      console.error('Error creating theme:', error);
      setError('Failed to create theme');
      return;
    }

    setNewTheme({});
    setShowForm(false);
    fetchThemes();
  };

  const handleEdit = (theme: Theme) => {
    setEditingTheme(theme);
    setFlippedCard(theme.id);
  };

  const handleUpdate = async () => {
    if (!editingTheme) return;

    setError(null);
    const { error } = await supabase
      .from('themes')
      .update(editingTheme)
      .select()
      .eq('id', editingTheme.id);

    if (error) {
      console.error('Error updating theme:', error);
      setError('Failed to update theme');
      return;
    }

    setEditingTheme(null);
    setFlippedCard(null);
    fetchThemes();
  };

  const handleCancel = () => {
    setEditingTheme(null);
    setFlippedCard(null);
    setShowForm(false);
    setNewTheme({});
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting theme:', error);
      setError('Failed to delete theme');
      return;
    }

    fetchThemes();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen pb-12 bg-gray-900 h-full">
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
        <Plus className="w-4 h-4" />
        <span>Add Theme</span>
      </button>

      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Theme Name</label>
            <input
              type="text"
              value={editingTheme?.name || newTheme.name || ''}
              onChange={(e) => editingTheme
                ? setEditingTheme({ ...editingTheme, name: e.target.value })
                : setNewTheme({ ...newTheme, name: e.target.value })
              }
              placeholder="Theme Name"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Preview URL</label>
            <input
              type="text"
              value={editingTheme?.preview_url || newTheme.preview_url || ''}
              onChange={(e) => editingTheme
                ? setEditingTheme({ ...editingTheme, preview_url: e.target.value })
                : setNewTheme({ ...newTheme, preview_url: e.target.value })
              }
              placeholder="Preview URL"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Opening Template ID</label>
            <input
              type="text"
              value={editingTheme?.opening_template_id || newTheme.opening_template_id || ''}
              onChange={(e) => editingTheme
                ? setEditingTheme({ ...editingTheme, opening_template_id: e.target.value })
                : setNewTheme({ ...newTheme, opening_template_id: e.target.value })
              }
              placeholder="Opening Template ID"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Agenda Template ID</label>
            <input
              type="text"
              value={editingTheme?.agenda_template_id || newTheme.agenda_template_id || ''}
              onChange={(e) => editingTheme
                ? setEditingTheme({ ...editingTheme, agenda_template_id: e.target.value })
                : setNewTheme({ ...newTheme, agenda_template_id: e.target.value })
              }
              placeholder="Agenda Template ID"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Content Template ID</label>
            <input
              type="text"
              value={editingTheme?.content_template_id || newTheme.content_template_id || ''}
              onChange={(e) => editingTheme
                ? setEditingTheme({ ...editingTheme, content_template_id: e.target.value })
                : setNewTheme({ ...newTheme, content_template_id: e.target.value })
              }
              placeholder="Content Template ID"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Offer Template ID</label>
            <input
              type="text"
              value={editingTheme?.offer_template_id || newTheme.offer_template_id || ''}
              onChange={(e) => editingTheme
                ? setEditingTheme({ ...editingTheme, offer_template_id: e.target.value })
                : setNewTheme({ ...newTheme, offer_template_id: e.target.value })
              }
              placeholder="Offer Template ID"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">Closing Template ID</label>
            <input
              type="text"
              value={editingTheme?.closing_template_id || newTheme.closing_template_id || ''}
              onChange={(e) => editingTheme
                ? setEditingTheme({ ...editingTheme, closing_template_id: e.target.value })
                : setNewTheme({ ...newTheme, closing_template_id: e.target.value })
              }
              placeholder="Closing Template ID"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={editingTheme ? handleUpdate : handleCreate}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {editingTheme ? 'Update Theme' : 'Create Theme'}
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <motion.div 
            key={theme.id}
            className="relative h-[280px] perspective-1000"
            initial={false}
          >
            <motion.div 
              className="w-full h-full"
              animate={{ rotateY: flippedCard === theme.id ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front of card */}
              <div className="absolute w-full h-full backface-hidden bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={theme.preview_url}
                  alt={theme.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-white truncate">{theme.name}</h3>
                      <p className="text-sm text-gray-400">Theme Template</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(theme)}
                        className="text-teal-400 hover:text-teal-300"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(theme.id); }}
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
                  <h3 className="text-lg font-medium text-white">Edit Theme</h3>
                  <button
                    onClick={() => setFlippedCard(null)}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Theme Name</label>
                    <input
                      type="text"
                      value={editingTheme?.name || theme.name}
                      onChange={(e) => setEditingTheme({ ...theme, name: e.target.value })}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      placeholder="Theme Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Preview URL</label>
                    <input
                      type="text"
                      value={theme.preview_url}
                      onChange={(e) => setEditingTheme(prev => prev ? { ...prev, preview_url: e.target.value } : theme)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      placeholder="Preview URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Opening Template ID</label>
                    <input
                      type="text"
                      value={theme.opening_template_id}
                      onChange={(e) => setEditingTheme(prev => prev ? { ...prev, opening_template_id: e.target.value } : theme)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      placeholder="Opening Template ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Agenda Template ID</label>
                    <input
                      type="text"
                      value={theme.agenda_template_id}
                      onChange={(e) => setEditingTheme(prev => prev ? { ...prev, agenda_template_id: e.target.value } : theme)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      placeholder="Agenda Template ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Content Template ID</label>
                    <input
                      type="text"
                      value={theme.content_template_id}
                      onChange={(e) => setEditingTheme(prev => prev ? { ...prev, content_template_id: e.target.value } : theme)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      placeholder="Content Template ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Offer Template ID</label>
                    <input
                      type="text"
                      value={theme.offer_template_id}
                      onChange={(e) => setEditingTheme(prev => prev ? { ...prev, offer_template_id: e.target.value } : theme)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      placeholder="Offer Template ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Closing Template ID</label>
                    <input
                      type="text"
                      value={theme.closing_template_id}
                      onChange={(e) => setEditingTheme(prev => prev ? { ...prev, closing_template_id: e.target.value } : theme)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      placeholder="Closing Template ID"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
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
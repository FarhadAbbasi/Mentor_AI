import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useWebinarStore } from '../../stores/webinarStore';

interface Theme {
  id: string;
  name: string;
  preview_url: string;
}

export function ThemeSelection() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { currentWebinarId } = useWebinarStore();

  useEffect(() => {
    const fetchThemes = async () => {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching themes:', error);
        return;
      }

      setThemes(data || []);
      setLoading(false);
    };

    const fetchCurrentTheme = async () => {
      if (!currentWebinarId) return;

      const { data, error } = await supabase
        .from('webinars')
        .select('theme_id')
        .eq('id', currentWebinarId)
        .single();

      if (error) {
        console.error('Error fetching current theme:', error);
        return;
      }

      if (data?.theme_id) {
        setSelectedThemeId(data.theme_id);
      }
    };

    fetchThemes();
    fetchCurrentTheme();
  }, [currentWebinarId]);

  const handleSave = async () => {
    console.log('THemes:', themes);
    console.log('Saving theme:', selectedThemeId);
    console.log('Webinar ID for theme:', selectedThemeId);
    
    if (!currentWebinarId || !selectedThemeId) return;

    setSaving(true);
    const { data, error } = await supabase
      .from('webinars')
      .update({ theme_id: selectedThemeId })
      .eq('id', currentWebinarId);

    console.log('Saved theme data:', data);
    setSaving(false);

    if (error) {
      console.error('Error saving theme:', error);
      return;
    }

    // window.location.href = '/webinar-creation';
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
      <div className="flex items-center justify-end">
        {/* <button
          onClick={() => window.location.href = '/webinar-creation'}
          className="text-teal-400 hover:text-teal-300 font-medium flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Steps
        </button> */}
        <button
          onClick={handleSave}
          disabled={!selectedThemeId || saving}
          className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Theme'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <motion.button
            key={theme.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedThemeId(theme.id)}
            className={`relative rounded-xl overflow-hidden group ${selectedThemeId === theme.id ? 'ring-2 ring-teal-500' : ''
              }`}
          >
            <div className="aspect-video w-full">
              <img
                src={theme.preview_url}
                alt={theme.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-medium text-lg">{theme.name}</p>
              </div>
            </div>
            {selectedThemeId === theme.id && (
              <div className="absolute top-4 right-4 bg-teal-500 rounded-full p-1">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useWebinarStore } from '../../stores/webinarStore';

interface Avatar {
  id: string;
  name: string;
  heygen_avatar_id: string;
  preview_video_url: string;
  preview_photo_url: string;
  gender: 'male' | 'female';
}

export function AvatarSelection() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [hoveredAvatarId, setHoveredAvatarId] = useState<string | null>(null);
  const videoRefs = React.useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { currentWebinarId } = useWebinarStore();

  useEffect(() => {
    const fetchAvatars = async () => {
      const { data, error } = await supabase
        .from('avatars')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching avatars:', error);
        return;
      }

      setAvatars(data || []);
      setLoading(false);
    };

    const fetchCurrentAvatar = async () => {
      if (!currentWebinarId) return;

      const { data, error } = await supabase
        .from('webinars')
        .select('avatar_id')
        .eq('id', currentWebinarId)
        .single();

      if (error) {
        console.error('Error fetching current avatar:', error);
        return;
      }

      if (data?.avatar_id) {
        setSelectedAvatarId(data.avatar_id);
      }
    };

    fetchAvatars();
    fetchCurrentAvatar();
  }, [currentWebinarId]);

  const handleSave = async () => {
    if (!currentWebinarId || !selectedAvatarId) return;

    setSaving(true);
    const { error } = await supabase
      .from('webinars')
      .update({ avatar_id: selectedAvatarId })
      .eq('id', currentWebinarId);

    setSaving(false);

    if (error) {
      console.error('Error saving avatar:', error);
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
          disabled={!selectedAvatarId || saving}
          className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Avatar'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {avatars.map((avatar) => (
          <motion.button
            key={avatar.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedAvatarId(avatar.id)}
            onMouseEnter={() => {
              setHoveredAvatarId(avatar.id);
              const video = videoRefs.current[avatar.id];
              if (video) {
                video.currentTime = 0;
                video.play();
                video.muted = false;
              }
            }}
            onMouseLeave={() => {
              setHoveredAvatarId(null);
              const video = videoRefs.current[avatar.id];
              if (video) {
                video.pause();
                video.currentTime = 0;
                video.muted = true;
              }
            }}
            className={`relative rounded-xl overflow-hidden aspect-video ${
              selectedAvatarId === avatar.id ? 'ring-2 ring-teal-500' : ''
            }`}
          >
            {hoveredAvatarId === avatar.id ? (
              <video
                ref={el => videoRefs.current[avatar.id] = el}
                src={avatar.preview_video_url}
                autoPlay
                muted={false}
                playsInline
                className="w-full h-full object-cover"
                onEnded={() => {
                  const video = videoRefs.current[avatar.id];
                  if (video) {
                    video.pause();
                    video.currentTime = 0;
                  }
                }}
              />
            ) : (
              <img
                src={avatar.preview_photo_url}
                alt={avatar.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium text-lg">{avatar.name}</span>
                  <span className="text-gray-300 text-sm capitalize">{avatar.gender}</span>
                  {selectedAvatarId === avatar.id && (
                    <div className="bg-teal-500 rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
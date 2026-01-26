import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    if (!user) throw new Error('Not authenticated');

    // Update profile in database
    const { error: dbError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (dbError) throw dbError;

    // Also update user metadata so it's available in auth context
    if (updates.full_name) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: updates.full_name }
      });
      if (authError) console.error('Error updating user metadata:', authError);
    }

    // Refresh profile
    await fetchProfile();
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Delete old avatar if exists
    if (profile?.avatar_url) {
      const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
      await supabase.storage.from('avatars').remove([oldPath]);
    }

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  return {
    profile,
    loading,
    updateProfile,
    uploadAvatar,
    refetchProfile: fetchProfile,
  };
}

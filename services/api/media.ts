import { supabase } from '@/services/supabase';

export async function uploadPostImage(
  userId: string,
  uri: string,
): Promise<string> {
  try {
    const ext = uri.split('.').pop() ?? 'jpg';
    const filename = `${userId}/${Date.now()}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('post-media')
      .upload(filename, blob, { contentType: `image/${ext}`, upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from('post-media').getPublicUrl(filename);
    return data.publicUrl;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to upload image');
  }
}

export async function uploadAvatar(
  userId: string,
  uri: string,
): Promise<string> {
  try {
    const ext = uri.split('.').pop() ?? 'jpg';
    const filename = `${userId}/avatar.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filename, blob, { contentType: `image/${ext}`, upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filename);
    return data.publicUrl;
  } catch (err) {
    throw err instanceof Error ? err : new Error('Failed to upload avatar');
  }
}

import { supabase } from '../lib/supabaseClient';

export type Bookmark = {
  id: string;
  user_id: string;
  title: string;
  url: string;
  is_public: boolean;
  created_at?: string;
};

export type BookmarkInput = {
  title: string;
  url: string;
  isPublic: boolean;
};

export const getMyBookmarks = async (userId: string): Promise<{
  data: Bookmark[];
  error: string | null;
}> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id, user_id, title, url, is_public, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return {
    data: (data as Bookmark[] | null) ?? [],
    error: error?.message ?? null,
  };
};

export const getPublicBookmarks = async (): Promise<{
  data: Bookmark[];
  error: string | null;
}> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id, user_id, title, url, is_public, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  return {
    data: (data as Bookmark[] | null) ?? [],
    error: error?.message ?? null,
  };
};

export const createBookmark = async (
  userId: string,
  input: BookmarkInput
): Promise<{ data: Bookmark | null; error: string | null }> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: userId,
      title: input.title,
      url: input.url,
      is_public: input.isPublic,
    })
    .select('id, user_id, title, url, is_public, created_at')
    .single();

  return {
    data: (data as Bookmark | null) ?? null,
    error: error?.message ?? null,
  };
};

export const updateBookmark = async (
  bookmarkId: string,
  userId: string,
  input: BookmarkInput
): Promise<{ data: Bookmark | null; error: string | null }> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .update({
      title: input.title,
      url: input.url,
      is_public: input.isPublic,
    })
    .eq('id', bookmarkId)
    .eq('user_id', userId)
    .select('id, user_id, title, url, is_public, created_at')
    .single();

  return {
    data: (data as Bookmark | null) ?? null,
    error: error?.message ?? null,
  };
};

export const deleteBookmark = async (
  bookmarkId: string,
  userId: string
): Promise<{ error: string | null }> => {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId)
    .eq('user_id', userId);

  return { error: error?.message ?? null };
};

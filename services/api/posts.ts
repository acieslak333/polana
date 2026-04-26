import { supabase } from '@/services/supabase';
import type { PostRow, CommentRow, ProfileSnippet } from '@polana/db-types';

export type { PostRow, CommentRow };

// Post and Comment extend the DB row types with joined data
export type Post = PostRow & {
  profiles: ProfileSnippet | null;
  reactions: { emoji: string; user_id: string }[];
  comment_count: number;
  gromady?: { name: string; avatar_config: Record<string, unknown> } | null;
};

export type Comment = CommentRow & {
  profiles: ProfileSnippet | null;
  replies?: Comment[];
};

const POST_QUERY = `
  id, gromada_id, author_id, content, media_urls, media_types,
  event_id, is_hidden, created_at, updated_at,
  profiles(id, first_name, nickname, avatar_config),
  reactions(emoji, user_id),
  comments(id)
`;

export async function fetchGromadaPosts(
  gromadaId: string,
  page = 0,
  pageSize = 25,
): Promise<Post[]> {
  const from = page * pageSize;
  const { data, error } = await supabase
    .from('posts')
    .select(POST_QUERY)
    .eq('gromada_id', gromadaId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;

  return (data ?? []).map((p) => ({
    ...p,
    comment_count: Array.isArray((p as any).comments) ? (p as any).comments.length : 0,
  })) as unknown as Post[];
}

export async function fetchFeedPosts(
  userId: string,
  page = 0,
  pageSize = 25,
): Promise<Post[]> {
  // Get all gromada_ids the user is a member of
  const { data: memberships, error: memErr } = await supabase
    .from('gromada_members')
    .select('gromada_id')
    .eq('user_id', userId);
  if (memErr) throw memErr;

  const gromadaIds = (memberships ?? []).map((m) => m.gromada_id);
  if (gromadaIds.length === 0) return [];

  const from = page * pageSize;
  const { data, error } = await supabase
    .from('posts')
    .select(POST_QUERY)
    .in('gromada_id', gromadaIds)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;

  return (data ?? []).map((p) => ({
    ...p,
    comment_count: Array.isArray((p as any).comments) ? (p as any).comments.length : 0,
  })) as unknown as Post[];
}

export async function fetchPost(id: string): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_QUERY)
    .eq('id', id)
    .single();
  if (error) throw error;
  const p = data as any;
  return { ...p, comment_count: Array.isArray(p.comments) ? p.comments.length : 0 } as Post;
}

export async function createPost(payload: {
  gromada_id: string;
  author_id: string;
  content: string;
  media_urls?: string[];
  media_types?: string[];
  event_id?: string | null;
}): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({ ...payload, media_urls: payload.media_urls ?? [], media_types: payload.media_types ?? [] })
    .select(POST_QUERY)
    .single();
  if (error) throw error;
  return { ...(data as any), comment_count: 0 } as Post;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

export async function hidePost(id: string, hidden: boolean): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({ is_hidden: hidden })
    .eq('id', id);
  if (error) throw error;
}

// ── Comments ──────────────────────────────────────────────────────────

const COMMENT_QUERY = `
  id, post_id, author_id, parent_comment_id, content, is_hidden, created_at,
  profiles(id, first_name, nickname, avatar_config)
`;

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_QUERY)
    .eq('post_id', postId)
    .eq('is_hidden', false)
    .order('created_at');
  if (error) throw error;
  return buildCommentTree((data ?? []) as unknown as Comment[]);
}

function buildCommentTree(flat: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] });
  }
  for (const c of map.values()) {
    if (c.parent_comment_id && map.has(c.parent_comment_id)) {
      map.get(c.parent_comment_id)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

export async function createComment(payload: {
  post_id: string;
  author_id: string;
  content: string;
  parent_comment_id?: string | null;
}): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert(payload)
    .select(COMMENT_QUERY)
    .single();
  if (error) throw error;
  return { ...(data as unknown as Comment), replies: [] };
}

// ── Reactions ─────────────────────────────────────────────────────────

export async function toggleReaction(
  postId: string,
  userId: string,
  emoji: string,
  currentlyReacted: boolean,
): Promise<void> {
  if (currentlyReacted) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('emoji', emoji);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('reactions')
      .insert({ post_id: postId, user_id: userId, emoji });
    if (error) throw error;
  }
}

// ── Reports ───────────────────────────────────────────────────────────

export async function reportPost(
  postId: string,
  reporterId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .insert({ post_id: postId, reporter_id: reporterId, reason });
  if (error) throw error;
}

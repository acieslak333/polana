import { supabase } from '@/services/supabase';

export type ReportRow = {
  id: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'other';
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
  post_content: string | null;
  comment_content: string | null;
  reporter_name: string | null;
};

export async function fetchPendingReports(gromadaIds: string[]): Promise<ReportRow[]> {
  if (gromadaIds.length === 0) return [];

  const { data, error } = await supabase
    .from('reports')
    .select(`
      id,
      reporter_id,
      post_id,
      comment_id,
      reason,
      description,
      status,
      created_at,
      posts(content, gromada_id),
      comments(content, post_id, posts(gromada_id)),
      profiles!reports_reporter_id_fkey(first_name, nickname)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    reporter_id: string;
    post_id: string | null;
    comment_id: string | null;
    reason: 'spam' | 'harassment' | 'inappropriate' | 'other';
    description: string | null;
    status: 'pending' | 'reviewed' | 'resolved';
    created_at: string;
    posts: { content: string | null; gromada_id: string | null } | null;
    comments: {
      content: string | null;
      posts: { gromada_id: string | null } | null;
    } | null;
    profiles: { first_name: string; nickname: string | null } | null;
  }>;

  return rows
    .filter((r) => {
      const gromadaId =
        r.posts?.gromada_id ?? r.comments?.posts?.gromada_id ?? null;
      return gromadaId !== null && gromadaIds.includes(gromadaId);
    })
    .map((r) => ({
      id: r.id,
      reporter_id: r.reporter_id,
      post_id: r.post_id,
      comment_id: r.comment_id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      created_at: r.created_at,
      post_content: r.posts?.content ?? null,
      comment_content: r.comments?.content ?? null,
      reporter_name: r.profiles
        ? (r.profiles.nickname ?? r.profiles.first_name)
        : null,
    }));
}

export async function resolveReport(
  reportId: string,
  action: 'hide' | 'dismiss',
  targetId: string | null,
  targetType: 'post' | 'comment' | null,
): Promise<void> {
  if (action === 'hide' && targetId !== null && targetType !== null) {
    const table = targetType === 'post' ? 'posts' : 'comments';
    const { error: hideErr } = await supabase
      .from(table)
      .update({ is_hidden: true })
      .eq('id', targetId);
    if (hideErr) throw hideErr;
  }

  const { error } = await supabase
    .from('reports')
    .update({ status: 'resolved' })
    .eq('id', reportId);
  if (error) throw error;
}

export async function undoResolveReport(
  reportId: string,
  action: 'hide' | 'dismiss',
  targetId: string | null,
  targetType: 'post' | 'comment' | null,
): Promise<void> {
  if (action === 'hide' && targetId !== null && targetType !== null) {
    const table = targetType === 'post' ? 'posts' : 'comments';
    const { error: unhideErr } = await supabase
      .from(table)
      .update({ is_hidden: false })
      .eq('id', targetId);
    if (unhideErr) throw unhideErr;
  }

  const { error } = await supabase
    .from('reports')
    .update({ status: 'pending' })
    .eq('id', reportId);
  if (error) throw error;
}

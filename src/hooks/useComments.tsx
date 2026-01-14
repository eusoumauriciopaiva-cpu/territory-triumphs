import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { updateMissionProgress } from '@/lib/missionUtils';
import type { Profile } from '@/types';

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export function useComments(postId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      // Fetch profiles for comments
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      return data.map(comment => ({
        ...comment,
        profile: profiles?.find(p => p.user_id === comment.user_id),
      })) as Comment[];
    },
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('comments')
        .insert({ user_id: user.id, post_id: postId, content })
        .select()
        .single();
      
      if (error) throw error;

      // Update mission progress for 'engajamento' (comment on 2 posts)
      await updateMissionProgress(user.id, 'engajamento', 1);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['daily-missions'] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  return {
    comments,
    commentCount: comments.length,
    isLoading,
    addComment: addComment.mutate,
    isAdding: addComment.isPending,
    deleteComment: deleteComment.mutate,
    isDeleting: deleteComment.isPending,
  };
}

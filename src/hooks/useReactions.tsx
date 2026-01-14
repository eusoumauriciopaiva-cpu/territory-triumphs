import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ReactionType = 'fire' | 'trophy' | 'angry';

export interface Reaction {
  id: string;
  user_id: string;
  post_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface ReactionCount {
  fire: number;
  trophy: number;
  angry: number;
  total: number;
}

export function useReactions(postId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reactions = [], isLoading } = useQuery({
    queryKey: ['reactions', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('post_id', postId);
      
      if (error) throw error;
      return data as Reaction[];
    },
  });

  const reactionCounts: ReactionCount = reactions.reduce(
    (acc, r) => {
      acc[r.reaction_type as ReactionType]++;
      acc.total++;
      return acc;
    },
    { fire: 0, trophy: 0, angry: 0, total: 0 }
  );

  const userReactions = reactions.filter(r => r.user_id === user?.id);

  const toggleReaction = useMutation({
    mutationFn: async (type: ReactionType) => {
      if (!user) throw new Error('Must be logged in');

      const existing = userReactions.find(r => r.reaction_type === type);

      if (existing) {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed', type };
      } else {
        const { error } = await supabase
          .from('reactions')
          .insert({ user_id: user.id, post_id: postId, reaction_type: type });
        if (error) throw error;
        return { action: 'added', type };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', postId] });
    },
  });

  return {
    reactions,
    reactionCounts,
    userReactions,
    isLoading,
    toggleReaction: toggleReaction.mutate,
    isToggling: toggleReaction.isPending,
  };
}

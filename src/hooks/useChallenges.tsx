import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  challenger_area: number;
  challenged_area: number;
  winner_id: string | null;
  created_at: string;
  expires_at: string;
  challenger_profile?: {
    name: string;
    rank: string;
    avatar_url: string | null;
  };
  challenged_profile?: {
    name: string;
    rank: string;
    avatar_url: string | null;
  };
}

export function useChallenges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each challenge
      const challengesWithProfiles = await Promise.all(
        (data || []).map(async (challenge) => {
          const [{ data: challengerProfile }, { data: challengedProfile }] = await Promise.all([
            supabase
              .from('profiles')
              .select('name, rank, avatar_url')
              .eq('user_id', challenge.challenger_id)
              .maybeSingle(),
            supabase
              .from('profiles')
              .select('name, rank, avatar_url')
              .eq('user_id', challenge.challenged_id)
              .maybeSingle(),
          ]);

          return {
            ...challenge,
            challenger_profile: challengerProfile,
            challenged_profile: challengedProfile,
          } as Challenge;
        })
      );

      return challengesWithProfiles;
    },
    enabled: !!user,
  });

  const createChallenge = useMutation({
    mutationFn: async (challengedId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: user.id,
          challenged_id: challengedId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });

  const respondToChallenge = useMutation({
    mutationFn: async ({ 
      challengeId, 
      accept 
    }: { 
      challengeId: string; 
      accept: boolean;
    }) => {
      const { error } = await supabase
        .from('challenges')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', challengeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });

  const pendingChallenges = challenges.filter(
    c => c.status === 'pending' && c.challenged_id === user?.id
  );

  const activeChallenges = challenges.filter(
    c => c.status === 'accepted'
  );

  return {
    challenges,
    pendingChallenges,
    activeChallenges,
    isLoading,
    createChallenge,
    respondToChallenge,
  };
}

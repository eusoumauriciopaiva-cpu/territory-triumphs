import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Angry, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useReactions, ReactionType } from '@/hooks/useReactions';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { createNotification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Profile } from '@/types';

interface PostInteractionsProps {
  postId: string;
  postOwnerId: string;
  locationName?: string;
  onViewProfile?: (profile: Profile) => void;
}

const REACTION_CONFIG: Record<ReactionType, { icon: typeof Flame; label: string; emoji: string }> = {
  fire: { icon: Flame, label: 'Fogo', emoji: '🔥' },
  trophy: { icon: Trophy, label: 'Troféu', emoji: '🏆' },
  angry: { icon: Angry, label: 'Raiva', emoji: '😠' },
};

export function PostInteractions({ postId, postOwnerId, locationName, onViewProfile }: PostInteractionsProps) {
  const { user } = useAuth();
  const { reactionCounts, userReactions, toggleReaction, isToggling } = useReactions(postId);
  const { comments, commentCount, addComment, isAdding, deleteComment } = useComments(postId);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleReaction = async (type: ReactionType) => {
    if (!user) return;
    
    const hasReaction = userReactions.some(r => r.reaction_type === type);
    toggleReaction(type);

    // Create notification if adding reaction
    if (!hasReaction) {
      await createNotification(
        postOwnerId,
        user.id,
        'reaction',
        `reagiu ${REACTION_CONFIG[type].emoji} à sua conquista${locationName ? ` em ${locationName}` : ''}!`,
        postId
      );
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    
    addComment(newComment.trim());
    
    // Create notification
    const preview = newComment.length > 30 ? newComment.slice(0, 30) + '...' : newComment;
    await createNotification(
      postOwnerId,
      user.id,
      'comment',
      `comentou: "${preview}"`,
      postId
    );

    setNewComment('');
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      {/* Reactions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG['fire']][]).map(([type, config]) => {
            const isActive = userReactions.some(r => r.reaction_type === type);
            const count = reactionCounts[type];

            return (
              <motion.button
                key={type}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleReaction(type)}
                disabled={isToggling}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="text-base">{config.emoji}</span>
                {count > 0 && <span>{count}</span>}
              </motion.button>
            );
          })}
        </div>

        {/* Total Reactions & Comments Toggle */}
        <div className="flex items-center gap-3">
          {reactionCounts.total > 0 && (
            <span className="text-xs text-muted-foreground">
              {reactionCounts.total} reações
            </span>
          )}
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{commentCount}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              {/* Comment List */}
              {comments.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2 group">
                      <Avatar 
                        className="w-7 h-7 cursor-pointer"
                        onClick={() => comment.profile && onViewProfile?.(comment.profile)}
                      >
                        <AvatarImage src={comment.profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {comment.profile?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span 
                            className="font-semibold text-xs text-foreground cursor-pointer hover:text-primary"
                            onClick={() => comment.profile && onViewProfile?.(comment.profile)}
                          >
                            @{comment.profile?.nickname || comment.profile?.name || 'Atleta'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 break-words">{comment.content}</p>
                      </div>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              {user && (
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Adicionar comentário..."
                    className="flex-1 h-9 bg-muted/50 border-border/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isAdding}
                    className="h-9 px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

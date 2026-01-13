import { Swords, Clock, MapPin, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAdminConflicts, TerritoryConflict } from '@/hooks/useConflicts';

export function AdminConflictFeed() {
  const { data: conflicts = [], isLoading, error } = useAdminConflicts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Erro ao carregar conflitos</p>
      </div>
    );
  }

  // Get top invaders
  const invaderStats = conflicts.reduce((acc, c) => {
    const id = c.invader_id;
    if (!acc[id]) {
      acc[id] = {
        id,
        name: c.invader_nickname || c.invader_name || 'Desconhecido',
        count: 0,
        totalArea: 0,
      };
    }
    acc[id].count++;
    acc[id].totalArea += c.area_invaded || 0;
    return acc;
  }, {} as Record<string, { id: string; name: string; count: number; totalArea: number }>);

  const topInvaders = Object.values(invaderStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Invaders */}
      {topInvaders.length > 0 && (
        <div className="bg-card/50 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Invasores Mais Agressivos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topInvaders.map((invader, index) => (
              <div
                key={invader.id}
                className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">
                    #{index + 1}
                  </span>
                  <span className="font-medium text-sm truncate">
                    {invader.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="destructive" className="text-[10px]">
                    {invader.count} invasões
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflict Feed */}
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Atividade Global de Conflitos
        </h4>

        {conflicts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Swords className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum conflito registrado</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {conflicts.map((conflict, index) => (
                <motion.div
                  key={conflict.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card/30 border border-border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(new Date(conflict.created_at), 'HH:mm', {
                            locale: ptBR,
                          })}
                        </span>
                        <span className="opacity-50">•</span>
                        <span>
                          {formatDistanceToNow(new Date(conflict.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>

                      <p className="text-sm">
                        <span className="font-bold text-primary">
                          {conflict.invader_nickname || conflict.invader_name || 'Invasor'}
                        </span>
                        <span className="text-muted-foreground mx-1">invadiu território de</span>
                        <span className="font-bold text-destructive">
                          {conflict.victim_nickname || conflict.victim_name || 'Vítima'}
                        </span>
                      </p>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {conflict.area_invaded > 0 && (
                          <span>
                            📐 {conflict.area_invaded.toLocaleString()} m²
                          </span>
                        )}
                        {conflict.latitude && conflict.longitude && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {conflict.latitude.toFixed(4)}, {conflict.longitude.toFixed(4)}
                          </span>
                        )}
                        {conflict.location_name && (
                          <span>📍 {conflict.location_name}</span>
                        )}
                      </div>
                    </div>

                    <Swords className="w-5 h-5 text-destructive/50 shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Bell, Swords, Check, CheckCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  useUserConflicts,
  useUnreadConflictCount,
  useMarkConflictAsRead,
  useMarkAllConflictsAsRead,
} from '@/hooks/useConflicts';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: conflicts = [] } = useUserConflicts();
  const { data: unreadCount = 0 } = useUnreadConflictCount();
  const markAsRead = useMarkConflictAsRead();
  const markAllAsRead = useMarkAllConflictsAsRead();

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
          <Bell className="w-6 h-6 text-foreground" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Swords className="w-5 h-5 text-primary" />
              Invasões de Território
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {conflicts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
              <p className="text-xs mt-1">Seu território está seguro!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conflicts.map((conflict) => (
                <motion.div
                  key={conflict.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "p-4 transition-colors relative",
                    !conflict.is_read_by_victim && "bg-primary/5"
                  )}
                >
                  {!conflict.is_read_by_victim && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                  )}

                  <div className="flex items-start gap-3 ml-2">
                    <div className="p-2 rounded-full bg-destructive/10 text-destructive shrink-0">
                      <Swords className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        ⚠️ TERRITÓRIO INVADIDO!
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-semibold text-primary">
                          {conflict.invader_nickname || conflict.invader_name || 'Invasor'}
                        </span>{' '}
                        dominou sua zona
                        {conflict.area_invaded > 0 && (
                          <span className="text-destructive font-medium">
                            {' '}({conflict.area_invaded.toLocaleString()} m²)
                          </span>
                        )}
                      </p>
                      {conflict.location_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          📍 {conflict.location_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {formatDistanceToNow(new Date(conflict.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>

                    {!conflict.is_read_by_victim && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8"
                        onClick={() => handleMarkRead(conflict.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

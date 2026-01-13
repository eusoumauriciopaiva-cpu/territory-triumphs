import { Home, Map, Circle, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRecordClick: () => void;
}

const tabs = [
  { id: 'feed', icon: Home, label: 'Feed' },
  { id: 'map', icon: Map, label: 'Mapa' },
  { id: 'record', icon: Circle, label: 'Gravar', special: true },
  { id: 'groups', icon: Users, label: 'Grupos' },
  { id: 'profile', icon: User, label: 'Perfil' },
];

export function BottomNav({ activeTab, setActiveTab, onRecordClick }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 glass border-t border-border h-20 px-4 safe-bottom z-50 flex items-center justify-around">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => tab.special ? onRecordClick() : setActiveTab(tab.id)}
          className={cn(
            "flex flex-col items-center justify-center transition-all duration-200 relative min-w-[56px] py-2",
            activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
            tab.special && "-mt-8"
          )}
        >
          {tab.special ? (
            <div className="relative">
              {/* Outer ring animation */}
              <div className="absolute inset-0 bg-primary rounded-full animate-pulse-ring opacity-0" />
              
              {/* Main button */}
              <div className="bg-gradient-neon p-5 rounded-full glow-neon active:scale-95 transition-transform border-4 border-background relative z-10">
                <tab.icon className="w-7 h-7 text-primary-foreground fill-primary-foreground" />
              </div>
            </div>
          ) : (
            <>
              <tab.icon
                className={cn(
                  "w-6 h-6 mb-1 transition-transform",
                  activeTab === tab.id && "scale-110"
                )}
              />
              <span className="text-[10px] font-semibold tracking-wide uppercase">
                {tab.label}
              </span>
            </>
          )}
        </button>
      ))}
    </nav>
  );
}

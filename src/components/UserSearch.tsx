import { useState, useEffect, useMemo } from 'react';
import { Search, Users, X } from 'lucide-react';
import { Input } from './ui/input';
import { UserSearchCard } from './UserSearchCard';
import { useProfiles } from '@/hooks/useProfiles';
import type { Profile } from '@/types';

interface UserSearchProps {
  onSelectUser?: (profile: Profile) => void;
  excludeUserId?: string;
}

export function UserSearch({ onSelectUser, excludeUserId }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allProfiles, isLoading } = useProfiles();

  // Filter profiles based on search query
  const filteredProfiles = useMemo(() => {
    if (!allProfiles) return [];
    
    const query = searchQuery.trim().toLowerCase();
    
    if (!query) {
      // Show top 10 by area when no search
      return allProfiles
        .filter(p => excludeUserId ? p.user_id !== excludeUserId : true)
        .slice(0, 10);
    }

    // Search by nickname, name, or unique_code
    return allProfiles.filter(profile => {
      if (excludeUserId && profile.user_id === excludeUserId) return false;
      
      // Check if searching by Z-code (starts with Z- or just the number)
      const isCodeSearch = query.startsWith('z-') || query.startsWith('z') || /^\d+$/.test(query);
      
      if (isCodeSearch) {
        const codeQuery = query.replace(/^z-?/i, '');
        if (profile.unique_code.toLowerCase().includes(codeQuery) ||
            profile.unique_code.toLowerCase().includes(query)) {
          return true;
        }
      }

      // Search by name
      if (profile.name.toLowerCase().includes(query)) {
        return true;
      }

      // Search by nickname
      if (profile.nickname && profile.nickname.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    }).slice(0, 20);
  }, [allProfiles, searchQuery, excludeUserId]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nick ou código (ex: Z-4829)"
          className="pl-10 pr-10 bg-card border-border focus:border-primary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground text-sm mt-2">Buscando atletas...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'Nenhum atleta encontrado' : 'Nenhum atleta cadastrado'}
            </p>
            {searchQuery && (
              <p className="text-xs text-muted-foreground mt-1">
                Tente buscar por nome, @nick ou código Z-XXXX
              </p>
            )}
          </div>
        ) : (
          <>
            {!searchQuery && (
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider px-1">
                Top Atletas
              </p>
            )}
            {filteredProfiles.map((profile) => (
              <UserSearchCard
                key={profile.id}
                profile={profile}
                onClick={() => onSelectUser?.(profile)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

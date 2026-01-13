import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ValidationState {
  isChecking: boolean;
  isAvailable: boolean | null;
  error: string | null;
}

// Validate nickname format: only letters, numbers, and underscores
export function validateNicknameFormat(nickname: string): string | null {
  if (!nickname) return null;
  
  if (nickname.length < 3) {
    return 'Nick deve ter no mínimo 3 caracteres';
  }
  
  if (nickname.length > 20) {
    return 'Nick deve ter no máximo 20 caracteres';
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
    return 'Apenas letras, números e underscore (_) são permitidos';
  }
  
  return null;
}

export function useNicknameValidation(nickname: string, debounceMs: number = 500) {
  const { user } = useAuth();
  const [state, setState] = useState<ValidationState>({
    isChecking: false,
    isAvailable: null,
    error: null,
  });

  const checkAvailability = useCallback(async (nicknameToCheck: string) => {
    if (!nicknameToCheck || !user) {
      setState({ isChecking: false, isAvailable: null, error: null });
      return;
    }

    // First validate format
    const formatError = validateNicknameFormat(nicknameToCheck);
    if (formatError) {
      setState({ isChecking: false, isAvailable: false, error: formatError });
      return;
    }

    setState(prev => ({ ...prev, isChecking: true }));

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('nickname', nicknameToCheck.toLowerCase())
        .maybeSingle();

      if (error) throw error;

      // If no result, nickname is available
      // If result exists but it's the current user, it's their own nickname
      const isAvailable = !data || data.user_id === user.id;

      setState({
        isChecking: false,
        isAvailable,
        error: isAvailable ? null : 'Este nick já está em uso, escolha outro',
      });
    } catch (err) {
      setState({
        isChecking: false,
        isAvailable: null,
        error: 'Erro ao verificar disponibilidade',
      });
    }
  }, [user]);

  useEffect(() => {
    const trimmed = nickname?.trim();
    
    if (!trimmed) {
      setState({ isChecking: false, isAvailable: null, error: null });
      return;
    }

    const timer = setTimeout(() => {
      checkAvailability(trimmed);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [nickname, debounceMs, checkAvailability]);

  return state;
}

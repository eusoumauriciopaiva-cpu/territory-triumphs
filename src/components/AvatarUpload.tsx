import { useState, useRef } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AvatarUploadProps {
  userId: string;
  currentAvatar: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  onAvatarChange: (url: string) => void;
}

export function AvatarUpload({
  userId,
  currentAvatar,
  name,
  size = 'lg',
  onAvatarChange,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      onAvatarChange(publicUrl);
      toast.success('Avatar atualizado!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Avatar Container */}
      <div
        className={cn(
          sizeClasses[size],
          'rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-0.5 rotate-2 cursor-pointer transition-transform hover:scale-105',
          'shadow-[0_0_30px_rgba(255,79,0,0.4)]'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <div
          className={cn(
            'w-full h-full rounded-[1.3rem] bg-background border-4 border-background overflow-hidden',
            'flex items-center justify-center text-3xl font-black relative'
          )}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : currentAvatar ? (
            <img
              src={currentAvatar}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            // Default avatar - Orange initial
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-primary font-black" style={{ fontSize: size === 'lg' ? '2.5rem' : size === 'md' ? '2rem' : '1.5rem' }}>
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Overlay on hover */}
          <div
            className={cn(
              'absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity',
              'flex items-center justify-center'
            )}
          >
            <Camera className={cn(iconSizeClasses[size], 'text-white')} />
          </div>
        </div>
      </div>

      {/* Upload Badge */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'absolute -bottom-1 -right-1 bg-primary text-black rounded-full p-1.5',
          'shadow-lg hover:bg-primary/90 transition-colors',
          'flex items-center justify-center'
        )}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Upload className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image, Trophy, Upload, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ConquestRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  conquestId: string;
  stats: {
    area: number;
    distance: number;
    duration: number;
  };
}

export function ConquestRegistrationModal({
  isOpen,
  onClose,
  onComplete,
  conquestId,
  stats,
}: ConquestRegistrationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 2) {
      toast({ title: 'Máximo 2 fotos', variant: 'destructive' });
      return;
    }

    const newPhotos = [...photos, ...files].slice(0, 2);
    setPhotos(newPhotos);

    // Create preview URLs
    const newPreviewUrls = newPhotos.map((file) => URL.createObjectURL(file));
    setPhotoPreviewUrls(newPreviewUrls);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviewUrls = photoPreviewUrls.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviewUrls(newPreviewUrls);
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!user || photos.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${user.id}/${conquestId}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('conquest-photos')
        .upload(fileName, photo, { upsert: true });

      if (error) {
        console.error('Upload error:', error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('conquest-photos')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Upload photos first
      const photoUrls = await uploadPhotos();

      // Create conquest post
      const { error } = await supabase.from('conquest_posts').insert({
        user_id: user.id,
        conquest_id: conquestId,
        title: title.trim() || `Território de ${stats.area.toLocaleString()}m²`,
        description: description.trim() || null,
        photo_urls: photoUrls,
      });

      if (error) throw error;

      toast({ title: 'Conquista registrada!' });
      onComplete();
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast({ 
        title: 'Erro ao salvar', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Create a simple post without extras
    if (user) {
      supabase.from('conquest_posts').insert({
        user_id: user.id,
        conquest_id: conquestId,
        title: `Território de ${stats.area.toLocaleString()}m²`,
      }).then(() => {
        onComplete();
      });
    } else {
      onComplete();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[12000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-lg bg-card rounded-t-3xl sm:rounded-3xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-card/95 backdrop-blur-sm p-4 border-b border-border flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Registrar Conquista</h2>
                <p className="text-xs text-muted-foreground">
                  {stats.area.toLocaleString()}m² • {stats.distance.toFixed(2)}km
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                Título (opcional)
              </label>
              <Input
                placeholder="Ex: Volta do Parque, Corrida Matinal..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                className="bg-muted/50 border-border"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                Descrição (opcional)
              </label>
              <Textarea
                placeholder="Como foi sua corrida hoje?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={280}
                rows={3}
                className="bg-muted/50 border-border resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {description.length}/280
              </p>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                Fotos (opcional, máx. 2)
              </label>
              
              <div className="flex gap-3">
                {/* Photo previews */}
                {photoPreviewUrls.map((url, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}

                {/* Add photo button */}
                {photos.length < 2 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <Camera className="w-6 h-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase">Adicionar</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex gap-3">
            <Button
              variant="secondary"
              onClick={handleSkip}
              className="flex-1"
              disabled={isSubmitting}
            >
              Pular
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-zonna text-primary-foreground font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Publicar
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

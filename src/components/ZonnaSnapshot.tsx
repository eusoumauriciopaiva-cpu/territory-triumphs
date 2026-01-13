import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, X, Trophy, Flame } from 'lucide-react';
import { Button } from './ui/button';
import { ZonnaMap3D } from './ZonnaMap3D';
import html2canvas from 'html2canvas';

interface ZonnaSnapshotProps {
  isOpen: boolean;
  onClose: () => void;
  conquestNumber: number;
  stats: {
    distance: number;
    duration: number;
    area: number;
    pace: number; // min/km
  };
  path: [number, number][];
}

export function ZonnaSnapshot({ 
  isOpen, 
  onClose, 
  conquestNumber, 
  stats, 
  path 
}: ZonnaSnapshotProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateStoryImage = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      // Wait for map to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 1080,
        height: 1920,
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setGeneratedImage(dataUrl);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!generatedImage) {
      await generateStoryImage();
      return;
    }

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], `zonna-territorio-${conquestNumber}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `ZONNA - Território #${conquestNumber}`,
          text: `Conquistei ${stats.area.toLocaleString()}m² com a ZONNA! 🔥`,
        });
      } else {
        const link = document.createElement('a');
        link.download = `zonna-territorio-${conquestNumber}.png`;
        link.href = generatedImage;
        link.click();
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.download = `zonna-territorio-${conquestNumber}.png`;
    link.href = generatedImage;
    link.click();
  };

  useEffect(() => {
    if (isOpen && !generatedImage) {
      generateStoryImage();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[12000] bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 safe-top">
        <h2 className="text-lg font-black uppercase tracking-wider text-foreground">
          Compartilhar Story
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Preview Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {generatedImage ? (
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={generatedImage}
            alt="Story Preview"
            className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-primary/30"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm font-medium">Gerando preview...</p>
          </div>
        )}
      </div>

      {/* Hidden Story Card for Capture - Full Screen with Floating Card */}
      <div 
        className="fixed -left-[9999px] -top-[9999px]"
        style={{ width: 1080, height: 1920 }}
      >
        <div
          ref={cardRef}
          className="relative w-full h-full overflow-hidden"
          style={{ width: 1080, height: 1920 }}
        >
          {/* Background Map - Full Bleed */}
          <div className="absolute inset-0">
            <ZonnaMap3D
              userPosition={path.length > 0 ? path[Math.floor(path.length / 2)] : null}
              recordingPath={path}
              followUser={false}
            />
            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Floating Card - Centered */}
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div 
              className="w-full rounded-[48px] overflow-hidden"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.92)',
                border: '3px solid #FF4F00',
                boxShadow: '0 0 60px rgba(255, 79, 0, 0.3)'
              }}
            >
              {/* Card Content */}
              <div className="p-12 flex flex-col items-center">
                
                {/* Logo ZONNA */}
                <div className="flex flex-col items-center mb-10">
                  <div className="flex items-center gap-5 mb-3">
                    <div 
                      className="w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #FF4F00 0%, #FF8C00 100%)' }}
                    >
                      <Flame className="w-12 h-12 text-white" />
                    </div>
                    <span 
                      className="text-7xl font-black tracking-tighter text-white"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      ZONNA
                    </span>
                  </div>
                  <p 
                    className="text-2xl font-semibold tracking-[0.3em] uppercase"
                    style={{ color: '#666666' }}
                  >
                    Domine seu Território
                  </p>
                </div>

                {/* Trophy Icon */}
                <div 
                  className="w-28 h-28 rounded-full flex items-center justify-center mb-8"
                  style={{ 
                    background: 'linear-gradient(135deg, #FF4F00 0%, #FF8C00 100%)',
                    boxShadow: '0 0 40px rgba(255, 79, 0, 0.5)'
                  }}
                >
                  <Trophy className="w-14 h-14 text-black" />
                </div>

                {/* Dynamic Title */}
                <div className="text-center mb-10">
                  <p 
                    className="text-5xl font-black tracking-wider mb-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <span style={{ color: '#FF4F00' }}>#{conquestNumber}</span>
                    <span className="text-white"> TERRITÓRIO</span>
                  </p>
                  <p 
                    className="text-6xl font-black tracking-tight"
                    style={{ color: '#FF4F00', fontFamily: 'Inter, sans-serif' }}
                  >
                    CONQUISTADO!
                  </p>
                </div>

                {/* Stats Block */}
                <div 
                  className="w-full rounded-3xl p-10"
                  style={{ backgroundColor: '#121212' }}
                >
                  <div className="flex items-center justify-center">
                    {/* KM */}
                    <div className="flex-1 text-center px-6">
                      <p 
                        className="text-6xl font-bold tracking-wider mb-3"
                        style={{ 
                          fontFamily: 'JetBrains Mono, monospace',
                          color: '#FFFFFF',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {stats.distance.toFixed(2)}
                      </p>
                      <p 
                        className="text-xl font-medium uppercase tracking-[0.2em]"
                        style={{ color: '#666666' }}
                      >
                        KM
                      </p>
                    </div>

                    {/* Divider */}
                    <div 
                      className="w-[2px] h-24"
                      style={{ backgroundColor: '#333333' }}
                    />

                    {/* Tempo */}
                    <div className="flex-1 text-center px-6">
                      <p 
                        className="text-6xl font-bold tracking-wider mb-3"
                        style={{ 
                          fontFamily: 'JetBrains Mono, monospace',
                          color: '#FFFFFF',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {formatTime(stats.duration)}
                      </p>
                      <p 
                        className="text-xl font-medium uppercase tracking-[0.2em]"
                        style={{ color: '#666666' }}
                      >
                        Tempo
                      </p>
                    </div>

                    {/* Divider */}
                    <div 
                      className="w-[2px] h-24"
                      style={{ backgroundColor: '#333333' }}
                    />

                    {/* M² */}
                    <div className="flex-1 text-center px-6">
                      <p 
                        className="text-6xl font-bold tracking-wider mb-3"
                        style={{ 
                          fontFamily: 'JetBrains Mono, monospace',
                          color: '#FF4F00',
                          letterSpacing: '0.05em'
                        }}
                      >
                        {stats.area.toLocaleString()}
                      </p>
                      <p 
                        className="text-xl font-medium uppercase tracking-[0.2em]"
                        style={{ color: '#666666' }}
                      >
                        M²
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Bottom Branding Watermark */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center">
            <p 
              className="text-xl font-bold tracking-[0.4em] uppercase"
              style={{ color: 'rgba(255, 79, 0, 0.6)' }}
            >
              @ZONNA.APP
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 pb-8 safe-bottom flex gap-4">
        <Button
          variant="ghost"
          size="lg"
          onClick={handleDownload}
          disabled={!generatedImage || isGenerating}
          className="flex-1 py-5 rounded-2xl font-semibold uppercase tracking-wider border border-border hover:border-primary/50 transition-all"
        >
          <Download className="w-5 h-5 mr-2" />
          Salvar
        </Button>
        <button
          onClick={handleShare}
          disabled={isGenerating}
          className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{
            backgroundColor: 'transparent',
            border: '2px solid #FF4F00',
            color: '#FF4F00',
          }}
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Share2 className="w-5 h-5" />
          )}
          Gerar Story
        </button>
      </div>
    </motion.div>
  );
}

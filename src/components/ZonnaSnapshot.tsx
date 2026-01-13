import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, X, Flame } from 'lucide-react';
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

  const formatPace = (pace: number) => {
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}'${secs.toString().padStart(2, '0')}"`;
  };

  const generateStoryImage = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      // Wait for map to render
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000000',
        scale: 3, // High resolution
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
      // Convert data URL to blob
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
        // Fallback: download the image
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
          ZONNA Snapshot
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
            className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          />
        ) : (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Hidden Story Card for Capture */}
      <div 
        className="fixed -left-[9999px] -top-[9999px]"
        style={{ width: 1080, height: 1920 }}
      >
        <div
          ref={cardRef}
          className="w-full h-full bg-black flex flex-col"
          style={{ width: 1080, height: 1920 }}
        >
          {/* Top Branding */}
          <div className="p-12 flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF4F00] to-[#FF8C00] flex items-center justify-center">
                <Flame className="w-10 h-10 text-white" />
              </div>
              <span 
                className="text-6xl font-black tracking-tighter text-white"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                ZONNA
              </span>
            </div>
            <p className="text-xl text-gray-400 font-medium tracking-widest uppercase">
              Domine o chão que você pisa
            </p>
          </div>

          {/* Territory Number */}
          <div className="px-12 mb-8">
            <p className="text-[#FF4F00] text-3xl font-black tracking-widest uppercase">
              TERRITÓRIO #{conquestNumber}
            </p>
            <p className="text-white text-5xl font-black tracking-tight mt-2">
              CONQUISTADO
            </p>
          </div>

          {/* Map Area */}
          <div className="flex-1 mx-8 rounded-3xl overflow-hidden border-2 border-[#FF4F00]/30 relative">
            <div className="absolute inset-0">
              <ZonnaMap3D
                userPosition={path.length > 0 ? path[0] : null}
                recordingPath={path}
                followUser={false}
              />
            </div>
            {/* Gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
          </div>

          {/* Stats Bar */}
          <div className="p-12">
            <div className="bg-[#111111] rounded-3xl p-8 border border-[#222222]">
              <div className="grid grid-cols-3 gap-8">
                {/* Pace */}
                <div className="text-center">
                  <p className="text-gray-500 text-lg font-bold uppercase tracking-widest mb-2">
                    PACE
                  </p>
                  <p 
                    className="text-5xl font-bold text-white"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {formatPace(stats.pace)}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">/km</p>
                </div>

                {/* Time */}
                <div className="text-center">
                  <p className="text-gray-500 text-lg font-bold uppercase tracking-widest mb-2">
                    TEMPO
                  </p>
                  <p 
                    className="text-5xl font-bold text-white"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {formatTime(stats.duration)}
                  </p>
                </div>

                {/* Distance */}
                <div className="text-center">
                  <p className="text-gray-500 text-lg font-bold uppercase tracking-widest mb-2">
                    DISTÂNCIA
                  </p>
                  <p 
                    className="text-5xl font-bold text-[#FF4F00]"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {stats.distance.toFixed(2)}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">km</p>
                </div>
              </div>

              {/* Area highlight */}
              <div className="mt-8 pt-8 border-t border-[#222222] text-center">
                <p className="text-gray-500 text-lg font-bold uppercase tracking-widest mb-2">
                  ÁREA DOMINADA
                </p>
                <p 
                  className="text-7xl font-black text-[#FF4F00]"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {stats.area.toLocaleString()}
                </p>
                <p className="text-gray-400 text-xl mt-1">metros quadrados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 pb-8 safe-bottom flex gap-4">
        <Button
          variant="secondary"
          size="lg"
          onClick={handleDownload}
          disabled={!generatedImage || isGenerating}
          className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-wider"
        >
          <Download className="w-5 h-5 mr-2" />
          Salvar
        </Button>
        <Button
          size="lg"
          onClick={handleShare}
          disabled={isGenerating}
          className="flex-1 py-6 rounded-2xl bg-gradient-to-r from-[#FF4F00] to-[#FF8C00] text-white font-black uppercase tracking-wider glow-zonna-intense"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Share2 className="w-5 h-5 mr-2" />
          )}
          Gerar Story
        </Button>
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Download, Share, Plus, Check, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(checkStandalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || isInstalled) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="relative mx-auto mb-6 w-24 h-24">
            <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-zonna rounded-full w-full h-full flex items-center justify-center">
              <Check className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">ZONNA Instalado!</h1>
          <p className="text-muted-foreground mb-8">O app já está no seu dispositivo.</p>
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-zonna text-primary-foreground font-bold"
          >
            Abrir ZONNA
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center max-w-sm"
        >
          {/* Logo */}
          <div className="relative mx-auto mb-8 w-28 h-28">
            <div className="absolute inset-0 bg-primary rounded-3xl blur-2xl opacity-50 animate-pulse-zonna" />
            <div className="relative bg-gradient-zonna p-6 rounded-3xl glow-zonna-intense">
              <Flame className="w-16 h-16 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-4xl font-black text-foreground mb-2 text-glow-zonna">ZONNA</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Domine o chão que você pisa
          </p>

          {/* Features */}
          <div className="space-y-4 mb-8 text-left">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Acesso Rápido</p>
                <p className="text-xs text-muted-foreground">Abra direto da tela inicial</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Funciona Offline</p>
                <p className="text-xs text-muted-foreground">Acesse seus dados sem internet</p>
              </div>
            </div>
          </div>

          {/* Install Button or iOS Instructions */}
          {isIOS ? (
            <div className="space-y-4">
              <p className="text-sm font-bold text-foreground">Para instalar no iPhone/iPad:</p>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Toque em</span>
                    <Share className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold">Compartilhar</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Selecione</span>
                    <Plus className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold">"Adicionar à Tela de Início"</span>
                  </div>
                </div>
              </div>
            </div>
          ) : deferredPrompt ? (
            <Button
              onClick={handleInstall}
              size="lg"
              className="w-full bg-gradient-zonna text-primary-foreground font-black uppercase tracking-widest py-6 rounded-2xl glow-zonna-intense"
            >
              <Download className="w-5 h-5 mr-2" />
              Instalar ZONNA
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Abra este site no navegador do seu celular para instalar o app.
              </p>
              <Button
                onClick={() => navigate('/')}
                variant="secondary"
                className="font-bold"
              >
                Continuar no Navegador
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Skip Link */}
      <div className="p-6 text-center">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Continuar sem instalar →
        </button>
      </div>
    </div>
  );
}

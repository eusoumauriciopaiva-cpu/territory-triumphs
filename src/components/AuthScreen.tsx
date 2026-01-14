import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        if (!name.trim()) {
          toast({ title: 'Digite seu nome', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name);
        if (error) throw error;
        toast({ title: 'Conta criada com sucesso!' });
      }
    } catch (error: any) {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Algo deu errado',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 text-center"
      >
        {/* ZONNA Logo Image */}
        <div className="relative mx-auto mb-6">
          <div className="absolute inset-0 bg-primary rounded-2xl blur-2xl opacity-30 animate-pulse scale-125" />
          <img 
            src="/zonna-logo.png" 
            alt="ZONNA" 
            className="relative w-48 h-auto mx-auto drop-shadow-[0_0_30px_rgba(255,79,0,0.6)]"
          />
        </div>
        
        {/* Official Slogan */}
        <p className="text-primary text-sm font-bold uppercase tracking-widest">
          Domine o chão que você pisa
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4"
      >
        {!isLogin && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-12 h-14 bg-card border-border rounded-xl"
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-12 h-14 bg-card border-border rounded-xl"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-12 pr-12 h-14 bg-card border-border rounded-xl"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-14 bg-gradient-zonna rounded-xl font-bold uppercase tracking-widest glow-zonna-intense"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {isLogin ? 'Entrar' : 'Criar Conta'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </motion.form>

      {/* Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          {isLogin ? (
            <>Não tem conta? <span className="text-primary font-bold">Criar agora</span></>
          ) : (
            <>Já tem conta? <span className="text-primary font-bold">Entrar</span></>
          )}
        </button>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12 text-xs text-muted-foreground/50"
      >
        © 2026 ZONNA • Todos os direitos reservados
      </motion.p>
    </div>
  );
}

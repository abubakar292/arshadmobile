import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SHOP_CONFIG } from '../config/shopConfig';

const errorMessages: Record<string, string> = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Try again.',
  'auth/email-already-in-use': 'This email is already registered.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
  'auth/network-request-failed': 'Check your internet connection.',
  'auth/popup-blocked': 'Please allow popups for Google Sign-In in your browser.',
  'auth/popup-closed-by-user': 'Google Sign-In popup was closed before completing.',
  'auth/cancelled-popup-request': 'Google Sign-In process was cancelled.',
  'auth/operation-not-allowed': 'Sign-in method is not enabled in Firebase Console. Please verify Email/Password and Google are enabled.',
  'auth/unauthorized-domain': 'This domain is not authorized in Firebase Console > Authentication > Settings > Authorized Domains.',
};

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, signUp, signInGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(name, email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(errorMessages[err.code] || err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(errorMessages[err.code] || err.message || 'Google sign-in failed.');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(circle at center, #1E2230 0%, #12141D 60%, #0B0C10 100%)' }}
    >
      {/* Background Gold Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md p-6 relative z-10"
      >
        <div className="rounded-[2rem] bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white p-1 border-2 border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.25)] mb-4 flex items-center justify-center">
              <img src={SHOP_CONFIG.logoUrl} alt={SHOP_CONFIG.shortName} className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight text-center">{SHOP_CONFIG.name}</h2>
            <p className="text-gold-600 font-bold text-xs uppercase tracking-widest mt-0.5">{SHOP_CONFIG.subTitle}</p>
          </div>

          <div className="flex bg-gray-100/80 rounded-xl p-1 mb-8 border border-gray-200">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                isLogin ? 'bg-obsidian text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                !isLogin ? 'bg-obsidian text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Input
                    label="Full Name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={<User className="w-5 h-5" />}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
            />

            <div className="pt-2">
              <Button type="submit" className="w-full bg-obsidian hover:bg-obsidian-light text-white border-none shadow-md" size="lg" isLoading={loading}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          <Button
            type="button"
            className="w-full mt-6 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

        </div>
      </motion.div>
    </div>
  );
}

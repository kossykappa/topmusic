import { useState } from 'react';
import { Music, Mail, Lock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthPageProps {
  onSuccess: () => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'fan' | 'artist'>('fan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      alert('Please enter email and password.');
      return;
    }

    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      onSuccess();
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          role,
        },
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert('Account created. Please check your email to confirm.');
    onSuccess();
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-purple-600">
            <Music className="h-8 w-8" />
          </div>

          <h1 className="text-3xl font-black">Welcome to TopMusic</h1>
          <p className="mt-2 text-sm text-white/50">
            Join as a fan or artist and enter the music experience.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-black/40 p-1">
          <button
            onClick={() => setMode('login')}
            className={`rounded-full py-2 text-sm font-bold ${
              mode === 'login' ? 'bg-white text-black' : 'text-white/60'
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setMode('signup')}
            className={`rounded-full py-2 text-sm font-bold ${
              mode === 'signup' ? 'bg-white text-black' : 'text-white/60'
            }`}
          >
            Sign Up
          </button>
        </div>

        {mode === 'signup' && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setRole('fan')}
                className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                  role === 'fan'
                    ? 'border-red-500 bg-red-600'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                Fan
              </button>

              <button
                onClick={() => setRole('artist')}
                className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                  role === 'artist'
                    ? 'border-purple-500 bg-purple-600'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                Artist
              </button>
            </div>

            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
              <User className="h-5 w-5 text-white/40" />
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
              />
            </div>
          </>
        )}

        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
          <Mail className="h-5 w-5 text-white/40" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
          />
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
          <Lock className="h-5 w-5 text-white/40" />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
          />
        </div>

        <button
          disabled={loading}
          onClick={handleSubmit}
          className="w-full rounded-full bg-gradient-to-r from-red-600 to-purple-600 py-4 font-black text-white disabled:opacity-50"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
        </button>

        <button
          onClick={handleGoogleLogin}
          className="mt-3 w-full rounded-full border border-white/10 bg-white/5 py-4 font-bold text-white"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
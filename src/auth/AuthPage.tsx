import { useState } from 'react';
import { Music, User, Mic2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AccountRole = 'fan' | 'artist';

interface AuthPageProps {
  onSuccess?: () => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AccountRole>('fan');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  async function createProfile(userId: string) {
    const username = email.split('@')[0];

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      username,
      display_name: username,
      role,
    });

    if (error) throw error;

    if (role === 'artist') {
      await supabase.from('artists').insert({
        name: username,
        owner_user_id: userId,
        country: null,
        genre: null,
        bio: 'New TopMusic artist.',
        avatar_url: null,
        followers_count: 0,
        chat_price: 1,
      });
    }
  }

  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      alert('Please enter email and password.');
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        onSuccess?.();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await createProfile(data.user.id);
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      onSuccess?.();
    } catch (error: any) {
      alert(error.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-lg md:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-red-600/20 via-purple-600/20 to-black p-10 md:flex md:flex-col md:justify-between">
            <div>
              <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2">
                <Music className="h-5 w-5 text-red-400" />
                <span className="text-sm font-bold">TOPMUSIC</span>
              </div>

              <h1 className="text-5xl font-black leading-tight">
                One account.
                <br />
                Music, fans and artists.
              </h1>

              <p className="mt-5 max-w-md text-white/60">
                Access the platform through one secure account. Fans enjoy music,
                gifts and comments. Artists unlock uploads, earnings and creator tools.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/60">
              No public confusion. Everyone signs in first. The account role defines
              the experience inside TOPMUSIC.
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mb-8 text-center md:text-left">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-purple-600 md:mx-0">
                <Music className="h-7 w-7" />
              </div>

              <h2 className="text-3xl font-black">
                {isLogin ? 'Login to TOPMUSIC' : 'Create your TOPMUSIC account'}
              </h2>

              <p className="mt-2 text-sm text-white/50">
                {isLogin
                  ? 'Enter your account to continue.'
                  : 'Choose how you want to use the platform.'}
              </p>
            </div>

            {!isLogin && (
              <div className="mb-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('fan')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    role === 'fan'
                      ? 'border-red-500 bg-red-500/15'
                      : 'border-white/10 bg-black/30 hover:bg-white/10'
                  }`}
                >
                  <User className="mb-3 h-6 w-6 text-red-400" />
                  <p className="font-black">Fan</p>
                  <p className="mt-1 text-xs text-white/50">
                    Listen, like, comment and send gifts.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('artist')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    role === 'artist'
                      ? 'border-purple-500 bg-purple-500/15'
                      : 'border-white/10 bg-black/30 hover:bg-white/10'
                  }`}
                >
                  <Mic2 className="mb-3 h-6 w-6 text-purple-400" />
                  <p className="font-black">Artist</p>
                  <p className="mt-1 text-xs text-white/50">
                    Upload music, earn and manage fans.
                  </p>
                </button>
              </div>
            )}

            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none placeholder:text-white/35 focus:border-red-500/60"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none placeholder:text-white/35 focus:border-red-500/60"
              />

              <button
                onClick={handleAuth}
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-purple-600 py-4 font-black text-white transition hover:scale-[1.01] disabled:opacity-60"
              >
                {loading ? 'Loading...' : isLogin ? 'Login' : 'Create Account'}
              </button>

              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="w-full text-sm text-white/50 transition hover:text-white"
              >
                {isLogin
                  ? 'No account? Create one'
                  : 'Already have an account? Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
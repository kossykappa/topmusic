import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  async function handleAuth() {
    try {
      setLoading(true);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        alert('Login realizado com sucesso!');
        window.location.reload();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: email.split('@')[0],
          display_name: email.split('@')[0],
          role: 'fan',
        });
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      alert('Conta criada e login realizado!');
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">
          TOPMUSIC
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          />

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-red-600 to-purple-600 py-3 font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Create Account'}
          </button>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-sm text-gray-400"
          >
            {isLogin
              ? 'No account? Create one'
              : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
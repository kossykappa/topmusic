import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';

export default function Wallet() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userId = getUserId();

  useEffect(() => {
    fetchWallet();
  }, []);

  async function fetchWallet() {
    const { data } = await supabase
      .from('artist_wallets')
      .select('*')
      .eq('artist_id', userId)
      .maybeSingle();

    setWallet(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading wallet...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">My Earnings</h1>

      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
        <p className="text-gray-400">Available Balance</p>

        <h2 className="text-4xl font-bold text-green-400">
          {(wallet?.balance || 0).toFixed(3)} $
        </h2>

        <div className="mt-6">
          <p className="text-gray-400">Total Earned</p>

          <h3 className="text-xl font-semibold">
            {(wallet?.total_earned || 0).toFixed(3)} $
          </h3>
        </div>
      </div>
    </div>
  );
}
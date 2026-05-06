import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';

export default function EarningsDashboard() {
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  const artistId = getUserId(); // artista logado

  useEffect(() => {
    fetchEarnings();
  }, []);

  async function fetchEarnings() {
    const { data, error } = await supabase
      .from('artists')
      .select('earnings_balance, total_earned')
      .eq('id', artistId)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setBalance(data?.earnings_balance || 0);
    setTotalEarned(data?.total_earned || 0);
    setLoading(false);
  }

  async function requestWithdraw() {
    if (balance <= 0) {
      alert('Sem saldo disponível');
      return;
    }

    const { error } = await supabase.from('withdraw_requests').insert({
      artist_id: artistId,
      amount: balance,
      status: 'pending',
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert('Pedido de levantamento enviado!');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        A carregar ganhos...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-6">

        <h1 className="text-3xl font-black">💰 Ganhos</h1>

        <div className="rounded-2xl bg-white/5 p-6">
          <p className="text-sm text-gray-400">Saldo disponível</p>
          <p className="text-3xl font-bold text-green-400">
            {balance} coins
          </p>
        </div>

        <div className="rounded-2xl bg-white/5 p-6">
          <p className="text-sm text-gray-400">Total ganho</p>
          <p className="text-3xl font-bold text-yellow-400">
            {totalEarned} coins
          </p>
        </div>

        <button
          onClick={requestWithdraw}
          className="w-full rounded-full bg-green-500 py-3 font-bold text-black hover:opacity-90"
        >
          💸 Solicitar levantamento
        </button>

      </div>
    </div>
  );
}
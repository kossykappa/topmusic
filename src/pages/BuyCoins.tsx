import { useEffect, useState } from 'react';
import { Coins, ShoppingCart } from 'lucide-react';
import { getUserId } from '../utils/userId';
import { supabase } from '../lib/supabase';

const PACKS = [
  { coins: 500, price: 5, label: 'Starter Pack' },
  { coins: 1200, price: 10, label: 'Popular Pack' },
  { coins: 2500, price: 20, label: 'Pro Pack' },
];

export default function BuyCoins() {
  const [coinBalance, setCoinBalance] = useState(0);
  const [buying, setBuying] = useState<number | null>(null);

  const userId = getUserId();

  useEffect(() => {
    fetchCoinBalance();
  }, []);

  async function fetchCoinBalance() {
    const { data, error } = await supabase
      .from('user_coin_wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar coins:', error);
      return;
    }

    setCoinBalance(data?.balance || 0);
  }

  async function buyCoins(coins: number, price: number) {
    setBuying(coins);

    // Simulação. Depois ligamos Stripe/PayPal real.
    const { error } = await supabase.rpc('reward_user_coins', {
      p_user_id: userId,
      p_amount: coins,
      p_description: `Compra simulada de ${coins} coins por $${price}`,
    });

    if (error) {
      alert(`Erro ao comprar coins: ${error.message}`);
      setBuying(null);
      return;
    }

    await fetchCoinBalance();

    alert(`Compraste ${coins} coins`);
    setBuying(null);
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black">Comprar Coins</h1>
          <p className="mt-3 text-gray-400">
            Usa coins para enviar gifts, apoiar artistas e desbloquear vantagens.
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-6">
          <div className="flex items-center gap-3">
            <Coins className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-sm text-yellow-300">O teu saldo actual</p>
              <h2 className="text-4xl font-black text-yellow-400">
                {coinBalance.toLocaleString()} coins
              </h2>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PACKS.map((pack) => (
            <button
              key={pack.coins}
              onClick={() => buyCoins(pack.coins, pack.price)}
              disabled={buying === pack.coins}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition hover:scale-[1.02] hover:bg-white/10 disabled:opacity-50"
            >
              <ShoppingCart className="mb-4 h-7 w-7 text-pink-400" />

              <p className="text-sm text-gray-400">{pack.label}</p>

              <h2 className="mt-2 text-3xl font-black text-white">
                {pack.coins.toLocaleString()} coins
              </h2>

              <p className="mt-3 text-xl font-bold text-pink-400">
                ${pack.price}
              </p>

              <p className="mt-4 text-sm text-gray-500">
                {buying === pack.coins ? 'A processar...' : 'Comprar agora'}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Como funcionam as coins?</h2>

          <div className="mt-4 space-y-2 text-gray-400">
            <p>• Fãs usam coins para apoiar artistas.</p>
            <p>• Coins podem ser usadas em gifts, votos e destaques.</p>
            <p>• Nesta fase a compra é simulada; depois ligamos Stripe/PayPal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
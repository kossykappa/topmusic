import { getUserId } from '../utils/userId';
import { supabase } from '../lib/supabase';

const PACKS = [
  { coins: 500, price: 5 },
  { coins: 1200, price: 10 },
  { coins: 2500, price: 20 },
];

export default function BuyCoins() {
  async function buy(coins: number) {
    const userId = getUserId();

    // 🔥 simulação (depois ligamos Stripe)
    await supabase.from('wallets').upsert(
      {
        user_id: userId,
        coins: coins,
      },
      { onConflict: 'user_id' }
    );

    alert(`Compraste ${coins} coins`);
  }

  return (
    <div className="p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold">Comprar Coins</h1>

      <div className="space-y-4">
        {PACKS.map((pack) => (
          <button
            key={pack.coins}
            onClick={() => buy(pack.coins)}
            className="w-full rounded-xl bg-pink-600 p-4 text-lg font-bold"
          >
            {pack.coins} coins — ${pack.price}
          </button>
        ))}
      </div>
    </div>
  );
}
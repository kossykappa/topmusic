import { useEffect, useState } from 'react';
import { Coins, ShoppingCart } from 'lucide-react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { getUserId } from '../utils/userId';
import { supabase } from '../lib/supabase';

const PACKS = [
  { coins: 80, price: 1, label: 'Mini Pack' },
  { coins: 180, price: 2, label: 'Basic Pack' },
  { coins: 400, price: 4, label: 'Starter Lite' },
  { coins: 500, price: 5, label: 'Starter Pack' },
  { coins: 850, price: 7.5, label: 'Value Pack' },
  { coins: 1200, price: 10, label: 'Popular Pack' },
  { coins: 1800, price: 15, label: 'Advanced Pack' },
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

  async function addCoins(coins: number) {
    const { error } = await supabase.rpc('reward_user_coins', {
      p_user_id: userId,
      p_amount: coins,
      p_description: `Compra de ${coins} coins via PayPal`,
    });

    if (error) {
      throw error;
    }

    await fetchCoinBalance();
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
            <div
              key={pack.coins}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition hover:scale-[1.02] hover:bg-white/10"
            >
              <ShoppingCart className="mb-4 h-7 w-7 text-pink-400" />

              <p className="text-sm text-gray-400">{pack.label}</p>

              <h2 className="mt-2 text-3xl font-black text-white">
                {pack.coins.toLocaleString()} coins
              </h2>

              <p className="mt-3 text-xl font-bold text-pink-400">
                ${pack.price}
              </p>

              <div className="mt-5">
                {buying === pack.coins ? (
                  <p className="text-sm text-gray-400">A processar...</p>
                ) : (
                  <PayPalButtons
                    style={{
                      layout: 'vertical',
                      color: 'gold',
                      shape: 'pill',
                      label: 'pay',
                    }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: 'CAPTURE',
                        purchase_units: [
                          {
                            amount: {
                              currency_code: 'USD',
                              value: pack.price.toFixed(2),
                            },
                            description: `${pack.coins} TopMusic coins`,
                          },
                        ],
                      });
                    }}
                    onApprove={async (data, actions) => {
                      setBuying(pack.coins);

                      try {
                        const details = await actions.order?.capture();

                        if (details?.status !== 'COMPLETED') {
                          alert('Pagamento não concluído.');
                          return;
                        }

                        await addCoins(pack.coins);

                        alert(`Compraste ${pack.coins} coins`);
                      } catch (error) {
                        console.error('Erro no pagamento:', error);
                        alert('Erro ao concluir pagamento.');
                      } finally {
                        setBuying(null);
                      }
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Como funcionam as coins?</h2>

          <div className="mt-4 space-y-2 text-gray-400">
            <p>• Fãs usam coins para apoiar artistas.</p>
            <p>• Coins podem ser usadas em gifts, votos e destaques.</p>
            <p>• O pagamento é feito por PayPal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
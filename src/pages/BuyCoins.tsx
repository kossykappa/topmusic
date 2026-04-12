import { Coins } from 'lucide-react';
import { getUserId } from '../utils/userId';
import { useState } from 'react';

interface BuyCoinsProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const packs = [
  { id: 'coins_100', label: '100 coins', price: '€2.99' },
  { id: 'coins_500', label: '500 coins', price: '€9.99' },
  { id: 'coins_1000', label: '1000 coins', price: '€17.99' },
];

export default function BuyCoins({ onNavigate }: BuyCoinsProps) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleBuy(packId: string) {
    try {
      setError('');
      setLoadingPack(packId);

      const response = await fetch('/api/create-coins-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, userId: getUserId() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar checkout');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Erro ao comprar coins');
    } finally {
      setLoadingPack(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <Coins className="mx-auto mb-4 h-12 w-12 text-yellow-400" />
          <h1 className="mb-2 text-4xl font-bold">Comprar Coins</h1>
          <p className="text-gray-400">
            Recarrega a tua wallet para enviar presentes aos artistas.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center"
            >
              <h2 className="mb-3 text-2xl font-bold">{pack.label}</h2>
              <p className="mb-6 text-3xl font-extrabold text-yellow-400">{pack.price}</p>

              <button
                onClick={() => handleBuy(pack.id)}
                disabled={loadingPack === pack.id}
                className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-3 font-bold text-black transition hover:scale-105 disabled:opacity-60"
              >
                {loadingPack === pack.id ? 'A processar...' : 'Comprar'}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-center text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => onNavigate('sendGift')}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-white transition hover:bg-white/10"
          >
            Voltar para Presentes
          </button>
        </div>
      </div>
    </div>
  );
}
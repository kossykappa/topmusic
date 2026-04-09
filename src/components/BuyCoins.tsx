import { useState } from 'react';
import { Coins } from 'lucide-react';
import { getUserId } from '../utils/userId';

const PACKS = [
  { id: 'starter', name: '500 moedas', price: '€5' },
  { id: 'plus', name: '1100 moedas', price: '€10' },
  { id: 'pro', name: '2300 moedas', price: '€20' },
];

export default function BuyCoins() {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleBuy(packId: string) {
    setError('');
    setLoadingPack(packId);

    try {
      const userId = getUserId();

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao iniciar pagamento');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Erro no pagamento');
    } finally {
      setLoadingPack(null);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <Coins className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
          <h1 className="text-4xl font-bold mb-3">Comprar moedas</h1>
          <p className="text-gray-400">Usa moedas para apoiar músicos com presentes.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PACKS.map((pack) => (
            <div
              key={pack.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
            >
              <h2 className="text-xl font-bold mb-2">{pack.name}</h2>
              <p className="text-2xl font-extrabold mb-4">{pack.price}</p>
              <button
                onClick={() => handleBuy(pack.id)}
                disabled={loadingPack === pack.id}
                className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {loadingPack === pack.id ? 'A processar...' : 'Comprar'}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-center text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
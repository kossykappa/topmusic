import { useEffect, useState } from 'react';
import GiftBurst from './GiftBurst';

interface Gift {
  id: number;
  name: string;
  coin_value: number;
  icon: string;
}

interface BurstItem {
  id: number;
  icon: string;
}

export default function GiftSelector() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [bursts, setBursts] = useState<BurstItem[]>([]);

  useEffect(() => {
    fetch('/api/get-gifts')
      .then((res) => res.json())
      .then((data) => {
        setGifts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar gifts:', err);
        setLoading(false);
      });
  }, []);

  function addBurst(icon: string) {
    const burstId = Date.now() + Math.floor(Math.random() * 10000);
    setBursts((prev) => [...prev, { id: burstId, icon }]);
  }

  function removeBurst(id: number) {
    setBursts((prev) => prev.filter((item) => item.id !== id));
  }

  async function sendGift(gift: Gift) {
    try {
      setMessage('');

      const res = await fetch('/api/send-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: 'user1',
          toArtistId: 'artist1',
          trackId: null,
          giftCatalogId: gift.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`🎉 ${gift.name} enviado com sucesso!`);
        addBurst(gift.icon);
      } else {
        setMessage(`❌ ${data.error || 'Erro ao enviar presente'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Erro ao enviar presente');
    }
  }

  if (loading) {
    return <p className="text-white">Carregando presentes...</p>;
  }

  return (
    <div className="relative">
      {message && (
        <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3 text-center font-semibold text-green-400">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {gifts.map((gift) => (
          <button
            key={gift.id}
            onClick={() => sendGift(gift)}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:scale-105 hover:bg-white/10"
          >
            <div className="text-3xl">{gift.icon}</div>
            <h3 className="mt-2 text-white">{gift.name}</h3>
            <p className="font-bold text-yellow-400">{gift.coin_value} coins</p>
          </button>
        ))}
      </div>

      {bursts.map((burst) => (
        <GiftBurst
          key={burst.id}
          id={burst.id}
          icon={burst.icon}
          onDone={removeBurst}
        />
      ))}
    </div>
  );
}
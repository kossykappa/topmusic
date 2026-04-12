import { useEffect, useState } from 'react';

interface Gift {
  id: number;
  name: string;
  coin_value: number;
  icon: string;
}

export default function GiftSelector() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/get-gifts')
      .then(res => res.json())
      .then(data => {
        setGifts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  async function sendGift(giftId: number) {
    try {
      const res = await fetch('/api/send-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'user1',
          receiverId: 'artist1',
          giftCatalogId: giftId
        })
      });

      const data = await res.json();

      if (data.success) {
        setMessage('🎉 Presente enviado com sucesso!');
      } else {
        setMessage('❌ Erro: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      setMessage('Erro ao enviar presente');
    }
  }

  if (loading) return <p className="text-white">Carregando...</p>;

  return (
    <div>
      {message && (
        <div className="mb-4 text-center text-green-400 font-bold">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {gifts.map(gift => (
          <div
            key={gift.id}
            onClick={() => sendGift(gift.id)}
            className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:scale-105 hover:bg-white/10 transition cursor-pointer"
          >
            <div className="text-3xl">{gift.icon}</div>
            <h3 className="text-white mt-2">{gift.name}</h3>
            <p className="text-yellow-400 font-bold">{gift.coin_value} coins</p>
          </div>
        ))}
      </div>
    </div>
  );
}
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

  useEffect(() => {
    fetch('/api/get-gifts')
      .then(res => res.json())
      .then(data => {
        setGifts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar gifts:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-white">Carregando presentes...</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {gifts.map((gift) => (
        <div
          key={gift.id}
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:scale-105 transition cursor-pointer"
        >
          <div className="text-3xl">{gift.icon}</div>
          <h3 className="text-white mt-2">{gift.name}</h3>
          <p className="text-yellow-400 font-bold">{gift.coin_value} coins</p>
        </div>
      ))}
    </div>
  );
}
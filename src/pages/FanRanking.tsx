import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Crown } from 'lucide-react';

interface FanRanking {
  fan_user_id: string;
  artist_id: string;
  total_coins_sent: number;
  gifts_sent: number;
}

export default function FanRanking() {
  const [ranking, setRanking] = useState<FanRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  async function fetchRanking() {
    const { data, error } = await supabase
      .from('fan_ranking')
      .select('*')
      .order('total_coins_sent', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setRanking(data || []);
    }

    setLoading(false);
  }

  function getMedal(index: number) {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        A carregar ranking...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-black">
          Ranking{' '}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Fãs
          </span>
        </h1>

        {ranking.length === 0 ? (
          <p className="text-gray-400">Sem dados ainda.</p>
        ) : (
          <div className="space-y-4">
            {ranking.map((fan, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold">
                    {getMedal(index)}
                  </div>

                  <div>
                    <p className="font-bold">{fan.fan_user_id}</p>
                    <p className="text-sm text-gray-400">
                      {fan.gifts_sent} gifts enviados
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-yellow-400 font-bold">
                    {fan.total_coins_sent} coins
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
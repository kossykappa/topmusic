import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';

interface Track {
  id: string;
  title: string;
  plays_count: number;
}

interface Earning {
  track_id: string;
  amount: number;
}

export default function EarningsDashboard() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = getUserId();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    // 🔹 buscar tracks do artista
    const { data: tracksData } = await supabase
      .from('tracks')
      .select('id, title, plays_count')
      .eq('artist_id', userId);

    // 🔹 buscar earnings do artista
    const { data: earningsData } = await supabase
      .from('earnings')
      .select('track_id, amount')
      .eq('artist_id', userId);

    setTracks(tracksData || []);
    setEarnings(earningsData || []);

    setLoading(false);
  }

  // 🔥 calcular totais
  const totalPlays = tracks.reduce(
    (sum, t) => sum + (t.plays_count || 0),
    0
  );

  const totalEarned = earnings.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  // 🔥 juntar earnings por track
  const ranking = tracks.map((track) => {
    const trackEarnings = earnings
      .filter((e) => e.track_id === track.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      ...track,
      earnings: trackEarnings,
    };
  });

  // ordenar por ganhos
  ranking.sort((a, b) => b.earnings - a.earnings);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-6xl">

        <h1 className="mb-6 text-4xl font-black">
          Earnings Dashboard
        </h1>

        {/* CARDS */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          
          <div className="rounded-2xl bg-white/5 p-6">
            <p className="text-gray-400">Tracks</p>
            <h2 className="text-3xl font-bold">{tracks.length}</h2>
          </div>

          <div className="rounded-2xl bg-white/5 p-6">
            <p className="text-gray-400">Total Plays</p>
            <h2 className="text-3xl font-bold">{totalPlays}</h2>
          </div>

          <div className="rounded-2xl bg-white/5 p-6">
            <p className="text-gray-400">Total Earned</p>
            <h2 className="text-3xl font-bold text-green-400">
              {totalEarned.toFixed(3)} $
            </h2>
          </div>

        </div>

        {/* RANKING */}
        <div>
          <h2 className="mb-4 text-2xl font-bold">
            Ranking por música
          </h2>

          {ranking.length === 0 ? (
            <p className="text-gray-400">
              Ainda não há dados de ganhos.
            </p>
          ) : (
            <div className="space-y-3">
              {ranking.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 p-4"
                >
                  <div>
                    <p className="font-semibold">{track.title}</p>
                    <p className="text-sm text-gray-400">
                      {track.plays_count || 0} plays
                    </p>
                  </div>

                  <div className="text-green-400 font-bold">
                    {track.earnings.toFixed(3)} $
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
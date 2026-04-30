import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  DollarSign,
  Music,
  Play,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Track {
  id: string;
  title: string;
  plays_count: number | null;
}

interface Earning {
  id: string;
  track_id: string;
  artist_id: string;
  amount: number;
  created_at: string;
}

interface RankingRow extends Track {
  earnings: number;
  events: number;
}

export default function EarningsDashboard() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
  setLoading(true);

  try {
    const { data: tracksData, error: tracksError } = await supabase
      .from('tracks')
      .select('id, title, plays_count');

    if (tracksError) {
      console.error('Erro ao carregar tracks:', tracksError);
    }

    const { data: earningsData, error: earningsError } = await supabase
      .from('earnings')
      .select('id, track_id, artist_id, amount, created_at')
      .order('created_at', { ascending: false });

    if (earningsError) {
      console.error('Erro ao carregar earnings:', earningsError);
    }

    setTracks((tracksData || []) as Track[]);
    setEarnings((earningsData || []) as Earning[]);
  } catch (error) {
    console.error('Erro geral no dashboard:', error);
    setTracks([]);
    setEarnings([]);
  } finally {
    setLoading(false);
  }
}

  const totalPlays = useMemo(
    () => tracks.reduce((sum, track) => sum + Number(track.plays_count || 0), 0),
    [tracks]
  );

  const totalEarned = useMemo(
    () => earnings.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [earnings]
  );

  const ranking = useMemo<RankingRow[]>(() => {
    const rows = tracks.map((track) => {
      const trackEarnings = earnings.filter((item) => item.track_id === track.id);

      const total = trackEarnings.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

      return {
        ...track,
        earnings: total,
        events: trackEarnings.length,
      };
    });

    return rows.sort((a, b) => b.earnings - a.earnings);
  }, [tracks, earnings]);

  const maxEarning = Math.max(...ranking.map((row) => row.earnings), 0);

  const recentEarnings = earnings.slice(0, 8);

  function formatDate(value: string) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  function getTrackTitle(trackId: string) {
    return tracks.find((track) => track.id === trackId)?.title || 'Música';
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        A carregar dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black md:text-5xl">
              Earnings{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="mt-3 text-gray-400">
              Visão profissional dos ganhos, plays e desempenho por música.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Actualizar dados
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <Music className="mb-4 h-7 w-7 text-red-400" />
            <p className="text-sm text-gray-400">Tracks</p>
            <h2 className="mt-2 text-3xl font-black">{tracks.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <Play className="mb-4 h-7 w-7 text-blue-400" />
            <p className="text-sm text-gray-400">Total Plays</p>
            <h2 className="mt-2 text-3xl font-black">{totalPlays}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <DollarSign className="mb-4 h-7 w-7 text-green-400" />
            <p className="text-sm text-gray-400">Total Earned</p>
            <h2 className="mt-2 text-3xl font-black text-green-400">
              {totalEarned.toFixed(3)} $
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <Wallet className="mb-4 h-7 w-7 text-purple-400" />
            <p className="text-sm text-gray-400">Earning Events</p>
            <h2 className="mt-2 text-3xl font-black">{earnings.length}</h2>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6 flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-green-400" />
              <h2 className="text-2xl font-bold">Ranking por música</h2>
            </div>

            {ranking.length === 0 ? (
              <p className="text-gray-400">Ainda não há dados de ganhos.</p>
            ) : (
              <div className="space-y-4">
                {ranking.map((track, index) => {
                  const percent =
                    maxEarning > 0 ? Math.round((track.earnings / maxEarning) * 100) : 0;

                  return (
                    <div
                      key={track.id}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-400">#{index + 1}</p>
                          <h3 className="text-lg font-bold">{track.title}</h3>
                          <p className="text-sm text-gray-400">
                            {track.plays_count || 0} plays · {track.events} eventos
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-black text-green-400">
                            {track.earnings.toFixed(3)} $
                          </p>
                          <p className="text-xs text-gray-500">{percent}%</p>
                        </div>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-green-400"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6 flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-bold">Últimos ganhos</h2>
            </div>

            {recentEarnings.length === 0 ? (
              <p className="text-gray-400">Ainda não há movimentos recentes.</p>
            ) : (
              <div className="space-y-3">
                {recentEarnings.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{getTrackTitle(item.track_id)}</p>
                        <p className="text-sm text-gray-400">
                          {formatDate(item.created_at)}
                        </p>
                      </div>

                      <p className="font-black text-green-400">
                        +{Number(item.amount || 0).toFixed(3)} $
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-r from-green-500/10 to-emerald-600/10 p-6">
          <p className="text-sm text-gray-300">Resumo</p>
          <h3 className="mt-2 text-2xl font-black">
            Cada play registado gera automaticamente ganhos e actualiza a wallet do artista.
          </h3>
          <p className="mt-2 text-gray-400">
            Este painel ajuda a acompanhar quais músicas estão a gerar mais valor dentro da plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}
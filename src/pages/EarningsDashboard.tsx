import { useEffect, useMemo, useState } from 'react';
import { BarChart3, DollarSign, Music, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TrackEarning {
  track_id: string;
  title: string;
  plays_count: number;
  total_earned: number;
  earning_events: number;
}

export default function EarningsDashboard() {
  const [rows, setRows] = useState<TrackEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  async function fetchEarnings() {
    setLoading(true);

    const { data, error } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        plays_count,
        earnings (
          id,
          amount
        )
      `);

    if (error) {
      console.error('Erro ao carregar dashboard:', error);
      setRows([]);
      setLoading(false);
      return;
    }

    const formatted = (data || []).map((track: any) => {
      const total = (track.earnings || []).reduce(
        (sum: number, item: any) => sum + Number(item.amount || 0),
        0
      );

      return {
        track_id: track.id,
        title: track.title,
        plays_count: track.plays_count || 0,
        total_earned: total,
        earning_events: track.earnings?.length || 0,
      };
    });

    formatted.sort((a, b) => b.total_earned - a.total_earned);

    setRows(formatted);
    setLoading(false);
  }

  const totals = useMemo(() => {
    return {
      tracks: rows.length,
      plays: rows.reduce((sum, row) => sum + Number(row.plays_count || 0), 0),
      earned: rows.reduce((sum, row) => sum + Number(row.total_earned || 0), 0),
      events: rows.reduce((sum, row) => sum + Number(row.earning_events || 0), 0),
    };
  }, [rows]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        A carregar dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-black">Earnings Dashboard</h1>
          <p className="mt-2 text-gray-400">
            Ganhos, plays e desempenho por música.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <Music className="mb-3 h-6 w-6 text-red-400" />
            <p className="text-sm text-gray-400">Tracks</p>
            <h2 className="text-2xl font-black">{totals.tracks}</h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <Play className="mb-3 h-6 w-6 text-blue-400" />
            <p className="text-sm text-gray-400">Total Plays</p>
            <h2 className="text-2xl font-black">{totals.plays}</h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <DollarSign className="mb-3 h-6 w-6 text-green-400" />
            <p className="text-sm text-gray-400">Total Earned</p>
            <h2 className="text-2xl font-black text-green-400">
              {totals.earned.toFixed(3)} $
            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <BarChart3 className="mb-3 h-6 w-6 text-purple-400" />
            <p className="text-sm text-gray-400">Earning Events</p>
            <h2 className="text-2xl font-black">{totals.events}</h2>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-5 text-2xl font-bold">Ranking por música</h2>

          {rows.length === 0 ? (
            <p className="text-gray-400">Ainda não há dados de ganhos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-sm text-gray-400">
                    <th className="py-3">#</th>
                    <th className="py-3">Música</th>
                    <th className="py-3">Plays</th>
                    <th className="py-3">Eventos</th>
                    <th className="py-3">Ganhos</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.track_id} className="border-b border-white/5">
                      <td className="py-4 font-bold text-gray-400">
                        {index + 1}
                      </td>

                      <td className="py-4 font-semibold">{row.title}</td>

                      <td className="py-4">{row.plays_count}</td>

                      <td className="py-4">{row.earning_events}</td>

                      <td className="py-4 font-bold text-green-400">
                        {Number(row.total_earned || 0).toFixed(3)} $
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WithdrawalRequest {
  id: string;
  artist_id: string;
  amount: number;
  method: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | string;
  created_at: string;
  payment_reference?: string | null;
  paid_at?: string | null;
}

interface Earning {
  id: string;
  artist_id: string;
  track_id: string;
  amount: number;
  created_at: string;
}

function formatUSD(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));
}

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234';

export default function FinanceDashboard() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(
  sessionStorage.getItem('topmusic_admin_auth') === 'true'
);
const [pin, setPin] = useState('');
const [error, setError] = useState('');

  const COMMISSION_RATE = 0.2;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: earningData, error: earningError } = await supabase
      .from('earnings')
      .select('*')
      .order('created_at', { ascending: false });

    if (withdrawalError) {
      console.error('Erro ao carregar levantamentos:', withdrawalError);
    }

    if (earningError) {
      console.error('Erro ao carregar earnings:', earningError);
    }

    setWithdrawals((withdrawalData || []) as WithdrawalRequest[]);
    setEarnings((earningData || []) as Earning[]);
    setLoading(false);
  }

  function login(e: React.FormEvent) {
  e.preventDefault();
  setError('');

  if (pin !== ADMIN_PIN) {
    setError('PIN incorrecto.');
    return;
  }

  sessionStorage.setItem('topmusic_admin_auth', 'true');
  setAuthenticated(true);
}

  const totals = useMemo(() => {
    const totalEarned = earnings.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const totalWithdrawals = withdrawals.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const pending = withdrawals
      .filter((item) => item.status === 'pending')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const approved = withdrawals
      .filter((item) => item.status === 'approved')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const paid = withdrawals
      .filter((item) => item.status === 'paid')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const rejected = withdrawals
      .filter((item) => item.status === 'rejected')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const platformCommission = totalEarned * COMMISSION_RATE;
    const artistShare = totalEarned * (1 - COMMISSION_RATE);

    return {
      totalEarned,
      totalWithdrawals,
      pending,
      approved,
      paid,
      rejected,
      platformCommission,
      artistShare,
    };
  }, [earnings, withdrawals]);

  function formatDate(value?: string | null) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  function statusBadge(status: string) {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1 text-sm font-semibold text-blue-400">
          <CheckCircle className="h-4 w-4" />
          Paid
        </span>
      );
    }

    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-sm font-semibold text-green-400">
          <CheckCircle className="h-4 w-4" />
          Approved
        </span>
      );
    }

    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-sm font-semibold text-red-400">
          <XCircle className="h-4 w-4" />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-yellow-500/15 px-3 py-1 text-sm font-semibold text-yellow-400">
        <Clock className="h-4 w-4" />
        Pending
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        A carregar dashboard financeiro...
      </div>
    );
  }

  if (!authenticated) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <form onSubmit={login} className="w-full max-w-md">
        <h2 className="mb-4 text-2xl font-bold">Admin Finance Access</h2>

        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="mb-4 w-full rounded-xl bg-black border border-white/10 px-4 py-3"
          placeholder="Enter PIN"
        />

        {error && <p className="text-red-400">{error}</p>}

        <button className="w-full rounded-xl bg-green-500 py-3 font-bold">
          Entrar
        </button>
      </form>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black md:text-5xl">
              Finance{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="mt-3 text-gray-400">
              Visão interna de ganhos, levantamentos e comissão TopMusic.
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
            <DollarSign className="mb-4 h-7 w-7 text-green-400" />
            <p className="text-sm text-gray-400">Total gerado</p>
            <h2 className="mt-2 text-3xl font-black text-green-400">
              {formatUSD(totals.totalEarned)}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <ShieldCheck className="mb-4 h-7 w-7 text-purple-400" />
            <p className="text-sm text-gray-400">Comissão TopMusic 20%</p>
            <h2 className="mt-2 text-3xl font-black">
              {formatUSD(totals.platformCommission)}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <Wallet className="mb-4 h-7 w-7 text-blue-400" />
            <p className="text-sm text-gray-400">Parte dos artistas 80%</p>
            <h2 className="mt-2 text-3xl font-black">
              {formatUSD(totals.artistShare)}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <BarChart3 className="mb-4 h-7 w-7 text-yellow-400" />
            <p className="text-sm text-gray-400">Total levantamentos</p>
            <h2 className="mt-2 text-3xl font-black">
              {formatUSD(totals.totalWithdrawals)}
            </h2>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-yellow-500/10 p-5">
            <p className="text-sm text-yellow-300">Pending</p>
            <h3 className="mt-2 text-2xl font-black">
              {formatUSD(totals.pending)}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-green-500/10 p-5">
            <p className="text-sm text-green-300">Approved</p>
            <h3 className="mt-2 text-2xl font-black">
              {formatUSD(totals.approved)}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-blue-500/10 p-5">
            <p className="text-sm text-blue-300">Paid</p>
            <h3 className="mt-2 text-2xl font-black">
              {formatUSD(totals.paid)}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-red-500/10 p-5">
            <p className="text-sm text-red-300">Rejected</p>
            <h3 className="mt-2 text-2xl font-black">
              {formatUSD(totals.rejected)}
            </h3>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-6 text-2xl font-bold">Últimos levantamentos</h2>

          {withdrawals.length === 0 ? (
            <p className="text-gray-400">Ainda não existem levantamentos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-sm text-gray-400">
                    <th className="py-3">Data</th>
                    <th className="py-3">Artista</th>
                    <th className="py-3">Método</th>
                    <th className="py-3">Valor</th>
                    <th className="py-3">Estado</th>
                    <th className="py-3">Referência</th>
                  </tr>
                </thead>

                <tbody>
                  {withdrawals.slice(0, 15).map((item) => (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="py-4 text-sm text-gray-300">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="py-4 text-xs text-gray-400">
                        {item.artist_id}
                      </td>

                      <td className="py-4">{item.method}</td>

                      <td className="py-4 font-bold text-green-400">
                        {formatUSD(item.amount)}
                      </td>

                      <td className="py-4">{statusBadge(item.status)}</td>

                      <td className="py-4 text-xs text-gray-400">
                        {item.payment_reference || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-r from-green-500/10 to-emerald-600/10 p-6">
          <p className="text-sm text-gray-300">Nota financeira</p>
          <h3 className="mt-2 text-2xl font-black">
            Este painel é administrativo e deve ficar protegido.
          </h3>
          <p className="mt-2 text-gray-400">
            A comissão de 20% é uma simulação interna. Podes ajustar a percentagem conforme o modelo de negócio da TopMusic.
          </p>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, Lock, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type WithdrawStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'paid';

interface WithdrawRequest {
  id: string;
  artist_id: string;
  amount: number;
  method: string;
  account_details: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | string;
  created_at: string;
  payment_reference?: string | null;
  paid_at?: string | null;
}

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234';

export default function AdminWithdraw() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<WithdrawStatus>('pending');
  const [pin, setPin] = useState('');
  const [authenticated, setAuthenticated] = useState(
    sessionStorage.getItem('topmusic_admin_auth') === 'true'
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (authenticated) {
      fetchRequests();
    }
  }, [authenticated]);

  async function fetchRequests() {
    setLoading(true);

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar pedidos:', error);
      setRequests([]);
    } else {
      setRequests((data || []) as WithdrawRequest[]);
    }

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

  function logout() {
    sessionStorage.removeItem('topmusic_admin_auth');
    setAuthenticated(false);
    setPin('');
  }

 async function updateStatus(id: string, status: 'approved' | 'rejected') {
  setUpdatingId(id);

  // 👉 SE FOR REJEITAR → usa função segura
  if (status === 'rejected') {
    const { error } = await supabase.rpc('reject_withdrawal', {
      p_request_id: id,
    });

    if (error) {
      console.error('Erro ao rejeitar pedido:', error);
    }

    await fetchRequests();
    setUpdatingId(null);
    return;
  }

  // 👉 SE FOR APROVAR → comportamento normal
  const { error } = await supabase
    .from('withdrawal_requests')
    .update({ status: 'approved' })
    .eq('id', id);

  if (error) {
    console.error('Erro ao aprovar pedido:', error);
  }

  await fetchRequests();
  setUpdatingId(null);
}

  async function markAsPaid(id: string) {
    const reference = prompt('Referência do pagamento:');

    if (!reference) return;

    setUpdatingId(id);

    const { error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'paid',
        payment_reference: reference,
        paid_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao marcar como pago:', error);
    }

    await fetchRequests();
    setUpdatingId(null);
  }

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter((req) => req.status === filter);
  }, [requests, filter]);

  const totals = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
      paid: requests.filter((r) => r.status === 'paid').length,
    };
  }, [requests]);

  function statusBadge(status: string) {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1 text-sm font-semibold text-blue-400">
          💰 Paid
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

  function formatDate(value: string) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <form
          onSubmit={login}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-red-500/20 p-3">
              <Lock className="h-7 w-7 text-red-400" />
            </div>

            <div>
              <h1 className="text-2xl font-black">Admin Withdraw</h1>
              <p className="text-sm text-gray-400">
                Área reservada à equipa TopMusic.
              </p>
            </div>
          </div>

          <label className="mb-2 block text-sm font-medium text-gray-300">
            PIN de administração
          </label>

          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="mb-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
            placeholder="Digite o PIN"
          />

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-purple-600 px-6 py-3 font-bold text-white transition hover:scale-[1.01]"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-black">Withdraw Requests</h1>
            <p className="mt-2 text-gray-400">
              Gerir pedidos de levantamento dos artistas.
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Sair do Admin
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { key: 'all', label: 'All', value: totals.all },
            { key: 'pending', label: 'Pending', value: totals.pending },
            { key: 'approved', label: 'Approved', value: totals.approved },
            { key: 'rejected', label: 'Rejected', value: totals.rejected },
            { key: 'paid', label: 'Paid', value: totals.paid },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as WithdrawStatus)}
              className={`rounded-2xl border p-4 text-left transition ${
                filter === item.key
                  ? 'border-red-500 bg-red-500/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="text-sm text-gray-400">{item.label}</p>
              <p className="text-2xl font-black">{item.value}</p>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
            A carregar pedidos...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
            Nenhum pedido encontrado.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl"
              >
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Artist ID</p>
                    <p className="break-all font-semibold">{req.artist_id}</p>
                  </div>

                  {statusBadge(req.status)}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-gray-400">Amount</p>
                    <p className="text-xl font-black text-green-400">
                      {new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(req.amount || 0)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Method</p>
                    <p className="font-semibold">{req.method}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Date</p>
                    <p className="font-semibold">{formatDate(req.created_at)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Request ID</p>
                    <p className="truncate text-xs text-gray-300">{req.id}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-black/40 p-4">
                  <p className="mb-1 text-sm text-gray-400">Payment Details</p>
                  <p className="break-words">{req.account_details}</p>
                </div>

                {req.status === 'paid' && (
                  <div className="mt-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-300">
                    <p>
                      <strong>Reference:</strong> {req.payment_reference || '-'}
                    </p>
                    <p>
                      <strong>Paid at:</strong>{' '}
                      {formatDate(req.paid_at || '')}
                    </p>
                  </div>
                )}

                {req.status === 'pending' && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => updateStatus(req.id, 'approved')}
                      disabled={updatingId === req.id}
                      className="rounded-xl bg-green-500 px-5 py-3 font-bold text-black transition hover:scale-105 disabled:opacity-50"
                    >
                      {updatingId === req.id ? 'A processar...' : 'Approve'}
                    </button>

                    <button
                      onClick={() => updateStatus(req.id, 'rejected')}
                      disabled={updatingId === req.id}
                      className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white transition hover:scale-105 disabled:opacity-50"
                    >
                      {updatingId === req.id ? 'A processar...' : 'Reject'}
                    </button>
                  </div>
                )}

                {req.status === 'approved' && (
                  <div className="mt-5">
                    <button
                      onClick={() => markAsPaid(req.id)}
                      disabled={updatingId === req.id}
                      className="rounded-xl bg-blue-500 px-5 py-3 font-bold text-white transition hover:scale-105 disabled:opacity-50"
                    >
                      {updatingId === req.id ? 'A processar...' : 'Mark as Paid'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
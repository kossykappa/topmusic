import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Clock,
  DollarSign,
  Send,
  Wallet as WalletIcon,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';

interface ArtistWallet {
  artist_id: string;
  balance: number | null;
  total_earned: number | null;
  updated_at?: string | null;
}

interface WithdrawalRequest {
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

export default function Wallet() {
  const [wallet, setWallet] = useState<ArtistWallet | null>(null);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('PayPal');
  const [accountDetails, setAccountDetails] = useState('');
  const [message, setMessage] = useState('');

  const userId = getUserId();

  useEffect(() => {
    fetchWalletData();
  }, []);

  async function fetchWalletData() {
    setLoading(true);

    const { data: walletData, error: walletError } = await supabase
      .from('artist_wallets')
      .select('*')
      .eq('artist_id', userId)
      .maybeSingle();

    const { data: requestsData, error: requestsError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('artist_id', userId)
      .order('created_at', { ascending: false });

    if (walletError) {
      console.error('Erro ao carregar wallet:', walletError);
    }

    if (requestsError) {
      console.error('Erro ao carregar levantamentos:', requestsError);
    }

    setWallet(walletData as ArtistWallet | null);
    setRequests((requestsData || []) as WithdrawalRequest[]);
    setLoading(false);
  }

  const availableBalance = Number(wallet?.balance || 0);
  const totalEarned = Number(wallet?.total_earned || 0);

  const totals = useMemo(() => {
    return {
      pending: requests
        .filter((item) => item.status === 'pending' || item.status === 'approved')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      paid: requests
        .filter((item) => item.status === 'paid')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      rejected: requests
        .filter((item) => item.status === 'rejected')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    };
  }, [requests]);

  async function requestWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    const value = Number(amount);

    if (!value || value <= 0) {
      setMessage('Insira um valor válido.');
      return;
    }

    if (value > availableBalance) {
      setMessage('O valor solicitado é superior ao saldo disponível.');
      return;
    }

    if (!accountDetails.trim()) {
      setMessage('Insira os dados da conta para pagamento.');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.rpc('request_withdrawal', {
  p_artist_id: userId,
  p_amount: value,
  p_method: method,
  p_account_details: accountDetails.trim(),
});

    if (error) {
      setMessage(`Erro ao solicitar levantamento: ${error.message}`);
      setSubmitting(false);
      return;
    }

    setAmount('');
    setAccountDetails('');
    setMessage('Pedido de levantamento enviado com sucesso.');
    setSubmitting(false);

    await fetchWalletData();
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        A carregar wallet...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black md:text-5xl">
              Artist{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                Wallet
              </span>
            </h1>
            <p className="mt-3 text-gray-400">
              Acompanhe ganhos, saldo disponível e pedidos de levantamento.
            </p>
          </div>

          <button
            onClick={fetchWalletData}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Actualizar
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <WalletIcon className="mb-4 h-7 w-7 text-green-400" />
            <p className="text-sm text-gray-400">Saldo disponível</p>
            <h2 className="mt-2 text-3xl font-black text-green-400">
              {availableBalance.toFixed(2)} $
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <DollarSign className="mb-4 h-7 w-7 text-blue-400" />
            <p className="text-sm text-gray-400">Total ganho</p>
            <h2 className="mt-2 text-3xl font-black">
              {totalEarned.toFixed(2)} $
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <Clock className="mb-4 h-7 w-7 text-yellow-400" />
            <p className="text-sm text-gray-400">Pendente / aprovado</p>
            <h2 className="mt-2 text-3xl font-black">
              {totals.pending.toFixed(2)} $
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <CheckCircle className="mb-4 h-7 w-7 text-purple-400" />
            <p className="text-sm text-gray-400">Já pago</p>
            <h2 className="mt-2 text-3xl font-black">
              {totals.paid.toFixed(2)} $
            </h2>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={requestWithdraw}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-6 flex items-center gap-3">
              <Send className="h-6 w-6 text-green-400" />
              <h2 className="text-2xl font-bold">Solicitar levantamento</h2>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm text-gray-300">Valor</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-green-500"
                placeholder="0.000"
              />
              <p className="mt-2 text-xs text-gray-500">
                Disponível: {availableBalance.toFixed(2)} $
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm text-gray-300">Método</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-green-500"
              >
                <option value="PayPal">PayPal</option>
                <option value="IBAN">IBAN / Transferência bancária</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm text-gray-300">
                Dados da conta
              </label>
              <textarea
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                className="min-h-28 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-green-500"
                placeholder="Ex: email PayPal, IBAN, número Mobile Money..."
              />
            </div>

            {message && (
              <p className="mb-4 rounded-xl bg-white/5 p-3 text-sm text-yellow-300">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || availableBalance <= 0}
              className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 font-bold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'A enviar...' : 'Enviar pedido'}
            </button>
          </form>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-6 text-2xl font-bold">Histórico de levantamentos</h2>

            {requests.length === 0 ? (
              <p className="text-gray-400">
                Ainda não existem pedidos de levantamento.
              </p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xl font-black">
                          {Number(request.amount || 0).toFixed(2)} $
                        </p>
                        <p className="text-sm text-gray-400">
                          {request.method} · {formatDate(request.created_at)}
                        </p>
                      </div>

                      {statusBadge(request.status)}
                    </div>

                    <div className="rounded-xl bg-white/5 p-3 text-sm text-gray-300">
                      <p className="mb-1 text-gray-500">Dados de pagamento</p>
                      <p className="break-words">{request.account_details}</p>
                    </div>

                    {request.status === 'paid' && (
                      <div className="mt-3 rounded-xl bg-blue-500/10 p-3 text-sm text-blue-300">
                        <p>
                          <strong>Referência:</strong>{' '}
                          {request.payment_reference || '-'}
                        </p>
                        <p>
                          <strong>Pago em:</strong>{' '}
                          {formatDate(request.paid_at)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-r from-green-500/10 to-emerald-600/10 p-6">
          <p className="text-sm text-gray-300">Nota</p>
          <h3 className="mt-2 text-2xl font-black">
            Os levantamentos são analisados pela equipa TopMusic antes do pagamento.
          </h3>
          <p className="mt-2 text-gray-400">
            Depois de aprovado e pago, a referência do pagamento ficará registada no histórico.
          </p>
        </div>
      </div>
    </div>
  );
}
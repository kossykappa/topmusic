import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Clock,
  DollarSign,
  Send,
  Wallet as WalletIcon,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

function formatUSD(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));
}

export default function Wallet() {
  const { t } = useTranslation();

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
    void fetchWalletData();
  }, []);

  async function fetchWalletData() {
    if (!userId) {
      setLoading(false);
      return;
    }

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

    if (walletError) console.error(t('walletLoadError'), walletError);
    if (requestsError) console.error(t('withdrawalsLoadError'), requestsError);

    setWallet(walletData as ArtistWallet | null);
    setRequests(Array.isArray(requestsData) ? (requestsData as WithdrawalRequest[]) : []);
    setLoading(false);
  }

  const availableBalance = Math.max(0, Number(wallet?.balance || 0));
  const totalEarned = Math.max(0, Number(wallet?.total_earned || 0));

  const totals = useMemo(() => {
    return {
      pending: requests
        .filter((item) => item.status === 'pending' || item.status === 'approved')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      paid: requests
        .filter((item) => item.status === 'paid')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    };
  }, [requests]);

  async function requestWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!userId) {
      setMessage('User not found');
      return;
    }

    const value = Number(amount);

    if (!value || value <= 0) {
      setMessage(t('enterValidAmount'));
      return;
    }

    if (value > availableBalance) {
      setMessage(t('amountExceedsBalance'));
      return;
    }

    if (!accountDetails.trim()) {
      setMessage(t('enterPaymentDetails'));
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
      console.error(error);
      setMessage(t('withdrawRequestError', { message: error.message }));
      setSubmitting(false);
      return;
    }

    setAmount('');
    setAccountDetails('');
    setMessage(t('withdrawRequestSuccess'));
    setSubmitting(false);

    await fetchWalletData();
  }

  function statusBadge(status: string) {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1 text-sm font-semibold text-blue-400">
          <CheckCircle className="h-4 w-4" />
          {t('paid')}
        </span>
      );
    }

    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-sm font-semibold text-green-400">
          <CheckCircle className="h-4 w-4" />
          {t('approved')}
        </span>
      );
    }

    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-sm font-semibold text-red-400">
          <XCircle className="h-4 w-4" />
          {t('rejected')}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-yellow-500/15 px-3 py-1 text-sm font-semibold text-yellow-400">
        <Clock className="h-4 w-4" />
        {t('pending')}
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
      <div className="flex min-h-[100dvh] items-center justify-center bg-black text-white">
        {t('loadingWallet')}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black px-4 py-4 pb-28 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black md:text-5xl">
              {t('artist')}{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                {t('wallet')}
              </span>
            </h1>

            <p className="mt-2 text-sm text-gray-400 md:text-base">
              {t('walletSubtitle')}
            </p>
          </div>

          <button
            onClick={fetchWalletData}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {t('refresh')}
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <WalletIcon className="mb-3 h-6 w-6 text-green-400" />
            <p className="text-xs text-gray-400">{t('availableBalance')}</p>
            <h2 className="mt-1 text-2xl font-black text-green-400">
              {formatUSD(availableBalance)}
            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <DollarSign className="mb-3 h-6 w-6 text-blue-400" />
            <p className="text-xs text-gray-400">{t('totalEarned')}</p>
            <h2 className="mt-1 text-2xl font-black">
              {formatUSD(totalEarned)}
            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Clock className="mb-3 h-6 w-6 text-yellow-400" />
            <p className="text-xs text-gray-400">{t('pendingApproved')}</p>
            <h2 className="mt-1 text-2xl font-black">
              {formatUSD(totals.pending)}
            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <CheckCircle className="mb-3 h-6 w-6 text-purple-400" />
            <p className="text-xs text-gray-400">{t('alreadyPaid')}</p>
            <h2 className="mt-1 text-2xl font-black">
              {formatUSD(totals.paid)}
            </h2>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={requestWithdraw}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="mb-4 flex items-center gap-3">
              <Send className="h-5 w-5 text-green-400" />
              <h2 className="text-xl font-bold">{t('requestWithdrawal')}</h2>
            </div>

            <div className="mb-3">
              <label className="mb-2 block text-sm text-gray-300">
                {t('amount')}
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-green-500"
                placeholder="0.00"
              />

              <p className="mt-2 text-xs text-gray-500">
                {t('available')}: {formatUSD(availableBalance)}
              </p>
            </div>

            <div className="mb-3">
              <label className="mb-2 block text-sm text-gray-300">
                {t('method')}
              </label>

              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-green-500"
              >
                <option value="PayPal">PayPal</option>
                <option value="IBAN">{t('bankTransfer')}</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Outro">{t('other')}</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="mb-2 block text-sm text-gray-300">
                {t('accountDetails')}
              </label>

              <textarea
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                className="min-h-20 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-green-500"
                placeholder={t('accountDetailsPlaceholder')}
              />
            </div>

            {message && (
              <p className="mb-3 rounded-xl bg-white/5 p-3 text-sm text-yellow-300">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || availableBalance <= 0}
              className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-bold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t('sending') : t('sendRequest')}
            </button>
          </form>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-4 text-xl font-bold">
              {t('withdrawalHistory')}
            </h2>

            {requests.length === 0 ? (
              <p className="text-sm text-gray-400">
                {t('noWithdrawalRequests')}
              </p>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xl font-black">
                          {formatUSD(request.amount)}
                        </p>

                        <p className="text-sm text-gray-400">
                          {request.method} · {formatDate(request.created_at)}
                        </p>
                      </div>

                      {statusBadge(request.status)}
                    </div>

                    <div className="rounded-xl bg-white/5 p-3 text-sm text-gray-300">
                      <p className="mb-1 text-gray-500">
                        {t('paymentDetails')}
                      </p>

                      <p className="break-words">{request.account_details}</p>
                    </div>

                    {request.status === 'paid' && (
                      <div className="mt-3 rounded-xl bg-blue-500/10 p-3 text-sm text-blue-300">
                        <p>
                          <strong>{t('reference')}:</strong>{' '}
                          {request.payment_reference || '-'}
                        </p>

                        <p>
                          <strong>{t('paidOn')}:</strong>{' '}
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

        <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-r from-green-500/10 to-emerald-600/10 p-4">
          <p className="text-xs text-gray-300">{t('note')}</p>

          <h3 className="mt-1 text-xl font-black">
            {t('withdrawalsReviewed')}
          </h3>

          <p className="mt-1 text-sm text-gray-400">
            {t('paymentReferenceRecorded')}
          </p>
        </div>
      </div>
    </div>
  );
}
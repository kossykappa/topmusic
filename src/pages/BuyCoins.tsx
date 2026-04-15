import { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  Coins,
  DollarSign,
  ArrowDownToLine,
  RefreshCw,
  CreditCard,
  Clock3,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';

interface BuyCoinsProps {
  onNavigate?: (page: string, data?: unknown) => void;
}

interface WalletRow {
  id: string;
  user_id: string;
  coins: number | null;
  balance_usd: number | null;
  total_earned_usd: number | null;
  total_withdrawn_usd: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface WithdrawRequestRow {
  id: string;
  user_id: string;
  amount_usd: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  method: string;
  account_email?: string | null;
  account_name?: string | null;
  notes?: string | null;
  created_at?: string | null;
}

const COINS_PER_USD = 100;
const MIN_WITHDRAW_USD = 10;

export default function BuyCoins({ onNavigate }: BuyCoinsProps) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [withdraws, setWithdraws] = useState<WithdrawRequestRow[]>([]);

  const [coinsToConvert, setCoinsToConvert] = useState('100');
  const [withdrawAmount, setWithdrawAmount] = useState('10');
  const [withdrawMethod, setWithdrawMethod] = useState('paypal');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountName, setAccountName] = useState('');
  const [notes, setNotes] = useState('');

  const userId = useMemo(() => getUserId(), []);

  useEffect(() => {
    void loadWalletPage();
  }, []);

  async function ensureWallet(currentUserId: string): Promise<WalletRow | null> {
    const { data: existingWallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (fetchError) {
      console.error('Erro ao procurar wallet:', fetchError);
      return null;
    }

    if (existingWallet) {
      return existingWallet as WalletRow;
    }

    const { data: newWallet, error: insertError } = await supabase
      .from('wallets')
      .insert({
        user_id: currentUserId,
        coins: 0,
        balance_usd: 0,
        total_earned_usd: 0,
        total_withdrawn_usd: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar wallet:', insertError);
      return null;
    }

    return newWallet as WalletRow;
  }

  async function loadWalletPage() {
    setLoading(true);

    try {
      const ensuredWallet = await ensureWallet(userId);
      setWallet(ensuredWallet);

      const { data: requestsData, error: requestsError } = await supabase
        .from('withdraw_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (requestsError) {
        console.error('Erro ao carregar levantamentos:', requestsError);
        setWithdraws([]);
      } else {
        setWithdraws((requestsData || []) as WithdrawRequestRow[]);
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar wallet:', error);
      setWallet(null);
      setWithdraws([]);
    } finally {
      setLoading(false);
    }
  }

  async function refreshWalletOnly() {
    const ensuredWallet = await ensureWallet(userId);
    setWallet(ensuredWallet);
  }

  async function convertCoinsToUsd() {
    if (!wallet) return;

    const coinsRequested = Number(coinsToConvert);

    if (!Number.isFinite(coinsRequested) || coinsRequested <= 0) {
      alert('Indique uma quantidade válida de coins.');
      return;
    }

    if (!Number.isInteger(coinsRequested)) {
      alert('A quantidade de coins deve ser um número inteiro.');
      return;
    }

    const currentCoins = Number(wallet.coins || 0);

    if (coinsRequested > currentCoins) {
      alert('Coins insuficientes.');
      return;
    }

    if (coinsRequested < COINS_PER_USD) {
      alert(`Conversão mínima: ${COINS_PER_USD} coins.`);
      return;
    }

    if (coinsRequested % COINS_PER_USD !== 0) {
      alert(`Use múltiplos de ${COINS_PER_USD} coins.`);
      return;
    }

    const usdValue = coinsRequested / COINS_PER_USD;
    const nextCoins = currentCoins - coinsRequested;
    const nextBalanceUsd = Number(wallet.balance_usd || 0) + usdValue;
    const nextTotalEarnedUsd = Number(wallet.total_earned_usd || 0) + usdValue;

    setBusy(true);

    try {
      const { error } = await supabase
        .from('wallets')
        .update({
          coins: nextCoins,
          balance_usd: nextBalanceUsd,
          total_earned_usd: nextTotalEarnedUsd,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao converter coins:', error);
        alert('Não foi possível converter as coins.');
        return;
      }

      setWallet((prev) =>
        prev
          ? {
              ...prev,
              coins: nextCoins,
              balance_usd: nextBalanceUsd,
              total_earned_usd: nextTotalEarnedUsd,
            }
          : prev
      );

      alert(`Conversão concluída: ${coinsRequested} coins = $${usdValue.toFixed(2)}`);
    } catch (error) {
      console.error('Erro inesperado ao converter coins:', error);
      alert('Ocorreu um erro ao converter.');
    } finally {
      setBusy(false);
    }
  }

  async function requestWithdraw() {
    if (!wallet) return;

    const amountUsd = Number(withdrawAmount);
    const currentBalance = Number(wallet.balance_usd || 0);

    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      alert('Indique um valor válido para levantamento.');
      return;
    }

    if (amountUsd < MIN_WITHDRAW_USD) {
      alert(`Levantamento mínimo: $${MIN_WITHDRAW_USD.toFixed(2)}.`);
      return;
    }

    if (amountUsd > currentBalance) {
      alert('Saldo insuficiente.');
      return;
    }

    if (!accountEmail.trim()) {
      alert('Indique o e-mail da conta de levantamento.');
      return;
    }

    if (!accountName.trim()) {
      alert('Indique o nome do titular da conta.');
      return;
    }

    setBusy(true);

    try {
      const { data: insertedRequest, error: requestError } = await supabase
        .from('withdraw_requests')
        .insert({
          user_id: userId,
          amount_usd: amountUsd,
          status: 'pending',
          method: withdrawMethod,
          account_email: accountEmail.trim(),
          account_name: accountName.trim(),
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (requestError) {
        console.error('Erro ao criar pedido de levantamento:', requestError);
        alert('Não foi possível criar o pedido de levantamento.');
        return;
      }

      const nextBalanceUsd = currentBalance - amountUsd;

      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance_usd: nextBalanceUsd,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (walletError) {
        console.error('Erro ao actualizar wallet após pedido:', walletError);
        alert('Pedido criado, mas houve erro ao actualizar o saldo.');
        return;
      }

      setWallet((prev) =>
        prev
          ? {
              ...prev,
              balance_usd: nextBalanceUsd,
            }
          : prev
      );

      setWithdraws((prev) => [insertedRequest as WithdrawRequestRow, ...prev]);

      setWithdrawAmount('10');
      setNotes('');

      alert('Pedido de levantamento enviado com sucesso.');
    } catch (error) {
      console.error('Erro inesperado no levantamento:', error);
      alert('Ocorreu um erro ao pedir levantamento.');
    } finally {
      setBusy(false);
    }
  }

  function formatUsd(value: number | null | undefined) {
    const amount = Number(value || 0);
    return `$${amount.toFixed(2)}`;
  }

  function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  }

  function statusBadge(status: WithdrawRequestRow['status']) {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Paid
        </span>
      );
    }

    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Approved
        </span>
      );
    }

    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">
          <XCircle className="h-3.5 w-3.5" />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-300">
        <Clock3 className="h-3.5 w-3.5" />
        Pending
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-lg">Loading wallet...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Fan Wallet</h1>
            <p className="mt-1 text-white/65">
              Coins, USD balance, conversions and withdrawals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadWalletPage()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              onClick={() => onNavigate?.('live')}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-sm font-bold text-white transition hover:scale-[1.02]"
            >
              Back to Live
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="mb-3 inline-flex rounded-2xl bg-pink-500/15 p-3 text-pink-300">
              <Coins className="h-6 w-6" />
            </div>
            <div className="text-sm text-white/65">Available Coins</div>
            <div className="mt-2 text-3xl font-black">
              {Number(wallet?.coins || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="mb-3 inline-flex rounded-2xl bg-green-500/15 p-3 text-green-300">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="text-sm text-white/65">Available USD Balance</div>
            <div className="mt-2 text-3xl font-black">
              {formatUsd(wallet?.balance_usd)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="mb-3 inline-flex rounded-2xl bg-blue-500/15 p-3 text-blue-300">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="text-sm text-white/65">Total Earned</div>
            <div className="mt-2 text-3xl font-black">
              {formatUsd(wallet?.total_earned_usd)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="mb-3 inline-flex rounded-2xl bg-yellow-500/15 p-3 text-yellow-300">
              <ArrowDownToLine className="h-6 w-6" />
            </div>
            <div className="text-sm text-white/65">Total Withdrawn</div>
            <div className="mt-2 text-3xl font-black">
              {formatUsd(wallet?.total_withdrawn_usd)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-purple-500/15 p-3 text-purple-300">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black">Convert Coins to USD</h2>
                <p className="text-sm text-white/60">
                  Conversion rate: {COINS_PER_USD} coins = $1.00
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Coins to convert
                </label>
                <input
                  type="number"
                  min={COINS_PER_USD}
                  step={COINS_PER_USD}
                  value={coinsToConvert}
                  onChange={(e) => setCoinsToConvert(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35"
                  placeholder={`Example: ${COINS_PER_USD}`}
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">
                <div className="flex items-center justify-between">
                  <span>Estimated USD</span>
                  <span className="font-black text-green-300">
                    $
                    {(
                      Math.max(0, Number(coinsToConvert) || 0) / COINS_PER_USD
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => void convertCoinsToUsd()}
                disabled={busy}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 font-black text-white transition hover:scale-[1.01] disabled:opacity-50"
              >
                Convert Now
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-green-500/15 p-3 text-green-300">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black">Withdraw USD</h2>
                <p className="text-sm text-white/60">
                  Minimum withdrawal: {formatUsd(MIN_WITHDRAW_USD)}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Amount in USD
                </label>
                <input
                  type="number"
                  min={MIN_WITHDRAW_USD}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35"
                  placeholder="10.00"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Method
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                >
                  <option value="paypal">PayPal</option>
                  <option value="wise">Wise</option>
                  <option value="revolut">Revolut</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Account Email
                </label>
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Account Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35"
                  placeholder="Full account holder name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/35"
                  placeholder="Optional note for admin"
                />
              </div>

              <button
                onClick={() => void requestWithdraw()}
                disabled={busy}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-3 font-black text-white transition hover:scale-[1.01] disabled:opacity-50"
              >
                Request Withdrawal
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Recent Withdrawal Requests</h2>
              <p className="text-sm text-white/60">
                Your latest payout requests in USD.
              </p>
            </div>

            <button
              onClick={() => void loadWalletPage()}
              disabled={busy}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              Reload
            </button>
          </div>

          {withdraws.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-white/65">
              No withdrawal requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {withdraws.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-white">
                        {formatUsd(request.amount_usd)}
                      </div>
                      <div className="mt-1 text-sm text-white/60">
                        {request.method} • {request.account_email || '—'}
                      </div>
                      <div className="mt-1 text-xs text-white/45">
                        {formatDate(request.created_at)}
                      </div>
                    </div>

                    <div>{statusBadge(request.status)}</div>
                  </div>

                  {(request.account_name || request.notes) && (
                    <div className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-white/70">
                      {request.account_name && (
                        <div>
                          <span className="font-bold text-white/85">Account:</span>{' '}
                          {request.account_name}
                        </div>
                      )}
                      {request.notes && (
                        <div className="mt-1">
                          <span className="font-bold text-white/85">Notes:</span>{' '}
                          {request.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/65 backdrop-blur-md">
          <div className="font-black text-white mb-2">Important</div>
          <p>
            This wallet uses USD as the base payout currency. Coins are first
            converted into USD balance, and withdrawals are then requested for
            manual review and payment.
          </p>
        </div>
      </div>
    </div>
  );
}
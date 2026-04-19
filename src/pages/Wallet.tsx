import { useEffect, useState } from 'react';
import {
  Wallet as WalletIcon,
  Coins,
  DollarSign,
  ArrowDownToLine,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';
import {
  ensureWallet,
  convertCoinsToUsd,
  requestWithdraw,
} from '../lib/walletService';

interface WalletProps {
  onNavigate?: (page: string, data?: unknown) => void;
}

interface WalletRow {
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
  status: string;
  method?: string | null;
  account_email?: string | null;
  account_name?: string | null;
  notes?: string | null;
  created_at?: string | null;
}

export default function Wallet({ onNavigate }: WalletProps) {
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
  const [flashMessage, setFlashMessage] = useState('');
  useEffect(() => {
  if (!flashMessage) return;

  const timer = setTimeout(() => {
    setFlashMessage('');
  }, 4000);

  return () => clearTimeout(timer);
}, [flashMessage]);

  useEffect(() => {
    void loadWalletData();
  }, []);

  async function loadWalletData() {
    setLoading(true);

    try {
      const userId = getUserId();
      const ensuredWallet = await ensureWallet(userId);
      setWallet((ensuredWallet || null) as WalletRow | null);

      if (ensuredWallet && Number(ensuredWallet.coins || 0) > 0) {
  setFlashMessage('Wallet actualizada. As tuas coins já estão disponíveis.');
} else {
  setFlashMessage('');
}

      const { data: withdrawData, error: withdrawError } = await supabase
        .from('withdraw_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (withdrawError) {
        console.error('Erro ao carregar levantamentos:', withdrawError);
        setWithdraws([]);
      } else {
        setWithdraws((withdrawData || []) as WithdrawRequestRow[]);
      }
    } catch (error) {
      console.error('Erro ao carregar wallet:', error);
      setWallet(null);
      setWithdraws([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConvertCoins() {
    const userId = getUserId();
    const coins = Number(coinsToConvert);

    if (!Number.isFinite(coins) || coins <= 0) {
      alert('Indique uma quantidade válida de coins.');
      return;
    }

    setBusy(true);

    try {
      const result = await convertCoinsToUsd(userId, coins);
      alert(result.message);
      await loadWalletData();
    } catch (error) {
      console.error(error);
      alert('Falha ao converter coins.');
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    const userId = getUserId();
    const amountUsd = Number(withdrawAmount);

    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      alert('Indique um valor válido.');
      return;
    }

    if (!accountEmail.trim()) {
      alert('Indique o email da conta.');
      return;
    }

    if (!accountName.trim()) {
      alert('Indique o nome do titular.');
      return;
    }

    setBusy(true);

    try {
      const result = await requestWithdraw(
        userId,
        amountUsd,
        withdrawMethod,
        accountEmail.trim(),
        accountName.trim(),
        notes.trim()
      );

      alert(result.message);
      await loadWalletData();
    } catch (error) {
      console.error(error);
      alert('Falha ao pedir levantamento.');
    } finally {
      setBusy(false);
    }
  }

async function handleBuyCoins(packId: 'starter' | 'plus' | 'pro') {
  try {
    const userId = getUserId();

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId, userId }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      alert('Falha ao iniciar pagamento.');
      return;
    }

    window.location.href = data.url;
  } catch (error) {
    console.error(error);
    alert('Erro ao iniciar checkout.');
  }
}

  function formatUsd(value?: number | null) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  }

  function renderStatus(status: string) {
    if (status === 'paid') return '✅ Paid';
    if (status === 'approved') return '🟦 Approved';
    if (status === 'rejected') return '❌ Rejected';
    return '🟨 Pending';
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading wallet...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">

{flashMessage && (
  <div className="mb-6 animate-fade-in rounded-2xl border border-green-400/20 bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-4 py-3 text-sm font-bold text-green-300 shadow-lg">
    {flashMessage}
  </div>
)}

      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Wallet</h1>
            <p className="mt-1 text-sm text-white/65">
              Gerir coins, saldo USD e pedidos de levantamento.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadWalletData()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              onClick={() => onNavigate?.('feed')}
              className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-sm font-bold text-white"
            >
              Voltar
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 inline-flex rounded-2xl bg-pink-500/15 p-3 text-pink-300">
              <Coins className="h-6 w-6" />
            </div>
            <div className="text-sm text-white/65">Coins</div>
            <div className="mt-2 text-3xl font-black">
              {Number(wallet?.coins || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 inline-flex rounded-2xl bg-green-500/15 p-3 text-green-300">
              <WalletIcon className="h-6 w-6" />
            </div>
            <div className="text-sm text-white/65">Saldo disponível</div>
            <div className="mt-2 text-3xl font-black">
              {formatUsd(wallet?.balance_usd)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 inline-flex rounded-2xl bg-blue-500/15 p-3 text-blue-300">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="text-sm text-white/65">Total ganho</div>
            <div className="mt-2 text-3xl font-black">
              {formatUsd(wallet?.total_earned_usd)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 inline-flex rounded-2xl bg-yellow-500/15 p-3 text-yellow-300">
              <ArrowDownToLine className="h-6 w-6" />
            </div>
            <div className="text-sm text-white/65">Total levantado</div>
            <div className="mt-2 text-3xl font-black">
              {formatUsd(wallet?.total_withdrawn_usd)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-xl font-black">Converter Coins para USD</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Coins
                </label>
                <input
                  type="number"
                  value={coinsToConvert}
                  onChange={(e) => setCoinsToConvert(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  placeholder="100"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">
                Conversão actual: <span className="font-bold text-green-300">100 coins = $1.00</span>
              </div>

              <button
                onClick={() => void handleConvertCoins()}
                disabled={busy}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 font-black text-white disabled:opacity-50"
              >
                Converter
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-xl font-black">Pedir levantamento</h2>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Valor em USD
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Método
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
                  Email da conta
                </label>
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Nome do titular
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white/80">
                  Nota
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                  placeholder="Opcional"
                />
              </div>

              <button
                onClick={() => void handleWithdraw()}
                disabled={busy}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-3 font-black text-white disabled:opacity-50"
              >
                Pedir levantamento
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-xl font-black">Histórico de levantamentos</h2>

          {withdraws.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-white/65">
              Nenhum pedido ainda.
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
                        {request.method || '—'} • {request.account_email || '—'}
                      </div>
                      <div className="mt-1 text-xs text-white/45">
                        {formatDate(request.created_at)}
                      </div>
                    </div>

                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                      {renderStatus(request.status)}
                    </div>
                  </div>

                  {(request.account_name || request.notes) && (
                    <div className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-white/70">
                      {request.account_name && (
                        <div>
                          <span className="font-bold text-white/85">Conta:</span>{' '}
                          {request.account_name}
                        </div>
                      )}
                      {request.notes && (
                        <div className="mt-1">
                          <span className="font-bold text-white/85">Nota:</span>{' '}
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
      </div>
    </div>
  );
}
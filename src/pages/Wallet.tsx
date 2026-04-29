import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';

export default function Wallet() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('PayPal');
  const [accountDetails, setAccountDetails] = useState('');
  const [message, setMessage] = useState('');

  const userId = getUserId();

  useEffect(() => {
    fetchWallet();
  }, []);

  async function fetchWallet() {
    const { data } = await supabase
      .from('artist_wallets')
      .select('*')
      .eq('artist_id', userId)
      .maybeSingle();

    setWallet(data);
    setLoading(false);
  }

  async function requestWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    const value = Number(amount);
    const balance = Number(wallet?.balance || 0);

    if (!value || value <= 0) {
      setMessage('Insira um valor válido.');
      return;
    }

    if (value > balance) {
      setMessage('O valor solicitado é superior ao saldo disponível.');
      return;
    }

    if (!accountDetails.trim()) {
      setMessage('Insira os dados da conta para pagamento.');
      return;
    }

    const { error } = await supabase.from('withdrawal_requests').insert({
      artist_id: userId,
      amount: value,
      method,
      account_details: accountDetails.trim(),
      status: 'pending',
    });

    if (error) {
      setMessage(`Erro ao solicitar levantamento: ${error.message}`);
      return;
    }

    setAmount('');
    setAccountDetails('');
    setMessage('Pedido de levantamento enviado com sucesso.');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading wallet...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">My Earnings</h1>

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-gray-400">Available Balance</p>

          <h2 className="text-4xl font-bold text-green-400">
            {(wallet?.balance || 0).toFixed(3)} $
          </h2>

          <div className="mt-6">
            <p className="text-gray-400">Total Earned</p>

            <h3 className="text-xl font-semibold">
              {(wallet?.total_earned || 0).toFixed(3)} $
            </h3>
          </div>
        </div>

        <form
          onSubmit={requestWithdraw}
          className="rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="mb-4 text-2xl font-bold">Solicitar levantamento</h2>

          <div className="mb-4">
            <label className="mb-2 block text-sm text-gray-300">Valor</label>
            <input
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
              placeholder="0.000"
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm text-gray-300">Método</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
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
              className="min-h-28 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
              placeholder="Ex: email PayPal, IBAN, número Mobile Money..."
            />
          </div>

          {message && <p className="mb-4 text-sm text-yellow-400">{message}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 font-bold text-black transition hover:scale-[1.01]"
          >
            Enviar pedido
          </button>
        </form>
      </div>
    </div>
  );
}
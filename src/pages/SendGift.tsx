import { useEffect, useState } from 'react';
import { Coins, Gift, Send, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';

interface Artist {
  id: string;
  name?: string | null;
  full_name?: string | null;
  artist_name?: string | null;
}

const GIFT_OPTIONS = [10, 50, 100, 250, 500];

export default function SendGift() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [coinBalance, setCoinBalance] = useState(0);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [coins, setCoins] = useState(50);
  const [message, setMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const userId = getUserId();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: walletData } = await supabase
      .from('user_coin_wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    setCoinBalance(walletData?.balance || 0);

    const { data: artistData } = await supabase
      .from('artists')
      .select('id, name, full_name, artist_name')
      .order('created_at', { ascending: false });

    setArtists((artistData || []) as Artist[]);

    if (artistData && artistData.length > 0) {
      setSelectedArtistId(String(artistData[0].id));
    }

    setLoading(false);
  }

  function getArtistName(artist: Artist) {
    return artist.artist_name || artist.full_name || artist.name || artist.id;
  }

  async function sendGift(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage('');
    setSuccess(false);

    if (!selectedArtistId) {
      setStatusMessage('Escolhe um artista.');
      return;
    }

    if (coins > coinBalance) {
      setStatusMessage('Coins insuficientes.');
      return;
    }

    setSending(true);

    const { error } = await supabase.rpc('send_artist_gift', {
      p_fan_user_id: userId,
      p_artist_id: selectedArtistId,
      p_track_id: null,
      p_coins: coins,
      p_message: message.trim() || null,
    });

    if (error) {
      setStatusMessage(`Erro ao enviar gift: ${error.message}`);
      setSending(false);
      return;
    }

    setSuccess(true);
    setMessage('');
    setStatusMessage(`Gift de ${coins} coins enviado com sucesso 🎁`);

    await fetchData();

    setSending(false);

    setTimeout(() => {
      setSuccess(false);
    }, 2500);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        A carregar gifts...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-4xl font-black">
            <Gift className="h-10 w-10 text-pink-400" />
            Enviar Gift
          </h1>
          <p className="mt-3 text-gray-400">
            Apoia artistas com coins e ajuda-os a crescer dentro da TopMusic.
          </p>
        </div>

        {success && (
          <div className="mb-6 rounded-3xl border border-pink-500/30 bg-pink-500/10 p-6 text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-pink-400" />
            <h2 className="text-2xl font-black text-pink-300">
              Gift enviado com sucesso!
            </h2>
            <p className="mt-2 text-gray-300">
              O artista recebeu o teu apoio.
            </p>
          </div>
        )}

        <div className="mb-8 rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-6">
          <div className="flex items-center gap-3">
            <Coins className="h-9 w-9 text-yellow-400" />
            <div>
              <p className="text-sm text-yellow-300">Saldo disponível</p>
              <h2 className="text-4xl font-black text-yellow-400">
                {coinBalance.toLocaleString()} coins
              </h2>
            </div>
          </div>
        </div>

        <form
          onSubmit={sendGift}
          className="rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <div className="mb-5">
            <label className="mb-2 block text-sm text-gray-300">
              Escolher artista
            </label>

            <select
              value={selectedArtistId}
              onChange={(e) => setSelectedArtistId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-pink-500"
            >
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {getArtistName(artist)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="mb-3 block text-sm text-gray-300">
              Escolher gift
            </label>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {GIFT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCoins(option)}
                  className={`rounded-2xl border px-4 py-4 font-black transition ${
                    coins === option
                      ? 'border-pink-500 bg-pink-500 text-black'
                      : 'border-white/10 bg-black text-white hover:bg-white/10'
                  }`}
                >
                  🎁 {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm text-gray-300">
              Mensagem opcional
            </label>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-pink-500"
              placeholder="Ex: Grande som! Continua assim..."
            />
          </div>

          {statusMessage && (
            <p className="mb-5 rounded-xl bg-white/5 p-3 text-sm text-yellow-300">
              {statusMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={sending || artists.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4 font-bold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            {sending ? 'A enviar...' : `Enviar ${coins} coins`}
          </button>
        </form>
      </div>
    </div>
  );
}
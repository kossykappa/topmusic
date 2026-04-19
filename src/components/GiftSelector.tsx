import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import GiftBurst from './GiftBurst';
import { getUserId } from '../utils/userId';

interface GiftItem {
  id: number;
  name: string;
  coin_value: number;
  icon: string;
}

interface BurstItem {
  id: number;
  icon: string;
  combo: number;
}

interface GiftSelectorProps {
  toArtistId: string;
  onClose: () => void;
  onBuyCoins: () => void;
}

export default function GiftSelector({
  toArtistId,
  onClose,
  onBuyCoins,
}: GiftSelectorProps) {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [bursts, setBursts] = useState<BurstItem[]>([]);
  const [combo, setCombo] = useState(0);
  const [liveToast, setLiveToast] = useState('');
  const [coinsBalance, setCoinsBalance] = useState<number | null>(null);

  const comboTimer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const userId = getUserId();

        const [giftsRes, walletRes] = await Promise.all([
          fetch('/api/get-gifts'),
          fetch(`/api/get-wallet?userId=${encodeURIComponent(userId)}`),
        ]);

        const giftsData = await giftsRes.json();
        const walletData = await walletRes.json();

        if (giftsRes.ok) {
          setGifts(giftsData || []);
        }

        if (walletRes.ok) {
          setCoinsBalance(Number(walletData.coins ?? walletData.balance ?? 0));
        }

        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados do painel:', err);
        setLoading(false);
      }
    }

    void loadData();

    return () => {
      if (comboTimer.current) window.clearTimeout(comboTimer.current);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  function addBurst(icon: string, comboValue: number) {
    const burstId = Date.now() + Math.floor(Math.random() * 10000);
    setBursts((prev) => [...prev, { id: burstId, icon, combo: comboValue }]);
  }

  function removeBurst(id: number) {
    setBursts((prev) => prev.filter((item) => item.id !== id));
  }

  function increaseCombo() {
    setCombo((prev) => {
      const next = prev + 1;

      if (comboTimer.current) {
        window.clearTimeout(comboTimer.current);
      }

      comboTimer.current = window.setTimeout(() => {
        setCombo(0);
      }, 2200);

      return next;
    });
  }

  function showToast(text: string) {
    setLiveToast(text);

    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }

    toastTimer.current = window.setTimeout(() => {
      setLiveToast('');
    }, 2000);
  }

  async function sendGift(gift: GiftItem) {
    try {
      setMessage('');
      const fromUserId = getUserId();

      const res = await fetch('/api/send-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId,
          toArtistId,
          trackId: null,
          giftCatalogId: gift.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const nextCombo = combo + 1;
        increaseCombo();

        setMessage(`🎉 Enviaste ${gift.name}! Saldo: ${data.newBalance} coins`);
        setCoinsBalance(Number(data.newBalance || 0));
        showToast(`${gift.icon} ${gift.name} enviado!`);
        addBurst(gift.icon, nextCombo);
      } else {
        setMessage(`❌ ${data.error || 'Erro ao enviar presente'}`);

        if (typeof data.balance === 'number') {
          setCoinsBalance(data.balance);
        }

        if (typeof data.newBalance === 'number') {
          setCoinsBalance(data.newBalance);
        }

        if (
          String(data.error || '').toLowerCase().includes('saldo insuficiente')
        ) {
          showToast('💰 Coins insuficientes');
        }
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Erro ao enviar presente');
    }
  }

  const showLowBalanceBox =
    coinsBalance !== null && coinsBalance < 10;

  return (
    <>
      <div
        className="fixed inset-0 z-[105] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 z-[110] rounded-t-3xl border-t border-white/10 bg-[#0b0b0f] p-5 shadow-2xl md:left-auto md:right-6 md:top-1/2 md:w-[420px] md:-translate-y-1/2 md:rounded-3xl md:border md:border-white/10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Enviar Presente 🎁</h2>
            <p className="text-sm text-gray-400">
              Escolha um presente para apoiar o artista
            </p>
            <p className="mt-1 text-sm font-semibold text-yellow-400">
              Saldo: {coinsBalance ?? '--'} coins
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {combo > 1 && (
          <div className="mb-4 inline-block rounded-full bg-pink-600 px-3 py-1 text-sm font-bold text-white shadow-lg">
            Combo x{combo}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-semibold text-green-400">
            {message}
          </div>
        )}

        {showLowBalanceBox && (
          <div className="mb-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
            <div className="mb-2 text-sm font-semibold text-yellow-300">
              Tens poucas coins disponíveis.
            </div>
            <button
              onClick={onBuyCoins}
              className="rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-sm font-bold text-black transition hover:scale-105"
            >
              Comprar coins
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-white">Carregando presentes...</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {gifts.map((gift) => (
              <button
                key={gift.id}
                onClick={() => void sendGift(gift)}
                disabled={
                  coinsBalance !== null && coinsBalance < gift.coin_value
                }
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition hover:scale-105 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="text-3xl">{gift.icon}</div>
                <div className="mt-2 font-semibold text-white">{gift.name}</div>
                <div className="font-bold text-yellow-400">
                  {gift.coin_value} coins
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {liveToast && (
        <div className="animate-fade-in fixed left-1/2 top-20 z-[200] -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-6 py-3 text-sm font-bold text-white shadow-2xl">
          {liveToast}
        </div>
      )}

      {bursts.map((burst) => (
        <GiftBurst
          key={burst.id}
          id={burst.id}
          icon={burst.icon}
          combo={burst.combo}
          onDone={removeBurst}
        />
      ))}
    </>
  );
}
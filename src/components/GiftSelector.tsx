import { Gift, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import GiftBurst from './GiftBurst';

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

export default function GiftSelector() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [bursts, setBursts] = useState<BurstItem[]>([]);
  const [open, setOpen] = useState(false);
  const [combo, setCombo] = useState(0);

  const comboTimer = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/get-gifts')
      .then((res) => res.json())
      .then((data) => {
        setGifts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar gifts:', err);
        setLoading(false);
      });
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

  async function sendGift(gift: GiftItem) {
    try {
      setMessage('');

      const res = await fetch('/api/send-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: 'user1',
          toArtistId: 'artist1',
          trackId: null,
          giftCatalogId: gift.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const nextCombo = combo + 1;
        increaseCombo();
        setMessage(`🎉 ${gift.name} enviado com sucesso! Saldo: ${data.newBalance}`);
        addBurst(gift.icon, nextCombo);
      } else {
        setMessage(`❌ ${data.error || 'Erro ao enviar presente'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Erro ao enviar presente');
    }
  }

  return (
    <>
      <div className="fixed right-4 top-1/2 z-[110] flex -translate-y-1/2 flex-col items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-purple-600 text-white shadow-xl transition hover:scale-110"
          title="Enviar presente"
        >
          <Gift className="h-6 w-6" />
        </button>

        {combo > 1 && (
          <div className="rounded-full bg-pink-600 px-3 py-1 text-sm font-bold text-white shadow-lg">
            Combo x{combo}
          </div>
        )}
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[105] bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="fixed bottom-0 left-0 right-0 z-[110] rounded-t-3xl border-t border-white/10 bg-[#0b0b0f] p-5 shadow-2xl md:left-auto md:right-6 md:top-1/2 md:w-[420px] md:-translate-y-1/2 md:rounded-3xl md:border md:border-white/10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Enviar Presente 🎁</h2>
                <p className="text-sm text-gray-400">Escolha um presente para apoiar o artista</p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {message && (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-semibold text-green-400">
                {message}
              </div>
            )}

            {loading ? (
              <p className="text-white">Carregando presentes...</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {gifts.map((gift) => (
                  <button
                    key={gift.id}
                    onClick={() => sendGift(gift)}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition hover:scale-105 hover:bg-white/10"
                  >
                    <div className="text-3xl">{gift.icon}</div>
                    <div className="mt-2 font-semibold text-white">{gift.name}</div>
                    <div className="font-bold text-yellow-400">{gift.coin_value} coins</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
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
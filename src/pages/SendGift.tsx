import { useState } from 'react';
import GiftSelector from '../components/GiftSelector';
import HeartFloat from '../components/HeartFloat';
import LiveComments from '../components/LiveComments';

interface HeartItem {
  id: number;
}

export default function SendGift() {
  const [openGifts, setOpenGifts] = useState(false);
  const [hearts, setHearts] = useState<HeartItem[]>([]);

  function addHeart() {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    setHearts((prev) => [...prev, { id }]);
  }

  function removeHeart(id: number) {
    setHearts((prev) => prev.filter((heart) => heart.id !== id));
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-black text-white">
      <div className="relative flex h-full w-full items-center justify-center">
        <video
          src="/video-demo.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        <div className="absolute left-4 top-4 z-20 flex items-center gap-3 rounded-full bg-black/35 px-3 py-2 backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-lg font-bold text-white shadow-lg">
            MZ
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Maya Zuda</h2>
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Live
              </span>
            </div>
            <p className="text-xs text-gray-200">@mayazuda.official</p>
          </div>
        </div>

        <div className="absolute bottom-8 left-4 z-20 max-w-md">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              🎵 Agora a tocar
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              👀 12.8K a ver
            </span>
          </div>

          <h3 className="text-2xl font-bold text-white">Studio Session Live</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-200">
            Maya Zuda ao vivo com nova sessão em estúdio. Envia presentes, reage e apoia a artista.
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-300">
            <span className="rounded-full bg-white/10 px-2 py-1">#Afrobeats</span>
            <span className="rounded-full bg-white/10 px-2 py-1">#LiveMusic</span>
            <span className="rounded-full bg-white/10 px-2 py-1">#TopMusic</span>
          </div>
        </div>

        <LiveComments />

        <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center space-y-5">
          <button
            onClick={addHeart}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg backdrop-blur-sm transition hover:scale-110 hover:bg-white/20"
          >
            ❤️
          </button>

          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg backdrop-blur-sm transition hover:scale-110 hover:bg-white/20">
            💬
          </button>

          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg backdrop-blur-sm transition hover:scale-110 hover:bg-white/20">
            🔗
          </button>

          <button
            onClick={() => setOpenGifts(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-red-600 text-xl shadow-xl transition hover:scale-110 animate-pulse"
            title="Enviar presente"
          >
            🎁
          </button>
        </div>

        {openGifts && (
          <div className="absolute right-4 bottom-0 z-30">
            <GiftSelector onClose={() => setOpenGifts(false)} />
          </div>
        )}

        {hearts.map((heart) => (
          <HeartFloat key={heart.id} id={heart.id} onDone={removeHeart} />
        ))}
      </div>
    </div>
  );
}
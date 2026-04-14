import { useEffect, useRef, useState } from 'react';
import {
  Heart,
  Gift,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Eye,
  User,
  Share2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LivePageProps {
  onNavigate?: (page: string, data?: unknown) => void;
}

interface LiveTrack {
  id: string;
  artist_id: string;
  artist_name?: string | null;
  title: string;
  stream_url: string;
  cover_url?: string | null;
  is_live?: boolean | null;
  viewers_count?: number | null;
  started_at?: string | null;
  created_at?: string | null;
}

interface FloatingGift {
  id: number;
  emoji: string;
  left: number;
  size: number;
  duration: number;
}

const DEFAULT_COMMENTS = [
  'Grande som 🔥',
  'Maya está forte hoje',
  'TopMusic vai longe 👏',
  'Coroa para o artista 👑',
];

const COMMENT_USERS = [
  'Rita S',
  'Mário V',
  'Dino Live',
  'Carlos M',
  'Ana K',
  'Top Fan',
  'Lima Beats',
  'Nuno A',
  'DJ Fogo',
  'Queen B',
];


const GIFT_POOL = ['🎁', '💎', '🔥', '👑', '💖', '⭐'];

function isVideo(item: LiveTrack | null): boolean {
  if (!item) return false;

  const url = String(item.stream_url || '').toLowerCase();

  return (
    url.endsWith('.mp4') ||
    url.endsWith('.mov') ||
    url.endsWith('.webm') ||
    url.includes('.mp4?') ||
    url.includes('.mov?') ||
    url.includes('.webm?')
  );
}

export default function LivePage({ onNavigate }: LivePageProps) {
  const [items, setItems] = useState<LiveTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<{ user: string; message: string }[]>(
  DEFAULT_COMMENTS.map((message, index) => ({
    user: COMMENT_USERS[index % COMMENT_USERS.length],
    message,
  }))
);
  const [floatingGifts, setFloatingGifts] = useState<FloatingGift[]>([]);
  const [bigHeartId, setBigHeartId] = useState<string | null>(null);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    void loadLives();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;

        entries.forEach((entry) => {
          const indexAttr = entry.target.getAttribute('data-index');
          const index = indexAttr ? Number(indexAttr) : -1;

          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        });

        if (bestIndex >= 0) {
          setActiveIndex(bestIndex);
          setIsPlaying(true);
        }
      },
      { threshold: [0.5, 0.7, 0.9] }
    );

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    if (!items.length) return;

    items.forEach((item, index) => {
      const video = videoRefs.current[index];
      const audio = audioRefs.current[index];
      const videoMode = isVideo(item);

      if (index === activeIndex && isPlaying) {
        if (videoMode && video) {
          video.muted = isMuted;
          video
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        } else if (!videoMode && audio) {
          audio.muted = isMuted;
          audio
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      } else {
        video?.pause();
        audio?.pause();
      }
    });
  }, [activeIndex, items, isMuted, isPlaying]);

  useEffect(() => {
    if (!items.length) return;

    const liveId = items[activeIndex]?.id;
    if (!liveId) return;

    setComments(DEFAULT_COMMENTS);

    const channel = supabase
      .channel(`live-comments-${liveId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_comments',
          filter: `live_id=eq.${liveId}`,
        },
        (payload) => {
          const newMessage =
            typeof payload.new.message === 'string'
              ? payload.new.message
              : 'Novo comentário';

          setComments((prev) => [newMessage, ...prev].slice(0, 6));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeIndex, items]);

  useEffect(() => {
  if (!items.length) return;

  const interval = window.setInterval(() => {
    const activeLive = items[activeIndex];
    if (!activeLive) return;

    const chance = Math.random();

    if (chance > 0.35) {
      spawnAutoGift();
    }
  }, 3200);

  return () => {
    window.clearInterval(interval);
  };
}, [items, activeIndex]);

  async function loadLives() {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('lives')
        .select('*')
        .eq('is_live', true)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar lives:', error);
        setItems([]);
        return;
      }

      const safeItems = (data || []) as LiveTrack[];
      setItems(safeItems);

      const likesMap: Record<string, number> = {};
      safeItems.forEach((item) => {
        likesMap[item.id] = 0;
      });
      setLikes(likesMap);
    } catch (error) {
      console.error('Erro inesperado ao carregar lives:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleMute() {
    setIsMuted((prev) => !prev);
  }

  function togglePlayCurrent() {
    const item = items[activeIndex];
    if (!item) return;

    const videoMode = isVideo(item);
    const video = videoRefs.current[activeIndex];
    const audio = audioRefs.current[activeIndex];

    if (isPlaying) {
      if (videoMode) video?.pause();
      else audio?.pause();
      setIsPlaying(false);
      return;
    }

    if (videoMode) {
      video
        ?.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio
        ?.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }

  function addLike(liveId: string) {
    setLikes((prev) => ({
      ...prev,
      [liveId]: (prev[liveId] || 0) + 1,
    }));
  }

  function handleDoubleTapLike(item: LiveTrack) {
  addLike(item.id);
  setBigHeartId(item.id);

  window.setTimeout(() => {
    setBigHeartId((prev) => (prev === item.id ? null : prev));
  }, 900);
}

  function sendVisualGift() {
    const gift: FloatingGift = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      emoji: GIFT_POOL[Math.floor(Math.random() * GIFT_POOL.length)],
      left: 70 + Math.random() * 15,
      size: 26 + Math.random() * 18,
      duration: 2.8 + Math.random() * 1.4,
    };

    setFloatingGifts((prev) => [...prev, gift]);

    window.setTimeout(() => {
      setFloatingGifts((prev) => prev.filter((g) => g.id !== gift.id));
    }, gift.duration * 1000);
  }

  function spawnAutoGift() {
  const gift: FloatingGift = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    emoji: GIFT_POOL[Math.floor(Math.random() * GIFT_POOL.length)],
    left: 72 + Math.random() * 12,
    size: 24 + Math.random() * 16,
    duration: 2.6 + Math.random() * 1.2,
  };

  setFloatingGifts((prev) => [...prev, gift]);

  window.setTimeout(() => {
    setFloatingGifts((prev) => prev.filter((g) => g.id !== gift.id));
  }, gift.duration * 1000);
}

  async function handleShare(item: LiveTrack) {
    const text = `${item.title} — ${item.artist_name || 'Artist'} está ao vivo no TopMusic`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text,
          url: window.location.href,
        });
      } catch {
        return;
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Link copiado!');
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Loading live...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        No live content yet
      </div>
    );
  }

  return (
    <div className="h-screen w-full snap-y snap-mandatory overflow-y-auto bg-black text-white">
      {items.map((item, index) => {
        const videoMode = isVideo(item);
        const artistName = item.artist_name || 'Artist';
        const viewers = (item.viewers_count || 0) + 120 + index * 7;

        return (
          <div
            key={item.id}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            data-index={index}
            className="relative min-h-screen w-full snap-start overflow-hidden"
          >
            <div className="absolute inset-0 bg-black" />

            {videoMode ? (
             <video
  ref={(el) => {
    videoRefs.current[index] = el;
  }}
  src={item.stream_url}
  className="absolute inset-0 h-full w-full object-cover"
  muted={isMuted}
  loop
  playsInline
  preload="auto"
  onDoubleClick={() => handleDoubleTapLike(item)}
/>
            ) : item.cover_url ? (
              <img
                src={item.cover_url}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-red-700/30 via-purple-700/30 to-black" />
            )}

            {!videoMode && (
              <audio
                ref={(el) => {
                  audioRefs.current[index] = el;
                }}
                src={item.stream_url}
                preload="auto"
                loop
              />
            )}

            <div className="absolute inset-0 bg-black/35" />
            <video
  ref={(el) => {
    videoRefs.current[index] = el;
  }}
  src={item.stream_url}
  className="absolute inset-0 h-full w-full object-cover"
  muted={isMuted}
  loop
  playsInline
  preload="auto"
  onDoubleClick={() => handleDoubleTapLike(item)}
/>
            <div className="absolute inset-0 bg-black/30" />
<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
<div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/10" />

            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
              <span>LIVE</span>
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            </div>

            <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-xs text-white backdrop-blur-sm">
              <Eye className="h-4 w-4" />
              <span>{viewers.toLocaleString()}</span>
            </div>

            <div className="absolute bottom-8 left-4 z-20 max-w-md">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  {videoMode ? 'VIDEO LIVE' : 'AUDIO LIVE'}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white">{artistName}</h2>
              <h3 className="mt-1 text-3xl font-black text-white">{item.title}</h3>

              <p className="mt-3 max-w-sm text-sm text-gray-200">
                Ao vivo agora. Entra, acompanha, reage e apoia o artista em tempo real.
              </p>

              <div className="mt-4 space-y-2">
                {comments.map((comment, i) => (
                  <div
                    key={`${item.id}-${comment}-${i}`}
                    className="animate-fade-in w-fit rounded-full bg-black/35 px-3 py-2 text-sm text-white backdrop-blur-sm"
                  >
                    {comment}
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-24 right-4 z-20 flex flex-col items-center gap-5">
              <button
                onClick={() => addLike(item.id)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition hover:scale-110"
              >
                <Heart className="h-5 w-5 text-white" />
              </button>
              <span className="text-xs font-bold text-white">
                {(likes[item.id] || 0).toLocaleString()}
              </span>

              <button
                onClick={togglePlayCurrent}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition hover:scale-110"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 text-white" fill="currentColor" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition hover:scale-110"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </button>

              <button
                onClick={() => {
                  sendVisualGift();
                  onNavigate?.('sendGift', {
                    artistId: item.artist_id,
                    artistName,
                  });
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-red-600 shadow-2xl shadow-pink-500/30 transition hover:scale-110 animate-pulse"
              >
                <Gift className="h-6 w-6 text-white" />
              </button>

              <button
                onClick={() =>
                  onNavigate?.('artist', {
                    artistId: item.artist_id,
                  })
                }
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition hover:scale-110"
              >
                <User className="h-5 w-5 text-white" />
              </button>

              <button
                onClick={() => handleShare(item)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition hover:scale-110"
              >
                <Share2 className="h-5 w-5 text-white" />
              </button>
            </div>

            {index === activeIndex &&
              floatingGifts.map((gift) => (
                <div
                  key={gift.id}
                  className="pointer-events-none absolute bottom-28 z-30 select-none"
                  style={{
                    left: `${gift.left}%`,
                    fontSize: `${gift.size}px`,
                    animation: `giftFloatLive ${gift.duration}s ease-out forwards`,
                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.45))',
                  }}
                >
                  {gift.emoji}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
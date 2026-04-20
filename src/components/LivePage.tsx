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
import { getUserId } from '../utils/userId';
import { addCoinsToWallet, sendGiftToArtist } from '../lib/walletService';
import GiftSelector from './GiftSelector';

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

interface FloatingHeart {
  id: number;
  left: number;
  size: number;
  duration: number;
}

interface LiveComment {
  user: string;
  message: string;
}

interface TopFan {
  name: string;
  xp: number;
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

function buildDefaultComments(): LiveComment[] {
  return DEFAULT_COMMENTS.map((message, index) => ({
    user: COMMENT_USERS[index % COMMENT_USERS.length],
    message,
  }));
}

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

function getFanBadge(xp: number) {
  if (xp > 200) return '👑 VIP';
  if (xp > 100) return '🔥 Pro';
  if (xp > 50) return '⭐ Active';
  return '🎧 New';
}

export default function LivePage({ onNavigate }: LivePageProps) {
  const [items, setItems] = useState<LiveTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedLives, setLikedLives] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<LiveComment[]>(buildDefaultComments());
  const [floatingGifts, setFloatingGifts] = useState<FloatingGift[]>([]);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [bigHeartId, setBigHeartId] = useState<string | null>(null);
  const [showGiftSelector, setShowGiftSelector] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [fanXp, setFanXp] = useState(0);
  const [fanCoins, setFanCoins] = useState(0);
  const [topFans, setTopFans] = useState<TopFan[]>([
    { name: 'Você', xp: 0 },
    { name: 'Rita S', xp: 120 },
    { name: 'Mário V', xp: 98 },
    { name: 'Dino Live', xp: 85 },
  ]);

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
          video.play().catch(() => setIsPlaying(false));
        } else if (!videoMode && audio) {
          audio.muted = isMuted;
          audio.play().catch(() => setIsPlaying(false));
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

    setComments(buildDefaultComments());

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

          const randomUser =
            COMMENT_USERS[Math.floor(Math.random() * COMMENT_USERS.length)];

          setComments((prev) =>
            [{ user: randomUser, message: newMessage }, ...prev].slice(0, 6)
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeIndex, items]);

  useEffect(() => {
    if (!items.length) return;

    const liveId = items[activeIndex]?.id;
    if (!liveId) return;

    async function loadRanking() {
      const { data, error } = await supabase
        .from('live_fan_scores')
        .select('*')
        .eq('live_id', liveId)
        .order('xp', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Erro ao carregar ranking:', error);
        return;
      }

      if (data) {
        setTopFans(
          data.map((fan) => ({
            name: fan.user_id === getUserId() ? 'Você' : String(fan.user_id).slice(0, 6),
            xp: fan.xp,
          }))
        );
      }
    }

    void loadRanking();
  }, [activeIndex, items, fanXp]);

  useEffect(() => {
    if (!items.length) return;

    const interval = window.setInterval(() => {
      const activeLive = items[activeIndex];
      if (!activeLive) return;

      if (Math.random() > 0.35) {
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

  function rewardFan(action: 'like' | 'comment' | 'gift') {
    let xpGain = 0;
    let coinGain = 0;

    if (action === 'like') {
      xpGain = 1;
    }

    if (action === 'comment') {
      xpGain = 2;
      coinGain = 1;
    }

    if (action === 'gift') {
      xpGain = 8;
      coinGain = 2;
    }

    const userId = getUserId();

    setFanXp((prevXp) => {
      const nextXp = prevXp + xpGain;

      setTopFans((prevFans) => {
        const updatedFans = prevFans.some((fan) => fan.name === 'Você')
          ? prevFans.map((fan) =>
              fan.name === 'Você' ? { ...fan, xp: nextXp } : fan
            )
          : [...prevFans, { name: 'Você', xp: nextXp }];

        return [...updatedFans].sort((a, b) => b.xp - a.xp);
      });

      return nextXp;
    });

    setFanCoins((prevCoins) => prevCoins + coinGain);

    if (coinGain > 0) {
      void addCoinsToWallet(userId, coinGain);
    }
  }

  async function sendComment() {
    if (!newComment.trim()) return;

    const message = newComment.trim();
    const liveId = items[activeIndex]?.id;
    if (!liveId) return;

    setComments((prev) => [{ user: 'Você', message }, ...prev].slice(0, 6));
    setNewComment('');
    rewardFan('comment');

    try {
      await supabase.from('live_comments').insert({
        live_id: liveId,
        message,
      });
    } catch (err) {
      console.error('Erro ao enviar comentário', err);
    }
  }

  async function rewardTopFans() {
    const liveId = items[activeIndex]?.id;
    if (!liveId) return;

    const { data } = await supabase
      .from('live_fan_scores')
      .select('*')
      .eq('live_id', liveId)
      .order('xp', { ascending: false })
      .limit(3);

    if (!data) return;

    const rewards = [20, 10, 5];

    for (let i = 0; i < data.length; i++) {
      const fan = data[i];
      const reward = rewards[i];
      await addCoinsToWallet(fan.user_id, reward);
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
      video?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      audio?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }

  function spawnFloatingHeart() {
    const heart: FloatingHeart = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      left: 84 + Math.random() * 6,
      size: 20 + Math.random() * 20,
      duration: 1.8 + Math.random() * 0.8,
    };

    setFloatingHearts((prev) => [...prev, heart]);

    window.setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== heart.id));
    }, heart.duration * 1000);
  }

  function addLike(liveId: string) {
    setLikes((prev) => ({
      ...prev,
      [liveId]: (prev[liveId] || 0) + 1,
    }));

    rewardFan('like');
    spawnFloatingHeart();

    setLikedLives((prev) => ({
      ...prev,
      [liveId]: true,
    }));

    window.setTimeout(() => {
      setLikedLives((prev) => ({
        ...prev,
        [liveId]: false,
      }));
    }, 700);
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
    const text = `${item.artist_name || 'Artist'} está ao vivo no TopMusic`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.artist_name || 'TopMusic Live',
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
        const artistHandle = `@${artistName.toLowerCase().replace(/\s+/g, '')}`;
        const viewers = (item.viewers_count || 0) + 120 + index * 7;
        const estimatedUsd = (fanCoins / 100).toFixed(2);

        return (
          <div
            key={item.id}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            data-index={index}
            className="relative min-h-screen w-full snap-start overflow-hidden"
          >
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
                alt={artistName}
                className="absolute inset-0 h-full w-full object-cover"
                onDoubleClick={() => handleDoubleTapLike(item)}
              />
            ) : (
              <div
                className="absolute inset-0 bg-gradient-to-br from-red-700/30 via-purple-700/30 to-black"
                onDoubleClick={() => handleDoubleTapLike(item)}
              />
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

            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/28 via-transparent to-black/5" />

            <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-2 py-1.5 text-white shadow-lg backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-xs font-bold text-white">
                {artistName.slice(0, 2).toUpperCase()}
              </div>

              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white">{artistName}</span>
                  <span className="rounded-full bg-red-600/90 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                    LIVE
                  </span>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                </div>

                <div className="text-[10px] text-white/60">{artistHandle}</div>
              </div>
            </div>

            <div className="absolute right-3 top-3 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
              <Eye className="h-4 w-4 text-white/90" />
              <span className="tracking-wide">{viewers.toLocaleString()}</span>
            </div>

            <div className="absolute left-2 sm:left-5 top-[100px] sm:top-[120px] z-20 w-[85%] sm:max-w-lg">
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-300">
                  Seu XP: {fanXp} ({getFanBadge(fanXp)})
                </span>
                <span className="rounded-full border border-pink-400/20 bg-pink-500/10 px-3 py-1 text-xs font-bold text-pink-200">
                  Coins: {fanCoins}
                </span>
                <span className="rounded-full border border-green-400/20 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">
                  USD: ${estimatedUsd}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur-md">
                <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-white/70">
                  Top Fans
                </div>

                <div className="space-y-2">
                  {topFans.map((fan, i) => (
                    <div
                      key={`${fan.name}-${i}`}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm text-white"
                    >
                      <span>
                        {i + 1}. {fan.name}
                      </span>
                      <span className="font-bold text-yellow-300">{fan.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {comments.map((comment, i) => (
                  <div
                    key={`${item.id}-${comment.user}-${comment.message}-${i}`}
                    className="animate-fade-in w-fit max-w-[320px] rounded-2xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white shadow-lg backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">{comment.user}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    </div>
                    <div className="mt-1 text-white/85">{comment.message}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-24 right-4 z-20 flex flex-col items-center gap-4 rounded-full bg-black/10 px-1.5 py-2 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => addLike(item.id)}
                  className={`flex h-14 w-14 items-center justify-center rounded-full border border-white/10 shadow-lg backdrop-blur-md transition hover:scale-110 ${
                    likedLives[item.id] ? 'bg-pink-500/30' : 'bg-white/15'
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 transition ${
                      likedLives[item.id]
                        ? 'fill-pink-500 text-pink-500 scale-110'
                        : 'text-white'
                    }`}
                  />
                </button>
                <span className="text-xs font-bold text-white">
                  {(likes[item.id] || 0).toLocaleString()}
                </span>
              </div>

              <button
                onClick={togglePlayCurrent}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/15 shadow-lg backdrop-blur-md transition hover:scale-110"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 text-white" fill="currentColor" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/15 shadow-lg backdrop-blur-md transition hover:scale-110"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </button>

              <button
               onClick={() => setShowGiftSelector(true)}

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
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/15 shadow-lg backdrop-blur-md transition hover:scale-110"
              >
                <User className="h-5 w-5 text-white" />
              </button>

              <button
                onClick={() => handleShare(item)}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/15 shadow-lg backdrop-blur-md transition hover:scale-110"
              >
                <Share2 className="h-5 w-5 text-white" />
              </button>
            </div>

            {bigHeartId === item.id && (
              <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
                <div className="animate-[heartPop_0.9s_ease-out_forwards] text-[110px] drop-shadow-[0_0_30px_rgba(255,80,120,0.55)]">
                  ❤️
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 z-40 flex items-center gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void sendComment();
                }}
                placeholder="Escreve um comentário..."
                className="flex-1 rounded-full bg-black/60 px-4 py-3 text-sm text-white outline-none backdrop-blur-md placeholder:text-white/60"
              />

              <button
                onClick={() => void sendComment()}
                className="rounded-full bg-pink-500 px-4 py-2 text-sm font-bold text-white"
              >
                Enviar
              </button>
            </div>

            {index === activeIndex && (
              <>
                {floatingGifts.map((gift) => (
                  <div
                    key={gift.id}
                    className="pointer-events-none absolute bottom-28 z-30 select-none"
                    style={{
                      left: `${gift.left}%`,
                      fontSize: `${gift.size}px`,
                      animation: `giftFloatLive ${gift.duration}s ease-out forwards`,
                    }}
                  >
                    {gift.emoji}
                  </div>
                ))}

                {floatingHearts.map((heart) => (
                  <div
                    key={heart.id}
                    className="pointer-events-none absolute bottom-28 z-30 select-none"
                    style={{
                      left: `${heart.left}%`,
                      fontSize: `${heart.size}px`,
                      animation: `heartFloatLive ${heart.duration}s ease-out forwards`,
                      filter: 'drop-shadow(0 0 10px rgba(255,80,120,0.5))',
                    }}
                  >
                    ❤️
                  </div>
                ))}
              </>
            )}
            {showGiftSelector && index === activeIndex && (
  <GiftSelector
    toArtistId={item.artist_id}
    onClose={() => setShowGiftSelector(false)}
    onBuyCoins={() => {
      setShowGiftSelector(false);
      onNavigate?.('wallet');
    }}
  />
)}
          </div>
        );
      })}
    </div>
  );
}
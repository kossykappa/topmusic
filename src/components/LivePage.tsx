import { useEffect, useRef, useState } from 'react';
import { Eye, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';
import { addCoinsToWallet } from '../lib/walletService';
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

export default function LivePage({ onNavigate }: LivePageProps) {
  const [items, setItems] = useState<LiveTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedLives, setLikedLives] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<LiveComment[]>(buildDefaultComments());
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [bigHeartId, setBigHeartId] = useState<string | null>(null);
  const [showGiftSelector, setShowGiftSelector] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [fanXp, setFanXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [sending, setSending] = useState(false);

  const userId = getUserId();

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
    async function loadCoins() {
      const { data } = await supabase
        .from('user_coin_wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      setCoins(data?.balance || 0);
    }

    void loadCoins();
  }, [userId]);

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

    if (action === 'like') xpGain = 1;

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

  async function quickGift(amount: number, artistId: string) {
    if (amount > coins) {
      alert('Sem coins suficientes');
      onNavigate?.('buyCoins');
      return;
    }

    setSending(true);

    const { error } = await supabase.rpc('send_artist_gift', {
      p_fan_user_id: userId,
      p_artist_id: artistId,
      p_track_id: null,
      p_coins: amount,
      p_message: null,
    });

    if (error) {
      alert('Erro: ' + error.message);
      setSending(false);
      return;
    }

    setCoins((prev) => prev - amount);
    rewardFan('gift');
    setSending(false);
  }

  function spawnFloatingHeart() {
    const heart: FloatingHeart = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      left: 82 + Math.random() * 10,
      size: 22 + Math.random() * 18,
      duration: 1.5 + Math.random() * 0.8,
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
    }, 850);
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
        const viewers = (item.viewers_count || 0) + 120 + index * 7;

        return (
          <div
            key={item.id}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            data-index={index}
            className="relative min-h-screen w-full snap-start overflow-hidden bg-black"
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
                className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black"
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

            <div className="absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            <div className="absolute left-3 right-3 top-3 z-30 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-purple-600">
                  <div className="flex h-full w-full items-center justify-center text-xs font-black text-white">
                    {artistName.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="max-w-[130px] truncate text-base font-black text-white drop-shadow">
                    {artistName}
                  </div>

                  <div className="text-xs font-semibold text-white/85 drop-shadow">
                    ❤️ {viewers.toLocaleString()}
                  </div>
                </div>

                <button className="ml-1 rounded-full bg-pink-500 px-4 py-2 text-sm font-black text-white shadow-lg">
                  + Seguir
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full bg-black/35 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                  <Eye className="h-3.5 w-3.5" />
                  {viewers.toLocaleString()}
                </div>

                <button
                  onClick={() => onNavigate?.('feed')}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-xl font-bold text-white backdrop-blur-md"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="absolute left-3 top-16 z-30 rounded-full bg-black/35 px-3 py-1.5 text-xs font-bold text-white/95 backdrop-blur-md">
              🔥 Classificação Diária
            </div>

            <div className="absolute bottom-20 left-3 z-30 w-[78%] max-w-md space-y-1">
              {comments.slice(0, 4).map((comment, i) => (
                <div
                  key={`${item.id}-${comment.user}-${comment.message}-${i}`}
                  className="w-fit max-w-[330px] rounded-xl bg-transparent px-1 py-0.5 text-base text-white drop-shadow"
                >
                  <span className="font-bold text-white/75">
                    {comment.user}
                  </span>{' '}
                  <span className="font-semibold text-white">
                    {comment.message}
                  </span>
                </div>
              ))}
            </div>

            <div className="absolute bottom-4 left-3 right-3 z-40 flex items-center gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void sendComment();
                }}
                placeholder="Escreve..."
                className="min-w-0 flex-1 rounded-full bg-black/35 px-4 py-3 text-base text-white outline-none backdrop-blur-md placeholder:text-white/70"
              />

              <button
                onClick={() => setShowGiftSelector(true)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/35 text-xl backdrop-blur-md"
              >
                🎁
              </button>

              <button
                onClick={() => addLike(item.id)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/35 text-xl backdrop-blur-md"
              >
                ❤️
              </button>

              <button
                onClick={() => void handleShare(item)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/35 text-xl backdrop-blur-md"
              >
                ↗
              </button>
            </div>

            {showGiftSelector && (
              <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/35 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-3xl bg-black/90 p-4 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black">Enviar presente</h3>
                      <p className="text-xs text-white/60">
                        Saldo: {coins} coins
                      </p>
                    </div>

                    <button
                      onClick={() => setShowGiftSelector(false)}
                      className="rounded-full bg-white/10 p-2"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <GiftSelector
                    onSelect={(gift) => {
                      void quickGift(gift.cost, item.artist_id);
                      setShowGiftSelector(false);
                    }}
                  />

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[5, 10, 25].map((amount) => (
                      <button
                        key={amount}
                        disabled={sending}
                        onClick={() => void quickGift(amount, item.artist_id)}
                        className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-50"
                      >
                        🎁 {amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {floatingHearts.map((heart) => (
              <div
                key={heart.id}
                className="pointer-events-none absolute bottom-28 z-40 animate-ping text-red-500"
                style={{
                  left: `${heart.left}%`,
                  fontSize: heart.size,
                  animationDuration: `${heart.duration}s`,
                }}
              >
                ❤️
              </div>
            ))}

            {bigHeartId === item.id && (
              <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
                <div className="animate-bounce text-8xl drop-shadow-2xl">
                  ❤️
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
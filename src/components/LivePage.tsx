import { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';
import { addCoinsToWallet } from '../lib/walletService';
import { useTranslation } from 'react-i18next';
import GiftPanel from '../components/GiftPanel';
import GiftAnimationLayer, {
  ActiveGiftAnimation,
} from '../components/GiftAnimationLayer';
import { Gift } from '../data/gifts';
import LiveCoinsRecharge from '../components/LiveCoinsRecharge';

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
  'liveComment1',
  'liveComment2',
  'liveComment3',
  'liveComment4',
];

const COMMENT_USERS = [
  'Rita S',
  'Mário V',
  'Dino Live',
  'Carlos M',
  'Ana K',
  'Top Fan',
  'Lima Beats',
  'DJ Fogo',
];

function buildDefaultComments(
  t: (key: string) => string
): LiveComment[] {
  return DEFAULT_COMMENTS.map((message, index) => ({
    user: COMMENT_USERS[index % COMMENT_USERS.length],
    message: t(message),
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
  const [comments, setComments] =
  function buildDefaultComments(
  t: (key: string) => string
): LiveComment[] {
  return DEFAULT_COMMENTS.map((message, index) => ({
    user: COMMENT_USERS[index % COMMENT_USERS.length],
    message: t(message),
  }));
}
  const userId = getUserId();

  const [items, setItems] = useState<LiveTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedLives, setLikedLives] = useState<Record<string, boolean>>({});
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [bigHeartId, setBigHeartId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [fanXp, setFanXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [followedArtists, setFollowedArtists] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [giftPanelOpen, setGiftPanelOpen] = useState(false);
  const [giftAnimations, setGiftAnimations] = useState<ActiveGiftAnimation[]>([]);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  const [topFans, setTopFans] = useState<TopFan[]>([
   { name: t('you'), xp: 0 },
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

      setCoins(data?.balance || 33);
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

    setComments(buildDefaultComments(t));

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
          const message =
            typeof payload.new.message === 'string'
              ? payload.new.message
              : t('newComment');

          const randomUser =
            COMMENT_USERS[Math.floor(Math.random() * COMMENT_USERS.length)];

          setComments((prev) =>
            [{ user: randomUser, message }, ...prev].slice(0, 6)
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
        console.error(t('errorLoadingRanking'), error);
        return;
      }

      if (data) {
        setTopFans(
          data.map((fan) => ({
            name:
  fan.user_id === getUserId()
    ? t('you')
    : String(fan.user_id).slice(0, 6),
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
        console.error(t('errorLoadingLives'), error);
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
      console.error(t('unexpectedLiveLoadingError'), error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function openArtistProfile(item: LiveTrack) {
  onNavigate?.('artist', {
    artistId: item.artist_id,
    artistName: item.artist_name || t('artist'),
    artistAvatar: item.cover_url || '',
    liveData: item,
  });
}

  function toggleFollowArtist(artistId: string) {
    setFollowedArtists((prev) => ({
      ...prev,
      [artistId]: !prev[artistId],
    }));
  }

  function handleRechargeCoins(amount: number) {
    setCoins((prev) => prev + amount);
    setRechargeOpen(false);

    void addCoinsToWallet(userId, amount);
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

    setFanXp((prevXp) => {
      const nextXp = prevXp + xpGain;

      setTopFans((prevFans) => {
        const updatedFans = prevFans.some((fan) => fan.name === 'Você')
          ? prevFans.map((fan) =>
              fan.name === 'Você' ? { ...fan, xp: nextXp } : fan
            )
          : [...prevFans, { name: t('you'), xp: nextXp }];

        return [...updatedFans].sort((a, b) => b.xp - a.xp);
      });

      return nextXp;
    });

    if (coinGain > 0) {
      void addCoinsToWallet(userId, coinGain);
    }
  }

  async function handleSendGift(gift: Gift) {
    const activeLive = items[activeIndex];

    if (!activeLive) return;

    if (gift.price > coins) {
      setGiftPanelOpen(false);
      setRechargeOpen(true);
      return;
    }

    setSending(true);

    setCoins((prev) => prev - gift.price);
    setGiftPanelOpen(false);

    setGiftAnimations((prev) => [
      ...prev,
      {
        id: Date.now(),
        senderName: t('you'),
        gift,
        quantity: 1,
      },
    ]);

    rewardFan('gift');

    const { error } = await supabase.rpc('send_artist_gift', {
      p_fan_user_id: userId,
      p_artist_id: activeLive.artist_id,
      p_track_id: null,
      p_coins: gift.price,
      p_message: gift.name,
    });

    if (error) {
      console.error(t('giftSendError'), error);
    }

    setSending(false);
  }

  async function sendComment() {
    if (!newComment.trim()) return;

    const message = newComment.trim();
    const liveId = items[activeIndex]?.id;
    if (!liveId) return;

    setComments((prev) => [
  { user: t('you'), message },
  ...prev,
].slice(0, 6));
    setNewComment('');
    rewardFan('comment');

    try {
      await supabase.from('live_comments').insert({
        live_id: liveId,
        message,
      });
    } catch (err) {
      console.error(t('commentSendError'), err);
    }
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
    const text = t('artistLiveNow', {
  artist: item.artist_name || t('artist'),
});

    if (navigator.share) {
      try {
        await navigator.share({
         title:
 item.artist_name || t('topMusicLive'),
          text,
          url: window.location.href,
        });
      } catch {
        return;
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert(t('linkCopied'));
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        {t('loadingLive')}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        {t('noLiveContentYet')}
      </div>
    );
  }

  return (
    <div className="h-screen w-full snap-y snap-mandatory overflow-y-auto bg-black text-white">
      <GiftAnimationLayer
        animations={giftAnimations}
        onRemove={(id) =>
          setGiftAnimations((prev) => prev.filter((item) => item.id !== id))
        }
      />

      <GiftPanel
        open={giftPanelOpen}
        coins={coins}
        onClose={() => setGiftPanelOpen(false)}
        onBuyCoins={() => setRechargeOpen(true)}
        onSendGift={(gift) => void handleSendGift(gift)}
      />

      <LiveCoinsRecharge
        open={rechargeOpen}
        currentCoins={coins}
        onClose={() => setRechargeOpen(false)}
        onSelectPack={handleRechargeCoins}
      />

      {items.map((item, index) => {
        const videoMode = isVideo(item);
        const artistName = item.artist_name || t('artist');
        const viewers = (item.viewers_count || 0) + 120 + index * 7;
        const liveLikes = likes[item.id] || 0;

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

            <div className="absolute left-3 right-3 top-3 z-50 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  onClick={() => openArtistProfile(item)}
                  className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-purple-600"
                >
                  <div className="flex h-full w-full items-center justify-center text-xs font-black text-white">
                    {artistName.slice(0, 2).toUpperCase()}
                  </div>
                </button>

                <div className="min-w-0">
                  <button
                    onClick={() => openArtistProfile(item)}
                    className="block max-w-[130px] truncate text-left text-base font-black text-white drop-shadow"
                  >
                    {artistName}
                  </button>

                  <div className="text-xs font-semibold text-white/85 drop-shadow">
                    ❤️ {(viewers + liveLikes).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => toggleFollowArtist(item.artist_id)}
                  className={`ml-1 rounded-full px-4 py-2 text-sm font-black text-white shadow-lg ${
                    followedArtists[item.artist_id]
                      ? 'bg-white/25 backdrop-blur-md'
                      : 'bg-pink-500'
                  }`}
                >
                  {followedArtists[item.artist_id]
  ? t('following')
  : t('follow')}
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
              🔥 🔥 {t('dailyRanking')}
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
                placeholder={t('writeComment')}
                className="min-w-0 flex-1 rounded-full bg-black/35 px-4 py-3 text-base text-white outline-none backdrop-blur-md placeholder:text-white/70"
              />

              <button
                disabled={sending}
                onClick={() => setGiftPanelOpen(true)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/35 text-xl backdrop-blur-md disabled:opacity-50"
              >
                🎁
              </button>

              <button
                onClick={() => addLike(item.id)}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/35 text-xl backdrop-blur-md ${
                  likedLives[item.id] ? 'scale-110 bg-pink-500/80' : ''
                }`}
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
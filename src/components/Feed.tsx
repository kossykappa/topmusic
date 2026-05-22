import { useEffect, useState } from 'react';
import { Coins, Heart, MessageCircle, Music2, Play, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { getUserId } from '../utils/userId';
import { useTranslation } from 'react-i18next';

interface Track {
  id: string;
  title: string;
  artist_id: string;
  audio_url?: string | null;
  cover_url?: string | null;
  video_url?: string | null;
  media_type?: string | null;
  plays_count?: number | null;
  likes_count?: number | null;
  comments_count?: number | null;
  artists?: {
    id: string;
    name: string;
    country?: string | null;
    genre?: string | null;
    avatar_url?: string | null;
  } | null;
}

interface TrackComment {
  id: string;
  track_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

interface FeedProps {
  onNavigate?: (page: string, data?: unknown) => void;
}

export function Feed({ onNavigate }: FeedProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, TrackComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [perks, setPerks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [sendingGift, setSendingGift] = useState(false);
  const [openGiftMenu, setOpenGiftMenu] = useState<Record<string, boolean>>({});

  const { playTrack } = useMusicPlayer();
  const { t } = useTranslation();
  const userId = getUserId();

  useEffect(() => {
    void fetchTracks();
    void fetchCoins();
    void fetchPerks();
  }, []);

  async function fetchTracks() {
    setLoading(true);

    const { data, error } = await supabase
      .from('tracks')
      .select(`
        *,
        artists (
          id,
          name,
          country,
          genre,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      alert(`Erro ao carregar Feed: ${error.message}`);
      console.error(error);
      setTracks([]);
      setLoading(false);
      return;
    }

    const loadedTracks = (data || []) as Track[];
    console.log('TRACKS LOADED');
    console.log(loadedTracks);
    console.log(JSON.stringify(loadedTracks, null, 2));
    console.log('TOTAL:', loadedTracks.length);

    setTracks(loadedTracks);
    await fetchLikedTracks(loadedTracks);

    setLoading(false);
  }

  async function fetchLikedTracks(loadedTracks: Track[]) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLikedTracks({});
      return;
    }

    const ids = loadedTracks.map((track) => track.id);

    if (!ids.length) return;

    const { data } = await supabase
      .from('track_likes')
      .select('track_id')
      .eq('user_id', user.id)
      .in('track_id', ids);

    const map: Record<string, boolean> = {};

    (data || []).forEach((like) => {
      map[String(like.track_id)] = true;
    });

    setLikedTracks(map);
  }

  async function fetchComments(trackId: string) {
    const { data, error } = await supabase
      .from('track_comments')
      .select('*')
      .eq('track_id', trackId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erro ao carregar comentários:', error);
      return;
    }

    setComments((prev) => ({
      ...prev,
      [trackId]: (data || []) as TrackComment[],
    }));
  }

  async function toggleComments(trackId: string) {
    const nextOpen = !openComments[trackId];

    setOpenComments((prev) => ({
      ...prev,
      [trackId]: nextOpen,
    }));

    if (nextOpen && !comments[trackId]) {
      await fetchComments(trackId);
    }
  }

  async function sendComment(trackId: string) {
    const message = commentInputs[trackId]?.trim();

    if (!message) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      onNavigate?.('auth');
      return;
    }

    const { data, error } = await supabase
      .from('track_comments')
      .insert({
        track_id: trackId,
        user_id: user.id,
        comment: message,
      })
      .select('*')
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setCommentInputs((prev) => ({
      ...prev,
      [trackId]: '',
    }));

    setComments((prev) => ({
      ...prev,
      [trackId]: [data as TrackComment, ...(prev[trackId] || [])],
    }));

    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId
          ? {
            ...track,
            comments_count: (track.comments_count || 0) + 1,
          }
          : track
      )
    );
  }

  async function fetchCoins() {
    const { data, error } = await supabase
      .from('user_coin_wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar coins:', error);
      return;
    }

    setCoins(data?.balance || 0);
  }

  async function fetchPerks() {
    const { data, error } = await supabase
      .from('fan_perks')
      .select('*')
      .eq('fan_user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar perks:', error);
      return;
    }

    setPerks(data);
  }

  async function rewardView(trackId: string) {
    const track = tracks.find((item) => item.id === trackId);

    if (!track) return;

    const nextPlays = (track.plays_count || 0) + 1;

    setTracks((prev) =>
      prev.map((item) =>
        item.id === trackId
          ? {
            ...item,
            plays_count: nextPlays,
          }
          : item
      )
    );

    setCoins((prev) => prev + 1);

    const { error } = await supabase
      .from('tracks')
      .update({
        plays_count: nextPlays,
      })
      .eq('id', trackId);

    if (error) {
      console.error('Erro ao actualizar plays:', error);
    }
  }

  async function quickGift(amount: number, artistId: string) {
    if (sendingGift) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      onNavigate?.('auth');
      return;
    }

    if (amount > coins) {
      alert('Coins insuficientes.');
      onNavigate?.('buyCoins');
      return;
    }

    setSendingGift(true);

    const { error } = await supabase.rpc('send_artist_gift', {
      p_fan_user_id: user.id,
      p_artist_id: artistId,
      p_track_id: null,
      p_coins: amount,
      p_message: null,
    });

    if (error) {
      alert(`Erro ao enviar gift: ${error.message}`);
      setSendingGift(false);
      return;
    }

    setCoins((prev) => prev - amount);
    alert(`🎁 Gift de ${amount} coins enviado!`);
    setSendingGift(false);
  }

  async function toggleLike(trackId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      onNavigate?.('auth');
      return;
    }

    const alreadyLiked = likedTracks[trackId];

    if (alreadyLiked) {
      const { error } = await supabase
        .from('track_likes')
        .delete()
        .eq('track_id', trackId)
        .eq('user_id', user.id);

      if (error) {
        alert(error.message);
        return;
      }

      setLikedTracks((prev) => ({
        ...prev,
        [trackId]: false,
      }));

      setTracks((prev) =>
        prev.map((track) =>
          track.id === trackId
            ? {
              ...track,
              likes_count: Math.max((track.likes_count || 0) - 1, 0),
            }
            : track
        )
      );

      return;
    }

    const { error } = await supabase.from('track_likes').upsert(
      {
        track_id: trackId,
        user_id: user.id,
      },
      {
        onConflict: 'track_id,user_id',
      }
    );

    if (error) {
      alert(error.message);
      return;
    }

    setLikedTracks((prev) => ({
      ...prev,
      [trackId]: true,
    }));

    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId
          ? {
            ...track,
            likes_count: (track.likes_count || 0) + 1,
          }
          : track
      )
    );
  }

  const playerTracks = tracks.map((track) => ({
    id: track.id,
    title: track.title,
    artist_id: track.artist_id,
    artist_name: track.artists?.name || 'TopMusic Artist',
    audio_url: track.audio_url || '',
    video_url: track.video_url || undefined,
    cover_url: track.cover_url || '',
    media_type: track.media_type || undefined,
  }));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        A carregar músicas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        {perks && (
          <div className="mb-6 rounded-xl bg-white/5 p-4 text-sm text-gray-300">
            <p className="mb-2 font-bold">Os teus benefícios:</p>
            {perks.can_message_artist && <p>💬 Pode enviar mensagem</p>}
            {perks.priority_support && <p>⚡ Prioridade</p>}
            {perks.profile_highlight && <p>🌟 Destaque</p>}
            {perks.exclusive_badge && <p>👑 Badge exclusivo</p>}
          </div>
        )}

        <div className="mb-10">
          <h1 className="text-4xl font-black md:text-5xl">
            TopMusic{' '}
            <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
              Feed
            </span>
          </h1>

          <p className="mt-3 text-gray-400">
            Música global, artistas reais e monetização justa.
          </p>
        </div>

        {tracks.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-gray-400">
            Ainda não há músicas publicadas.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="min-h-[calc(100vh-120px)] snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 hover:bg-white/10 md:min-h-0 md:hover:scale-[1.02]"
              >
                <div className="relative h-[300px] bg-gray-900">
                  {track.video_url ? (
                    <video
                      src={track.video_url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                      loop
                    />
                  ) : track.cover_url ? (
                    <img
                      src={track.cover_url}
                      alt={track.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Music2 className="h-12 w-12 text-white/30" />
                    </div>
                  )}

                  <div className="absolute bottom-6 right-4 z-20 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-sm text-yellow-400">
                      <Coins className="h-4 w-4" />
                      {coins}
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenGiftMenu((prev) => ({
                            ...prev,
                            [track.id]: !prev[track.id],
                          }))
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-yellow-300 backdrop-blur-md transition hover:scale-110 hover:bg-yellow-500/20"
                      >
                        🎁
                      </button>

                      {openGiftMenu[track.id] && (
                        <div className="absolute bottom-14 right-0 flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/95 p-3 shadow-2xl backdrop-blur-xl">
                          {[10, 50, 100].map((amount) => (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => {
                                void quickGift(amount, track.artist_id);

                                setOpenGiftMenu((prev) => ({
                                  ...prev,
                                  [track.id]: false,
                                }));
                              }}
                              disabled={sendingGift}
                              className="rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-4 py-2 text-sm font-bold text-white transition hover:scale-105 disabled:opacity-50"
                            >
                              🎁 {amount}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await rewardView(track.id);

                      playTrack(
                        {
                          id: track.id,
                          title: track.title,
                          artist_id: track.artist_id,
                          artist_name: track.artists?.name || 'TopMusic Artist',
                          audio_url: track.audio_url || '',
                          video_url: track.video_url || undefined,
                          cover_url: track.cover_url || '',
                          media_type: track.media_type || undefined,
                        },
                        playerTracks
                      );
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition hover:opacity-100"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/30 backdrop-blur">
                      <Play
                        className="ml-1 h-7 w-7 text-white transition hover:scale-110 hover:text-cyan-400"
                        fill="currentColor"
                      />
                    </div>
                  </button>
                </div>

                <div
  className="p-5"
  style={{
    background: '#111',
    minHeight: '200px',
    color: 'white'
  }}
>

                  <h3 className="text-xl font-bold">{track.title}</h3>

                  <button
                    onClick={() =>
                      onNavigate?.('artist', {
                        artistId: track.artist_id,
                        artistName: track.artists?.name,
                        artist: track.artists,
                      })
                    }
                    className="mt-1 text-sm text-red-400 hover:text-red-300"
                  >
                    {track.artists?.name || 'Ver artista'}
                  </button>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1 text-blue-300">
                      <Play className="h-5 w-5 text-white/80 transition hover:scale-110 hover:text-cyan-400" />
                      {(track.plays_count || 0).toLocaleString()}
                    </span>

                    <button
                      onClick={() => toggleLike(track.id)}
                      className="flex items-center gap-1 transition"
                    >
                      <Heart
                        className={`h-5 w-5 transition ${likedTracks[track.id]
                          ? 'fill-red-500 text-red-500 scale-110'
                          : 'text-white/70 hover:text-red-400'
                          }`}
                        fill={likedTracks[track.id] ? 'currentColor' : 'none'}
                      />
                      {(track.likes_count || 0).toLocaleString()}
                    </button>

                    <button
                      onClick={() => toggleComments(track.id)}
                      className="flex items-center gap-1 transition"
                    >
                      <MessageCircle
                        className={`h-5 w-5 transition ${openComments[track.id]
                          ? 'text-blue-400 scale-110'
                          : 'text-white/70 hover:text-blue-400'
                          }`}
                      />
                      {(track.comments_count || 0).toLocaleString()}
                    </button>
                  </div>

                  {openComments[track.id] && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3">
                      <div className="mb-3 flex gap-2">
                        <input
                          value={commentInputs[track.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [track.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              void sendComment(track.id);
                            }
                          }}
                          placeholder="Escreve um comentário..."
                          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-white/40"
                        />

                        <button
                          onClick={() => sendComment(track.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 transition hover:scale-105 hover:bg-red-700"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(comments[track.id] || []).length > 0 ? (
                          comments[track.id].map((item) => (
                            <div
                              key={item.id}
                              className="rounded-xl bg-white/5 px-4 py-3 text-sm"
                            >
                              <p className="text-white">{item.comment}</p>
                              <p className="mt-1 text-xs text-white/40">
                                {new Date(item.created_at).toLocaleString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-white/40">
                            Ainda não há comentários.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
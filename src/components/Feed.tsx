import { useEffect, useState } from 'react';
import { Coins, Heart, Music2, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { getUserId } from '../utils/userId';

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
  artists?: {
    id: string;
    name: string;
    country?: string | null;
    genre?: string | null;
    avatar_url?: string | null;
  } | null;
}

interface FeedProps {
  onNavigate?: (page: string, data?: unknown) => void;
}

export function Feed({ onNavigate }: FeedProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [perks, setPerks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [sendingGift, setSendingGift] = useState(false);

  const { playTrack } = useMusicPlayer();
  const userId = getUserId();

  useEffect(() => {
    fetchTracks();
    fetchCoins();
    fetchPerks();
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
      console.error('Erro ao carregar músicas:', error);
      setTracks([]);
    } else {
      setTracks((data || []) as Track[]);
    }

    setLoading(false);
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

  async function handleMessageArtist(artistId: string) {
  if (!canSendMessage()) {
    alert('🔥 Torna-te VIP');
    return;
  }

  const message = prompt('Escreve a tua mensagem');

  if (!message) return;

  const { error } = await supabase.rpc('send_message_paid', {
    p_fan_user_id: userId,
    p_artist_id: artistId,
    p_message: message,
    p_cost: 5, // preço por mensagem
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert('Mensagem enviada 🎉');
  fetchCoins();
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

  function canSendMessage() {
    return perks?.can_message_artist === true;
  }

  function handleMessageArtist(artistId: string) {
    if (!canSendMessage()) {
      alert('🔥 Torna-te VIP para enviar mensagens ao artista');
      return;
    }

    alert('Abrir chat com artista ' + artistId);
  }

  async function rewardView() {
    const { error } = await supabase.rpc('reward_user_coins', {
      p_user_id: userId,
      p_amount: 1,
      p_description: 'Visualização de música',
    });

    if (error) {
      console.error('Erro ao dar coins:', error);
      return;
    }

    setCoins((prev) => prev + 1);
  }

  async function quickGift(amount: number, artistId: string) {
    if (sendingGift) return;

    if (amount > coins) {
      alert('Coins insuficientes.');
      return;
    }

    setSendingGift(true);

    const { error } = await supabase.rpc('send_artist_gift', {
      p_fan_user_id: userId,
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
    const { data: existingLike } = await supabase
      .from('track_likes')
      .select('id')
      .eq('track_id', trackId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      await supabase.from('track_likes').delete().eq('id', existingLike.id);

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

    await supabase.from('track_likes').insert({
      track_id: trackId,
      user_id: userId,
    });

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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                <div className="relative aspect-video bg-gray-900">
                  {track.video_url ? (
                    <video
                      src={track.video_url || ''}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
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

                    {[10, 50, 100].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => quickGift(amount, track.artist_id)}
                        disabled={sendingGift}
                        className="rounded-full bg-pink-500 p-3 text-white shadow-lg transition hover:scale-110 disabled:opacity-50"
                      >
                        🎁 {amount}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={async () => {
                      await rewardView();

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
                        className="ml-1 h-7 w-7 text-white"
                        fill="currentColor"
                      />
                    </div>
                  </button>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold">{track.title}</h3>

                  <button
                    onClick={() =>
                      onNavigate?.('artist', { artistId: track.artist_id })
                    }
                    className="mt-1 text-sm text-red-400 hover:text-red-300"
                  >
                    {track.artists?.name || 'Ver artista'}
                  </button>

                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                    <button
                      onClick={() => handleMessageArtist(track.artist_id)}
                      className={`flex items-center gap-1 transition ${
                        canSendMessage() ? 'text-purple-400' : 'text-gray-500'
                      }`}
                    >
                      {canSendMessage() ? '💬 Mensagem' : '🔒 VIP'}
                    </button>

                    <span className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      {(track.plays_count || 0).toLocaleString()}
                    </span>

                    <button
                      onClick={() => toggleLike(track.id)}
                      className="flex items-center gap-1 transition hover:text-red-400"
                    >
                      <Heart className="h-4 w-4" />
                      {(track.likes_count || 0).toLocaleString()}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
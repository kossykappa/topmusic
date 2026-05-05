import { useEffect, useMemo, useState } from 'react';
import {
  UserPlus,
  UserCheck,
  Play,
  Users,
  Music2,
  Video,
  Heart,
  Gift,
  Radio,
  MapPin,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { getUserId } from '../utils/userId';
import { buyLicense } from '../services/licenses';

interface Artist {
  id: string;
  name: string;
  country?: string | null;
  genre?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  followers_count?: number | null;
}

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
  is_live_enabled?: boolean | null;
  created_at?: string;
  track_licenses?: {
    id: string;
    price: number;
    duration_type: string;
  }[];
}

interface ArtistPageProps {
  artistId: string;
  onNavigate?: (page: string, data?: unknown) => void;
}

const MESSAGE_COST = 1;

export default function ArtistPage({ artistId, onNavigate }: ArtistPageProps) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const { playTrack } = useMusicPlayer();

  useEffect(() => {
    void fetchArtistData();
  }, [artistId]);

  async function fetchArtistData() {
    setLoading(true);

    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();

    if (artistError || !artistData) {
      setArtist(null);
      setTracks([]);
      setLoading(false);
      return;
    }

    const { data: tracksData, error: tracksError } = await supabase
      .from('tracks')
      .select(`
        *,
        track_licenses (
          id,
          price,
          duration_type
        )
      `)
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    setTracks(tracksError ? [] : ((tracksData || []) as Track[]));
    setArtist(artistData as Artist);
    setLoading(false);
  }

  async function handleBuyLicense(track: Track) {
    const license = track.track_licenses?.[0];

    if (!license) {
      alert('Esta música ainda não tem licença definida pelo artista.');
      return;
    }

    const userId = getUserId();
    await buyLicense(userId, license.id);

    alert(`Licença comprada por €${license.price}. Já pode usar esta música em live.`);
  }

  function handleFollow() {
    setIsFollowing((prev) => !prev);
  }

  const artistName = artist?.name || 'Artist';

  const videoTracks = useMemo(
    () =>
      tracks.filter(
        (track) =>
          track.media_type?.toLowerCase() === 'video' &&
          (track.video_url || track.audio_url)
      ),
    [tracks]
  );

  const audioTracks = useMemo(
    () => tracks.filter((track) => track.media_type?.toLowerCase() !== 'video'),
    [tracks]
  );

  const totalPlays = useMemo(
    () => tracks.reduce((sum, track) => sum + (track.plays_count || 0), 0),
    [tracks]
  );

  const totalLikes = useMemo(
    () => tracks.reduce((sum, track) => sum + (track.likes_count || 0), 0),
    [tracks]
  );

  const artistHandle = `@${artistName.toLowerCase().replace(/\s+/g, '')}`;

  const playerTracks = tracks.map((track) => ({
    id: track.id,
    title: track.title,
    artist_name: artistName,
    audio_url: track.audio_url || '',
    video_url: track.video_url || undefined,
    cover_url: track.cover_url || '',
  }));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-xl text-white">A carregar artista...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <h2 className="text-2xl text-white">Artista não encontrado</h2>
          <button
            onClick={() => onNavigate?.('artists')}
            className="mt-4 rounded-full bg-white px-5 py-2 font-bold text-black"
          >
            Voltar aos artistas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-purple-600/10 to-pink-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-end">
            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-white/10 bg-gradient-to-br from-red-500/30 to-purple-500/30 shadow-2xl">
              {artist.avatar_url ? (
                <img
                  src={artist.avatar_url}
                  alt={artist.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Users className="h-20 w-20 text-white/50" />
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  <Radio className="h-3.5 w-3.5 text-red-400" />
                  <span>Perfil do Artista</span>
                </div>

                <h1 className="text-5xl font-black text-white md:text-6xl">
                  {artist.name}
                </h1>

                <p className="mt-2 text-sm text-gray-300">{artistHandle}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-300">
                  {artist.country && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                      <MapPin className="h-4 w-4" />
                      {artist.country}
                    </span>
                  )}

                  {artist.genre && (
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      {artist.genre}
                    </span>
                  )}
                </div>

                {artist.bio && (
                  <p className="mt-4 max-w-2xl text-gray-300">{artist.bio}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {tracks.length} lançamentos
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {videoTracks.length} vídeos
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {totalPlays.toLocaleString()} plays
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {totalLikes.toLocaleString()} likes
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {(artist.followers_count || 0).toLocaleString()} seguidores
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleFollow}
                  className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-all ${
                    isFollowing
                      ? 'border border-white/20 bg-white/20 text-white'
                      : 'bg-white text-black hover:scale-105'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-5 w-5" />
                      <span>A seguir</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      <span>Seguir</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    onNavigate?.('sendGift', {
                      artistId,
                      artistName,
                      artistHandle,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-red-600 px-6 py-3 font-bold text-white shadow-xl transition hover:scale-105"
                >
                  <Gift className="h-5 w-5" />
                  <span>Apoiar Artista</span>
                </button>

                <button
                  onClick={() =>
                    onNavigate?.('chat', {
                      artistId,
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-bold text-white shadow-xl transition hover:scale-105 hover:bg-purple-700"
                >
                  <span>💬 Falar com artista — {MESSAGE_COST} coin por mensagem</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-14 px-6 py-12">
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-r from-red-600 to-pink-600 p-2">
              <Video className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white">Vídeos</h2>
          </div>

          {videoTracks.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {videoTracks.map((track) => (
                <div
                  key={track.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:bg-white/10"
                >
                  <div className="relative bg-black" style={{ paddingBottom: '177.78%' }}>
                    <video
                      src={track.video_url || track.audio_url || ''}
                      className="absolute inset-0 h-full w-full object-cover"
                      preload="auto"
                      muted
                      playsInline
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <button
                      onClick={() =>
                        playTrack(
                          {
                            id: track.id,
                            title: track.title,
                            artist_name: artistName,
                            audio_url: track.audio_url || '',
                            video_url: track.video_url || undefined,
                            cover_url: track.cover_url || '',
                          },
                          playerTracks
                        )
                      }
                      className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/30 backdrop-blur-md">
                        <Play className="ml-1 h-7 w-7 text-white" fill="currentColor" />
                      </div>
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="mb-1 text-lg font-bold text-white">
                      {track.title}
                    </h3>

                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        <span>{(track.plays_count || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        <span>{(track.likes_count || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyLicense(track)}
                      className="mt-4 w-full rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400"
                    >
                      🔓 Usar esta música na live
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-gray-400">
              Este artista ainda não tem vídeos.
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
              <Music2 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white">Músicas</h2>
          </div>

          {audioTracks.length > 0 ? (
            <div className="space-y-3">
              {audioTracks.map((track) => (
                <div
                  key={track.id}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
                >
                  <div className="h-16 w-16 overflow-hidden rounded-xl bg-gradient-to-br from-red-600/20 to-purple-600/20">
                    {track.cover_url ? (
                      <img
                        src={track.cover_url}
                        alt={track.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Music2 className="h-6 w-6 text-white/40" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-white">
                      {track.title}
                    </h3>
                    <p className="truncate text-sm text-gray-400">
                      {artistName}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      playTrack(
                        {
                          id: track.id,
                          title: track.title,
                          artist_name: artistName,
                          audio_url: track.audio_url || '',
                          video_url: track.video_url || undefined,
                          cover_url: track.cover_url || '',
                        },
                        playerTracks
                      )
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 transition hover:scale-105 hover:bg-red-700"
                  >
                    <Play className="ml-0.5 h-5 w-5 text-white" fill="currentColor" />
                  </button>

                  <button
                    onClick={() => handleBuyLicense(track)}
                    className="hidden rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400 md:block"
                  >
                    Licença Live
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-gray-400">
              Este artista ainda não tem músicas.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
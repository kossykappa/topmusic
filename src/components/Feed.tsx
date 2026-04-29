import { useEffect, useRef, useState } from 'react';
import { Play, Heart, Music2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const { playTrack } = useMusicPlayer();
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const userId = getUserId();

async function toggleLike(trackId: string) {
  const { data: existingLike } = await supabase
    .from('track_likes')
    .select('id')
    .eq('track_id', trackId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingLike) {
    await supabase
      .from('track_likes')
      .delete()
      .eq('id', existingLike.id);

    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId
          ? { ...track, likes_count: Math.max((track.likes_count || 0) - 1, 0) }
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
        ? { ...track, likes_count: (track.likes_count || 0) + 1 }
        : track
    )
  );
}

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;

        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    {
      threshold: 0.7,
    }
  );

  Object.values(videoRefs.current).forEach((video) => {
    if (video) observer.observe(video);
  });

  return () => observer.disconnect();
}, [tracks]);

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

  const playerTracks = tracks.map((track) => ({
    id: track.id,
    title: track.title,
    artist_name: track.artists?.name || 'TopMusic Artist',
    audio_url: track.audio_url || '',
    video_url: track.video_url || undefined,
    cover_url: track.cover_url || '',
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
  ref={(el) => {
    videoRefs.current[track.id] = el;
  }}
  src={track.video_url || ''}
  className="h-full w-full object-cover"
  muted
  playsInline
  loop
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

                  <button
                    onClick={() =>
                      playTrack(
                        {
                          id: track.id,
                          title: track.title,
                          artist_name: track.artists?.name || 'TopMusic Artist',
                          audio_url: track.audio_url || '',
                          video_url: track.video_url || undefined,
                          cover_url: track.cover_url || '',
                        },
                        playerTracks
                      )
                    }
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition hover:opacity-100"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/30 backdrop-blur">
                      <Play className="ml-1 h-7 w-7 text-white" fill="currentColor" />
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
  onClick={() => toggleLike(track.id)}
  className="flex items-center gap-1 transition hover:text-red-400"
>
  <Heart className="h-4 w-4" />
  {(track.likes_count || 0).toLocaleString()}
</button>

                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {(track.likes_count || 0).toLocaleString()}
                    </span>
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
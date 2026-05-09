import { useEffect, useState } from 'react';
import {
  Play,
  TrendingUp,
  Clock,
  Music2,
  Video,
  Radio,
  Globe2,
  Users,
  MapPin,
  Flame,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { isVideoFile } from '../utils/fileTypes';
import type { Song } from '../types';

interface HomepageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

interface Artist {
  id: string;
  name: string;
  country?: string | null;
  genre?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  followers_count?: number | null;
}

interface LiveItem {
  id: string;
  artist_id: string;
  artist_name?: string | null;
  title?: string | null;
  stream_url: string;
  cover_url?: string | null;
  viewers_count?: number | null;
  is_live?: boolean | null;
}

export default function Homepage({ onNavigate }: HomepageProps) {
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [lives, setLives] = useState<LiveItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { playTrack } = useMusicPlayer();

  useEffect(() => {
    void fetchDiscoverData();
  }, []);

  async function fetchDiscoverData() {
    setLoading(true);

    try {
      const [tracksResponse, artistsResponse, livesResponse] = await Promise.all([
        supabase.from('tracks').select('*').order('created_at', { ascending: false }),
        supabase
          .from('artists')
          .select('*')
          .order('followers_count', { ascending: false })
          .limit(8),
        supabase
          .from('lives')
          .select('*')
          .eq('is_live', true)
          .order('started_at', { ascending: false })
          .limit(8),
      ]);

      const tracks = tracksResponse.data || [];

      const safeTracks = tracks.map((track) => ({
        id: track.id,
        title: track.title,
        genre: track.genre,
        language: track.language,
        cover_url: track.cover_url,
        audio_url: track.audio_url,
        video_url: track.video_url,
        created_at: track.created_at,
        artist_name: track.artist_name,
        plays_count: track.plays_count || 0,
      })) as Song[];

      const sortedByPlays = [...safeTracks].sort(
        (a, b) => (b.plays_count || 0) - (a.plays_count || 0)
      );

      const sortedByDate = [...safeTracks].sort(
        (a, b) =>
          new Date(b.created_at || '').getTime() -
          new Date(a.created_at || '').getTime()
      );

      setTrendingSongs(sortedByPlays.slice(0, 8));
      setNewReleases(sortedByDate.slice(0, 8));
      setArtists((artistsResponse.data || []) as Artist[]);
      setLives((livesResponse.data || []) as LiveItem[]);
    } catch (error) {
      console.error('Error loading discover data:', error);
      setTrendingSongs([]);
      setNewReleases([]);
      setArtists([]);
      setLives([]);
    } finally {
      setLoading(false);
    }
  }

  function handlePlay(song: Song, list: Song[]) {
    playTrack(
      {
        id: song.id,
        title: song.title,
        artist_name: song.artist_name,
        audio_url: song.audio_url,
        video_url: song.video_url,
        cover_url: song.cover_url || '',
      },
      list.map((s) => ({
        id: s.id,
        title: s.title,
        artist_name: s.artist_name,
        audio_url: s.audio_url,
        video_url: s.video_url,
        cover_url: s.cover_url || '',
      }))
    );
  }

  function openArtistProfile(artist: Artist) {
    onNavigate('artist', {
      id: artist.id,
      artistId: artist.id,
      artistName: artist.name,
      artistAvatar: artist.avatar_url || '',
      artist,
    });
  }

  function openLiveArtist(live: LiveItem) {
    onNavigate('artist', {
      id: live.artist_id,
      artistId: live.artist_id,
      artistName: live.artist_name || 'Artist',
      artistAvatar: live.cover_url || '',
      live,
    });
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6 lg:px-8">
        <section className="pt-4">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
            <Globe2 className="h-4 w-4 text-purple-400" />
            <span>Global Discovery</span>
          </div>

          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            Discover{' '}
            <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
              Music
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-white/60">
            Find live artists, trending tracks, new releases and global sounds.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('feed')}
              className="rounded-full bg-gradient-to-r from-red-600 to-purple-600 px-6 py-3 font-bold text-white"
            >
              Open Feed
            </button>

            <button
              onClick={() => onNavigate('live')}
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-bold text-white"
            >
              Enter Live
            </button>

            <button
              onClick={() => onNavigate('upload')}
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-bold text-white"
            >
              Upload
            </button>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-600 p-2">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-black">Live Now</h2>
                <p className="text-sm text-white/50">Artists currently live</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('live')}
              className="text-sm font-bold text-red-400"
            >
              View Live
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-3xl bg-white/10" />
              ))}
            </div>
          ) : lives.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {lives.map((live) => (
                <button
                  key={live.id}
                  onClick={() => openLiveArtist(live)}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-left transition hover:border-red-500/60"
                >
                  <div className="relative aspect-[4/5] bg-white/5">
                    {live.cover_url ? (
                      <img
                        src={live.cover_url}
                        alt={live.artist_name || 'Live'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Radio className="h-12 w-12 text-white/30" />
                      </div>
                    )}

                    <div className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-black">
                      LIVE
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="truncate text-base font-black">
                        {live.artist_name || 'Live Artist'}
                      </h3>
                      <p className="text-xs text-white/70">
                        {(live.viewers_count || 0) + 120} viewers
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 py-12 text-center text-white/50">
              No live artists yet.
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-r from-red-600 to-pink-600 p-2">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-black">Trending Tracks</h2>
                <p className="text-sm text-white/50">Most played right now</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('feed')}
              className="text-sm font-bold text-red-400"
            >
              Feed
            </button>
          </div>

          {trendingSongs.length > 0 ? (
            <div className="space-y-3">
              {trendingSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
                >
                  <div className="w-7 text-center text-xl font-black text-white/30">
                    {index + 1}
                  </div>

                  <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white/10">
                    {song.cover_url ? (
                      <img
                        src={song.cover_url}
                        alt={song.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        {isVideoFile(song.audio_url) ? (
                          <Video className="h-6 w-6 text-white/30" />
                        ) : (
                          <Music2 className="h-6 w-6 text-white/30" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold">{song.title}</h3>
                    <p className="truncate text-sm text-white/50">
                      {song.artist_name}
                    </p>
                  </div>

                  <div className="hidden text-sm text-white/40 md:block">
                    {(song.plays_count || 0).toLocaleString()} plays
                  </div>

                  <button
                    onClick={() => handlePlay(song, trendingSongs)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600"
                  >
                    <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 py-12 text-center text-white/50">
              No trending tracks yet.
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-2">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-3xl font-black">New Releases</h2>
              <p className="text-sm text-white/50">Fresh music just dropped</p>
            </div>
          </div>

          {newReleases.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {newReleases.map((song) => (
                <div key={song.id} className="group">
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-white/10">
                    {song.cover_url ? (
                      <img
                        src={song.cover_url}
                        alt={song.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Music2 className="h-10 w-10 text-white/30" />
                      </div>
                    )}

                    <button
                      onClick={() => handlePlay(song, newReleases)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600">
                        <Play className="ml-1 h-6 w-6" fill="currentColor" />
                      </span>
                    </button>
                  </div>

                  <h3 className="truncate text-sm font-bold">{song.title}</h3>
                  <p className="truncate text-xs text-white/50">{song.artist_name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 py-12 text-center text-white/50">
              No new releases yet.
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-3xl font-black">Artists to Follow</h2>
                <p className="text-sm text-white/50">Discover creators building their fanbase</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('artists')}
              className="text-sm font-bold text-red-400"
            >
              All Artists
            </button>
          </div>

          {artists.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {artists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => openArtistProfile(artist)}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-purple-500/60 hover:bg-white/10"
                >
                  <div className="mb-4 aspect-square overflow-hidden rounded-2xl bg-white/10">
                    {artist.avatar_url ? (
                      <img
                        src={artist.avatar_url}
                        alt={artist.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Users className="h-12 w-12 text-white/30" />
                      </div>
                    )}
                  </div>

                  <h3 className="truncate font-black">{artist.name}</h3>

                  <div className="mt-2 space-y-1 text-xs text-white/50">
                    {artist.country && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {artist.country}
                      </p>
                    )}

                    {artist.genre && (
                      <p className="flex items-center gap-1">
                        <Music2 className="h-3 w-3" />
                        {artist.genre}
                      </p>
                    )}

                    <p>{(artist.followers_count || 0).toLocaleString()} followers</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 py-12 text-center text-white/50">
              No artists yet.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-red-600/10 via-purple-600/10 to-pink-600/10 p-7">
  <div className="mb-6 flex items-center gap-3">
    <div className="rounded-xl bg-red-600 p-2">
      <Flame className="h-5 w-5" />
    </div>

    <div>
      <h2 className="text-3xl font-black">Explore Global Sounds</h2>
      <p className="text-sm text-white/50">
        Discover music by mood, style and global trends
      </p>
    </div>
  </div>

  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    {[
      { name: 'Pop', icon: '🎧' },
      { name: 'Afrobeats', icon: '🔥' },
      { name: 'Hip Hop', icon: '🎤' },
      { name: 'R&B', icon: '💜' },
      { name: 'Dance', icon: '⚡' },
      { name: 'Latin', icon: '🌹' },
      { name: 'Electronic', icon: '🌐' },
      { name: 'Trending', icon: '🚀' },
    ].map((item) => (
      <button
        key={item.name}
        onClick={() => onNavigate('region', { region: item.name })}
        className="rounded-2xl border border-white/10 bg-black/30 px-5 py-7 text-left transition hover:border-red-500/60 hover:bg-white/10"
      >
        <div className="text-3xl">{item.icon}</div>

        <div className="mt-3 font-black">{item.name}</div>

        <div className="mt-1 text-xs text-white/50">
        </div>
      </button>
    ))}
  </div>
{/* EXPLORE GLOBAL SOUNDS */}
<section>
  <div className="mb-6 flex items-center gap-3">
    <div className="rounded-xl bg-red-600 p-2">
      <Flame className="h-5 w-5" />
    </div>

    <div>
      <h2 className="text-3xl font-black">
        Explore Global Sounds
      </h2>

      <p className="text-sm text-white/50">
        Discover music by genre, mood and worldwide trends
      </p>
    </div>
  </div>

  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    {[
      { name: 'Pop', icon: '🎧' },
      { name: 'Hip Hop', icon: '🎤' },
      { name: 'Afrobeats', icon: '🔥' },
      { name: 'Electronic', icon: '🌐' },
      { name: 'Latin', icon: '🌹' },
      { name: 'Kizomba', icon: '💃' },
      { name: 'Kuduro', icon: '⚡' },
      { name: 'Dance', icon: '🪩' },
      { name: 'R&B', icon: '💙' },
      { name: 'Trending', icon: '🚀' },
    ].map((item) => (
      <button
        key={item.name}
        onClick={() => onNavigate('region', { region: item.name })}
        className="rounded-2xl border border-white/10 bg-black/30 px-5 py-7 text-left transition hover:border-red-500/60 hover:bg-white/10"
      >
        <div className="text-3xl">
          {item.icon}
        </div>

        <div className="mt-3 font-black">
          {item.name}
        </div>

        <div className="mt-1 text-xs text-white/50">
          Explore global music
        </div>
      </button>
    ))}
  </div>
  </section>
      </div>
    </div>
    )
}
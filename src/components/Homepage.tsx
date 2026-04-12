import { useEffect, useState } from 'react';
import {
  Upload,
  Play,
  TrendingUp,
  Clock,
  DollarSign,
  Zap,
  Music2,
  Video,
  Radio,
  Globe2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { isVideoFile } from '../utils/fileTypes';
import type { Song } from '../types';

interface HomepageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function Homepage({ onNavigate }: HomepageProps) {
  const { t } = useTranslation();
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useMusicPlayer();

  useEffect(() => {
    fetchSongs();
  }, []);

  async function fetchSongs() {
    try {
      const { data: tracks, error } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tracks:', error);
        setTrendingSongs([]);
        setNewReleases([]);
        return;
      }

      if (tracks && tracks.length > 0) {
        const tracksWithArtistInfo = tracks.map((track) => ({
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
        }));

        const sortedByPlays = [...tracksWithArtistInfo].sort(
          (a, b) => (b.plays_count || 0) - (a.plays_count || 0)
        );
        const sortedByDate = [...tracksWithArtistInfo].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setTrendingSongs(sortedByPlays.slice(0, 6));
        setNewReleases(sortedByDate.slice(0, 6));
      } else {
        setTrendingSongs([]);
        setNewReleases([]);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      setTrendingSongs([]);
      setNewReleases([]);
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

  return (
    <div className="min-h-screen bg-black">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-purple-600/10 to-red-600/10 blur-3xl" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-red-500/20 blur-3xl" />
          <div className="absolute bottom-20 right-1/4 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-14 px-4 pb-24 pt-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-24">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
              <Radio className="h-4 w-4 text-red-400" />
              <span>Discover. Stream. Earn.</span>
            </div>

            <h1 className="text-5xl font-black leading-tight text-white md:text-7xl">
              Music lives
              <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
                {' '}
                here
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 md:text-xl">
              A global platform where artists upload music and video, fans discover
              new talent, and support creators through gifts, live interaction and
              internal monetization.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => onNavigate('upload')}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-red-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-red-500/40 transition hover:scale-105 hover:from-red-700 hover:to-purple-700"
              >
                <Upload className="h-5 w-5" />
                <span>Upload Music</span>
              </button>

              <button
                onClick={() => onNavigate('feed')}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-bold text-white transition hover:scale-105 hover:bg-white/10"
              >
                <Play className="h-5 w-5" />
                <span>Explore Feed</span>
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                🎁 Gifts
              </span>
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                🎤 Live
              </span>
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                💰 Coins
              </span>
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                🌍 Global Music
              </span>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-black/40 p-4 shadow-2xl backdrop-blur-sm">
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black">
                <div className="relative aspect-[9/16] bg-gradient-to-br from-black via-gray-900 to-black">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.25),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(239,68,68,0.2),_transparent_40%)]" />

                  <div className="absolute left-4 top-4 flex items-center gap-3 rounded-full bg-black/40 px-3 py-2 backdrop-blur-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-purple-600 font-bold text-white">
                      MZ
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          Maya Zuda
                        </span>
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          Live
                        </span>
                      </div>
                      <p className="text-xs text-gray-300">@mayazuda.official</p>
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-4 max-w-[70%]">
                    <p className="mb-2 text-sm font-semibold text-pink-300">
                      Studio Session
                    </p>
                    <h3 className="text-2xl font-black text-white">
                      Support artists in real time
                    </h3>
                    <p className="mt-2 text-sm text-gray-300">
                      Buy coins, send gifts and help artists earn directly inside
                      TopMusic.
                    </p>
                  </div>

                  <div className="absolute bottom-8 right-4 flex flex-col items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg text-white backdrop-blur-sm">
                      ❤️
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg text-white backdrop-blur-sm">
                      💬
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-red-600 text-xl text-white shadow-xl">
                      🎁
                    </div>
                  </div>

                  <div className="absolute left-4 top-28 space-y-2">
                    <div className="rounded-full bg-black/50 px-3 py-2 text-xs text-white backdrop-blur-sm">
                      🔥 Rose x5 sent
                    </div>
                    <div className="rounded-full bg-black/50 px-3 py-2 text-xs text-white backdrop-blur-sm">
                      💎 Diamond support
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK VALUE CARDS */}
      <section className="relative z-20 -mt-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <Upload className="mb-3 h-6 w-6 text-red-400" />
            <h3 className="font-bold text-white">Upload Music & Video</h3>
            <p className="mt-2 text-sm text-gray-400">
              Publish your tracks and video content in one place.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <DollarSign className="mb-3 h-6 w-6 text-yellow-400" />
            <h3 className="font-bold text-white">Earn with Gifts</h3>
            <p className="mt-2 text-sm text-gray-400">
              Fans support artists directly through gifts and coins.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <TrendingUp className="mb-3 h-6 w-6 text-pink-400" />
            <h3 className="font-bold text-white">Grow Faster</h3>
            <p className="mt-2 text-sm text-gray-400">
              Get discovered through trends, feed and live engagement.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <Zap className="mb-3 h-6 w-6 text-purple-400" />
            <h3 className="font-bold text-white">Live Interaction</h3>
            <p className="mt-2 text-sm text-gray-400">
              Build stronger fan relationships through live experiences.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-24 px-4 py-20 sm:px-6 lg:px-8">
        {/* TRENDING */}
        <section>
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-gradient-to-r from-red-600 to-pink-600 p-2">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-4xl font-black text-white md:text-5xl">
                  {t('trending.title')}
                </h2>
              </div>
              <p className="text-lg text-gray-400">{t('trending.subtitle')}</p>
            </div>

            <button
              onClick={() => onNavigate('feed')}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              View Feed
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-gray-700" />
                      <div className="h-3 w-1/4 rounded bg-gray-700" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : trendingSongs.length > 0 ? (
            <div className="space-y-3">
              {trendingSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="group cursor-pointer rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm transition-all hover:border-red-500/50 hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center text-2xl font-black text-gray-600">
                      {index + 1}
                    </div>

                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-red-600/20 to-purple-600/20">
                      {song.cover_url ? (
                        <>
                          <img
                            src={song.cover_url}
                            alt={song.title}
                            className="h-full w-full object-cover"
                          />
                          {isVideoFile(song.audio_url) && (
                            <div className="absolute right-1 top-1 rounded bg-black/60 p-0.5">
                              <Video className="h-3 w-3 text-red-400" />
                            </div>
                          )}
                        </>
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
                      <h3 className="truncate text-lg font-bold text-white">
                        {song.title}
                      </h3>
                      <p className="truncate text-sm text-gray-400">
                        {song.artist_name}
                      </p>
                    </div>

                    <div className="hidden text-sm text-gray-500 md:block">
                      {song.genre}
                    </div>

                    <div className="text-sm text-gray-400">
                      {(song.plays_count || 0).toLocaleString()} plays
                    </div>

                    <button
                      onClick={() => handlePlay(song, trendingSongs)}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
                    >
                      <Play className="ml-0.5 h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-white/5 py-16 text-center">
              <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-600" />
              <p className="text-lg text-gray-400">
                No trending songs yet. Be the first to upload!
              </p>
            </div>
          )}
        </section>

        {/* NEW RELEASES */}
        <section>
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-4xl font-black text-white md:text-5xl">
                  {t('newReleases.title')}
                </h2>
              </div>
              <p className="text-lg text-gray-400">{t('newReleases.subtitle')}</p>
            </div>

            <button
              onClick={() => onNavigate('feed')}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Explore More
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="mb-3 aspect-square rounded-xl bg-gray-800" />
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-800" />
                  <div className="h-3 w-1/2 rounded bg-gray-800" />
                </div>
              ))}
            </div>
          ) : newReleases.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
              {newReleases.map((song) => (
                <div key={song.id} className="group cursor-pointer">
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 shadow-lg">
                    {song.cover_url ? (
                      <>
                        <img
                          src={song.cover_url}
                          alt={song.title}
                          className="h-full w-full object-cover"
                        />
                        {isVideoFile(song.audio_url) && (
                          <div className="absolute right-2 top-2 rounded bg-black/60 p-1">
                            <Video className="h-4 w-4 text-red-400" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                        {isVideoFile(song.audio_url) ? (
                          <Video className="h-12 w-12 text-white/40" />
                        ) : (
                          <Music2 className="h-12 w-12 text-white/40" />
                        )}
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-all group-hover:opacity-100">
                      <button
                        onClick={() => handlePlay(song, newReleases)}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-xl transition-transform group-hover:scale-100 hover:bg-red-700"
                      >
                        <Play className="ml-1 h-6 w-6 text-white" />
                      </button>
                    </div>
                  </div>

                  <h3 className="mb-1 truncate text-sm font-bold text-white transition-colors group-hover:text-red-400">
                    {song.title}
                  </h3>
                  <p className="truncate text-xs text-gray-400">
                    {song.artist_name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/5 bg-white/5 py-16 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-gray-600" />
              <p className="text-lg text-gray-400">
                No new releases yet. Be the first to upload!
              </p>
            </div>
          )}
        </section>

        {/* LIVE GIFTS HIGHLIGHT */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-red-600/10 via-purple-600/10 to-pink-600/10 p-8 md:p-12">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-4xl font-black text-white md:text-5xl">
                Support Artists Live
              </h2>
              <p className="mb-6 text-lg text-gray-300">
                Buy coins, send gifts, and help artists earn directly while fans
                enjoy a more interactive music experience.
              </p>

              <div className="mb-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  🎁 Gifts
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  💰 Coins
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                  🔥 Live Support
                </span>
              </div>

              <button
                onClick={() => onNavigate('sendGift')}
                className="rounded-full bg-gradient-to-r from-pink-500 to-red-600 px-8 py-4 font-bold text-white shadow-xl transition hover:scale-105"
              >
                Open Live Gifts
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
              <div className="flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-black via-gray-900 to-black text-6xl text-white">
                🎤
              </div>
              <div className="mt-4 font-bold text-white">Live gifting preview</div>
              <div className="text-sm text-gray-400">
                Fans send gifts. Artists earn instantly.
              </div>
            </div>
          </div>
        </section>

        {/* EXPLORE BY REGION */}
        <section className="py-4">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-sm">
              <Globe2 className="h-4 w-4 text-purple-400" />
              <span>Global Discovery</span>
            </div>

            <h2 className="mb-4 text-4xl font-black text-white md:text-5xl">
              Explore by Region
            </h2>
            <p className="text-lg text-gray-400">
              Discover sounds, cultures and artists from around the world
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => onNavigate('region', { region: 'Angola' })}
              className="group relative h-64 overflow-hidden rounded-2xl border border-white/10 transition-all hover:scale-105 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/30"
            >
              <img
                src="https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Angola"
                className="absolute inset-0 h-full w-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
              <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black/40 shadow-lg backdrop-blur-sm">
                <img
                  src="https://flagcdn.com/w40/ao.png"
                  alt="Angola flag"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement;
                    if (fallback) fallback.innerHTML = '🇦🇴';
                  }}
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <h3 className="mb-3 text-4xl font-black tracking-tight text-white drop-shadow-2xl">
                  Angola
                </h3>
                <p className="text-sm font-light text-gray-200 opacity-0 transition-opacity group-hover:opacity-100">
                  Semba, Kizomba, Kuduro
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('region', { region: 'Africa' })}
              className="group relative h-64 overflow-hidden rounded-2xl border border-white/10 transition-all hover:scale-105 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/30"
            >
              <img
                src="https://images.pexels.com/photos/95425/pexels-photo-95425.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Africa"
                className="absolute inset-0 h-full w-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
              <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-xl shadow-lg backdrop-blur-sm">
                🌍
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <h3 className="mb-3 text-4xl font-black tracking-tight text-white drop-shadow-2xl">
                  Africa
                </h3>
                <p className="text-sm font-light text-gray-200 opacity-0 transition-opacity group-hover:opacity-100">
                  Afrobeat, Amapiano, Gqom
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('region', { region: 'South Africa' })}
              className="group relative h-64 overflow-hidden rounded-2xl border border-white/10 transition-all hover:scale-105 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/30"
            >
              <img
                src="https://images.pexels.com/photos/1619654/pexels-photo-1619654.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="South Africa"
                className="absolute inset-0 h-full w-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
              <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black/40 shadow-lg backdrop-blur-sm">
                <img
                  src="https://flagcdn.com/w40/za.png"
                  alt="South Africa flag"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement;
                    if (fallback) fallback.innerHTML = '🇿🇦';
                  }}
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <h3 className="mb-3 text-4xl font-black tracking-tight text-white drop-shadow-2xl">
                  South Africa
                </h3>
                <p className="text-sm font-light text-gray-200 opacity-0 transition-opacity group-hover:opacity-100">
                  Amapiano, Gqom, Kwaito
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('region', { region: 'Nigeria' })}
              className="group relative h-64 overflow-hidden rounded-2xl border border-white/10 transition-all hover:scale-105 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/30"
            >
              <img
                src="https://images.pexels.com/photos/1864642/pexels-photo-1864642.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Nigeria"
                className="absolute inset-0 h-full w-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
              <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black/40 shadow-lg backdrop-blur-sm">
                <img
                  src="https://flagcdn.com/w40/ng.png"
                  alt="Nigeria flag"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement;
                    if (fallback) fallback.innerHTML = '🇳🇬';
                  }}
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <h3 className="mb-3 text-4xl font-black tracking-tight text-white drop-shadow-2xl">
                  Nigeria
                </h3>
                <p className="text-sm font-light text-gray-200 opacity-0 transition-opacity group-hover:opacity-100">
                  Afrobeats, Alté, Street Pop
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* MONETIZATION CTA */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm md:p-12">
          <h2 className="mb-4 text-4xl font-black text-white md:text-5xl">
            Turn your audience into income
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-lg text-gray-300">
            Upload your music, build your fanbase, receive gifts, and grow your
            music business inside one platform.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => onNavigate('upload')}
              className="rounded-full bg-gradient-to-r from-red-600 to-purple-600 px-8 py-4 font-bold text-white shadow-xl transition hover:scale-105"
            >
              Start Uploading
            </button>

            <button
              onClick={() => onNavigate('artists')}
              className="rounded-full border border-white/10 bg-white/5 px-8 py-4 font-bold text-white transition hover:bg-white/10"
            >
              Explore Artists
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
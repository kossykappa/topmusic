import { useEffect, useState } from 'react';
import { Upload, Play, TrendingUp, Clock, DollarSign, Zap, Music2, Video } from 'lucide-react';
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
        const tracksWithArtistInfo = tracks.map(track => ({
          id: track.id,
          title: track.title,
          genre: track.genre,
          language: track.language,
          cover_url: track.cover_url,
          audio_url: track.audio_url,
          created_at: track.created_at,
          artist_name: track.artist_name,
          plays_count: track.plays_count || 0
        }));

        const sortedByPlays = [...tracksWithArtistInfo].sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0));
        const sortedByDate = [...tracksWithArtistInfo].sort((a, b) =>
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

  return (
    <div className="min-h-screen bg-black">
      <div className="relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-purple-600/10 to-red-600/10 blur-3xl"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-red-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-black text-white tracking-tight leading-tight">
                {t('hero.title')}
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                {t('hero.subtitle')}
              </p>
            </div>
            <button
              onClick={() => onNavigate('upload')}
              className="inline-flex items-center space-x-3 rtl:space-x-reverse px-10 py-5 bg-gradient-to-r from-red-600 to-purple-600 text-white text-lg font-bold rounded-full hover:from-red-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-2xl shadow-red-500/50 hover:shadow-red-500/70"
            >
              <Upload className="w-6 h-6" />
              <span>{t('hero.cta')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">
        <section>
          <div className="mb-10">
            <div className="flex items-center space-x-3 rtl:space-x-reverse mb-3">
              <div className="p-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white">{t('trending.title')}</h2>
            </div>
            <p className="text-gray-400 text-lg ltr:ml-14 rtl:mr-14">{t('trending.subtitle')}</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse backdrop-blur-sm">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/4"></div>
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
                  className="group bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/5 hover:border-red-500/50 transition-all cursor-pointer backdrop-blur-sm"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl font-black text-gray-600 w-8 text-center">{index + 1}</div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-red-600/20 to-purple-600/20 rounded-lg overflow-hidden flex-shrink-0">
                      {song.cover_url ? (
                        <>
                          <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
                          {isVideoFile(song.audio_url) && (
                            <div className="absolute top-1 right-1 bg-black/60 rounded p-0.5">
                              <Video className="w-3 h-3 text-red-400" />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {isVideoFile(song.audio_url) ? (
                            <Video className="w-6 h-6 text-white/30" />
                          ) : (
                            <Music2 className="w-6 h-6 text-white/30" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-lg truncate">{song.title}</h3>
                      <p className="text-gray-400 text-sm truncate">{song.artist_name}</p>
                    </div>
                    <div className="hidden md:block text-gray-500 text-sm">{song.genre}</div>
                    <div className="text-gray-400 text-sm">{(song.plays_count || 0).toLocaleString()} plays</div>
                    <button
                      onClick={() => playTrack({
                        id: song.id,
                        title: song.title,
                        artist_name: song.artist_name,
                        audio_url: song.audio_url,
                        video_url: song.video_url,
                        cover_url: song.cover_url || ''
                      }, trendingSongs.map(s => ({
                        id: s.id,
                        title: s.title,
                        artist_name: s.artist_name,
                        audio_url: s.audio_url,
                        video_url: s.video_url,
                        cover_url: s.cover_url || ''
                      })))}
                      className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5">
              <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No trending songs yet. Be the first to upload!</p>
            </div>
          )}
        </section>

        <section>
          <div className="mb-10">
            <div className="flex items-center space-x-3 rtl:space-x-reverse mb-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white">{t('newReleases.title')}</h2>
            </div>
            <p className="text-gray-400 text-lg ltr:ml-14 rtl:mr-14">{t('newReleases.subtitle')}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-800 rounded-xl mb-3"></div>
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : newReleases.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {newReleases.map((song) => (
                <div
                  key={song.id}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl mb-3 overflow-hidden shadow-lg">
                    {song.cover_url ? (
                      <>
                        <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
                        {isVideoFile(song.audio_url) && (
                          <div className="absolute top-2 right-2 bg-black/60 rounded p-1">
                            <Video className="w-4 h-4 text-red-400" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                        {isVideoFile(song.audio_url) ? (
                          <Video className="w-12 h-12 text-white/40" />
                        ) : (
                          <Music2 className="w-12 h-12 text-white/40" />
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <button
                        onClick={() => playTrack({
                          id: song.id,
                          title: song.title,
                          artist_name: song.artist_name,
                          audio_url: song.audio_url,
                          video_url: song.video_url,
                          cover_url: song.cover_url || ''
                        }, newReleases.map(s => ({
                          id: s.id,
                          title: s.title,
                          artist_name: s.artist_name,
                          audio_url: s.audio_url,
                          video_url: s.video_url,
                          cover_url: s.cover_url || ''
                        })))}
                        className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform shadow-xl"
                      >
                        <Play className="w-6 h-6 text-white ml-1" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-sm truncate mb-1 group-hover:text-red-400 transition-colors">{song.title}</h3>
                  <p className="text-gray-400 text-xs truncate">{song.artist_name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No new releases yet. Be the first to upload!</p>
            </div>
          )}
        </section>

        <section className="py-12">
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Explore by Region
            </h2>
            <p className="text-gray-400 text-lg">Discover music from different cultures around the world</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => onNavigate('region', { region: 'Angola' })}
              className="group relative h-64 rounded-2xl overflow-hidden border border-white/10 hover:border-red-500/50 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/30"
            >
              <img
                src="https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Angola"
                className="absolute inset-0 w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30"></div>
              <div className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden flex items-center justify-center shadow-lg">
                <img
                  src="https://flagcdn.com/w40/ao.png"
                  alt="Angola flag"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement;
                    if (fallback) fallback.innerHTML = '🇦🇴';
                  }}
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-4xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">Angola</h3>
                <p className="text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg font-light">
                  Semba, Kizomba, Kuduro
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('region', { region: 'Africa' })}
              className="group relative h-64 rounded-2xl overflow-hidden border border-white/10 hover:border-green-500/50 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/30"
            >
              <img
                src="https://images.pexels.com/photos/95425/pexels-photo-95425.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Africa"
                className="absolute inset-0 w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30"></div>
              <div className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-xl">
                🌍
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-4xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">Africa</h3>
                <p className="text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg font-light">
                  Afrobeat, Amapiano, Gqom
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('region', { region: 'South Africa' })}
              className="group relative h-64 rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30"
            >
              <img
                src="https://images.pexels.com/photos/1619654/pexels-photo-1619654.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="South Africa"
                className="absolute inset-0 w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30"></div>
              <div className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden flex items-center justify-center shadow-lg">
                <img
                  src="https://flagcdn.com/w40/za.png"
                  alt="South Africa flag"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement;
                    if (fallback) fallback.innerHTML = '🇿🇦';
                  }}
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-4xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">South Africa</h3>
                <p className="text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg font-light">
                  Amapiano, Gqom, Kwaito
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('region', { region: 'Nigeria' })}
              className="group relative h-64 rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/30"
            >
              <img
                src="https://images.pexels.com/photos/1864642/pexels-photo-1864642.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Nigeria"
                className="absolute inset-0 w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30"></div>
              <div className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden flex items-center justify-center shadow-lg">
                <img
                  src="https://flagcdn.com/w40/ng.png"
                  alt="Nigeria flag"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement;
                    if (fallback) fallback.innerHTML = '🇳🇬';
                  }}
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-4xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">Nigeria</h3>
                <p className="text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg font-light">
                  Afrobeat, Afro Pop, Highlife
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('region', { region: 'Congo' })}
              className="group relative h-64 rounded-2xl overflow-hidden border border-white/10 hover:border-yellow-500/50 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/30"
            >
              <img
                src="https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Congo"
                className="absolute inset-0 w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30"></div>
              <div className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden flex items-center justify-center shadow-lg">
                <img
                  src="https://flagcdn.com/w40/cd.png"
                  alt="Congo flag"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement;
                    if (fallback) fallback.innerHTML = '🇨🇩';
                  }}
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-4xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">Congo</h3>
                <p className="text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg font-light">
                  Soukous, Ndombolo, Rumba
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('region', { region: 'Mozambique' })}
              className="group relative h-64 rounded-2xl overflow-hidden border border-white/10 hover:border-red-500/50 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/30"
            >
              <img
                src="https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Mozambique"
                className="absolute inset-0 w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30"></div>
              <div className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden flex items-center justify-center shadow-lg">
                <img
                  src="https://flagcdn.com/w40/mz.png"
                  alt="Mozambique flag"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement;
                    if (fallback) fallback.innerHTML = '🇲🇿';
                  }}
                />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-4xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">Mozambique</h3>
                <p className="text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg font-light">
                  Marrabenta, Pandza, Kizomba
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('region', { region: 'Caribbean' })}
              className="group relative h-64 rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30"
            >
              <img
                src="https://images.pexels.com/photos/1001850/pexels-photo-1001850.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Caribbean"
                className="absolute inset-0 w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30"></div>
              <div className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-xl">
                🌴
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-4xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">Caribbean</h3>
                <p className="text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg font-light">
                  Zouk, Kompa, Dancehall
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('region', { region: 'Global' })}
              className="group relative h-64 rounded-2xl overflow-hidden border border-white/10 hover:border-slate-500/50 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-slate-500/30"
            >
              <img
                src="https://images.pexels.com/photos/2147029/pexels-photo-2147029.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Global"
                className="absolute inset-0 w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30"></div>
              <div className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-xl">
                🌎
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <h3 className="text-4xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">Global</h3>
                <p className="text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg font-light">
                  Pop, Hip Hop, R&B, Rock
                </p>
              </div>
            </button>
          </div>
        </section>

        <section className="py-12">
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              {t('features.title')}
            </h2>
            <p className="text-gray-400 text-lg">{t('features.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-red-950/30 via-red-900/20 to-transparent rounded-2xl p-8 border border-red-900/30 hover:border-red-500/50 transition-all hover:transform hover:scale-105 backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-red-500/50 transition-shadow">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{t('features.earnPerStream.title')}</h3>
              <p className="text-gray-400 leading-relaxed">
                {t('features.earnPerStream.description')}
              </p>
            </div>

            <div className="group bg-gradient-to-br from-purple-950/30 via-purple-900/20 to-transparent rounded-2xl p-8 border border-purple-900/30 hover:border-purple-500/50 transition-all hover:transform hover:scale-105 backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{t('features.instantPayment.title')}</h3>
              <p className="text-gray-400 leading-relaxed">
                {t('features.instantPayment.description')}
              </p>
            </div>

            <div className="group bg-gradient-to-br from-pink-950/30 via-pink-900/20 to-transparent rounded-2xl p-8 border border-pink-900/30 hover:border-pink-500/50 transition-all hover:transform hover:scale-105 backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-pink-500/50 transition-shadow">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{t('features.analytics.title')}</h3>
              <p className="text-gray-400 leading-relaxed">
                {t('features.analytics.description')}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

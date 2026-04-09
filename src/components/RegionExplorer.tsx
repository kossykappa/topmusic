import { useEffect, useState } from 'react';
import { Play, Music2, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { isVideoFile } from '../utils/fileTypes';
import type { Song } from '../types';

interface RegionExplorerProps {
  region: string;
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

const REGION_GENRES: Record<string, string[]> = {
  'Angola': ['Semba', 'Kizomba', 'Kuduro', 'Tarraxinha', 'Funaná', 'Coladeira'],
  'Africa': ['Afrobeat', 'Afro House', 'Afro Pop', 'Amapiano', 'Gqom', 'Kwaito', 'Maskandi', 'Soukous', 'Ndombolo', 'Highlife', 'Bongo Flava', 'Coupe-Decale'],
  'South Africa': ['Amapiano', 'Gqom', 'Kwaito', 'Maskandi', 'Afro House'],
  'Nigeria': ['Afrobeat', 'Afro Pop', 'Highlife', 'Fuji'],
  'Congo': ['Soukous', 'Ndombolo', 'Rumba'],
  'Mozambique': ['Marrabenta', 'Pandza', 'Kizomba'],
  'Caribbean': ['Zouk', 'Zouk Love', 'Kompa', 'Dancehall', 'Reggae'],
  'Global': ['Pop', 'Hip Hop', 'R&B', 'Electronic', 'Rock', 'Jazz', 'Gospel', 'Classical']
};

const REGION_INFO: Record<string, { emoji: string; gradient: string }> = {
  'Angola': { emoji: '🇦🇴', gradient: 'from-red-600 to-yellow-600' },
  'Africa': { emoji: '🌍', gradient: 'from-green-600 to-yellow-600' },
  'South Africa': { emoji: '🇿🇦', gradient: 'from-green-600 to-blue-600' },
  'Nigeria': { emoji: '🇳🇬', gradient: 'from-green-700 to-emerald-600' },
  'Congo': { emoji: '🇨🇩', gradient: 'from-blue-600 to-yellow-600' },
  'Mozambique': { emoji: '🇲🇿', gradient: 'from-green-600 to-red-600' },
  'Caribbean': { emoji: '🌴', gradient: 'from-blue-600 to-cyan-600' },
  'Global': { emoji: '🌎', gradient: 'from-slate-700 to-slate-900' }
};

export default function RegionExplorer({ region, onBack, onNavigate }: RegionExplorerProps) {
  const { t } = useTranslation();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useMusicPlayer();

  const regionGenres = REGION_GENRES[region] || [];
  const regionInfo = REGION_INFO[region] || { emoji: '🎵', gradient: 'from-gray-600 to-gray-800' };

  useEffect(() => {
    fetchRegionSongs();
  }, [region]);

  async function fetchRegionSongs() {
    try {
      setLoading(true);
      const { data: tracks, error } = await supabase
        .from('tracks')
        .select('*')
        .in('genre', regionGenres)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching tracks:', error);
        setSongs([]);
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

        setSongs(tracksWithArtistInfo);
      } else {
        setSongs([]);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }

  if (!region) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Music2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No region selected</h3>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className={`relative overflow-hidden bg-gradient-to-b ${regionInfo.gradient}`}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <button
            onClick={onBack}
            className="mb-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all"
          >
            ← Back
          </button>
          <div className="flex items-center space-x-6">
            <div className="text-8xl">{regionInfo.emoji}</div>
            <div>
              <h1 className="text-6xl md:text-7xl font-black text-white mb-4">
                {region}
              </h1>
              <p className="text-xl text-white/80">
                Explore music from {region} • {regionGenres.join(', ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
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
        ) : songs.length > 0 ? (
          <div className="space-y-3">
            {songs.map((song) => (
              <div
                key={song.id}
                className="group bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/5 hover:border-red-500/50 transition-all cursor-pointer backdrop-blur-sm"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 bg-gradient-to-br from-red-600/20 to-purple-600/20 rounded-lg overflow-hidden flex-shrink-0">
                    {song.cover_url ? (
                      <>
                        <img
                          src={song.cover_url}
                          alt={song.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full flex items-center justify-center';
                              fallback.innerHTML = isVideoFile(song.audio_url)
                                ? '<svg class="w-6 h-6 text-white/30" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>'
                                : '<svg class="w-6 h-6 text-white/30" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
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
                    }, songs.map(s => ({
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
          <div className="text-center py-32 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl border border-white/10">
            <div className="max-w-md mx-auto px-6">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-yellow-600/20 rounded-full blur-3xl"></div>
                <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-red-600/10 to-yellow-600/10 rounded-full flex items-center justify-center border border-red-500/20">
                  <Music2 className="w-12 h-12 text-red-400" />
                </div>
              </div>

              <h3 className="text-3xl font-black text-white mb-3">
                No Tracks Yet
              </h3>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                We're still building our collection of music from {region}. Be the first to upload and share the sounds of this region!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={onBack}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 hover:border-white/20 transition-all font-semibold"
                >
                  Explore Other Regions
                </button>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('upload')}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full transition-all font-semibold shadow-lg shadow-red-600/30"
                  >
                    Upload Music
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

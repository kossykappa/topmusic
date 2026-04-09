import { useEffect, useState } from 'react';
import { UserPlus, UserCheck, Play, Users, Music2, Video, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { getUserId } from '../utils/userId';

interface Track {
  id: string;
  title: string;
  artist_name: string;
  genre: string;
  language: string;
  audio_url: string;
  cover_url: string;
  video_url?: string;
  media_type?: string;
  plays_count: number;
  likes_count: number;
  created_at: string;
}

interface ArtistPageProps {
  artistId: string;
}

export default function ArtistPage({ artistId }: ArtistPageProps) {
  const { t } = useTranslation();
  const [artistName, setArtistName] = useState<string>('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const { playTrack } = useMusicPlayer();

  useEffect(() => {
    fetchArtistData();
  }, [artistId]);

  async function fetchArtistData() {
    try {
      const { data: tracksData } = await supabase
        .from('tracks')
        .select('*')
        .eq('artist_name', artistId)
        .order('created_at', { ascending: false });

      setTracks(tracksData || []);
      if (tracksData && tracksData.length > 0) {
        setArtistName(tracksData[0].artist_name);
      }
    } catch (error) {
      console.error('Error fetching artist data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFollow() {
    setIsFollowing(!isFollowing);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-white">Artist not found</h2>
        </div>
      </div>
    );
  }

  const videoTracks = tracks.filter(t => t.media_type === 'video' && t.video_url);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative h-72 bg-gradient-to-b from-white/10 to-transparent">
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-end pb-8">
          <div className="flex items-end gap-6">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-red-500/30 to-purple-500/30 flex items-center justify-center overflow-hidden shadow-2xl border-4 border-white/10">
              <Users className="w-20 h-20 text-white/50" />
            </div>

            <div className="flex-1 space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-white">{artistName}</h1>
              <div className="flex items-center gap-6">
                <span className="text-gray-300">{videoTracks.length} videos</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-300">{tracks.length} tracks</span>
              </div>

              <button
                onClick={handleFollow}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                  isFollowing
                    ? 'bg-white/20 text-white border border-white/20'
                    : 'bg-white text-black hover:scale-105'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-5 h-5" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Videos</h2>

          {videoTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoTracks.map((track) => (
                <div
                  key={track.id}
                  className="group relative bg-white/5 rounded-2xl overflow-hidden hover:bg-white/10 transition-all"
                >
                  <div
                    className="relative bg-black"
                    style={{
                      paddingBottom: '177.78%',
                    }}
                  >
                    {track.video_url && (
                      <video
                        src={track.video_url}
                        className="absolute inset-0 w-full h-full object-cover"
                        preload="metadata"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <button
                      onClick={() => playTrack({
                        id: track.id,
                        title: track.title,
                        artist_name: track.artist_name,
                        audio_url: track.audio_url,
                        video_url: track.video_url,
                        cover_url: track.cover_url
                      }, videoTracks.map(t => ({
                        id: t.id,
                        title: t.title,
                        artist_name: t.artist_name,
                        audio_url: t.audio_url,
                        video_url: t.video_url,
                        cover_url: t.cover_url
                      })))}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center">
                        <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
                      </div>
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg mb-1">{track.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        <span>{track.plays_count.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{track.likes_count.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-white">
                        {track.genre}
                      </span>
                      <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-white">
                        {track.language}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No videos yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

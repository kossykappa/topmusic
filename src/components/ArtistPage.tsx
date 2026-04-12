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
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { getUserId } from '../utils/userId';

interface Track {
  id: string;
  title: string;
  artist_id: string;
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
  onNavigate?: (page: string, data?: unknown) => void;
}

export default function ArtistPage({ artistId, onNavigate }: ArtistPageProps) {
  const [artistName, setArtistName] = useState<string>('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const { playTrack } = useMusicPlayer();

  useEffect(() => {
    void fetchArtistData();
  }, [artistId]);

  async function fetchArtistData() {
    setLoading(true);

    try {
      const userId = getUserId();

      const [{ data: tracksData, error: tracksError }, { count, error: countError }, { data: followData, error: followError }] =
        await Promise.all([
          supabase
            .from('tracks')
            .select('*')
            .eq('artist_id', artistId)
            .order('created_at', { ascending: false }),
          supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('artist_id', artistId),
          supabase
            .from('follows')
            .select('id')
            .eq('artist_id', artistId)
            .eq('follower_user_id', userId)
            .maybeSingle(),
        ]);

      if (tracksError) {
        console.error('Error fetching artist tracks:', tracksError);
        setTracks([]);
      } else {
        const safeTracks = (tracksData || []) as Track[];
        setTracks(safeTracks);

        if (safeTracks.length > 0) {
          setArtistName(safeTracks[0].artist_name || 'Artist');
        } else {
          setArtistName('Artist');
        }
      }

      if (countError) {
        console.error('Error counting followers:', countError);
        setFollowersCount(0);
      } else {
        setFollowersCount(count || 0);
      }

      if (followError) {
        console.error('Error checking follow status:', followError);
        setIsFollowing(false);
      } else {
        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error('Error fetching artist data:', error);
      setTracks([]);
      setFollowersCount(0);
      setIsFollowing(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow() {
    const userId = getUserId();
    const nextState = !isFollowing;

    setIsFollowing(nextState);
    setFollowersCount((prev) => Math.max(0, prev + (nextState ? 1 : -1)));

    if (nextState) {
      const { error } = await supabase.from('follows').insert({
        follower_user_id: userId,
        artist_id: artistId,
      });

      if (error) {
        console.error('Error following artist:', error);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      }

      return;
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .match({
        follower_user_id: userId,
        artist_id: artistId,
      });

    if (error) {
      console.error('Error unfollowing artist:', error);
      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
    }
  }

  const videoTracks = useMemo(
    () =>
      tracks.filter(
        (t) => t.media_type === 'video' && (t.video_url || t.audio_url)
      ),
    [tracks]
  );

  const audioTracks = useMemo(
    () => tracks.filter((t) => t.media_type !== 'video'),
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

  const artistHandle = `@${String(artistName || 'artist')
    .toLowerCase()
    .replace(/\s+/g, '')}`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-xl text-white">Loading artist...</div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <h2 className="text-2xl text-white">Artist not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-purple-600/10 to-pink-600/10 blur-3xl" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-20 top-10 h-64 w-64 rounded-full bg-red-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-end">
            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-white/10 bg-gradient-to-br from-red-500/30 to-purple-500/30 shadow-2xl">
              <Users className="h-20 w-20 text-white/50" />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  <Radio className="h-3.5 w-3.5 text-red-400" />
                  <span>Artist Profile</span>
                </div>

                <h1 className="text-5xl font-black text-white md:text-6xl">
                  {artistName}
                </h1>
                <p className="mt-2 text-sm text-gray-300">{artistHandle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {tracks.length} releases
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {videoTracks.length} videos
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {totalPlays.toLocaleString()} plays
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {totalLikes.toLocaleString()} likes
                </span>
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {followersCount.toLocaleString()} followers
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
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      <span>Follow</span>
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
                  <span>Support Artist</span>
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
            <h2 className="text-3xl font-black text-white">Videos</h2>
          </div>

          {videoTracks.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {videoTracks.map((track) => (
                <div
                  key={track.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:bg-white/10"
                >
                  <div
                    className="relative bg-black"
                    style={{ paddingBottom: '177.78%' }}
                  >
                    <video
                      src={track.video_url || track.audio_url}
                      className="absolute inset-0 h-full w-full object-cover"
                      preload="metadata"
                      muted
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <button
                      onClick={() =>
                        playTrack(
                          {
                            id: track.id,
                            title: track.title,
                            artist_name: track.artist_name,
                            audio_url: track.audio_url,
                            video_url: track.video_url || track.audio_url,
                            cover_url: track.cover_url,
                          },
                          videoTracks.map((t) => ({
                            id: t.id,
                            title: t.title,
                            artist_name: t.artist_name,
                            audio_url: t.audio_url,
                            video_url: t.video_url || t.audio_url,
                            cover_url: t.cover_url,
                          }))
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
                        <span>{track.plays_count.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        <span>{track.likes_count.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {track.genre && (
                        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white">
                          {track.genre}
                        </span>
                      )}
                      {track.language && (
                        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white">
                          {track.language}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-gray-400">
              No videos yet
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
              <Music2 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white">Tracks</h2>
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
                      {track.genre} • {track.language}
                    </p>
                  </div>

                  <div className="hidden text-sm text-gray-400 md:block">
                    {track.plays_count.toLocaleString()} plays
                  </div>

                  <button
                    onClick={() =>
                      playTrack(
                        {
                          id: track.id,
                          title: track.title,
                          artist_name: track.artist_name,
                          audio_url: track.audio_url,
                          video_url: track.video_url,
                          cover_url: track.cover_url,
                        },
                        audioTracks.map((t) => ({
                          id: t.id,
                          title: t.title,
                          artist_name: t.artist_name,
                          audio_url: t.audio_url,
                          video_url: t.video_url,
                          cover_url: t.cover_url,
                        }))
                      )
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 transition hover:scale-105 hover:bg-red-700"
                  >
                    <Play className="ml-0.5 h-5 w-5 text-white" fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-gray-400">
              No tracks yet
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
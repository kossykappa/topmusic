import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart,
  Share2,
  UserPlus,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';

interface ArtistRecord {
  id: string;
  name: string;
  image_url?: string | null;
}

interface TrackRow {
  id: string;
  title: string;
  artist_id: string;
  audio_url: string;
  cover_url?: string | null;
  created_at?: string | null;
  genre?: string | null;
  language?: string | null;
  likes_count?: number | null;
  plays_count?: number | null;
  media_type?: string | null;
}

interface FeedItem extends TrackRow {
  artist_name: string;
  artist_image_url?: string | null;
  isLiked: boolean;
  isFollowing: boolean;
  currentLikesCount: number;
}

function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function Feed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingStates, setPlayingStates] = useState<Record<number, boolean>>(
    {}
  );
  const [mutedStates, setMutedStates] = useState<Record<number, boolean>>({});
  const [currentTimes, setCurrentTimes] = useState<Record<number, number>>({});
  const [durations, setDurations] = useState<Record<number, number>>({});
  const [activeIndex, setActiveIndex] = useState(0);

  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playedTrackIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;

        entries.forEach((entry) => {
          const indexAttr = entry.target.getAttribute('data-index');
          const index = indexAttr ? Number(indexAttr) : -1;

          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        });

        if (bestIndex >= 0) {
          setActiveIndex(bestIndex);
        }
      },
      {
        threshold: [0.4, 0.6, 0.75],
      }
    );

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    if (!items.length) return;
    if (activeIndex < 0 || activeIndex >= items.length) return;

    playIndex(activeIndex);
  }, [activeIndex, items.length]);

  useEffect(() => {
    return () => {
      audioRefs.current.forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  const loadTracks = async () => {
    setLoading(true);

    try {
      const userId = getUserId();

      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select(
          'id, title, artist_id, audio_url, cover_url, created_at, genre, language, likes_count, plays_count'
        )
        .order('created_at', { ascending: false })
        .limit(20);

      if (tracksError) {
        console.error('Error loading tracks:', tracksError);
        setItems([]);
        return;
      }

      const validTracks = ((tracksData || []) as TrackRow[]).filter(
        (track) => track.audio_url && String(track.audio_url).trim() !== ''
      );

      if (validTracks.length === 0) {
        setItems([]);
        return;
      }

      const artistIds = [
        ...new Set(validTracks.map((track) => track.artist_id).filter(Boolean)),
      ];

      let artistsMap = new Map<string, ArtistRecord>();

      if (artistIds.length > 0) {
        const { data: artistsData, error: artistsError } = await supabase
          .from('artists')
          .select('id, name, image_url')
          .in('id', artistIds);

        if (artistsError) {
          console.error('Error loading artists:', artistsError);
        } else {
          artistsMap = new Map(
            ((artistsData || []) as ArtistRecord[]).map((artist) => [
              artist.id,
              artist,
            ])
          );
        }
      }

      const trackIds = validTracks.map((track) => track.id);

      const { data: userLikes, error: likesError } = await supabase
        .from('likes')
        .select('track_id')
        .eq('user_id', userId)
        .in('track_id', trackIds);

      if (likesError) {
        console.error('Error loading likes:', likesError);
      }

      const likedTrackIds = new Set(
        (userLikes || []).map((like) => String(like.track_id))
      );

      const feedItems: FeedItem[] = validTracks.map((track) => {
        const artist = artistsMap.get(track.artist_id);

        return {
          ...track,
          artist_name: artist?.name || 'Artista desconhecido',
          artist_image_url: artist?.image_url || null,
          isLiked: likedTrackIds.has(track.id),
          isFollowing: false,
          currentLikesCount: track.likes_count || 0,
        };
      });

      setItems(feedItems);
      setActiveIndex(0);
    } catch (error) {
      console.error('Unexpected error loading tracks:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const registerPlay = async (trackId: string) => {
    const userId = getUserId();

    const { error } = await supabase.from('plays').insert({
      track_id: trackId,
      user_id: userId,
    });

    if (error) {
      console.error('Error registering play:', error);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === trackId
          ? { ...item, plays_count: (item.plays_count || 0) + 1 }
          : item
      )
    );
  };

  const pauseAllExcept = (indexToKeep?: number) => {
    audioRefs.current.forEach((audio, index) => {
      if (!audio) return;

      if (indexToKeep === undefined || index !== indexToKeep) {
        audio.pause();
        setPlayingStates((prev) => ({ ...prev, [index]: false }));
      }
    });
  };

  const playIndex = (index: number) => {
    const audio = audioRefs.current[index];
    const item = items[index];

    if (!audio || !item) return;

    pauseAllExcept(index);

    audio
      .play()
      .then(() => {
        setPlayingStates((prev) => ({ ...prev, [index]: true }));

        if (!playedTrackIdsRef.current.has(item.id)) {
          playedTrackIdsRef.current.add(item.id);
          void registerPlay(item.id);
        }
      })
      .catch((err) => {
        console.error('Audio play error:', err);
      });
  };

  const togglePlayPause = (index: number) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    if (playingStates[index]) {
      audio.pause();
      setPlayingStates((prev) => ({ ...prev, [index]: false }));
      return;
    }

    pauseAllExcept(index);

    audio
      .play()
      .then(() => {
        setPlayingStates((prev) => ({ ...prev, [index]: true }));
        setActiveIndex(index);

        const item = items[index];
        if (item && !playedTrackIdsRef.current.has(item.id)) {
          playedTrackIdsRef.current.add(item.id);
          void registerPlay(item.id);
        }
      })
      .catch((err) => {
        console.error('Audio play error:', err);
      });
  };

  const toggleMute = (index: number) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    const nextMuted = !(mutedStates[index] ?? false);
    audio.muted = nextMuted;
    setMutedStates((prev) => ({ ...prev, [index]: nextMuted }));
  };

  const handleTimeUpdate = (index: number) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    setCurrentTimes((prev) => ({
      ...prev,
      [index]: audio.currentTime || 0,
    }));
  };

  const handleLoadedMetadata = (index: number) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    setDurations((prev) => ({
      ...prev,
      [index]: audio.duration || 0,
    }));
  };

  const handleSeek = (index: number, progress: number) => {
    const audio = audioRefs.current[index];
    const duration = durations[index];

    if (!audio || !duration) return;

    const nextTime = duration * progress;
    audio.currentTime = nextTime;

    setCurrentTimes((prev) => ({
      ...prev,
      [index]: nextTime,
    }));
  };

  const toggleLike = async (index: number, trackId: string) => {
    const userId = getUserId();
    const currentItem = items[index];
    const newLikedState = !currentItem.isLiked;
    const likesCountDelta = newLikedState ? 1 : -1;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              isLiked: newLikedState,
              currentLikesCount: Math.max(
                0,
                item.currentLikesCount + likesCountDelta
              ),
            }
          : item
      )
    );

    if (newLikedState) {
      const { error: insertError } = await supabase
        .from('likes')
        .insert({ track_id: trackId, user_id: userId });

      if (insertError) {
        console.error('Error adding like:', insertError);

        setItems((prev) =>
          prev.map((item, i) =>
            i === index
              ? {
                  ...item,
                  isLiked: false,
                  currentLikesCount: Math.max(0, item.currentLikesCount - 1),
                }
              : item
          )
        );

        return;
      }
    } else {
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .match({ track_id: trackId, user_id: userId });

      if (deleteError) {
        console.error('Error removing like:', deleteError);

        setItems((prev) =>
          prev.map((item, i) =>
            i === index
              ? {
                  ...item,
                  isLiked: true,
                  currentLikesCount: item.currentLikesCount + 1,
                }
              : item
          )
        );

        return;
      }
    }

    const updatedLikesCount = Math.max(
      0,
      currentItem.currentLikesCount + likesCountDelta
    );

    const { error: updateError } = await supabase
      .from('tracks')
      .update({ likes_count: updatedLikesCount })
      .eq('id', trackId);

    if (updateError) {
      console.error('Error updating track likes_count:', updateError);
    }
  };

  const toggleFollow = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, isFollowing: !item.isFollowing } : item
      )
    );
  };

  const handleShare = async (item: FeedItem) => {
    const shareText = `${item.title} - ${item.artist_name}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: shareText,
          url: window.location.href,
        });
      } catch {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Link copiado!');
    }
  };

  const visibleItemsKey = useMemo(
    () => items.map((item) => item.id).join('-'),
    [items]
  );

  useEffect(() => {
    if (!visibleItemsKey) return;
  }, [visibleItemsKey]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading feed...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
        <div className="mb-4">
          <Music2 className="h-16 w-16 text-white/50" />
        </div>
        <div className="text-2xl font-bold mb-2">No releases yet</div>
        <div className="text-gray-400">
          Upload some tracks to get started!
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black text-white snap-y snap-mandatory overflow-y-auto h-screen">
      {items.map((item, index) => {
        const progress =
          durations[index] && durations[index] > 0
            ? ((currentTimes[index] || 0) / durations[index]) * 100
            : 0;

        return (
          <div
            key={item.id}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            data-index={index}
            className="flex items-center justify-center min-h-screen w-full snap-start py-8 px-4"
          >
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <div
                  className="rounded-3xl bg-black shadow-2xl overflow-hidden border border-white/10"
                  style={{
                    width: '340px',
                    height: '600px',
                  }}
                >
                {item.media_type === 'video' && item.audio_url ? (
  <video
    src={item.audio_url}
    className="h-full w-full object-cover"
    autoPlay
    muted
    loop
    playsInline
    controls={false}
  />
) : item.cover_url ? (
  <img
    src={item.cover_url}
    alt={item.title}
    className="h-full w-full object-cover"
  />
) : item.artists?.image_url ? (
  <img
    src={item.artists.image_url}
    alt={item.artists.name || item.title}
    className="h-full w-full object-cover"
  />
) : (
  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-600/20 via-purple-600/20 to-blue-600/20">
    <Music2 className="h-24 w-24 text-white/30" />
  </div>
)}

                <audio
                  ref={(el) => {
                    audioRefs.current[index] = el;
                  }}
                  src={item.audio_url}
                  preload="metadata"
                  onTimeUpdate={() => handleTimeUpdate(index)}
                  onLoadedMetadata={() => handleLoadedMetadata(index)}
                />

                <div className="flex items-center gap-2 mt-3" style={{ width: '340px' }}>
                  <span className="text-xs font-bold text-white bg-white/20 px-2 py-1 rounded-full">
                    {formatTime(currentTimes[index] || 0)}
                  </span>

                  <div
                    className="flex-1 h-1.5 bg-white/25 rounded-full cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = (e.clientX - rect.left) / rect.width;
                      handleSeek(index, Math.max(0, Math.min(1, ratio)));
                    }}
                  >
                    <div
                      className="h-full bg-white rounded-full transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <span className="text-xs font-bold text-white bg-white/20 px-2 py-1 rounded-full">
                    {formatTime(durations[index] || 0)}
                  </span>
                </div>

                <div className="text-center mt-3" style={{ width: '340px' }}>
                  <h3 className="text-lg font-bold text-white">
                    {item.title} — {item.artist_name}
                  </h3>
                </div>

                <div className="flex justify-center gap-2 mt-2 flex-wrap" style={{ width: '340px' }}>
                  {item.genre && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white">
                      {item.genre}
                    </span>
                  )}
                  {item.language && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white">
                      {item.language}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => togglePlayPause(index)}
                  className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-110 transition-transform"
                >
                  {playingStates[index] ? (
                    <Pause className="w-5 h-5 text-white" fill="currentColor" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={() => toggleMute(index)}
                  className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-110 transition-transform"
                >
                  {mutedStates[index] ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>

                <button
                  onClick={() => toggleLike(index, item.id)}
                  className={`w-14 h-14 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-110 transition-transform ${
                    item.isLiked ? 'bg-red-500/35' : 'bg-white/20'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      item.isLiked ? 'fill-red-500 text-red-500' : 'text-white'
                    }`}
                  />
                </button>

                <button
                  onClick={() => handleShare(item)}
                  className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Share2 className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={() => toggleFollow(index)}
                  className={`w-14 h-14 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-110 transition-transform ${
                    item.isFollowing ? 'bg-green-500/35' : 'bg-white/20'
                  }`}
                >
                  <UserPlus
                    className={`w-5 h-5 ${
                      item.isFollowing ? 'text-green-500' : 'text-white'
                    }`}
                  />
                </button>

                <div className="text-center">
                  <span className="text-xs font-bold text-white drop-shadow-lg">
                    {item.currentLikesCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
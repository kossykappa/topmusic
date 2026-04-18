import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart,
  Share2,
  UserPlus,
  UserCheck,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music2,
  Gift,
  Radio,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/userId';
import { sendGiftToArtist } from '../lib/walletService';

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
  video_url?: string | null;
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

interface FeedProps {
  onNavigate?: (page: string, data?: unknown) => void;
}

function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function isItemVideo(item: FeedItem | TrackRow | undefined | null): boolean {
  if (!item) return false;

  return (
    item.media_type?.toLowerCase() === 'video' ||
    String(item.audio_url || '').toLowerCase().endsWith('.mp4') ||
    String(item.audio_url || '').toLowerCase().endsWith('.mov') ||
    String(item.audio_url || '').toLowerCase().endsWith('.webm') ||
    String(item.video_url || '').toLowerCase().endsWith('.mp4') ||
    String(item.video_url || '').toLowerCase().endsWith('.mov') ||
    String(item.video_url || '').toLowerCase().endsWith('.webm')
  );
}

function calculateScore(item: FeedItem) {
  let score = 0;

  // 📊 popularidade base
  score += (item.plays_count || 0) * 0.2;
  score += (item.currentLikesCount || 0) * 1;

  // ❤️ comportamento directo do user
  if (item.isLiked) score += 50;
  if (item.isFollowing) score += 30;

  // 🔥 histórico inteligente
  score += item._scoreBoost || 0;

  return score;
}

export function Feed({ onNavigate }: FeedProps) {
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
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playedTrackIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    void loadTracks();
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

  items.forEach((item, index) => {
    if (index !== activeIndex) {
      const watched = currentTimes[index] || 0;
      const duration = durations[index] || 0;

      if (watched > 0 && duration > 0 && watched < duration * 0.25) {
        markTrackSkipped(item.id);
      }
    }
  });

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

      videoRefs.current.forEach((video) => {
        if (video) {
          video.pause();
          video.src = '';
        }
      });
    };
  }, []);

  const loadTracks = async () => {
  setLoading(true);

  try {
    const userId = getUserId();

    // 1. likes do utilizador
    const { data: likedTrackIdsData, error: likedIdsError } = await supabase
      .from('likes')
      .select('track_id')
      .eq('user_id', userId);

    if (likedIdsError) {
      console.error('Error loading liked track ids:', likedIdsError);
    }

    const likedTrackIds = (likedTrackIdsData || []).map((row) => row.track_id);

const { data: engagementData, error: engagementError } = await supabase
  .from('track_engagement')
  .select('track_id, watch_seconds, completed, skipped, gifted')
  .eq('user_id', userId);

if (engagementError) {
  console.error('Error loading engagement data:', engagementError);
}

    // 2. artistas seguidos
    const { data: followedArtistsData, error: followedArtistsError } = await supabase
      .from('follows')
      .select('artist_id')
      .eq('follower_user_id', userId);

    if (followedArtistsError) {
      console.error('Error loading followed artists:', followedArtistsError);
    }

    const followedArtistIds = (followedArtistsData || []).map((row) => row.artist_id);

    // 3. descobrir géneros e idiomas favoritos a partir dos likes
    let preferredGenres: string[] = [];
let preferredLanguages: string[] = [];

const engagementTrackIds = (engagementData || []).map((row) => row.track_id);
const allPreferenceTrackIds = Array.from(new Set([...likedTrackIds, ...engagementTrackIds]));

if (allPreferenceTrackIds.length > 0) {
  const { data: preferenceTracksData, error: preferenceTracksError } = await supabase
    .from('tracks')
    .select('id, genre, language')
    .in('id', allPreferenceTrackIds);

  if (preferenceTracksError) {
    console.error('Error loading preference tracks details:', preferenceTracksError);
  } else {
    const genreCount = new Map<string, number>();
    const languageCount = new Map<string, number>();

    (preferenceTracksData || []).forEach((track) => {
      const engagement = (engagementData || []).find((e) => e.track_id === track.id);

      let weight = 1;

      if (engagement?.gifted) weight += 4;
      if (engagement?.completed) weight += 3;
      if ((engagement?.watch_seconds || 0) >= 15) weight += 2;
      if (engagement?.skipped) weight -= 2;

      const genre = String(track.genre || '').trim();
      const language = String(track.language || '').trim();

      if (genre) {
        genreCount.set(genre, (genreCount.get(genre) || 0) + weight);
      }

      if (language) {
        languageCount.set(language, (languageCount.get(language) || 0) + weight);
      }
    });

    preferredGenres = Array.from(genreCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 3);

    preferredLanguages = Array.from(languageCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([language]) => language)
      .slice(0, 2);
  }
}

    // 4. populares
    const { data: popularData, error: popularError } = await supabase
      .from('tracks')
      .select(
        'id, title, artist_id, audio_url, video_url, cover_url, created_at, genre, language, likes_count, plays_count, media_type'
      )
      .order('plays_count', { ascending: false })
      .limit(10);

    if (popularError) {
      console.error('Error loading popular tracks:', popularError);
    }

    // 5. recentes
    const { data: recentData, error: recentError } = await supabase
      .from('tracks')
      .select(
        'id, title, artist_id, audio_url, video_url, cover_url, created_at, genre, language, likes_count, plays_count, media_type'
      )
      .order('created_at', { ascending: false })
      .limit(8);

    if (recentError) {
      console.error('Error loading recent tracks:', recentError);
    }

    // 6. artistas seguidos
    let followedArtistsTracks: TrackRow[] = [];

    if (followedArtistIds.length > 0) {
      const { data: followedTracksData, error: followedTracksError } = await supabase
        .from('tracks')
        .select(
          'id, title, artist_id, audio_url, video_url, cover_url, created_at, genre, language, likes_count, plays_count, media_type'
        )
        .in('artist_id', followedArtistIds)
        .limit(8);

      if (followedTracksError) {
        console.error('Error loading followed artists tracks:', followedTracksError);
      } else {
        followedArtistsTracks = (followedTracksData || []) as TrackRow[];
      }
    }

    // 7. afinidade por género
    let affinityGenreTracks: TrackRow[] = [];

    if (preferredGenres.length > 0) {
      const { data: affinityGenreData, error: affinityGenreError } = await supabase
        .from('tracks')
        .select(
          'id, title, artist_id, audio_url, video_url, cover_url, created_at, genre, language, likes_count, plays_count, media_type'
        )
        .in('genre', preferredGenres)
        .limit(8);

      if (affinityGenreError) {
        console.error('Error loading genre affinity tracks:', affinityGenreError);
      } else {
        affinityGenreTracks = (affinityGenreData || []) as TrackRow[];
      }
    }

    // 8. afinidade por idioma
    let affinityLanguageTracks: TrackRow[] = [];

    if (preferredLanguages.length > 0) {
      const { data: affinityLanguageData, error: affinityLanguageError } = await supabase
        .from('tracks')
        .select(
          'id, title, artist_id, audio_url, video_url, cover_url, created_at, genre, language, likes_count, plays_count, media_type'
        )
        .in('language', preferredLanguages)
        .limit(6);

      if (affinityLanguageError) {
        console.error('Error loading language affinity tracks:', affinityLanguageError);
      } else {
        affinityLanguageTracks = (affinityLanguageData || []) as TrackRow[];
      }
    }

    // 9. misturar por prioridade
    const mixedTracks = [
      ...followedArtistsTracks,
      ...affinityGenreTracks,
      ...affinityLanguageTracks,
      ...((popularData || []) as TrackRow[]),
      ...((recentData || []) as TrackRow[]),
    ];

    // 10. remover duplicados e inválidos
    const uniqueTracks = Array.from(
      new Map(mixedTracks.map((track) => [track.id, track])).values()
    ).filter((track) => track.audio_url && String(track.audio_url).trim() !== '');

    // 11. vídeos primeiro
    const videoTracks = uniqueTracks.filter((track) => isItemVideo(track));
    const audioTracks = uniqueTracks.filter((track) => !isItemVideo(track));
    const validTracks = [...videoTracks, ...audioTracks].slice(0, 20);

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

    const likedTrackIdsSet = new Set(
      (userLikes || []).map((like) => String(like.track_id))
    );

    let followedArtistIdsSet = new Set<string>();

    if (artistIds.length > 0) {
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('artist_id')
        .eq('follower_user_id', userId)
        .in('artist_id', artistIds);

      if (followsError) {
        console.error('Error loading follows:', followsError);
      } else {
        followedArtistIdsSet = new Set(
          (followsData || []).map((follow) => String(follow.artist_id))
        );
      }
    }

   const feedItems: FeedItem[] = validTracks.map((track) => {
  const artist = artistsMap.get(track.artist_id);
  const engagement = engagementMap.get(track.id);

  let boost = 0;

  if (engagement) {
    if (engagement.liked) boost += 80;
    if (engagement.gifted) boost += 120;

    const watchRatio =
      engagement.watch_seconds && track.plays_count
        ? engagement.watch_seconds / 30
        : 0;

    boost += watchRatio * 20;

    if (engagement.skipped) boost -= 50;
  }

  return {
    ...track,
    artist_name: artist?.name || 'Artista desconhecido',
    artist_image_url: artist?.image_url || null,
    isLiked: likedTrackIds.has(track.id),
    isFollowing: followedArtistIds.has(track.artist_id),
    currentLikesCount: track.likes_count || 0,

    // 🔥 NOVO
    _scoreBoost: boost,
  };
});

    const sorted = [...feedItems].sort(
  (a, b) => calculateScore(b) - calculateScore(a)
);

setItems(sorted);
    setActiveIndex(0);
  } catch (error) {
    console.error('Unexpected error loading tracks:', error);
    setItems([]);
  } finally {
    setLoading(false);
  }
};

async function upsertTrackEngagement(
  trackId: string,
  updates: Partial<{
    watch_seconds: number;
    completed: boolean;
    skipped: boolean;
    gifted: boolean;
    liked: boolean;
  }>
) {
  const userId = getUserId();

  const { data: engagementData } = await supabase
  .from('track_engagement')
  .select('*')
  .eq('user_id', userId);

  const engagementMap = new Map();

(engagementData || []).forEach((e) => {
  engagementMap.set(e.track_id, e);
});

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('track_engagement')
      .select('*')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching engagement:', fetchError);
      return;
    }

    if (!existing) {
      const { error: insertError } = await supabase.from('track_engagement').insert({
        user_id: userId,
        track_id: trackId,
        watch_seconds: updates.watch_seconds || 0,
        completed: updates.completed || false,
        skipped: updates.skipped || false,
        gifted: updates.gifted || false,
        liked: updates.liked || false,
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('Error inserting engagement:', insertError);
      }

      return;
    }

    const nextPayload = {
      watch_seconds:
        typeof updates.watch_seconds === 'number'
          ? Math.max(Number(existing.watch_seconds || 0), updates.watch_seconds)
          : existing.watch_seconds,
      completed:
        typeof updates.completed === 'boolean'
          ? updates.completed || existing.completed
          : existing.completed,
      skipped:
        typeof updates.skipped === 'boolean'
          ? updates.skipped || existing.skipped
          : existing.skipped,
      gifted:
        typeof updates.gifted === 'boolean'
          ? updates.gifted || existing.gifted
          : existing.gifted,
      liked:
        typeof updates.liked === 'boolean'
          ? updates.liked || existing.liked
          : existing.liked,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('track_engagement')
      .update(nextPayload)
      .eq('user_id', userId)
      .eq('track_id', trackId);

    if (updateError) {
      console.error('Error updating engagement:', updateError);
    }
  } catch (error) {
    console.error('Unexpected engagement error:', error);
  }
}

function markTrackSkipped(trackId: string) {
  void upsertTrackEngagement(trackId, { skipped: true });
}

function markTrackGifted(trackId: string) {
  void upsertTrackEngagement(trackId, { gifted: true });
}

function markTrackLiked(trackId: string) {
  void upsertTrackEngagement(trackId, { liked: true });
}

function markTrackWatched(trackId: string, watchSeconds: number, completed = false) {
  void upsertTrackEngagement(trackId, {
    watch_seconds: watchSeconds,
    completed,
  });
}
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

    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (indexToKeep === undefined || index !== indexToKeep) {
        video.pause();
        setPlayingStates((prev) => ({ ...prev, [index]: false }));
      }
    });
  };

  const playIndex = (index: number) => {
    const item = items[index];
    if (!item) return;

    pauseAllExcept(index);

    const isVideo = isItemVideo(item);
    const audio = audioRefs.current[index];
    const video = videoRefs.current[index];

    if (isVideo && video) {
      video.muted = mutedStates[index] ?? true;

      video
        .play()
        .then(() => {
          setPlayingStates((prev) => ({ ...prev, [index]: true }));

          if (!playedTrackIdsRef.current.has(item.id)) {
            playedTrackIdsRef.current.add(item.id);
            void registerPlay(item.id);
          }
        })
        .catch((err) => {
          console.error('Video play error:', err);
        });

      return;
    }

    if (!isVideo && audio) {
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
    }
  };

  const togglePlayPause = (index: number) => {
    const item = items[index];
    if (!item) return;

    const isVideo = isItemVideo(item);
    const audio = audioRefs.current[index];
    const video = videoRefs.current[index];

    if (playingStates[index]) {
      if (isVideo && video) video.pause();
      if (!isVideo && audio) audio.pause();

      setPlayingStates((prev) => ({ ...prev, [index]: false }));
      return;
    }

    pauseAllExcept(index);

    if (isVideo && video) {
      video.muted = mutedStates[index] ?? true;

      video
        .play()
        .then(() => {
          setPlayingStates((prev) => ({ ...prev, [index]: true }));
          setActiveIndex(index);

          if (!playedTrackIdsRef.current.has(item.id)) {
            playedTrackIdsRef.current.add(item.id);
            void registerPlay(item.id);
          }
        })
        .catch((err) => {
          console.error('Video play error:', err);
        });

      return;
    }

    if (!isVideo && audio) {
      audio
        .play()
        .then(() => {
          setPlayingStates((prev) => ({ ...prev, [index]: true }));
          setActiveIndex(index);

          if (!playedTrackIdsRef.current.has(item.id)) {
            playedTrackIdsRef.current.add(item.id);
            void registerPlay(item.id);
          }
        })
        .catch((err) => {
          console.error('Audio play error:', err);
        });
    }
  };

  const toggleMute = (index: number) => {
    const item = items[index];
    if (!item) return;

    const nextMuted = !(mutedStates[index] ?? false);
    const isVideo = isItemVideo(item);

    if (isVideo) {
      const video = videoRefs.current[index];
      if (!video) return;
      video.muted = nextMuted;
    } else {
      const audio = audioRefs.current[index];
      if (!audio) return;
      audio.muted = nextMuted;
    }

    setMutedStates((prev) => ({ ...prev, [index]: nextMuted }));
  };

  const handleTimeUpdate = (index: number) => {
  const item = items[index];
  if (!item) return;

  const isVideo = isItemVideo(item);

  if (isVideo) {
    const video = videoRefs.current[index];
    if (!video) return;

    const currentTime = video.currentTime || 0;
    const duration = video.duration || 0;

    setCurrentTimes((prev) => ({
      ...prev,
      [index]: currentTime,
    }));

    if (currentTime >= 3) {
      markTrackWatched(
        item.id,
        currentTime,
        duration > 0 && currentTime >= duration * 0.8
      );
    }

    return;
  }

  const audio = audioRefs.current[index];
  if (!audio) return;

  const currentTime = audio.currentTime || 0;
  const duration = audio.duration || 0;

  setCurrentTimes((prev) => ({
    ...prev,
    [index]: currentTime,
  }));

  if (currentTime >= 3) {
    markTrackWatched(
      item.id,
      currentTime,
      duration > 0 && currentTime >= duration * 0.8
    );
  }
};

  const handleLoadedMetadata = (index: number) => {
    const item = items[index];
    if (!item) return;

    const isVideo = isItemVideo(item);

    if (isVideo) {
      const video = videoRefs.current[index];
      if (!video) return;

      setDurations((prev) => ({
        ...prev,
        [index]: video.duration || 0,
      }));
      return;
    }

    const audio = audioRefs.current[index];
    if (!audio) return;

    setDurations((prev) => ({
      ...prev,
      [index]: audio.duration || 0,
    }));
  };

  const handleSeek = (index: number, progress: number) => {
    const item = items[index];
    const duration = durations[index];

    if (!item || !duration) return;

    const nextTime = duration * progress;
    const isVideo = isItemVideo(item);

    if (isVideo) {
      const video = videoRefs.current[index];
      if (!video) return;

      video.currentTime = nextTime;
    } else {
      const audio = audioRefs.current[index];
      if (!audio) return;

      audio.currentTime = nextTime;
    }

    setCurrentTimes((prev) => ({
      ...prev,
      [index]: nextTime,
    }));
  };

  const toggleLike = async (index: number, trackId: string) => {
    const userId = getUserId();
    const currentItem = items[index];
    if (!currentItem) return;

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

      markTrackLiked(trackId);

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

  const toggleFollow = async (index: number) => {
    const userId = getUserId();
    const currentItem = items[index];
    if (!currentItem || !currentItem.artist_id) return;

    const nextFollowingState = !currentItem.isFollowing;

    setItems((prev) =>
      prev.map((item, i) =>
        item.artist_id === currentItem.artist_id
          ? { ...item, isFollowing: nextFollowingState }
          : item
      )
    );

    if (nextFollowingState) {
      const { error } = await supabase.from('follows').insert({
        follower_user_id: userId,
        artist_id: currentItem.artist_id,
      });

      if (error) {
        console.error('Error adding follow:', error);

        setItems((prev) =>
          prev.map((item) =>
            item.artist_id === currentItem.artist_id
              ? { ...item, isFollowing: false }
              : item
          )
        );
      }

      return;
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .match({
        follower_user_id: userId,
        artist_id: currentItem.artist_id,
      });

    if (error) {
      console.error('Error removing follow:', error);

      setItems((prev) =>
        prev.map((item) =>
          item.artist_id === currentItem.artist_id
            ? { ...item, isFollowing: true }
            : item
        )
      );
    }
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
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-xl text-white">Loading feed...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <div className="mb-4">
          <Music2 className="h-16 w-16 text-white/50" />
        </div>
        <div className="mb-2 text-2xl font-bold">No releases yet</div>
        <div className="text-gray-400">
          Upload some tracks to get started!
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full snap-y snap-mandatory overflow-y-auto bg-black text-white">
      {items.map((item, index) => {
        const progress =
          durations[index] && durations[index] > 0
            ? ((currentTimes[index] || 0) / durations[index]) * 100
            : 0;

        const artistHandle = `@${String(item.artist_name || 'artist')
          .toLowerCase()
          .replace(/\s+/g, '')}`;

        const videoMode = isItemVideo(item);

        return (
          <div
            key={item.id}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            data-index={index}
            className="relative flex min-h-screen w-full snap-start items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-black" />

            <div className="relative h-full w-full">
              {videoMode ? (
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  src={item.video_url || item.audio_url}
                  className="absolute inset-0 h-full w-full object-cover"
                  muted={mutedStates[index] ?? true}
                  autoPlay
                  loop
                  playsInline
                  preload="auto"
                  onTimeUpdate={() => handleTimeUpdate(index)}
                  onLoadedMetadata={() => handleLoadedMetadata(index)}
                />
              ) : item.cover_url ? (
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : item.artist_image_url ? (
                <img
                  src={item.artist_image_url}
                  alt={item.artist_name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-purple-600/20 to-blue-600/20" />
              )}

              {!videoMode && (
                <audio
                  ref={(el) => {
                    audioRefs.current[index] = el;
                  }}
                  src={item.audio_url}
                  preload="metadata"
                  onTimeUpdate={() => handleTimeUpdate(index)}
                  onLoadedMetadata={() => handleLoadedMetadata(index)}
                />
              )}

              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

              <div className="absolute left-4 top-4 z-20 flex items-center gap-3 rounded-full bg-black/35 px-3 py-2 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-bold text-white shadow-lg">
                  {item.artist_image_url ? (
                    <img
                      src={item.artist_image_url}
                      alt={item.artist_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    item.artist_name.slice(0, 2).toUpperCase()
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white">
                      {item.artist_name}
                    </h2>
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-200">{artistHandle}</p>
                </div>
              </div>

              <div className="absolute bottom-8 left-4 z-20 max-w-md">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    🎵 {videoMode ? 'VIDEO' : 'AUDIO'}
                  </span>

                  {item.genre && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {item.genre}
                    </span>
                  )}

                  {item.language && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {item.language}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-black text-white">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-200">
                  Discover this release, support the artist, and share the vibe with
                  your community.
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => togglePlayPause(index)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:scale-105"
                  >
                    {playingStates[index] ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
                    )}
                    <span>{playingStates[index] ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                   onClick={() => {
  markTrackGifted(item.id);
  onNavigate?.('sendGift', {
    artistId: item.artist_id,
    artistName: item.artist_name,
    artistHandle,
  });
}}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-red-600 px-4 py-2 text-sm font-bold text-white shadow-xl transition hover:scale-105"
                  >
                    <Gift className="h-4 w-4" />
                    <span>Support</span>
                  </button>

                  <button
                    onClick={() =>
                      onNavigate?.('artist', {
                        artistId: item.artist_id,
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    <Radio className="h-4 w-4" />
                    <span>Artist</span>
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-sm">
                    {(item.plays_count || 0).toLocaleString()} plays
                  </span>
                  <span className="rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-sm">
                    {item.currentLikesCount.toLocaleString()} likes
                  </span>
                </div>

                <div className="mt-4 flex w-[320px] max-w-full items-center gap-2">
                  <span className="rounded-full bg-white/15 px-2 py-1 text-xs font-bold text-white">
                    {formatTime(currentTimes[index] || 0)}
                  </span>

                  <div
                    className="h-1.5 flex-1 cursor-pointer rounded-full bg-white/25"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = (e.clientX - rect.left) / rect.width;
                      handleSeek(index, Math.max(0, Math.min(1, ratio)));
                    }}
                  >
                    <div
                      className="h-full rounded-full bg-white transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <span className="rounded-full bg-white/15 px-2 py-1 text-xs font-bold text-white">
                    {formatTime(durations[index] || 0)}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-24 right-4 z-20 flex flex-col items-center gap-5">
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => toggleLike(index, item.id)}
                    className={`flex h-14 w-14 items-center justify-center rounded-full border border-white/10 backdrop-blur-md transition hover:scale-110 ${
                      item.isLiked ? 'bg-red-500/35' : 'bg-white/20'
                    }`}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        item.isLiked ? 'fill-red-500 text-red-500' : 'text-white'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-white drop-shadow-lg">
                    {item.currentLikesCount.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => toggleFollow(index)}
                    className={`flex h-14 w-14 items-center justify-center rounded-full border border-white/10 backdrop-blur-md transition hover:scale-110 ${
                      item.isFollowing ? 'bg-green-500/35' : 'bg-white/20'
                    }`}
                  >
                    {item.isFollowing ? (
                      <UserCheck className="h-5 w-5 text-green-500" />
                    ) : (
                      <UserPlus className="h-5 w-5 text-white" />
                    )}
                  </button>
                  <span className="text-[10px] font-bold text-white/90">
                    {item.isFollowing ? 'Following' : 'Follow'}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() =>
                      onNavigate?.('sendGift', {
                        artistId: item.artist_id,
                        artistName: item.artist_name,
                        artistHandle,
                      })
                    }
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-red-600 text-white shadow-xl transition hover:scale-110 animate-pulse"
                  >
                    <Gift className="h-5 w-5" />
                  </button>
                  <span className="text-[10px] font-bold text-white/90">
                    Gift
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleShare(item)}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/20 backdrop-blur-md transition hover:scale-110"
                  >
                    <Share2 className="h-5 w-5 text-white" />
                  </button>
                  <span className="text-[10px] font-bold text-white/90">
                    Share
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => toggleMute(index)}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/20 backdrop-blur-md transition hover:scale-110"
                  >
                    {mutedStates[index] ? (
                      <VolumeX className="h-5 w-5 text-white" />
                    ) : (
                      <Volume2 className="h-5 w-5 text-white" />
                    )}
                  </button>
                  <span className="text-[10px] font-bold text-white/90">
                    Audio
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
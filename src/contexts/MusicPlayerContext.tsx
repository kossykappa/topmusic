import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url: string;
  video_url?: string;
  media_type?: string;
  genre?: string;
  language?: string;
}

interface MusicPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playlist: Track[];
  currentIndex: number;
  isLoading: boolean;
  canPlay: boolean;
  playTrack: (track: Track, newPlaylist?: Track[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playCountedRef = useRef<Set<string>>(new Set());

  const isTrackVideo = (track: Track | null) => {
    if (!track) return false;

    return (
      track.media_type?.toLowerCase() === 'video' ||
      track.audio_url?.toLowerCase().endsWith('.mp4') ||
      track.audio_url?.toLowerCase().endsWith('.mov') ||
      track.audio_url?.toLowerCase().endsWith('.webm') ||
      track.video_url?.toLowerCase().endsWith('.mp4') ||
      track.video_url?.toLowerCase().endsWith('.mov') ||
      track.video_url?.toLowerCase().endsWith('.webm')
    );
  };

  const getTrackMediaUrl = (track: Track | null) => {
    if (!track) return '';
    return isTrackVideo(track)
      ? track.video_url || track.audio_url
      : track.audio_url;
  };

  const getActiveMediaElement = (track: Track | null) => {
    return isTrackVideo(track) ? videoRef.current : audioRef.current;
  };

  const pauseInactiveMedia = (track: Track | null) => {
    const usingVideo = isTrackVideo(track);

    if (usingVideo) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    }
  };

  const trackPlay = async (trackId: string) => {
    if (playCountedRef.current.has(trackId)) return;

    try {
      const { data: track } = await supabase
        .from('tracks')
        .select('plays_count')
        .eq('id', trackId)
        .single();

      if (track) {
        const { error } = await supabase
          .from('tracks')
          .update({ plays_count: (track.plays_count || 0) + 1 })
          .eq('id', trackId);

        if (error) {
          console.error('Error updating play count:', error);
        } else {
          playCountedRef.current.add(trackId);
        }
      }
    } catch (error) {
      console.error('Error in trackPlay:', error);
    }
  };

  const startTrackPlayback = (track: Track) => {
    const mediaUrl = getTrackMediaUrl(track);
    const media = getActiveMediaElement(track);

    pauseInactiveMedia(track);

    if (!media || !mediaUrl) {
      console.error('No media element or media URL found');
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    media.src = mediaUrl;
    media.load();

    const handleCanPlay = () => {
      setCanPlay(true);
    };

    media.addEventListener('canplay', handleCanPlay, { once: true });

    media
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error playing media:', error);
        setIsPlaying(false);
        setIsLoading(false);
        media.removeEventListener('canplay', handleCanPlay);
      });
  };

  const playTrack = (track: Track, newPlaylist?: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    setIsLoading(true);
    setCanPlay(false);

    if (newPlaylist) {
      setPlaylist(newPlaylist);
      const index = newPlaylist.findIndex((t) => t.id === track.id);
      setCurrentIndex(index !== -1 ? index : 0);
    } else if (playlist.length > 0) {
      const index = playlist.findIndex((t) => t.id === track.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    } else {
      setPlaylist([track]);
      setCurrentIndex(0);
    }

    trackPlay(track.id);

    setTimeout(() => {
      startTrackPlayback(track);
    }, 100);
  };

  const togglePlay = () => {
    if (!currentTrack) return;

    const media = getActiveMediaElement(currentTrack);

    if (!media) {
      console.error('No active media element found');
      return;
    }

    if (isPlaying) {
      media.pause();
      setIsPlaying(false);
    } else {
      media
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('Error playing media:', error);
          setIsPlaying(false);
        });
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;

    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextTrack = playlist[nextIndex];

    setCurrentTrack(nextTrack);
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
    setIsLoading(true);
    setCanPlay(false);

    trackPlay(nextTrack.id);

    setTimeout(() => {
      startTrackPlayback(nextTrack);
    }, 100);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;

    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    const prevTrack = playlist[prevIndex];

    setCurrentTrack(prevTrack);
    setCurrentIndex(prevIndex);
    setIsPlaying(true);
    setIsLoading(true);
    setCanPlay(false);

    trackPlay(prevTrack.id);

    setTimeout(() => {
      startTrackPlayback(prevTrack);
    }, 100);
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        canPlay,
        playlist,
        currentIndex,
        playTrack,
        togglePlay,
        playNext,
        playPrevious,
        audioRef,
        videoRef,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}
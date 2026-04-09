import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Track {
  id: string;
  title: string;
  artist_name: string;
  audio_url: string;
  cover_url: string;
  video_url?: string;
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

  const trackPlay = async (trackId: string) => {
    if (playCountedRef.current.has(trackId)) {
      return;
    }

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
          console.log('Play count incremented for track:', trackId);
        }
      }
    } catch (error) {
      console.error('Error in trackPlay:', error);
    }
  };

  const playTrack = (track: Track, newPlaylist?: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setIsLoading(true);
      setCanPlay(false);

      if (newPlaylist) {
        setPlaylist(newPlaylist);
        const index = newPlaylist.findIndex(t => t.id === track.id);
        setCurrentIndex(index !== -1 ? index : 0);
      } else if (playlist.length > 0) {
        const index = playlist.findIndex(t => t.id === track.id);
        if (index !== -1) {
          setCurrentIndex(index);
        }
      } else {
        setPlaylist([track]);
        setCurrentIndex(0);
      }

      trackPlay(track.id);

      setTimeout(() => {
        // Determine if this is video or audio
        const mediaUrl = track.video_url || track.audio_url;
        const isVideo = track.video_url && track.video_url.trim() !== '';
        const media = isVideo ? videoRef.current : audioRef.current;

        if (media) {
          console.log('Setting media source:', mediaUrl);
          media.src = mediaUrl;
          media.load();

          // Set up one-time canplay listener
          const handleCanPlay = () => {
            setCanPlay(true);
            console.log('Media can play');
          };
          media.addEventListener('canplay', handleCanPlay, { once: true });

          console.log('Attempting to play media:', media.src);
          media.play()
            .then(() => {
              setIsLoading(false);
              console.log('Media started playing successfully');
            })
            .catch(error => {
              console.error('Error playing media:', error);
              setIsPlaying(false);
              setIsLoading(false);
              media.removeEventListener('canplay', handleCanPlay);
            });
        } else {
          console.error('No media element found');
          setIsPlaying(false);
          setIsLoading(false);
        }
      }, 100);
    }
  };

  const togglePlay = () => {
    if (!currentTrack) {
      console.error('No current track');
      return;
    }

    // Determine which media element to use
    const isVideo = currentTrack.video_url && currentTrack.video_url.trim() !== '';
    const media = isVideo ? videoRef.current : audioRef.current;

    if (!media) {
      console.error('No media element found');
      return;
    }

    if (isPlaying) {
      media.pause();
      setIsPlaying(false);
      console.log('Media paused');
    } else {
      console.log('Attempting to play media:', media.src);
      media.play()
        .then(() => {
          setIsPlaying(true);
          console.log('Media playing successfully');
        })
        .catch(error => {
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
      const mediaUrl = nextTrack.video_url || nextTrack.audio_url;
      const isVideo = nextTrack.video_url && nextTrack.video_url.trim() !== '';
      const media = isVideo ? videoRef.current : audioRef.current;

      if (media) {
        console.log('Setting next track source:', mediaUrl);
        media.src = mediaUrl;
        media.load();

        const handleCanPlay = () => {
          setCanPlay(true);
        };
        media.addEventListener('canplay', handleCanPlay, { once: true });

        media.play()
          .then(() => {
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Error playing next track:', error);
            setIsPlaying(false);
            setIsLoading(false);
            media.removeEventListener('canplay', handleCanPlay);
          });
      }
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
      const mediaUrl = prevTrack.video_url || prevTrack.audio_url;
      const isVideo = prevTrack.video_url && prevTrack.video_url.trim() !== '';
      const media = isVideo ? videoRef.current : audioRef.current;

      if (media) {
        console.log('Setting previous track source:', mediaUrl);
        media.src = mediaUrl;
        media.load();

        const handleCanPlay = () => {
          setCanPlay(true);
        };
        media.addEventListener('canplay', handleCanPlay, { once: true });

        media.play()
          .then(() => {
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Error playing previous track:', error);
            setIsPlaying(false);
            setIsLoading(false);
            media.removeEventListener('canplay', handleCanPlay);
          });
      }
    }, 100);
  };

  return (
    <MusicPlayerContext.Provider value={{
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
      videoRef
    }}>
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

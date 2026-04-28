import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
  Heart,
  Music2,
} from 'lucide-react';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

export default function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    playNext,
    playPrevious,
  } = useMusicPlayer();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const audioUrl = currentTrack?.audio_url || '';
const videoUrl = currentTrack?.video_url || '';

const isVideo =
  !!videoUrl ||
  audioUrl.toLowerCase().endsWith('.mp4') ||
  audioUrl.toLowerCase().endsWith('.mov') ||
  audioUrl.toLowerCase().endsWith('.webm');

const mediaUrl = audioUrl || videoUrl;

  const mediaRef = audioRef; // força áudio sempre

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);

    const media = mediaRef.current;
    if (!media || !mediaUrl) return;

    console.log('🎵 MEDIA URL:', mediaUrl);

    media.src = mediaUrl;
    media.load();
    media.volume = isMuted ? 0 : volume;

    const onLoadedMetadata = () => {
      if (Number.isFinite(media.duration)) {
        setDuration(media.duration);
      }
    };

    const onDurationChange = () => {
      if (Number.isFinite(media.duration)) {
        setDuration(media.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(media.currentTime || 0);
    };

    media.addEventListener('loadedmetadata', onLoadedMetadata);
    media.addEventListener('durationchange', onDurationChange);
    media.addEventListener('timeupdate', onTimeUpdate);

    media.onloadeddata = () => {
  if (isPlaying) {
    media.play().catch((error) => {
      console.error('Erro ao tocar media:', error);
    });
  }
};

    return () => {
      media.removeEventListener('loadedmetadata', onLoadedMetadata);
      media.removeEventListener('durationchange', onDurationChange);
      media.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [currentTrack?.id, mediaUrl, isVideo]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.play().catch((error) => {
        console.error('Erro ao tocar:', error);
      });
    } else {
      media.pause();
    }
  }, [isPlaying, isVideo]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    media.volume = isMuted ? 0 : volume;
    media.muted = isMuted;
  }, [volume, isMuted, isVideo]);

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const media = mediaRef.current;
    const nextTime = Number(e.target.value);

    if (!media) return;

    media.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextVolume = Number(e.target.value);
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
  }

  function toggleMute() {
    setIsMuted((prev) => !prev);
  }

  function formatTime(time: number) {
    if (!Number.isFinite(time) || time < 0) return '0:00';

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  if (!currentTrack) return null;

  return (
    <>
      <audio ref={audioRef} preload="metadata" />
      <video ref={videoRef} preload="metadata" className="hidden" playsInline />

      {!isExpanded && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-gradient-to-t from-black via-gray-900 to-gray-900/95 backdrop-blur-xl">
          <div className="mx-auto h-24 max-w-screen-2xl px-4 sm:px-6">
            <div className="flex h-full items-center justify-between gap-4">
              <div
                onClick={() => setIsExpanded(true)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5 lg:w-72 lg:flex-none"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-black">
                  {currentTrack.cover_url ? (
                    <img
                      src={currentTrack.cover_url}
                      alt={currentTrack.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Music2 className="h-6 w-6 text-white/40" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-medium text-white">
                    {currentTrack.title}
                  </h4>
                  <p className="truncate text-xs text-gray-400">
                    {currentTrack.artist_name}
                  </p>
                </div>
              </div>

              <div className="hidden max-w-2xl flex-1 flex-col gap-2 md:flex">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={playPrevious}
                    className="text-white/70 transition-all hover:text-white"
                  >
                    <SkipBack className="h-5 w-5 fill-current" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white transition-all hover:scale-105 hover:bg-gray-100"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 fill-black text-black" />
                    ) : (
                      <Play className="ml-0.5 h-5 w-5 fill-black text-black" />
                    )}
                  </button>

                  <button
                    onClick={playNext}
                    className="text-white/70 transition-all hover:text-white"
                  >
                    <SkipForward className="h-5 w-5 fill-current" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-10 text-right text-xs tabular-nums text-gray-400">
                    {formatTime(currentTime)}
                  </span>

                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.01"
                    value={currentTime}
                    onChange={handleSeek}
                    className="h-1 flex-1 cursor-pointer"
                  />

                  <span className="w-10 text-xs tabular-nums text-gray-400">
                    {duration ? formatTime(duration) : '--:--'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="hidden text-white/70 transition-colors hover:text-white lg:block"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="hidden w-24 cursor-pointer lg:block"
                />

                <button
                  onClick={togglePlay}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white md:hidden"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-black text-black" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4 fill-black text-black" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-gray-900 via-black to-black">
          <div className="flex min-h-screen flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6">
              <button
                onClick={() => setIsExpanded(false)}
                className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="text-sm text-white/50">Now Playing</div>

              <button className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                <Heart className="h-6 w-6" />
              </button>
            </div>

            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 pb-8 sm:px-6">
              <div className="mb-8 w-full max-w-md">
                {currentTrack.cover_url ? (
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl shadow-2xl">
                    <img
                      src={currentTrack.cover_url}
                      alt={currentTrack.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-2xl">
                    <Music2 className="h-20 w-20 text-white/40" />
                  </div>
                )}
              </div>

              <div className="mb-6 w-full max-w-md">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.01"
                  value={currentTime}
                  onChange={handleSeek}
                  className="mb-2 h-1.5 w-full cursor-pointer"
                />

                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration ? formatTime(duration) : '--:--'}</span>
                </div>
              </div>

              <div className="mb-2 w-full max-w-md text-center">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {currentTrack.title}
                </h1>
              </div>

              <div className="mb-8 w-full max-w-md text-center">
                <p className="text-lg text-gray-400">{currentTrack.artist_name}</p>
              </div>

              <div className="mb-8 flex w-full max-w-md items-center justify-center gap-6">
                <button
                  onClick={playPrevious}
                  className="text-white/70 transition-all hover:scale-110 hover:text-white"
                >
                  <SkipBack className="h-8 w-8 fill-current" />
                </button>

                <button
                  onClick={togglePlay}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-2xl transition-all hover:scale-105"
                >
                  {isPlaying ? (
                    <Pause className="h-7 w-7 fill-black text-black" />
                  ) : (
                    <Play className="ml-1 h-7 w-7 fill-black text-black" />
                  )}
                </button>

                <button
                  onClick={playNext}
                  className="text-white/70 transition-all hover:scale-110 hover:text-white"
                >
                  <SkipForward className="h-8 w-8 fill-current" />
                </button>
              </div>

              <div className="flex w-full max-w-xs items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="text-white/70 transition-colors hover:text-white"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
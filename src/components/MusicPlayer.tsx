import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
  Heart,
} from 'lucide-react';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

export default function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    canPlay,
    togglePlay,
    playNext,
    playPrevious,
    audioRef,
    videoRef,
  } = useMusicPlayer();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedPercentage, setBufferedPercentage] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);

  const trackData = currentTrack as
    | (typeof currentTrack & {
        media_type?: string;
        genre?: string;
        language?: string;
      })
    | null;

  const isVideo =
    trackData?.media_type?.toLowerCase() === 'video' ||
    trackData?.audio_url?.toLowerCase().endsWith('.mp4') ||
    trackData?.audio_url?.toLowerCase().endsWith('.mov') ||
    trackData?.audio_url?.toLowerCase().endsWith('.webm') ||
    trackData?.video_url?.toLowerCase().endsWith('.mp4') ||
    trackData?.video_url?.toLowerCase().endsWith('.mov') ||
    trackData?.video_url?.toLowerCase().endsWith('.webm');

  const mediaUrl = isVideo
    ? trackData?.video_url || currentTrack?.audio_url
    : currentTrack?.audio_url;

  const mediaRef = isVideo ? videoRef : audioRef;

  useEffect(() => {
    if (isVideo && currentTrack) {
      setIsExpanded(true);
    }
  }, [isVideo, currentTrack]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(media.currentTime || 0);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(media.duration || 0);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handleProgress = () => {
      if (!media.duration || !isFinite(media.duration)) {
        setBufferedPercentage(0);
        return;
      }

      if (media.buffered.length > 0) {
        const bufferedEnd = media.buffered.end(media.buffered.length - 1);
        const percentage = (bufferedEnd / media.duration) * 100;
        setBufferedPercentage(Math.max(0, Math.min(100, percentage)));
      }
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('durationchange', handleLoadedMetadata);
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('progress', handleProgress);

    media.volume = isMuted ? 0 : volume;

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('durationchange', handleLoadedMetadata);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('progress', handleProgress);
    };
  }, [mediaRef, isDragging, volume, isMuted]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !mediaUrl) return;

    media.src = mediaUrl;
    media.load();
    media.volume = isMuted ? 0 : volume;

    if (isVideo && videoRef.current) {
      videoRef.current.muted = isMuted;
    }

    if (isPlaying) {
      media.play().catch((error) => {
        console.error('Error playing media:', error);
      });
    }
  }, [currentTrack, mediaUrl, mediaRef, isPlaying, volume, isMuted, isVideo, videoRef]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !mediaRef.current || !duration || !isFinite(duration)) {
      return;
    }

    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const nextTime = Math.max(0, Math.min(duration, pos * duration));

    mediaRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleProgressClick(e);
    }
  };

  const handleProgressMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);

    setVolume(newVolume);

    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
    }

    if (isVideo && videoRef.current) {
      videoRef.current.muted = newVolume === 0;
    }

    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isMuted) {
      const restoredVolume = volume || 0.5;
      media.volume = restoredVolume;

      if (isVideo && videoRef.current) {
        videoRef.current.muted = false;
      }

      setVolume(restoredVolume);
      setIsMuted(false);
    } else {
      media.volume = 0;

      if (isVideo && videoRef.current) {
        videoRef.current.muted = true;
      }

      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  const progressPercentage =
    duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {!isExpanded && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-gradient-to-t from-black via-gray-900 to-gray-900/95 backdrop-blur-xl">
          <div className="mx-auto h-20 max-w-screen-2xl px-4 sm:px-6">
            <div className="flex h-full items-center justify-between gap-4">
              <div
                onClick={() => setIsExpanded(true)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5 lg:w-72 lg:flex-none"
              >
                <div className="flex-shrink-0">
                  {isVideo && mediaUrl ? (
                    <div className="h-12 w-12 overflow-hidden rounded bg-black">
                      <video
                        ref={videoRef}
                        src={mediaUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        autoPlay
                        loop
                        preload="auto"
                      />
                    </div>
                  ) : currentTrack.cover_url ? (
                    <img
                      src={currentTrack.cover_url}
                      alt={currentTrack.title}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-gradient-to-br from-blue-500/30 to-purple-500/30">
                      <span className="text-xl">🎵</span>
                    </div>
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
                    disabled={isLoading || !canPlay}
                    className="text-white/70 transition-all duration-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Previous track"
                  >
                    <SkipBack className="h-5 w-5 fill-current" />
                  </button>

                  <button
                    onClick={togglePlay}
                    disabled={isLoading || !canPlay}
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-white transition-all duration-200 hover:scale-105 hover:bg-gray-100 active:scale-95 disabled:cursor-not-allowed ${
                      isLoading || !canPlay ? 'animate-pulse opacity-50' : 'opacity-100'
                    }`}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isLoading || isBuffering ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    ) : isPlaying ? (
                      <Pause className="h-4 w-4 fill-black text-black" />
                    ) : (
                      <Play className="ml-0.5 h-4 w-4 fill-black text-black" />
                    )}
                  </button>

                  <button
                    onClick={playNext}
                    disabled={isLoading || !canPlay}
                    className="text-white/70 transition-all duration-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Next track"
                  >
                    <SkipForward className="h-5 w-5 fill-current" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-10 text-right text-xs tabular-nums text-gray-400">
                    {formatTime(currentTime)}
                  </span>

                  <div
                    ref={progressRef}
                    className="group relative h-1 flex-1 cursor-pointer rounded-full bg-white/10"
                    onMouseDown={handleProgressMouseDown}
                    onMouseMove={handleProgressMouseMove}
                    onMouseUp={handleProgressMouseUp}
                    onClick={handleProgressClick}
                  >
                    <div
                      className="absolute h-full rounded-full bg-white/20 transition-all duration-500"
                      style={{
                        width: `${bufferedPercentage}%`,
                        opacity: bufferedPercentage > 0 ? 1 : 0,
                      }}
                    />
                    <div
                      className="absolute h-full rounded-full bg-white transition-all duration-200"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100" />
                    </div>
                  </div>

                  <span
                    className={`w-10 text-xs tabular-nums text-gray-400 transition-opacity duration-300 ${
                      duration > 0 ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    {duration > 0 ? formatTime(duration) : '--:--'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 md:hidden">
                <button
                  onClick={togglePlay}
                  disabled={isLoading || !canPlay}
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-white transition-all ${
                    isLoading || !canPlay ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  {isLoading || isBuffering ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4 fill-black text-black" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4 fill-black text-black" />
                  )}
                </button>
              </div>

              <div className="hidden w-44 items-center gap-3 lg:flex">
                <button
                  onClick={toggleMute}
                  className="text-white/70 transition-colors hover:text-white"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>

                <div className="group relative h-1 flex-1 rounded-full bg-white/10">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                    aria-label="Volume"
                  />
                  <div
                    className="pointer-events-none absolute h-full rounded-full bg-white transition-all"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
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
                aria-label="Close player"
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
                {isVideo && mediaUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
                    <video
                      ref={videoRef}
                      src={mediaUrl}
                      className="h-full w-full object-cover"
                      controls
                      playsInline
                      preload="auto"
                    />
                  </div>
                ) : currentTrack.cover_url ? (
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl shadow-2xl">
                    <img
                      src={currentTrack.cover_url}
                      alt={currentTrack.title}
                      className="h-full w-full object-cover"
                    />
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-2xl">
                    <span className="text-8xl">🎵</span>
                  </div>
                )}
              </div>

              <div className="mb-6 w-full max-w-md">
                <div
                  ref={progressRef}
                  className="group relative mb-2 h-1.5 cursor-pointer rounded-full bg-white/10"
                  onMouseDown={handleProgressMouseDown}
                  onMouseMove={handleProgressMouseMove}
                  onMouseUp={handleProgressMouseUp}
                  onClick={handleProgressClick}
                >
                  <div
                    className="absolute h-full rounded-full bg-white/20 transition-all duration-500"
                    style={{
                      width: `${bufferedPercentage}%`,
                      opacity: bufferedPercentage > 0 ? 1 : 0,
                    }}
                  />
                  <div
                    className="absolute h-full rounded-full bg-white transition-all duration-200"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100" />
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-400">
                  <span className="tabular-nums">{formatTime(currentTime)}</span>
                  <span
                    className={`tabular-nums transition-opacity ${
                      duration > 0 ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    {duration > 0 ? formatTime(duration) : '--:--'}
                  </span>
                </div>
              </div>

              <div className="mb-2 w-full max-w-md text-center">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {currentTrack.title}
                </h1>
              </div>

              <div className="mb-4 w-full max-w-md text-center">
                <p className="text-lg text-gray-400">{currentTrack.artist_name}</p>
              </div>

              {(trackData?.genre || trackData?.language) && (
                <div className="mb-8 flex w-full max-w-md flex-wrap justify-center gap-2">
                  {trackData?.genre && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">
                      {trackData.genre}
                    </span>
                  )}
                  {trackData?.language && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">
                      {trackData.language}
                    </span>
                  )}
                </div>
              )}

              {(isLoading || isBuffering) && (
                <div className="mb-6 flex animate-pulse items-center justify-center gap-2 text-sm text-white/70">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  <span>{isLoading ? 'Loading...' : 'Buffering...'}</span>
                </div>
              )}

              <div className="mb-8 flex w-full max-w-md items-center justify-center gap-6">
                <button
                  onClick={playPrevious}
                  disabled={isLoading || !canPlay}
                  className="text-white/70 transition-all duration-200 hover:scale-110 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous track"
                >
                  <SkipBack className="h-8 w-8 fill-current" />
                </button>

                <button
                  onClick={togglePlay}
                  disabled={isLoading || !canPlay}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-2xl transition-all duration-200 hover:scale-105 hover:bg-gray-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isLoading || isBuffering ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  ) : isPlaying ? (
                    <Pause className="h-7 w-7 fill-black text-black" />
                  ) : (
                    <Play className="ml-1 h-7 w-7 fill-black text-black" />
                  )}
                </button>

                <button
                  onClick={playNext}
                  disabled={isLoading || !canPlay}
                  className="text-white/70 transition-all duration-200 hover:scale-110 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next track"
                >
                  <SkipForward className="h-8 w-8 fill-current" />
                </button>
              </div>

              <div className="flex w-full max-w-xs items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="text-white/70 transition-colors hover:text-white"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>

                <div className="group relative h-1 flex-1 rounded-full bg-white/10">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                    aria-label="Volume"
                  />
                  <div
                    className="pointer-events-none absolute h-full rounded-full bg-white transition-all"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
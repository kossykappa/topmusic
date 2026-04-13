import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, X, Heart } from 'lucide-react';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

export default function MusicPlayer() {
  const { currentTrack, isPlaying, isLoading, canPlay, togglePlay, playNext, playPrevious, audioRef, videoRef } = useMusicPlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedPercentage, setBufferedPercentage] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Determine if this is a video track based on media_type field
  const trackData = currentTrack as typeof currentTrack & { media_type?: string; genre?: string; language?: string };
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
const mediaUrl = isVideo
  ? trackData?.video_url || currentTrack?.audio_url
  : currentTrack?.audio_url;
  const mediaUrl = isVideo ? trackData?.video_url : currentTrack?.audio_url;
  {isVideo && mediaUrl ? (
  <div className="w-12 h-12 rounded overflow-hidden bg-black">
    <video
      ref={videoRef}
      src={mediaUrl}
      className="w-full h-full object-cover"
      muted
      playsInline
      autoPlay
      loop
      preload="auto"
    />
  </div>
) : currentTrack.cover_url ? (

  // Event handlers for media element
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(media.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handleProgress = () => {
      if (media.buffered.length > 0) {
        const bufferedEnd = media.buffered.end(media.buffered.length - 1);
        const percentage = (bufferedEnd / media.duration) * 100;
        setBufferedPercentage(percentage);
      }
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('durationchange', handleLoadedMetadata);
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('progress', handleProgress);

    // Set volume
    media.volume = volume;

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('durationchange', handleLoadedMetadata);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('progress', handleProgress);
    };
  }, [mediaRef, isDragging, volume]);

  // Update media source when track changes
  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !mediaUrl) return;

    media.src = mediaUrl;
    media.load();

    if (isPlaying) {
      media.play().catch(error => {
        console.error('Error playing media:', error);
      });
    }
  }, [currentTrack, mediaUrl, mediaRef, isPlaying]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !mediaRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    mediaRef.current.currentTime = newTime;
    setCurrentTime(newTime);
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
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      if (isMuted) {
        mediaRef.current.volume = volume || 0.5;
        setVolume(volume || 0.5);
        setIsMuted(false);
      } else {
        mediaRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  const progressPercentage = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Minimized player bar at bottom */}
      {!isExpanded && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-gray-900 to-gray-900/95 backdrop-blur-xl border-t border-white/10 z-40">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-20">
            <div className="h-full flex items-center justify-between gap-4">
              {/* Track info */}
              <div
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-3 min-w-0 flex-1 lg:flex-none lg:w-72 cursor-pointer hover:bg-white/5 rounded-lg p-2 -ml-2 transition-colors"
              >
                <div className="flex-shrink-0">
                  {isVideo && mediaUrl ? (
  <div className="w-12 h-12 rounded overflow-hidden bg-black">
    <video
  ref={videoRef}
  src={mediaUrl}
  className="w-full h-full object-cover"
  controls
  playsInline
  preload="auto"
/>
  </div>
) : currentTrack.cover_url ? (
                    <img
                      src={currentTrack.cover_url}
                      alt={currentTrack.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
                      <span className="text-xl">🎵</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-white font-medium truncate text-sm">
                    {currentTrack.title}
                  </h4>
                  <p className="text-gray-400 text-xs truncate">
                    {currentTrack.artist_name}
                  </p>
                </div>
              </div>

              {/* Desktop controls */}
              <div className="hidden md:flex flex-col flex-1 max-w-2xl gap-2">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={playPrevious}
                    disabled={isLoading || !canPlay}
                    className="text-white/70 hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous track"
                  >
                    <SkipBack className="w-5 h-5 fill-current" />
                  </button>
                  <button
                    onClick={togglePlay}
                    disabled={isLoading || !canPlay}
                    className={`w-9 h-9 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed ${(isLoading || !canPlay) ? 'opacity-50 animate-pulse' : 'opacity-100'}`}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isLoading || isBuffering ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="w-4 h-4 text-black fill-black" />
                    ) : (
                      <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={playNext}
                    disabled={isLoading || !canPlay}
                    className="text-white/70 hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next track"
                  >
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-10 text-right tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                  <div
                    ref={progressRef}
                    className="flex-1 relative h-1 bg-white/10 rounded-full cursor-pointer group"
                    onMouseDown={handleProgressMouseDown}
                    onMouseMove={handleProgressMouseMove}
                    onMouseUp={handleProgressMouseUp}
                    onClick={handleProgressClick}
                  >
                    <div
                      className="absolute h-full bg-white/20 rounded-full transition-all duration-500"
                      style={{
                        width: `${bufferedPercentage}%`,
                        opacity: bufferedPercentage > 0 ? 1 : 0
                      }}
                    />
                    <div
                      className="absolute h-full bg-white rounded-full transition-all duration-200"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                    </div>
                  </div>
                  <span className={`text-xs text-gray-400 w-10 tabular-nums transition-opacity duration-300 ${duration > 0 ? 'opacity-100' : 'opacity-50'}`}>
                    {duration > 0 ? formatTime(duration) : '--:--'}
                  </span>
                </div>
              </div>

              {/* Mobile play button */}
              <div className="flex md:hidden items-center gap-2">
                <button
                  onClick={togglePlay}
                  disabled={isLoading || !canPlay}
                  className={`w-10 h-10 rounded-full bg-white flex items-center justify-center transition-all ${(isLoading || !canPlay) ? 'opacity-50' : 'opacity-100'}`}
                >
                  {isLoading || isBuffering ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4 text-black fill-black" />
                  ) : (
                    <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                  )}
                </button>
              </div>

              {/* Volume control */}
              <div className="hidden lg:flex items-center gap-3 w-44">
                <button
                  onClick={toggleMute}
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 relative h-1 bg-white/10 rounded-full group">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                    aria-label="Volume"
                  />
                  <div
                    className="absolute h-full bg-white rounded-full transition-all pointer-events-none"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded full-screen player */}
      {isExpanded && (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-black to-black z-50 overflow-y-auto">
          <div className="min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6">
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                aria-label="Close player"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="text-white/50 text-sm">Now Playing</div>
              <button className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                <Heart className="w-6 h-6" />
              </button>
            </div>

            {/* Main content - centered vertical layout */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-8 max-w-2xl mx-auto w-full">
              {/* 1. Media (Cover image or Video) */}
              <div className="w-full max-w-md mb-8">
               {isVideo && mediaUrl ? (
  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-2xl">
    <video
      ref={videoRef}
      src={mediaUrl}
      className="w-full h-full object-cover"
      controls
      playsInline
      preload="auto"
    />
  </div>
) : currentTrack.cover_url ? (
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-2xl">
                    <img
                      src={currentTrack.cover_url}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shadow-2xl">
                    <span className="text-8xl">🎵</span>
                  </div>
                )}
              </div>

              {/* 2. Progress Bar */}
              <div className="w-full max-w-md mb-6">
                <div
                  ref={progressRef}
                  className="relative h-1.5 bg-white/10 rounded-full cursor-pointer group mb-2"
                  onMouseDown={handleProgressMouseDown}
                  onMouseMove={handleProgressMouseMove}
                  onMouseUp={handleProgressMouseUp}
                  onClick={handleProgressClick}
                >
                  <div
                    className="absolute h-full bg-white/20 rounded-full transition-all duration-500"
                    style={{
                      width: `${bufferedPercentage}%`,
                      opacity: bufferedPercentage > 0 ? 1 : 0
                    }}
                  />
                  <div
                    className="absolute h-full bg-white rounded-full transition-all duration-200"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="tabular-nums">{formatTime(currentTime)}</span>
                  <span className={`tabular-nums transition-opacity ${duration > 0 ? 'opacity-100' : 'opacity-50'}`}>
                    {duration > 0 ? formatTime(duration) : '--:--'}
                  </span>
                </div>
              </div>

              {/* 3. Track Title */}
              <div className="w-full max-w-md mb-2 text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {currentTrack.title}
                </h1>
              </div>

              {/* 4. Artist Name */}
              <div className="w-full max-w-md mb-4 text-center">
                <p className="text-lg text-gray-400">
                  {currentTrack.artist_name}
                </p>
              </div>

              {/* 5. Genre/Language Tags */}
              {(trackData.genre || trackData.language) && (
                <div className="w-full max-w-md mb-8 flex flex-wrap gap-2 justify-center">
                  {trackData.genre && (
                    <span className="px-3 py-1 bg-white/10 text-white/70 text-sm rounded-full">
                      {trackData.genre}
                    </span>
                  )}
                  {trackData.language && (
                    <span className="px-3 py-1 bg-white/10 text-white/70 text-sm rounded-full">
                      {trackData.language}
                    </span>
                  )}
                </div>
              )}

              {/* Loading/Buffering indicator */}
              {(isLoading || isBuffering) && (
                <div className="mb-6 flex items-center justify-center gap-2 text-sm text-white/70 animate-pulse">
                  <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  <span>{isLoading ? 'Loading...' : 'Buffering...'}</span>
                </div>
              )}

              {/* 6. Playback Controls */}
              <div className="w-full max-w-md flex items-center justify-center gap-6 mb-8">
                <button
                  onClick={playPrevious}
                  disabled={isLoading || !canPlay}
                  className="text-white/70 hover:text-white transition-all duration-200 transform hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-8 h-8 fill-current" />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={isLoading || !canPlay}
                  className={`w-16 h-16 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-2xl disabled:cursor-not-allowed ${(isLoading || !canPlay) ? 'opacity-50 animate-pulse' : 'opacity-100'}`}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isLoading || isBuffering ? (
                    <div className="w-7 h-7 border-3 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-7 h-7 text-black fill-black" />
                  ) : (
                    <Play className="w-7 h-7 text-black fill-black ml-1" />
                  )}
                </button>
                <button
                  onClick={playNext}
                  disabled={isLoading || !canPlay}
                  className="text-white/70 hover:text-white transition-all duration-200 transform hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next track"
                >
                  <SkipForward className="w-8 h-8 fill-current" />
                </button>
              </div>

              {/* Volume Control */}
              <div className="w-full max-w-xs flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 relative h-1 bg-white/10 rounded-full group">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                    aria-label="Volume"
                  />
                  <div
                    className="absolute h-full bg-white rounded-full transition-all pointer-events-none"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden audio element for audio tracks */}
          {!isVideo && <audio ref={audioRef} />}
        </div>
      )}

      {/* Hidden audio element when minimized */}
      {!isExpanded && !isVideo && <audio ref={audioRef} />}
    </>
  );
}

export function isVideoFile(url: string): boolean {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  const lowerUrl = url.toLowerCase();
  // Remove query parameters before checking extension
  const urlWithoutParams = lowerUrl.split('?')[0];
  return videoExtensions.some(ext => urlWithoutParams.endsWith(ext) || urlWithoutParams.includes(ext));
}

export function isAudioFile(url: string): boolean {
  if (!url) return false;
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
  const lowerUrl = url.toLowerCase();
  // Remove query parameters before checking extension
  const urlWithoutParams = lowerUrl.split('?')[0];
  return audioExtensions.some(ext => urlWithoutParams.endsWith(ext) || urlWithoutParams.includes(ext));
}

export function getMediaType(url: string): 'video' | 'audio' {
  return isVideoFile(url) ? 'video' : 'audio';
}

export const ACCEPTED_AUDIO_TYPES = '.mp3,.wav';
export const ACCEPTED_VIDEO_TYPES = '.mp4';
export const ACCEPTED_MEDIA_TYPES = `${ACCEPTED_AUDIO_TYPES},${ACCEPTED_VIDEO_TYPES}`;

export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.mp3', '.wav', '.mp4'];
  const isValid = validExtensions.some(ext => fileName.endsWith(ext));

  if (!isValid) {
    return {
      valid: false,
      error: 'Only MP3, WAV, and MP4 files are supported'
    };
  }

  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 100MB'
    };
  }

  return { valid: true };
}

import { useState } from 'react';
import { Upload, Music, Check, Loader2, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { GENRE_CATEGORIES, LANGUAGE_OPTIONS } from '../types';
import { validateMediaFile } from '../utils/fileTypes';

interface UploadMusicProps {
  onNavigate: (page: string) => void;
}

export default function UploadMusic({ onNavigate }: UploadMusicProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    artistName: '',
    genre: '',
    language: '',
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

  const sanitizeFilename = (filename: string): string => {
    const ext = filename.split('.').pop() || '';
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    const sanitized = nameWithoutExt
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    return sanitized || `file.${ext}`;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!audioFile || !coverFile) {
      setError(t('upload.messages.selectFiles'));
      return;
    }

    const validation = validateMediaFile(audioFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);

    try {
      setUploadProgress(t('upload.messages.coverUploading'));

      const coverFileExt = coverFile.name.split('.').pop() || 'jpg';
      const coverBaseName = sanitizeFilename(coverFile.name).replace(/\.[^/.]+$/, '');
      const coverFileName = `${Date.now()}-${coverBaseName}.${coverFileExt}`;
      const coverFilePath = coverFileName;

      console.log('Cover upload path:', coverFilePath);

      const { error: coverError } = await supabase.storage
        .from('covers')
        .upload(coverFilePath, coverFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: coverFile.type,
        });

      if (coverError) {
        console.error('Cover upload error:', coverError);
        throw new Error(`${t('upload.messages.failedCover')}: ${coverError.message}`);
      }

      const {
        data: { publicUrl: coverUrl },
      } = supabase.storage.from('covers').getPublicUrl(coverFilePath);

      console.log('Cover uploaded successfully:', coverUrl);

      setUploadProgress(t('upload.messages.audioUploading'));

      const audioFileExt = audioFile.name.split('.').pop() || 'mp3';
      const audioBaseName = sanitizeFilename(audioFile.name).replace(/\.[^/.]+$/, '');
      const audioFileName = `${Date.now()}-${audioBaseName}.${audioFileExt}`;
      const audioFilePath = audioFileName;

      console.log('Audio upload path:', audioFilePath);

      const { error: audioError } = await supabase.storage
        .from('tracks')
        .upload(audioFilePath, audioFile, {
          cacheControl: '3600',
          upsert: false,
          contentType:
            audioFile.type || (audioFile.name.toLowerCase().endsWith('.mp4') ? 'video/mp4' : 'audio/mpeg'),
        });

      if (audioError) {
        console.error('Audio upload error:', audioError);
        throw new Error(`${t('upload.messages.failedAudio')}: ${audioError.message}`);
      }

      const {
        data: { publicUrl: audioUrl },
      } = supabase.storage.from('tracks').getPublicUrl(audioFilePath);

      console.log('Audio uploaded successfully:', audioUrl);

      setUploadProgress(t('upload.messages.saving'));

      const { error: trackError } = await supabase.from('tracks').insert([
        {
          title: formData.title,
          artist_name: formData.artistName,
          genre: formData.genre,
          language: formData.language,
          cover_url: coverUrl,
          audio_url: audioUrl,
        },
      ]);

      if (trackError) {
        console.error('Database insert error:', trackError);
        throw new Error(trackError.message);
      }

      setSuccess(true);
      setFormData({ title: '', artistName: '', genre: '', language: '' });
      setAudioFile(null);
      setCoverFile(null);
      setAudioPreviewUrl(null);

      setTimeout(() => {
        onNavigate('home');
      }, 2000);
    } catch (error: any) {
      console.error('Error uploading music:', error);
      setError(error.message || t('upload.messages.uploadFailed'));
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white">{t('upload.messages.success')}</h2>
          <p className="text-gray-400">{t('upload.messages.successMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('upload.title')}{' '}
            <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
              {t('upload.titleHighlight')}
            </span>
          </h1>
          <p className="text-gray-400 text-lg">{t('upload.subtitle')}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-red-900/20 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('upload.form.trackName')} {t('upload.form.required')}
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
              placeholder={t('upload.form.trackNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('upload.form.artistName')} {t('upload.form.required')}
            </label>
            <input
              type="text"
              required
              value={formData.artistName}
              onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
              placeholder={t('upload.form.artistNamePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('upload.form.genre')} {t('upload.form.required')}
              </label>
              <select
                required
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
              >
                <option value="">{t('upload.form.genreSelect')}</option>
                {GENRE_CATEGORIES.map((category) => (
                  <optgroup key={category.name} label={category.name}>
                    {category.genres.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('upload.form.language')} {t('upload.form.required')}
              </label>
              <select
                required
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
              >
                <option value="">{t('upload.form.languageSelect')}</option>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Audio or Video {t('upload.form.required')}
            </label>
            <p className="text-xs text-gray-500 mb-2">MP3, WAV, or MP4 (max 100MB)</p>
            <div className="relative">
              <input
                type="file"
                required
                accept=".mp3,.wav,.mp4"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setAudioFile(file);
                  if (file) {
                    setAudioPreviewUrl(URL.createObjectURL(file));
                  } else {
                    setAudioPreviewUrl(null);
                  }
                }}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white file:mr-4 rtl:file:mr-0 rtl:file:ml-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
              />
            </div>
            {audioFile && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  {audioFile.type.startsWith('video/') ? (
                    <Video className="w-4 h-4 text-red-400" />
                  ) : (
                    <Music className="w-4 h-4 text-red-400" />
                  )}
                  <p className="text-sm text-gray-400">
                    {t('upload.messages.selected')}: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>

                {audioPreviewUrl && audioFile.type.startsWith('video/') ? (
                  <div className="relative w-full max-w-md rounded-lg overflow-hidden bg-black border border-red-500/50">
                    <video src={audioPreviewUrl} controls autoPlay muted className="w-full aspect-video object-contain" />
                  </div>
                ) : audioPreviewUrl ? (
                  <div className="relative w-full max-w-md">
                    <audio
                      src={audioPreviewUrl}
                      controls
                      autoPlay
                      className="w-full"
                      style={{
                        backgroundColor: '#000',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                      }}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('upload.form.coverImage')} {t('upload.form.required')}
            </label>
            <div className="relative">
              <input
                type="file"
                required
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
              />
            </div>
            {coverFile && (
              <div className="mt-4">
                <img
                  src={URL.createObjectURL(coverFile)}
                  alt="Cover preview"
                  className="w-32 h-32 object-cover rounded-lg border border-purple-500/50"
                />
                <p className="mt-2 text-sm text-gray-400">
                  {coverFile.name} ({(coverFile.size / 1024).toFixed(2)} KB)
                </p>
              </div>
            )}
          </div>

          {uploadProgress && (
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{uploadProgress}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full flex items-center justify-center space-x-2 rtl:space-x-reverse px-6 py-4 bg-gradient-to-r from-red-600 to-purple-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg shadow-red-500/50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('upload.form.uploading')}</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>{t('upload.form.uploadButton')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
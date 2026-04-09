import { useEffect, useState } from 'react';
import { Upload, Music, Check, Loader2, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { GENRE_CATEGORIES, LANGUAGE_OPTIONS } from '../types';
import { validateMediaFile } from '../utils/fileTypes';

interface UploadMusicProps {
  onNavigate: (page: string) => void;
}

interface ArtistRow {
  id: string;
  name: string;
  image_url?: string | null;
}

export default function UploadMusic({ onNavigate }: UploadMusicProps) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: '',
    artistName: '',
    genre: '',
    language: '',
  });

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [mediaPreviewUrl, coverPreviewUrl]);

  const sanitizeFilename = (filename: string): string => {
    const lastDot = filename.lastIndexOf('.');
    const ext = lastDot >= 0 ? filename.slice(lastDot + 1) : '';
    const nameWithoutExt = lastDot >= 0 ? filename.slice(0, lastDot) : filename;

    const sanitizedBase = nameWithoutExt
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return ext ? `${sanitizedBase || 'file'}.${ext}` : sanitizedBase || 'file';
  };

  const isVideoFile = (file: File | null) => {
    if (!file) return false;
    return (
      file.type.startsWith('video/') ||
      file.name.toLowerCase().endsWith('.mp4') ||
      file.name.toLowerCase().endsWith('.mov') ||
      file.name.toLowerCase().endsWith('.webm')
    );
  };

  async function findOrCreateArtist(name: string, imageUrl?: string | null) {
    const normalizedName = name.trim();

    const { data: existingArtist, error: existingArtistError } = await supabase
      .from('artists')
      .select('id, name, image_url')
      .ilike('name', normalizedName)
      .maybeSingle();

    if (existingArtistError) {
      throw new Error(`Erro ao verificar artista: ${existingArtistError.message}`);
    }

    if (existingArtist) {
      if (!existingArtist.image_url && imageUrl) {
        const { error: updateArtistError } = await supabase
          .from('artists')
          .update({ image_url: imageUrl })
          .eq('id', existingArtist.id);

        if (updateArtistError) {
          console.error('Erro ao actualizar imagem do artista:', updateArtistError);
        }
      }

      return existingArtist.id;
    }

    const { data: newArtist, error: insertArtistError } = await supabase
      .from('artists')
      .insert([
        {
          name: normalizedName,
          image_url: imageUrl || null,
        },
      ])
      .select('id')
      .single();

    if (insertArtistError || !newArtist) {
      throw new Error(
        `Erro ao criar artista: ${insertArtistError?.message || 'desconhecido'}`
      );
    }

    return newArtist.id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!mediaFile || !coverFile) {
      setError(t('upload.messages.selectFiles'));
      return;
    }

    if (!formData.title.trim() || !formData.artistName.trim()) {
      setError('Preencha o título e o nome do artista.');
      return;
    }

    const validation = validateMediaFile(mediaFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);

    try {
      const videoMode = isVideoFile(mediaFile);

      setUploadProgress(t('upload.messages.coverUploading'));

      const coverExt = coverFile.name.split('.').pop() || 'jpg';
      const coverBaseName = sanitizeFilename(coverFile.name).replace(/\.[^/.]+$/, '');
      const coverFileName = `${Date.now()}-${coverBaseName}.${coverExt}`;
      const coverFilePath = coverFileName;

      const { error: coverError } = await supabase.storage
        .from('covers')
        .upload(coverFilePath, coverFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: coverFile.type || 'image/jpeg',
        });

      if (coverError) {
        throw new Error(`${t('upload.messages.failedCover')}: ${coverError.message}`);
      }

      const {
        data: { publicUrl: coverUrl },
      } = supabase.storage.from('covers').getPublicUrl(coverFilePath);

      setUploadProgress(videoMode ? 'A carregar vídeo...' : t('upload.messages.audioUploading'));

      const mediaExt = mediaFile.name.split('.').pop() || (videoMode ? 'mp4' : 'mp3');
      const mediaBaseName = sanitizeFilename(mediaFile.name).replace(/\.[^/.]+$/, '');
      const mediaFileName = `${Date.now()}-${mediaBaseName}.${mediaExt}`;
      const mediaFilePath = mediaFileName;

      const mediaContentType =
        mediaFile.type ||
        (videoMode ? 'video/mp4' : 'audio/mpeg');

      const { error: mediaError } = await supabase.storage
        .from('tracks')
        .upload(mediaFilePath, mediaFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: mediaContentType,
        });

      if (mediaError) {
        throw new Error(
          `${videoMode ? 'Falha no upload do vídeo' : t('upload.messages.failedAudio')}: ${mediaError.message}`
        );
      }

      const {
        data: { publicUrl: mediaUrl },
      } = supabase.storage.from('tracks').getPublicUrl(mediaFilePath);

      setUploadProgress('A preparar artista...');

      const artistId = await findOrCreateArtist(formData.artistName, coverUrl);

      setUploadProgress(t('upload.messages.saving'));

      const payload = {
        title: formData.title.trim(),
        artist_id: artistId,
        genre: formData.genre || null,
        language: formData.language || null,
        cover_url: coverUrl,
        audio_url: mediaUrl,
        video_url: videoMode ? mediaUrl : null,
        media_type: videoMode ? 'video' : 'audio',
        likes_count: 0,
        plays_count: 0,
      };

      const { error: trackError } = await supabase.from('tracks').insert([payload]);

      if (trackError) {
        throw new Error(trackError.message);
      }

      setSuccess(true);
      setFormData({
        title: '',
        artistName: '',
        genre: '',
        language: '',
      });
      setMediaFile(null);
      setCoverFile(null);

      if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);

      setMediaPreviewUrl(null);
      setCoverPreviewUrl(null);

      setTimeout(() => {
        onNavigate('feed');
      }, 1800);
    } catch (err: any) {
      console.error('Error uploading media:', err);
      setError(err.message || t('upload.messages.uploadFailed'));
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

            <input
              type="file"
              required
              accept=".mp3,.wav,.mp4,audio/*,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setMediaFile(file);

                if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);

                if (file) {
                  setMediaPreviewUrl(URL.createObjectURL(file));
                } else {
                  setMediaPreviewUrl(null);
                }
              }}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white file:mr-4 rtl:file:mr-0 rtl:file:ml-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
            />

            {mediaFile && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  {isVideoFile(mediaFile) ? (
                    <Video className="w-4 h-4 text-red-400" />
                  ) : (
                    <Music className="w-4 h-4 text-red-400" />
                  )}
                  <p className="text-sm text-gray-400">
                    {t('upload.messages.selected')}: {mediaFile.name} (
                    {(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>

                {mediaPreviewUrl && isVideoFile(mediaFile) ? (
                  <div className="relative w-full max-w-md rounded-lg overflow-hidden bg-black border border-red-500/50">
                    <video
                      src={mediaPreviewUrl}
                      controls
                      muted
                      className="w-full aspect-video object-contain"
                    />
                  </div>
                ) : mediaPreviewUrl ? (
                  <div className="relative w-full max-w-md">
                    <audio
                      src={mediaPreviewUrl}
                      controls
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

            <input
              type="file"
              required
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setCoverFile(file);

                if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);

                if (file) {
                  setCoverPreviewUrl(URL.createObjectURL(file));
                } else {
                  setCoverPreviewUrl(null);
                }
              }}
              className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
            />

            {coverFile && coverPreviewUrl && (
              <div className="mt-4">
                <img
                  src={coverPreviewUrl}
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
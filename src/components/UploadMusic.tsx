import { useEffect, useState } from 'react';
import {
  Upload,
  Music,
  Check,
  Loader2,
  Video,
  Sparkles,
  Radio,
  Coins,
  Image as ImageIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { GENRE_CATEGORIES, LANGUAGE_OPTIONS } from '../types';
import { validateMediaFile } from '../utils/fileTypes';

interface UploadMusicProps {
  onNavigate: (page: string, data?: unknown) => void;
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

      const mediaContentType = mediaFile.type || (videoMode ? 'video/mp4' : 'audio/mpeg');

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
        artist_name: formData.artistName.trim(),
        genre: formData.genre || null,
        language: formData.language || null,
        cover_url: coverUrl,
        audio_url: mediaUrl,
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white">{t('upload.messages.success')}</h2>
          <p className="text-gray-400">{t('upload.messages.successMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* HERO */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-pink-400" />
            <span>Publish your sound to the world</span>
          </div>

          <h1 className="mb-4 text-4xl font-black text-white md:text-6xl">
            {t('upload.title')}{' '}
            <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
              {t('upload.titleHighlight')}
            </span>
          </h1>

          <p className="mx-auto max-w-3xl text-lg text-gray-400">
            Faz upload das tuas músicas e vídeos, entra no feed, cresce em visibilidade
            e prepara-te para interagir com fãs dentro do ecossistema TopMusic.
          </p>
        </div>

        {/* VALUE BLOCKS */}
        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <Radio className="mb-3 h-6 w-6 text-red-400" />
            <h3 className="font-bold text-white">Entra no feed</h3>
            <p className="mt-2 text-sm text-gray-400">
              O teu conteúdo pode ser descoberto por novos ouvintes e fãs.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <Coins className="mb-3 h-6 w-6 text-yellow-400" />
            <h3 className="font-bold text-white">Prepara monetização</h3>
            <p className="mt-2 text-sm text-gray-400">
              Constrói a tua presença para receber apoio e gifts no ecossistema.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <Upload className="mb-3 h-6 w-6 text-purple-400" />
            <h3 className="font-bold text-white">Audio e vídeo</h3>
            <p className="mt-2 text-sm text-gray-400">
              Publica singles, sessões ao vivo, videoclipes e mais.
            </p>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-red-900/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 space-y-8"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                {t('upload.form.trackName')} {t('upload.form.required')}
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500"
                placeholder={t('upload.form.trackNamePlaceholder')}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                {t('upload.form.artistName')} {t('upload.form.required')}
              </label>
              <input
                type="text"
                required
                value={formData.artistName}
                onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500"
                placeholder={t('upload.form.artistNamePlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                {t('upload.form.genre')} {t('upload.form.required')}
              </label>
              <select
                required
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500"
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
              <label className="mb-2 block text-sm font-medium text-gray-300">
                {t('upload.form.language')} {t('upload.form.required')}
              </label>
              <select
                required
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500"
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

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* MEDIA */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-r from-red-600 to-pink-600 p-2">
                  {mediaFile && isVideoFile(mediaFile) ? (
                    <Video className="h-5 w-5 text-white" />
                  ) : (
                    <Music className="h-5 w-5 text-white" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-white">
                  Upload Audio or Video
                </h3>
              </div>

              <p className="mb-3 text-xs text-gray-500">MP3, WAV, or MP4 (max 100MB)</p>

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
                className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white outline-none transition-colors file:mr-4 file:rounded-full file:border-0 file:bg-red-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-red-700 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />

              {mediaFile && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {isVideoFile(mediaFile) ? (
                      <Video className="h-4 w-4 text-red-400" />
                    ) : (
                      <Music className="h-4 w-4 text-red-400" />
                    )}
                    <p className="text-sm text-gray-400">
                      {t('upload.messages.selected')}: {mediaFile.name} (
                      {(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>

                  {mediaPreviewUrl && isVideoFile(mediaFile) ? (
                    <div className="overflow-hidden rounded-xl border border-red-500/40 bg-black">
                      <video
                        src={mediaPreviewUrl}
                        controls
                        muted
                        className="aspect-video w-full object-contain"
                      />
                    </div>
                  ) : mediaPreviewUrl ? (
                    <div className="rounded-xl border border-red-500/40 bg-black p-3">
                      <audio src={mediaPreviewUrl} controls className="w-full" />
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* COVER */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {t('upload.form.coverImage')}
                </h3>
              </div>

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
                className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white outline-none transition-colors file:mr-4 file:rounded-full file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />

              {coverFile && coverPreviewUrl && (
                <div className="mt-4">
                  <div className="overflow-hidden rounded-xl border border-purple-500/40 bg-black inline-block">
                    <img
                      src={coverPreviewUrl}
                      alt="Cover preview"
                      className="h-40 w-40 object-cover"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    {coverFile.name} ({(coverFile.size / 1024).toFixed(2)} KB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {uploadProgress && (
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{uploadProgress}</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-center text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-red-500/40 transition-all hover:scale-105 hover:from-red-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t('upload.form.uploading')}</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>{t('upload.form.uploadButton')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
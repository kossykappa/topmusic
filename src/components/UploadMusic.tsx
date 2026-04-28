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
    licensePrice: '2',
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

  async function findOrCreateArtist(name: string, avatarUrl?: string | null) {
    const normalizedName = name.trim();

    const { data: existingArtist, error: existingArtistError } = await supabase
      .from('artists')
      .select('id, name, avatar_url')
      .ilike('name', normalizedName)
      .maybeSingle();

    if (existingArtistError) {
      throw new Error(`Erro ao verificar artista: ${existingArtistError.message}`);
    }

    if (existingArtist) {
      if (!existingArtist.avatar_url && avatarUrl) {
        await supabase
          .from('artists')
          .update({ avatar_url: avatarUrl })
          .eq('id', existingArtist.id);
      }

      return existingArtist.id;
    }

    const { data: newArtist, error: insertArtistError } = await supabase
      .from('artists')
      .insert([
        {
          name: normalizedName,
          genre: formData.genre || null,
          avatar_url: avatarUrl || null,
          followers_count: 0,
        },
      ])
      .select('id')
      .single();

    if (insertArtistError || !newArtist) {
      throw new Error(`Erro ao criar artista: ${insertArtistError?.message || 'desconhecido'}`);
    }

    return newArtist.id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!mediaFile || !coverFile) {
      setError('Seleccione o ficheiro de música/vídeo e a capa.');
      return;
    }

    if (!formData.title.trim() || !formData.artistName.trim()) {
      setError('Preencha o título e o nome do artista.');
      return;
    }

    const validation = validateMediaFile(mediaFile);
    if (!validation.valid) {
      setError(validation.error || 'Ficheiro inválido.');
      return;
    }

    setUploading(true);

    try {
      const videoMode = isVideoFile(mediaFile);

      setUploadProgress('A carregar capa...');

      const coverExt = coverFile.name.split('.').pop() || 'jpg';
      const coverBaseName = sanitizeFilename(coverFile.name).replace(/\.[^/.]+$/, '');
      const coverFileName = `${Date.now()}-${coverBaseName}.${coverExt}`;

      const { error: coverError } = await supabase.storage
        .from('covers')
        .upload(coverFileName, coverFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: coverFile.type || 'image/jpeg',
        });

      if (coverError) {
        throw new Error(`Falha no upload da capa: ${coverError.message}`);
      }

      const {
        data: { publicUrl: coverUrl },
      } = supabase.storage.from('covers').getPublicUrl(coverFileName);

      setUploadProgress(videoMode ? 'A carregar vídeo...' : 'A carregar áudio...');

      const mediaExt = mediaFile.name.split('.').pop() || (videoMode ? 'mp4' : 'mp3');
      const mediaBaseName = sanitizeFilename(mediaFile.name).replace(/\.[^/.]+$/, '');
      const mediaFileName = `${Date.now()}-${mediaBaseName}.${mediaExt}`;

      const { error: mediaError } = await supabase.storage
        .from('tracks')
        .upload(mediaFileName, mediaFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: mediaFile.type || (videoMode ? 'video/mp4' : 'audio/mpeg'),
        });

      if (mediaError) {
        throw new Error(`Falha no upload do ficheiro: ${mediaError.message}`);
      }

      const {
        data: { publicUrl: mediaUrl },
      } = supabase.storage.from('tracks').getPublicUrl(mediaFileName);

      setUploadProgress('A preparar artista...');

      const artistId = await findOrCreateArtist(formData.artistName, coverUrl);

      setUploadProgress('A guardar música...');

      const { data: newTrack, error: trackError } = await supabase
        .from('tracks')
        .insert([
          {
            title: formData.title.trim(),
            artist_id: artistId,
            genre: formData.genre || null,
            language: formData.language || null,
            cover_url: coverUrl,
            audio_url: videoMode ? null : mediaUrl,
video_url: videoMode ? mediaUrl : null,
media_type: videoMode ? 'video' : 'audio',
            likes_count: 0,
            plays_count: 0,
            status: 'published',
            is_live_enabled: true,
          },
        ])
        .select('id, artist_id')
        .single();

      if (trackError || !newTrack) {
        throw new Error(trackError?.message || 'Erro ao guardar música.');
      }

      setUploadProgress('A criar licença de live...');

      const { error: licenseError } = await supabase.from('track_licenses').insert([
        {
          track_id: newTrack.id,
          artist_id: newTrack.artist_id,
          price: Number(formData.licensePrice) || 2,
          duration_type: '24h',
        },
      ]);

      if (licenseError) {
        throw new Error(`Erro ao criar licença: ${licenseError.message}`);
      }

      setSuccess(true);
      setFormData({
        title: '',
        artistName: '',
        genre: '',
        language: '',
        licensePrice: '2',
      });
      setMediaFile(null);
      setCoverFile(null);
      setMediaPreviewUrl(null);
      setCoverPreviewUrl(null);

      setTimeout(() => {
        onNavigate('feed');
      }, 1800);
    } catch (err: any) {
      console.error('Error uploading media:', err);
      setError(err.message || 'Falha no upload.');
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
          <h2 className="text-3xl font-bold text-white">Música publicada com sucesso</h2>
          <p className="text-gray-400">A música já pode aparecer no feed TopMusic.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-pink-400" />
            <span>Publicar música no TopMusic</span>
          </div>

          <h1 className="mb-4 text-4xl font-black text-white md:text-6xl">
            Upload{' '}
            <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
              TopMusic
            </span>
          </h1>

          <p className="mx-auto max-w-3xl text-lg text-gray-400">
            Publica músicas ou vídeos, cria licença automática para lives e prepara a monetização justa.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <Radio className="mb-3 h-6 w-6 text-red-400" />
            <h3 className="font-bold text-white">Entra no feed</h3>
            <p className="mt-2 text-sm text-gray-400">A música fica disponível para descoberta pública.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <Coins className="mb-3 h-6 w-6 text-yellow-400" />
            <h3 className="font-bold text-white">Licença de live</h3>
            <p className="mt-2 text-sm text-gray-400">O artista define valor para uso da música em lives.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <Upload className="mb-3 h-6 w-6 text-purple-400" />
            <h3 className="font-bold text-white">Áudio ou vídeo</h3>
            <p className="mt-2 text-sm text-gray-400">Suporta músicas, videoclipes e sessões ao vivo.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-3xl border border-red-900/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white"
              placeholder="Título da música"
            />

            <input
              type="text"
              required
              value={formData.artistName}
              onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
              className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white"
              placeholder="Nome do artista"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <select
              required
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white"
            >
              <option value="">Seleccionar género</option>
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

            <select
              required
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white"
            >
              <option value="">Seleccionar idioma</option>
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.licensePrice}
              onChange={(e) => setFormData({ ...formData, licensePrice: e.target.value })}
              className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white"
              placeholder="Preço licença live (€)"
            />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="mb-4 flex items-center gap-2">
                {mediaFile && isVideoFile(mediaFile) ? (
                  <Video className="h-5 w-5 text-white" />
                ) : (
                  <Music className="h-5 w-5 text-white" />
                )}
                <h3 className="text-lg font-bold text-white">Ficheiro áudio ou vídeo</h3>
              </div>

              <input
                type="file"
                required
                accept=".mp3,.wav,.mp4,audio/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setMediaFile(file);
                  if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
                  setMediaPreviewUrl(file ? URL.createObjectURL(file) : null);
                }}
                className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-red-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />

              {mediaPreviewUrl && mediaFile && (
                <div className="mt-4">
                  {isVideoFile(mediaFile) ? (
                    <video src={mediaPreviewUrl} controls muted className="aspect-video w-full rounded-xl bg-black object-contain" />
                  ) : (
                    <audio src={mediaPreviewUrl} controls className="w-full" />
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-white" />
                <h3 className="text-lg font-bold text-white">Capa</h3>
              </div>

              <input
                type="file"
                required
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setCoverFile(file);
                  if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
                  setCoverPreviewUrl(file ? URL.createObjectURL(file) : null);
                }}
                className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />

              {coverPreviewUrl && (
                <img src={coverPreviewUrl} alt="Preview" className="mt-4 h-40 w-40 rounded-xl object-cover" />
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-red-500/40 transition-all hover:scale-105 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>A publicar...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Publicar no TopMusic</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
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
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { GENRE_CATEGORIES, LANGUAGE_OPTIONS } from '../types';
import { validateMediaFile } from '../utils/fileTypes';

interface UploadMusicProps {
  onNavigate: (page: string, data?: unknown) => void;
}

type Step = 1 | 2 | 3;

export default function UploadMusic({ onNavigate }: UploadMusicProps) {
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>(1);
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

  function validateStepOne() {
    if (!formData.title.trim()) {
      setError(t('fillMusicTitle'));
      return false;
    }

    if (!formData.artistName.trim()) {
      setError(t('fillArtistName'));
      return false;
    }

    if (!formData.genre) {
      setError(t('selectGenreError'));
      return false;
    }

    if (!formData.language) {
      setError(t('selectLanguageError'));
      return false;
    }

    setError('');
    return true;
  }

  function validateStepTwo() {
    if (!mediaFile || !coverFile) {
      setError(t('selectMediaAndCover'));
      return false;
    }

    const validation = validateMediaFile(mediaFile);

    if (!validation.valid) {
      setError(validation.error || t('invalidFile'));
      return false;
    }

    setError('');
    return true;
  }

  function nextStep() {
    if (step === 1 && !validateStepOne()) return;
    if (step === 2 && !validateStepTwo()) return;
    setStep((prev) => Math.min(prev + 1, 3) as Step);
  }

  function previousStep() {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1) as Step);
  }

  async function findOrCreateArtist(name: string, avatarUrl?: string | null) {
    const normalizedName = name.trim();

    const { data: existingArtist, error: existingArtistError } = await supabase
      .from('artists')
      .select('id, name, avatar_url')
      .ilike('name', normalizedName)
      .maybeSingle();

    if (existingArtistError) {
      throw new Error(`${t('artistCheckError')}: ${existingArtistError.message}`);
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
      throw new Error(`${t('artistCreateError')}: ${insertArtistError?.message || t('unknown')}`);
    }

    return newArtist.id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validateStepOne()) {
      setStep(1);
      return;
    }

    if (!validateStepTwo()) {
      setStep(2);
      return;
    }

    setUploading(true);

    try {
      const videoMode = isVideoFile(mediaFile);

      setUploadProgress(t('uploadingCover'));

      const coverExt = coverFile!.name.split('.').pop() || 'jpg';
      const coverBaseName = sanitizeFilename(coverFile!.name).replace(/\.[^/.]+$/, '');
      const coverFileName = `${Date.now()}-${coverBaseName}.${coverExt}`;

      const { error: coverError } = await supabase.storage
        .from('covers')
        .upload(coverFileName, coverFile!, {
          cacheControl: '3600',
          upsert: false,
          contentType: coverFile!.type || 'image/jpeg',
        });

      if (coverError) {
        throw new Error(`${t('coverUploadError')}: ${coverError.message}`);
      }

      const {
        data: { publicUrl: coverUrl },
      } = supabase.storage.from('covers').getPublicUrl(coverFileName);

      setUploadProgress(videoMode ? t('uploadingVideo') : t('uploadingAudio'));

      const mediaExt = mediaFile!.name.split('.').pop() || (videoMode ? 'mp4' : 'mp3');
      const mediaBaseName = sanitizeFilename(mediaFile!.name).replace(/\.[^/.]+$/, '');
      const mediaFileName = `${Date.now()}-${mediaBaseName}.${mediaExt}`;

      const { error: mediaError } = await supabase.storage
        .from('tracks')
        .upload(mediaFileName, mediaFile!, {
          cacheControl: '3600',
          upsert: false,
          contentType: mediaFile!.type || (videoMode ? 'video/mp4' : 'audio/mpeg'),
        });

      if (mediaError) {
        throw new Error(`${t('mediaUploadError')}: ${mediaError.message}`);
      }

      const {
        data: { publicUrl: mediaUrl },
      } = supabase.storage.from('tracks').getPublicUrl(mediaFileName);

      setUploadProgress(t('preparingArtist'));

      const artistId = await findOrCreateArtist(formData.artistName, coverUrl);

      setUploadProgress(t('savingMusic'));

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
            comments_count: 0,
            status: 'published',
            is_live_enabled: true,
          },
        ])
        .select('id, artist_id')
        .single();

      if (trackError || !newTrack) {
        throw new Error(trackError?.message || t('saveMusicError'));
      }

      setUploadProgress(t('creatingLiveLicense'));

      const { error: licenseError } = await supabase.from('track_licenses').insert([
        {
          track_id: newTrack.id,
          artist_id: newTrack.artist_id,
          price: Number(formData.licensePrice) || 2,
          duration_type: '24h',
        },
      ]);

      if (licenseError) {
        throw new Error(`${t('createLicenseError')}: ${licenseError.message}`);
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
      console.error(t('errorUploadingMedia'), err);
      setError(err.message || t('uploadFailed'));
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black px-4">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white">{t('musicPublishedSuccess')}</h2>
          <p className="text-gray-400">{t('musicCanAppearFeed')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-black via-gray-950 to-black px-4 py-6 pb-28 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-pink-400" />
            <span>{t('publishMusicTopMusic')}</span>
          </div>

          <h1 className="mb-3 text-4xl font-black leading-tight md:text-6xl">
            {t('upload')}{' '}
            <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
              TopMusic
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-400 md:text-lg">
            {t('uploadSubtitle')}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
          {[1, 2, 3].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                if (item === 1) setStep(1);
                if (item === 2 && validateStepOne()) setStep(2);
                if (item === 3 && validateStepOne() && validateStepTwo()) setStep(3);
              }}
              className={`rounded-xl px-2 py-3 text-xs font-bold transition md:text-sm ${
                step === item
                  ? 'bg-gradient-to-r from-red-600 to-purple-600 text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item === 1 && `1. ${t('data')}`}
              {item === 2 && `2. ${t('files')}`}
              {item === 3 && `3. ${t('publish')}`}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-red-900/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 md:p-8"
        >
          {step === 1 && (
            <div className="space-y-4">
              <div className="hidden gap-4 md:grid md:grid-cols-3">
                <InfoCard
                  icon={<Radio className="h-5 w-5 text-red-400" />}
                  title={t('enterFeed')}
                  text={t('enterFeedText')}
                />
                <InfoCard
                  icon={<Coins className="h-5 w-5 text-yellow-400" />}
                  title={t('liveLicense')}
                  text={t('liveLicenseText')}
                />
                <InfoCard
                  icon={<Upload className="h-5 w-5 text-purple-400" />}
                  title={t('audioOrVideo')}
                  text={t('audioOrVideoText')}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white outline-none focus:border-red-500/60"
                  placeholder={t('musicTitle')}
                />

                <input
                  type="text"
                  required
                  value={formData.artistName}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                  className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white outline-none focus:border-red-500/60"
                  placeholder={t('artistName')}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <select
                  required
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white outline-none focus:border-red-500/60"
                >
                  <option value="">{t('selectGenre')}</option>
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
                  className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white outline-none focus:border-red-500/60"
                >
                  <option value="">{t('selectLanguage')}</option>
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
                  className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white outline-none focus:border-red-500/60"
                  placeholder={t('liveLicensePrice')}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="mb-4 flex items-center gap-2">
                  {mediaFile && isVideoFile(mediaFile) ? (
                    <Video className="h-5 w-5 text-white" />
                  ) : (
                    <Music className="h-5 w-5 text-white" />
                  )}
                  <h3 className="text-lg font-bold text-white">{t('audioVideoFile')}</h3>
                </div>

                <input
  type="file"
  required
  accept=".mp3,.m4a,.aac,.wav,.ogg,.flac,.opus,.mp4,.mov,.webm,.mkv,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/ogg,audio/flac,video/mp4,video/quicktime,video/webm"
  capture={undefined}
  onChange={(e) => {
    const file = e.target.files?.[0] || null;
    setMediaFile(file);
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(file ? URL.createObjectURL(file) : null);
  }}
  className="w-full rounded-xl border border-gray-700 bg-black/50 px-4 py-3 text-white file:mr-4 file:rounded-full"
/>

                {mediaPreviewUrl && mediaFile && (
                  <div className="mt-4">
                    {isVideoFile(mediaFile) ? (
                      <video
                        src={mediaPreviewUrl}
                        controls
                        muted
                        className="aspect-video w-full rounded-xl bg-black object-contain"
                      />
                    ) : (
                      <audio src={mediaPreviewUrl} controls className="w-full" />
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-white" />
                  <h3 className="text-lg font-bold text-white">{t('cover')}</h3>
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
                  <img
                    src={coverPreviewUrl}
                    alt={t('preview')}
                    className="mt-4 h-48 w-48 rounded-xl object-cover"
                  />
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <h2 className="mb-4 text-2xl font-black">{t('reviewPublication')}</h2>

                <div className="space-y-3 text-sm text-white/70">
                  <p><strong className="text-white">{t('title')}:</strong> {formData.title || '—'}</p>
                  <p><strong className="text-white">{t('artist')}:</strong> {formData.artistName || '—'}</p>
                  <p><strong className="text-white">{t('genre')}:</strong> {formData.genre || '—'}</p>
                  <p><strong className="text-white">{t('language')}:</strong> {formData.language || '—'}</p>
                  <p><strong className="text-white">{t('liveLicense')}:</strong> {formData.licensePrice || '0'} €</p>
                  <p><strong className="text-white">{t('file')}:</strong> {mediaFile?.name || '—'}</p>
                  <p><strong className="text-white">{t('cover')}:</strong> {coverFile?.name || '—'}</p>
                </div>
              </div>

              {coverPreviewUrl && (
                <img
                  src={coverPreviewUrl}
                  alt={t('preview')}
                  className="mx-auto h-52 w-52 rounded-2xl object-cover"
                />
              )}
            </div>
          )}

          {uploadProgress && (
            <div className="mt-6 flex items-center justify-center gap-2 text-gray-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{uploadProgress}</span>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-center text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={previousStep}
                disabled={uploading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-4 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" />
                {t('back')}
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 px-4 py-4 font-semibold text-white shadow-lg shadow-red-500/30 transition hover:scale-[1.02]"
              >
                {t('continue')}
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={uploading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 px-4 py-4 font-semibold text-white shadow-lg shadow-red-500/40 transition hover:scale-[1.02] disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{t('publishing')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span>{t('publishTopMusic')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3">{icon}</div>
      <h3 className="font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{text}</p>
    </div>
  );
}
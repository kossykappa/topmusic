import { useEffect, useState } from 'react';
import {
  CheckCircle,
  Crown,
  Music2,
  User,
  Upload,
  Wallet,
  Share2,
  BarChart3,
  Inbox,
  Heart,
  Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

type ProfileRole = 'fan' | 'artist' | 'admin';

interface Profile {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  country?: string | null;
  verified?: boolean | null;
  role?: ProfileRole | string | null;
}

interface ProfilePageProps {
  onNavigate?: (page: string, data?: unknown) => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');

  const [tracksCount, setTracksCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [earnings, setEarnings] = useState(0);

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    void loadProfile();
  }, []);

  function showError(message: string) {
    setErrorMessage(message);
    setStatusMessage('');
    console.error(message);
  }

  function showStatus(message: string) {
    setStatusMessage(message);
    setErrorMessage('');
  }

  function goTo(page: string) {
    if (onNavigate) {
      onNavigate(page);
      return;
    }

    window.location.hash = page;
  }

  async function loadArtistStats(userId: string) {
    try {
      const { data: artist } = await supabase
        .from('artists')
        .select('id, followers_count')
        .eq('owner_user_id', userId)
        .maybeSingle();

      setFollowersCount(artist?.followers_count || 0);

      const { count: tracks } = await supabase
        .from('tracks')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', artist?.id || '');

      setTracksCount(tracks || 0);

      const { data: tracksData } = await supabase
        .from('tracks')
        .select('likes_count')
        .eq('artist_id', artist?.id || '');

      const totalLikes = (tracksData || []).reduce(
        (sum, track) => sum + (Number(track.likes_count) || 0),
        0
      );

      setLikesCount(totalLikes);

      const { data: earningsData } = await supabase
        .from('artist_earnings')
        .select('amount')
        .eq('artist_id', artist?.id || '');

      const totalEarned = (earningsData || []).reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
      );

      setEarnings(totalEarned);
    } catch (error) {
      console.error('Artist stats error:', error);
      setTracksCount(0);
      setFollowersCount(0);
      setLikesCount(0);
      setEarnings(0);
    }
  }

  async function loadProfile() {
    setLoading(true);
    setErrorMessage('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      showError(userError.message);
      setLoading(false);
      return;
    }

    if (!user) {
      showError(t('noAuthenticatedUser'));
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      showError(`Profile load error: ${error.message}`);
      setLoading(false);
      return;
    }

    if (!data) {
      const usernameFromEmail = user.email?.split('@')[0] || 'user';

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: usernameFromEmail,
          display_name: usernameFromEmail,
          role: 'fan',
        })
        .select('*')
        .single();

      if (insertError) {
        showError(`Profile create error: ${insertError.message}`);
        setLoading(false);
        return;
      }

      setProfile(newProfile as Profile);
      setDisplayName(newProfile.display_name || '');
      setUsername(newProfile.username || '');
      setBio(newProfile.bio || '');
      setCountry(newProfile.country || '');

      await loadArtistStats(newProfile.id);

      setLoading(false);
      return;
    }

    const loadedProfile = data as Profile;

    setProfile(loadedProfile);
    setDisplayName(loadedProfile.display_name || '');
    setUsername(loadedProfile.username || '');
    setBio(loadedProfile.bio || '');
    setCountry(loadedProfile.country || '');

    await loadArtistStats(loadedProfile.id);

    setLoading(false);
  }

  async function saveProfile() {
    if (!profile) {
      showError(t('profileNotLoaded'));
      return;
    }

    setSaving(true);
    showStatus(t('savingProfile'));

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        username,
        bio,
        country,
      })
      .eq('id', profile.id);

    if (error) {
      setSaving(false);
      showError(`Save profile error: ${error.message}`);
      return;
    }

    await loadProfile();
    setSaving(false);
    showStatus(t('profileUpdatedSuccessfully'));
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!profile) {
      showError(t('profileNotLoaded'));
      return;
    }

    setSaving(true);
    showStatus(t('uploadingAvatar'));

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
      });

    if (uploadError) {
      setSaving(false);
      showError(`Avatar upload error: ${uploadError.message}`);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(fileName);

    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
      })
      .eq('id', profile.id);

    if (error) {
      setSaving(false);
      showError(`Avatar save error: ${error.message}`);
      return;
    }

    await loadProfile();
    setSaving(false);
    showStatus(t('avatarUpdatedSuccessfully'));
  }

  async function becomeArtist() {
    if (!profile) {
      showError(t('profileNotLoaded'));
      return;
    }

    const confirmUpgrade = window.confirm(t('confirmArtistMode'));

    if (!confirmUpgrade) return;

    setSaving(true);
    showStatus(t('activatingArtistMode'));

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'artist',
      })
      .eq('id', profile.id);

    if (profileError) {
      setSaving(false);
      showError(`Artist mode profile error: ${profileError.message}`);
      return;
    }

    const { data: existingArtist, error: existingError } = await supabase
      .from('artists')
      .select('id')
      .eq('owner_user_id', profile.id)
      .maybeSingle();

    if (existingError) {
      setSaving(false);
      showError(`Artist check error: ${existingError.message}`);
      return;
    }

    if (!existingArtist) {
      const artistName = displayName || username || 'TopMusic Artist';

      const { error: artistError } = await supabase.from('artists').insert({
        name: artistName,
        owner_user_id: profile.id,
        country: country || null,
        genre: null,
        bio: bio || 'New TopMusic artist.',
        avatar_url: profile.avatar_url || null,
        followers_count: 0,
        chat_price: 1,
      });

      if (artistError) {
        setSaving(false);
        showError(`Artist create error: ${artistError.message}`);
        return;
      }
    }

    await loadProfile();
    setSaving(false);
    showStatus(t('artistModeActivated'));

    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  async function shareProfile() {
    const handle = username || profile?.id || 'profile';
    const link = `${window.location.origin}/artist/${handle}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: displayName || username || 'TopMusic profile',
          text: 'TopMusic profile',
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
        showStatus(t('profileLinkCopied'));
      }
    } catch {
      await navigator.clipboard.writeText(link);
      showStatus(t('profileLinkCopied'));
    }
  }

  const role = (profile?.role || 'fan') as ProfileRole;
  const isArtist = role === 'artist' || role === 'admin';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        {t('loadingProfile')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 pb-28 pt-8 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        {(statusMessage || errorMessage) && (
          <div
            className={`rounded-2xl border p-4 text-sm font-bold ${
              errorMessage
                ? 'border-red-500/40 bg-red-500/10 text-red-200'
                : 'border-green-500/40 bg-green-500/10 text-green-200'
            }`}
          >
            {errorMessage || statusMessage}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5">
          <div className="h-32 bg-gradient-to-r from-red-600 via-pink-600 to-purple-700 md:h-44" />

          <div className="px-6 pb-7 md:px-8">
            <div className="-mt-16 flex flex-col items-center md:-mt-20 md:flex-row md:items-end md:gap-8">
              <div className="flex flex-col items-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={t('avatar')}
                    className="h-36 w-36 rounded-full border-4 border-black object-cover shadow-2xl md:h-40 md:w-40"
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-black bg-white/10 text-5xl shadow-2xl md:h-40 md:w-40">
                    🎵
                  </div>
                )}

                <label className="mt-4 cursor-pointer rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition hover:scale-105">
                  {t('changeAvatar')}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="mt-6 flex-1 text-center md:text-left">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/70">
                    {role === 'admin'
                      ? t('adminAccount')
                      : isArtist
                      ? t('artistAccount')
                      : t('fanAccount')}
                  </span>

                  {profile?.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {t('verified')}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl font-black md:text-5xl">
                  {displayName || username || t('myProfile')}
                </h1>

                <p className="mt-2 text-white/50">
                  @{username || 'username'} {country ? `• ${country}` : ''}
                </p>

                <p className="mt-4 max-w-2xl text-white/65">
                  {bio || t('profileBioPlaceholder')}
                </p>

                <button
                  type="button"
                  onClick={shareProfile}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  <Share2 className="h-4 w-4" />
                  {t('shareProfile')}
                </button>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-black/40 p-4 text-center">
                <Music2 className="mx-auto mb-2 h-5 w-5 text-purple-400" />
                <p className="text-2xl font-black">{tracksCount}</p>
                <p className="text-xs text-white/50">{t('tracks')}</p>
              </div>

              <div className="rounded-2xl bg-black/40 p-4 text-center">
                <Users className="mx-auto mb-2 h-5 w-5 text-blue-400" />
                <p className="text-2xl font-black">{followersCount}</p>
                <p className="text-xs text-white/50">{t('fans')}</p>
              </div>

              <div className="rounded-2xl bg-black/40 p-4 text-center">
                <Heart className="mx-auto mb-2 h-5 w-5 text-red-400" />
                <p className="text-2xl font-black">{likesCount}</p>
                <p className="text-xs text-white/50">{t('likes')}</p>
              </div>

              <div className="rounded-2xl bg-black/40 p-4 text-center">
                <Wallet className="mx-auto mb-2 h-5 w-5 text-green-400" />
                <p className="text-2xl font-black text-green-400">
                  ${earnings.toFixed(2)}
                </p>
                <p className="text-xs text-white/50">{t('earned')}</p>
              </div>
            </div>

            {isArtist && (
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <button
                  type="button"
                  onClick={() => goTo('upload')}
                  className="rounded-2xl bg-white/10 p-4 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  <Upload className="mx-auto mb-2 h-5 w-5 text-purple-400" />
                  {t('myMusic')}
                </button>

                <button
                  type="button"
                  onClick={() => goTo('earningsDashboard')}
                  className="rounded-2xl bg-white/10 p-4 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  <BarChart3 className="mx-auto mb-2 h-5 w-5 text-green-400" />
                  {t('earnings')}
                </button>

                <button
                  type="button"
                  onClick={() => goTo('artistInbox')}
                  className="rounded-2xl bg-white/10 p-4 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  <Inbox className="mx-auto mb-2 h-5 w-5 text-pink-400" />
                  {t('inbox')}
                </button>

                <button
                  type="button"
                  onClick={() => goTo('wallet')}
                  className="rounded-2xl bg-white/10 p-4 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  <Wallet className="mx-auto mb-2 h-5 w-5 text-yellow-400" />
                  {t('coins')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <h2 className="mb-6 text-2xl font-black">{t('editProfile')}</h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('displayName')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500/60"
              />

              <input
                type="text"
                placeholder={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500/60"
              />

              <input
                type="text"
                placeholder={t('country')}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500/60"
              />

              <textarea
                placeholder={t('bio')}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="h-28 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500/60"
              />

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-purple-600 py-3 font-bold disabled:opacity-60"
              >
                {saving ? t('saving') : t('saveProfile')}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {!isArtist ? (
              <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600">
                  <Music2 className="h-6 w-6" />
                </div>

                <h2 className="text-2xl font-black">{t('becomeArtist')}</h2>

                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {t('artistModeDescription')}
                </p>

                <button
                  type="button"
                  onClick={becomeArtist}
                  disabled={saving}
                  className="mt-5 w-full rounded-xl bg-white py-3 font-black text-black transition hover:scale-105 disabled:opacity-60"
                >
                  {saving ? t('pleaseWait') : t('activateArtistMode')}
                </button>
              </div>
            ) : (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600">
                  <Crown className="h-6 w-6" />
                </div>

                <h2 className="text-2xl font-black">
                  {t('artistToolsActive')}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {t('artistToolsDescription')}
                </p>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-5 text-xl font-black">{t('accountAccess')}</h2>

              <div className="space-y-3 text-sm text-white/70">
                <div className="flex items-center gap-3 rounded-2xl bg-black/30 p-3">
                  <User className="h-5 w-5 text-red-400" />
                  <span>{t('fanFeatures')}</span>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-2xl p-3 ${
                    isArtist ? 'bg-black/30' : 'bg-black/10 text-white/30'
                  }`}
                >
                  <Upload className="h-5 w-5 text-purple-400" />
                  <span>{t('artistUploadsManagement')}</span>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-2xl p-3 ${
                    isArtist ? 'bg-black/30' : 'bg-black/10 text-white/30'
                  }`}
                >
                  <Wallet className="h-5 w-5 text-yellow-400" />
                  <span>{t('earningsTools')}</span>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-2xl p-3 ${
                    isArtist ? 'bg-black/30' : 'bg-black/10 text-white/30'
                  }`}
                >
                  <Music2 className="h-5 w-5 text-pink-400" />
                  <span>{t('artistInboxCommunity')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
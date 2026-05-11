import { useEffect, useState } from 'react';
import { CheckCircle, Crown, Music2, User, Upload, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');

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
      showError('No authenticated user found.');
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
      setLoading(false);
      return;
    }

    const loadedProfile = data as Profile;

    setProfile(loadedProfile);
    setDisplayName(loadedProfile.display_name || '');
    setUsername(loadedProfile.username || '');
    setBio(loadedProfile.bio || '');
    setCountry(loadedProfile.country || '');

    setLoading(false);
  }

  async function saveProfile() {
    if (!profile) {
      showError('Profile not loaded.');
      return;
    }

    setSaving(true);
    showStatus('Saving profile...');

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
    showStatus('Profile updated successfully.');
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!profile) {
      showError('Profile not loaded.');
      return;
    }

    setSaving(true);
    showStatus('Uploading avatar...');

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
    showStatus('Avatar updated successfully.');
  }

  async function becomeArtist() {
    if (!profile) {
      showError('Profile not loaded.');
      return;
    }

    const confirmUpgrade = window.confirm(
      'Do you want to activate Artist Mode? This will unlock upload, earnings and artist tools.'
    );

    if (!confirmUpgrade) return;

    setSaving(true);
    showStatus('Activating Artist Mode...');

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
    showStatus('Artist Mode activated successfully. Refreshing...');

    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  const role = (profile?.role || 'fan') as ProfileRole;
  const isArtist = role === 'artist' || role === 'admin';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
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

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex flex-col items-center md:w-56">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="mb-4 h-36 w-36 rounded-full border-4 border-white/10 object-cover"
                />
              ) : (
                <div className="mb-4 flex h-36 w-36 items-center justify-center rounded-full border-4 border-white/10 bg-white/10 text-5xl">
                  🎵
                </div>
              )}

              <label className="cursor-pointer rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition hover:scale-105">
                Change avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/70">
                  {role === 'admin'
                    ? 'Admin Account'
                    : isArtist
                    ? 'Artist Account'
                    : 'Fan Account'}
                </span>

                {profile?.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-black md:text-5xl">
                {displayName || username || 'My Profile'}
              </h1>

              <p className="mt-2 text-white/50">
                @{username || 'username'} {country ? `• ${country}` : ''}
              </p>

              <p className="mt-4 max-w-2xl text-white/65">
                {bio || 'Add a short bio to tell people who you are.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="mb-6 text-2xl font-black">Edit Profile</h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500/60"
              />

              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500/60"
              />

              <input
                type="text"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500/60"
              />

              <textarea
                placeholder="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="h-32 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-red-500/60"
              />

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-purple-600 py-3 font-bold disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {!isArtist ? (
              <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600">
                  <Music2 className="h-6 w-6" />
                </div>

                <h2 className="text-2xl font-black">Become an Artist</h2>

                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  Activate Artist Mode to upload songs, receive gifts, manage your
                  audience and access creator earnings.
                </p>

                <button
                  type="button"
                  onClick={becomeArtist}
                  disabled={saving}
                  className="mt-5 w-full rounded-xl bg-white py-3 font-black text-black transition hover:scale-105 disabled:opacity-60"
                >
                  {saving ? 'Please wait...' : 'Activate Artist Mode'}
                </button>
              </div>
            ) : (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600">
                  <Crown className="h-6 w-6" />
                </div>

                <h2 className="text-2xl font-black">Artist Tools Active</h2>

                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  Your account can access upload, earnings, artist inbox and creator
                  monetization tools.
                </p>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-5 text-xl font-black">Account Access</h2>

              <div className="space-y-3 text-sm text-white/70">
                <div className="flex items-center gap-3 rounded-2xl bg-black/30 p-3">
                  <User className="h-5 w-5 text-red-400" />
                  <span>Fan features: feed, likes, comments and gifts</span>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-2xl p-3 ${
                    isArtist ? 'bg-black/30' : 'bg-black/10 text-white/30'
                  }`}
                >
                  <Upload className="h-5 w-5 text-purple-400" />
                  <span>Artist uploads and music management</span>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-2xl p-3 ${
                    isArtist ? 'bg-black/30' : 'bg-black/10 text-white/30'
                  }`}
                >
                  <Wallet className="h-5 w-5 text-yellow-400" />
                  <span>Earnings and monetization tools</span>
                </div>

                <div
                  className={`flex items-center gap-3 rounded-2xl p-3 ${
                    isArtist ? 'bg-black/30' : 'bg-black/10 text-white/30'
                  }`}
                >
                  <Music2 className="h-5 w-5 text-pink-400" />
                  <span>Artist inbox, lives and fan community</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
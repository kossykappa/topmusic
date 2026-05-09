import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  country?: string;
  verified?: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);

      setDisplayName(data.display_name || '');
      setUsername(data.username || '');
      setBio(data.bio || '');
      setCountry(data.country || '');
    }

    setLoading(false);
  }

  async function saveProfile() {
    if (!profile) return;

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
      alert(error.message);
      return;
    }

    alert('Profile updated!');
  }

  async function uploadAvatar(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || !profile) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
      });

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
      })
      .eq('id', profile.id);

    loadProfile();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="mb-8 text-4xl font-black">
          My Profile
        </h1>

        <div className="mb-8 flex flex-col items-center">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="mb-4 h-32 w-32 rounded-full object-cover"
            />
          ) : (
            <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-white/10 text-4xl">
              🎵
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            className="text-sm"
          />
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3"
          />

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3"
          />

          <input
            type="text"
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3"
          />

          <textarea
            placeholder="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="h-32 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3"
          />

          <button
            onClick={saveProfile}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-purple-600 py-3 font-bold"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
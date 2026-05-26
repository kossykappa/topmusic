import { useEffect, useState } from 'react';
import { Users, MapPin, Music } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

interface Artist {
  id: string;
  name: string;
  country?: string | null;
  genre?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  followers_count: number;
  created_at?: string;
}

interface ArtistsListingProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function ArtistsListing({ onNavigate }: ArtistsListingProps) {
  const { t } = useTranslation();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchArtists();
  }, []);

  async function fetchArtists() {
    setLoading(true);

    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('followers_count', { ascending: false });

    if (error) {
      console.error(t('artistsLoadError'), error);
      setArtists([]);
    } else {
      setArtists(Array.isArray(data) ? (data as Artist[]) : []);
    }

    setLoading(false);
  }

  function openArtistProfile(artist: Artist) {
    onNavigate('artist', {
      id: artist.id,
      artistId: artist.id,
      artistName: artist.name,
      artistAvatar: artist.avatar_url || '',
      artist,
    });
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-black via-gray-950 to-black px-4 py-6 pb-28 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-3 text-4xl font-black leading-tight text-white md:text-5xl">
            {t('discoverArtists')}{' '}
            <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
              {t('artists')}
            </span>
          </h1>

          <p className="text-lg text-gray-400">{t('artistsSubtitle')}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 aspect-square rounded-2xl bg-gray-700" />
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-700" />
                <div className="h-3 w-1/2 rounded bg-gray-700" />
              </div>
            ))}
          </div>
        ) : artists.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => (
              <button
                key={artist.id}
                onClick={() => openArtistProfile(artist)}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
              >
                <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20">
                  {artist.avatar_url ? (
                    <img
                      src={artist.avatar_url}
                      alt={artist.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Users className="h-16 w-16 text-white/30" />
                  )}
                </div>

                <h3 className="mb-2 text-lg font-semibold text-white">
                  {artist.name}
                </h3>

                <div className="space-y-1 text-sm text-gray-400">
                  {artist.country && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {artist.country}
                    </p>
                  )}

                  {artist.genre && (
                    <p className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      {artist.genre}
                    </p>
                  )}

                  <p>
                    {(artist.followers_count || 0).toLocaleString()}{' '}
                    {t('followers')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            {t('noArtistsYet')}
          </div>
        )}
      </div>
    </div>
  );
}
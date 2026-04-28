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
    fetchArtists();
  }, []);

  async function fetchArtists() {
    setLoading(true);

    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('followers_count', { ascending: false });

    if (error) {
      console.error('Error fetching artists:', error);
      setArtists([]);
    } else {
      setArtists(data || []);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            {t('artists.title') || 'Descubra'}{' '}
            <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
              {t('artists.titleHighlight') || 'Artistas'}
            </span>
          </h1>
          <p className="text-lg text-gray-400">
            {t('artists.subtitle') || 'Explore artistas talentosos de todo o mundo'}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-gray-800/50 p-6">
                <div className="mb-4 aspect-square rounded-2xl bg-gray-700" />
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-700" />
                <div className="h-3 w-1/2 rounded bg-gray-700" />
              </div>
            ))}
          </div>
        ) : artists.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artists.map((artist) => (
              <button
                key={artist.id}
                onClick={() => onNavigate('artist', { artistId: artist.id })}
                className="group rounded-2xl border border-red-900/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 text-left transition-all hover:scale-105 hover:border-red-500/50"
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

                <h3 className="mb-2 text-lg font-semibold text-white">{artist.name}</h3>

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
                    {(artist.followers_count || 0).toLocaleString()} seguidores
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            Ainda não há artistas. Seja o primeiro a enviar música!
          </div>
        )}
      </div>
    </div>
  );
}
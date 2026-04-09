import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import type { Artist } from '../types';

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
    try {
      const { data } = await supabase
        .from('artists')
        .select('*')
        .order('followers_count', { ascending: false });

      setArtists(data || []);
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('artists.title')}{' '}
            <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
              {t('artists.titleHighlight')}
            </span>
          </h1>
          <p className="text-gray-400 text-lg">{t('artists.subtitle')}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
                <div className="aspect-square bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : artists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artists.map((artist) => (
              <button
                key={artist.id}
                onClick={() => onNavigate('artist', { artistId: artist.id })}
                className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-6 border border-red-900/20 hover:border-red-500/50 transition-all transform hover:scale-105 text-left"
              >
                <div className="aspect-square bg-gradient-to-br from-red-600/20 to-purple-600/20 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                  {artist.profile_image ? (
                    <img src={artist.profile_image} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-16 h-16 text-white/30" />
                  )}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{artist.name}</h3>
                <p className="text-gray-400 text-sm">{artist.followers_count.toLocaleString()} {t('artist.followers')}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            {t('artists.noArtists')}
          </div>
        )}
      </div>
    </div>
  );
}

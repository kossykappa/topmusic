export interface Artist {
  id: string;
  name: string;
  bio: string;
  profile_image: string;
  followers_count: number;
  created_at: string;
}

export interface Song {
  id: string;
  artist_name: string;
  title: string;
  genre: string;
  language: string;
  audio_url: string;
  video_url?: string;
  cover_url: string;
  media_type?: 'audio' | 'video';
  created_at: string;
  plays_count?: number;
}

export interface Follow {
  id: string;
  artist_id: string;
  follower_name: string;
  created_at: string;
}

export type Language = 'EN' | 'PT' | 'PT-BR' | 'FR' | 'ES' | 'NL' | 'DE' | 'AR';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  i18nCode: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'EN', name: 'English', nativeName: 'English (US)', i18nCode: 'en' },
  { code: 'PT', name: 'Portuguese', nativeName: 'Português (AO)', i18nCode: 'pt' },
  { code: 'PT-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (BR)', i18nCode: 'pt-BR' },
  { code: 'FR', name: 'French', nativeName: 'Français', i18nCode: 'fr' },
  { code: 'ES', name: 'Spanish', nativeName: 'Español', i18nCode: 'es' },
  { code: 'NL', name: 'Dutch', nativeName: 'Nederlands', i18nCode: 'nl' },
  { code: 'DE', name: 'German', nativeName: 'Deutsch', i18nCode: 'de' },
  { code: 'AR', name: 'Arabic', nativeName: 'العربية', i18nCode: 'ar' },
];

export interface GenreCategory {
  name: string;
  genres: string[];
}

export const GENRE_CATEGORIES: GenreCategory[] = [
  {
    name: 'Global',
    genres: [
      'Pop',
      'Rock',
      'Hip Hop',
      'R&B',
      'Jazz',
      'Electronic',
      'Classical',
      'Country',
      'Reggae',
      'Dancehall',
      'Latin',
      'Indie',
      'Metal',
      'K-Pop',
      'Gospel'
    ]
  },
  {
    name: 'Africa',
    genres: [
      'Afrobeat',
      'Afro House',
      'Afro Pop',
      'Afro Soul',
      'Amapiano',
      'Bongo Flava',
      'Coladeira',
      'Coupe-Decale',
      'Fuji',
      'Funaná',
      'Gqom',
      'Highlife',
      'Kizomba',
      'Kuduro',
      'Kwaito',
      'Makossa',
      'Maskandi',
      'Morna',
      'Ndombolo',
      'Palmwine',
      'Semba',
      'Soukous',
      'Tarraxinha'
    ]
  },
  {
    name: 'Caribbean / Afro-Caribbean',
    genres: [
      'Kompa',
      'Zouk',
      'Zouk Love'
    ]
  },
  {
    name: 'Others',
    genres: [
      'Traditional',
      'Instrumental'
    ]
  }
];

export const ALL_GENRES = GENRE_CATEGORIES.flatMap(category => category.genres).sort();

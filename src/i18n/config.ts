import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      feed: 'Feed',
      live: 'Live',
      artists: 'Artists',
      upload: 'Upload',
      coins: 'Coins',
      discoverArtists: 'Discover Artists',
      exploreArtists: 'Explore talented artists from around the world',
    },
  },

  pt: {
    translation: {
      feed: 'Feed',
      live: 'Ao Vivo',
      artists: 'Artistas',
      upload: 'Upload',
      coins: 'Moedas',
      discoverArtists: 'Descobrir Artistas',
      exploreArtists: 'Explora artistas talentosos do mundo inteiro',
    },
  },

  fr: {
    translation: {
      feed: 'Flux',
      live: 'Live',
      artists: 'Artistes',
      upload: 'Téléverser',
      coins: 'Pièces',
      discoverArtists: 'Découvrir des artistes',
      exploreArtists: 'Découvrez des artistes talentueux du monde entier',
    },
  },

  es: {
    translation: {
      feed: 'Feed',
      live: 'En Vivo',
      artists: 'Artistas',
      upload: 'Subir',
      coins: 'Monedas',
      discoverArtists: 'Descubrir artistas',
      exploreArtists: 'Explora artistas talentosos de todo el mundo',
    },
  },

  nl: {
    translation: {
      feed: 'Feed',
      live: 'Live',
      artists: 'Artiesten',
      upload: 'Uploaden',
      coins: 'Munten',
      discoverArtists: 'Ontdek artiesten',
      exploreArtists: 'Ontdek getalenteerde artiesten van over de hele wereld',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('topmusic_language') || 'en',
  fallbackLng: 'en',

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
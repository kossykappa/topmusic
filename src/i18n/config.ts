import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const savedLanguage =
  localStorage.getItem('topmusic_language') || 'en';

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
      profile: 'Profile',
      logout: 'Logout',
      gifts: 'Gifts',
      discover: 'Discover',
      notifications: 'Notifications',
      earnings: 'Earnings',
      inbox: 'Inbox',
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
      profile: 'Perfil',
      logout: 'Sair',
      gifts: 'Presentes',
      discover: 'Descobrir',
      notifications: 'Notificações',
      earnings: 'Ganhos',
      inbox: 'Inbox',
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
      profile: 'Profil',
      logout: 'Déconnexion',
      gifts: 'Cadeaux',
      discover: 'Découvrir',
      notifications: 'Notifications',
      earnings: 'Revenus',
      inbox: 'Boîte',
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
      profile: 'Perfil',
      logout: 'Cerrar sesión',
      gifts: 'Regalos',
      discover: 'Descubrir',
      notifications: 'Notificaciones',
      earnings: 'Ganancias',
      inbox: 'Inbox',
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
      profile: 'Profiel',
      logout: 'Uitloggen',
      gifts: 'Cadeaus',
      discover: 'Ontdekken',
      notifications: 'Meldingen',
      earnings: 'Inkomsten',
      inbox: 'Inbox',
    },
  },

  de: {
    translation: {
      feed: 'Feed',
      live: 'Live',
      artists: 'Künstler',
      upload: 'Hochladen',
      coins: 'Münzen',
      discoverArtists: 'Künstler entdecken',
      exploreArtists: 'Entdecke talentierte Künstler aus aller Welt',
      profile: 'Profil',
      logout: 'Abmelden',
      gifts: 'Geschenke',
      discover: 'Entdecken',
      notifications: 'Benachrichtigungen',
      earnings: 'Einnahmen',
      inbox: 'Postfach',
    },
  },

  it: {
    translation: {
      feed: 'Feed',
      live: 'Live',
      artists: 'Artisti',
      upload: 'Carica',
      coins: 'Monete',
      discoverArtists: 'Scopri artisti',
      exploreArtists: 'Scopri artisti talentuosi da tutto il mondo',
      profile: 'Profilo',
      logout: 'Esci',
      gifts: 'Regali',
      discover: 'Scoprire',
      notifications: 'Notifiche',
      earnings: 'Guadagni',
      inbox: 'Inbox',
    },
  },

  ar: {
    translation: {
      feed: 'الخلاصة',
      live: 'مباشر',
      artists: 'الفنانون',
      upload: 'رفع',
      coins: 'عملات',
      discoverArtists: 'اكتشف الفنانين',
      exploreArtists: 'اكتشف فنانين موهوبين من جميع أنحاء العالم',
      profile: 'الملف الشخصي',
      logout: 'تسجيل الخروج',
      gifts: 'الهدايا',
      discover: 'اكتشف',
      notifications: 'الإشعارات',
      earnings: 'الأرباح',
      inbox: 'البريد',
    },
  },

  sw: {
    translation: {
      feed: 'Feed',
      live: 'Live',
      artists: 'Wasanii',
      upload: 'Pakia',
      coins: 'Sarafu',
      discoverArtists: 'Gundua Wasanii',
      exploreArtists: 'Gundua wasanii wenye vipaji kutoka duniani kote',
      profile: 'Wasifu',
      logout: 'Toka',
      gifts: 'Zawadi',
      discover: 'Gundua',
      notifications: 'Arifa',
      earnings: 'Mapato',
      inbox: 'Inbox',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: 'en',

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
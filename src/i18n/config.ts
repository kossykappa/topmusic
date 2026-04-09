import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';
import nl from './locales/nl.json';
import de from './locales/de.json';
import ar from './locales/ar.json';

const supportedLanguages = ['en', 'fr', 'pt', 'pt-BR', 'es', 'nl', 'de', 'ar'];

function getBrowserLanguage(): string {
  const browserLang = navigator.language.toLowerCase();

  if (browserLang === 'pt-br' || browserLang.startsWith('pt-br')) {
    return 'pt-BR';
  }

  if (browserLang === 'pt-pt' || browserLang === 'pt-ao' || browserLang.startsWith('pt')) {
    return 'pt';
  }

  const langCode = browserLang.split('-')[0];
  return supportedLanguages.includes(langCode) ? langCode : 'en';
}

const savedLanguage = localStorage.getItem('language');
const defaultLanguage = savedLanguage || getBrowserLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      pt: { translation: pt },
      'pt-BR': { translation: ptBR },
      es: { translation: es },
      nl: { translation: nl },
      de: { translation: de },
      ar: { translation: ar },
    },
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);

  const isRTL = lng === 'ar';

  document.documentElement.classList.add('language-transition');

  requestAnimationFrame(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;

    setTimeout(() => {
      document.documentElement.classList.remove('language-transition');
    }, 300);
  });
});

const initialLang = i18n.language;
const isRTL = initialLang === 'ar';
document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
document.documentElement.lang = initialLang;

export default i18n;

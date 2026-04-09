import { Music, Globe } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string, data?: unknown) => void;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { t, i18n } = useTranslation();
  const [showLanguages, setShowLanguages] = useState(false);

  const languages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português (AO)', flag: '🇦🇴' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (BR)', flag: '🇧🇷' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setShowLanguages(false);
  };

  return (
    <nav className="bg-black/95 backdrop-blur-sm border-b border-red-900/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8 rtl:space-x-reverse">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-2 rtl:space-x-reverse text-white font-bold text-xl hover:text-red-500 transition-colors"
            >
              <Music className="w-6 h-6" />
              <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
                TOPMUSIC
              </span>
            </button>

            <div className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
              <button
                onClick={() => onNavigate('home')}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'home' ? 'text-red-500' : 'text-gray-300 hover:text-white'
                }`}
              >
                {t('nav.home')}
              </button>
              <button
                onClick={() => onNavigate('feed')}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'feed' ? 'text-red-500' : 'text-gray-300 hover:text-white'
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => onNavigate('artist', { artistId: 'Maya Zuda' })}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'artist' ? 'text-red-500' : 'text-gray-300 hover:text-white'
                }`}
              >
                Maya Zuda
              </button>
              <button
                onClick={() => onNavigate('artists')}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'artists' ? 'text-red-500' : 'text-gray-300 hover:text-white'
                }`}
              >
                {t('nav.artists')}
              </button>
              <button
                onClick={() => onNavigate('upload')}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'upload' ? 'text-red-500' : 'text-gray-300 hover:text-white'
                }`}
              >
                {t('nav.upload')}
              </button>
              <button
                onClick={() => onNavigate('pricing')}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'pricing' ? 'text-red-500' : 'text-gray-300 hover:text-white'
                }`}
              >
                {t('nav.pricing')}
              </button>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowLanguages(!showLanguages)}
              className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-red-500/50"
            >
              <span className="text-lg">{currentLanguage.flag}</span>
              <span className="text-sm font-medium text-white hidden sm:inline">{currentLanguage.nativeName}</span>
              <Globe className="w-4 h-4 text-gray-400 sm:hidden" />
            </button>

            {showLanguages && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLanguages(false)}
                />
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl border border-red-900/30 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 space-y-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 rounded-lg text-sm transition-all ${
                          i18n.language === lang.code
                            ? 'bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-lg'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="flex-1 text-left rtl:text-right font-medium">{lang.nativeName}</span>
                        {i18n.language === lang.code && (
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

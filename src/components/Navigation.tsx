import {
  Music,
  Globe,
  Gift,
  Radio,
  Users,
  Upload,
  Coins,
  Home,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string, data?: unknown) => void;
  hideTopNavOnMobile?: boolean;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export default function Navigation({
  currentPage,
  onNavigate,
  hideTopNavOnMobile = false,
}: NavigationProps) {
  const { i18n } = useTranslation();
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

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setShowLanguages(false);
  };

  const topNavItems = [
    { key: 'feed', label: 'Feed', icon: Music },
    { key: 'live', label: 'Live', icon: Radio },
    { key: 'artists', label: 'Artists', icon: Users },
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'wallet', label: 'Coins', icon: Coins },
  ];

  const mobileNavItems = [
    { key: 'feed', label: 'Feed', icon: Music },
    { key: 'live', label: 'Live', icon: Radio },
    { key: 'artists', label: 'Artists', icon: Users },
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'wallet', label: 'Coins', icon: Coins },
  ];

  return (
    <>
      <nav
        className={`sticky top-0 z-50 border-b border-red-900/20 bg-black/95 backdrop-blur-sm ${
          hideTopNavOnMobile ? 'hidden md:block' : ''
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8 rtl:space-x-reverse">
              <button
                onClick={() => onNavigate('feed')}
                className="flex items-center space-x-2 text-xl font-bold text-white transition-colors hover:text-red-500 rtl:space-x-reverse"
              >
                <Music className="h-6 w-6" />
                <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
                  TOPMUSIC
                </span>
              </button>

              <button
  onClick={() => onNavigate('earningsDashboard')}
  className="flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-red-400"
>
  Earnings
</button>

              <div className="hidden items-center space-x-6 md:flex rtl:space-x-reverse">
         {import.meta.env.VITE_ADMIN_PIN && (
          
<button
  onClick={() => {
    const pin = prompt('Admin PIN');

    if (pin === import.meta.env.VITE_ADMIN_PIN) {
      onNavigate('secret-topmusic-admin');
    } else {
      alert('Acesso negado');
    }
  }}
  className="text-sm font-medium text-white/50 transition hover:text-white"
>
  Admin
</button>

                {topNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = currentPage === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => onNavigate(item.key)}
                      className={`flex items-center space-x-1 text-sm font-medium transition-colors rtl:space-x-reverse ${
                        active ? 'text-red-500' : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => onNavigate('home')}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors rtl:space-x-reverse ${
                    currentPage === 'home'
                      ? 'text-red-500'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Discover</span>
                </button>

                <button
                  onClick={() => onNavigate('sendGift')}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors rtl:space-x-reverse ${
                    currentPage === 'sendGift'
                      ? 'text-red-500'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Gift className="h-4 w-4" />
                  <span>Gifts</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowLanguages(!showLanguages)}
                className="flex items-center space-x-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 transition-all hover:border-red-500/50 hover:bg-white/10 rtl:space-x-reverse"
              >
                <span className="text-lg">{currentLanguage.flag}</span>
                <span className="hidden text-sm font-medium text-white sm:inline">
                  {currentLanguage.nativeName}
                </span>
                <Globe className="h-4 w-4 text-gray-400 sm:hidden" />
              </button>

              {showLanguages && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLanguages(false)}
                  />
                  <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-red-900/30 bg-gray-900/95 shadow-2xl backdrop-blur-xl duration-200 rtl:left-0 rtl:right-auto">
                    <div className="space-y-1 p-2">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-sm transition-all rtl:space-x-reverse ${
                            i18n.language === lang.code
                              ? 'bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-lg'
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className="text-xl">{lang.flag}</span>
                          <span className="flex-1 text-left font-medium rtl:text-right">
                            {lang.nativeName}
                          </span>
                          {i18n.language === lang.code && (
                            <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
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

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.key;

            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`relative flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-all ${
                  active ? 'text-red-500' : 'text-gray-300'
                }`}
              >
                {active && (
                  <div className="absolute top-0 h-0.5 w-8 rounded-full bg-gradient-to-r from-red-500 to-purple-600" />
                )}
                <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
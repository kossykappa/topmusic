import { useEffect, useState } from 'react';
import {
  Music,
  Radio,
  Users,
  Upload,
  Coins,
  Home,
  Gift,
  Bell,
  User,
  LogOut,
  Globe,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string, data?: unknown) => void;
  hideTopNavOnMobile?: boolean;
  unreadCount?: number;
}

type Role = 'fan' | 'artist' | 'admin';

export default function Navigation({
  currentPage,
  onNavigate,
  hideTopNavOnMobile = false,
  unreadCount = 0,
}: NavigationProps) {
  const { t, i18n } = useTranslation();

  const [role, setRole] = useState<Role>('fan');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showLanguages, setShowLanguages] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem('topmusic_language') || i18n.language || 'en'
  );

  useEffect(() => {
    void loadSessionAndProfile();
  }, []);

  async function loadSessionAndProfile() {
    const { data } = await supabase.auth.getSession();

    if (data.session?.user) {
      const userId = data.session.user.id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, role')
        .eq('id', userId)
        .single();

      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);

      if (profile?.role === 'artist' || profile?.role === 'admin') {
        setRole(profile.role);
      } else {
        setRole('fan');
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  async function changeLanguage(code: string) {
    await i18n.changeLanguage(code);
    localStorage.setItem('topmusic_language', code);
    setSelectedLanguage(code);
    setShowLanguages(false);
  }

  const mobileNavItems = [
    { key: 'feed', label: t('feed'), icon: Music },
    { key: 'live', label: t('live'), icon: Radio },
    { key: 'artists', label: t('artists'), icon: Users },
    { key: 'upload', label: t('upload'), icon: Upload },
    { key: 'wallet', label: t('coins'), icon: Coins },
  ];

  const languages = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ar', label: 'العربية' },
  { code: 'sw', label: 'Kiswahili' },
];

  const languageMenu = (
    <div className="absolute right-0 top-10 z-50 w-44 rounded-2xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-xl">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`block w-full rounded-xl px-4 py-2 text-left text-sm transition ${
  selectedLanguage === lang.code
    ? 'bg-gradient-to-r from-red-500 to-purple-600 font-bold text-white'
    : 'text-white/70 hover:bg-white/10 hover:text-white'
}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <nav
        className={`sticky top-0 z-50 border-b border-red-900/20 bg-black/95 backdrop-blur-sm ${
          hideTopNavOnMobile ? 'hidden md:block' : ''
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between md:h-16">
            <button
              onClick={() => onNavigate('feed')}
              className="flex items-center space-x-2 text-base font-bold text-white md:text-xl"
            >
              <Music className="h-6 w-6" />
              <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
                TOPMUSIC TESTE
              </span>
            </button>

            <div className="hidden items-center space-x-6 md:flex">
              <button onClick={() => onNavigate('feed')} className="text-white/70 hover:text-white">{t('feed')}</button>
              <button onClick={() => onNavigate('live')} className="text-white/70 hover:text-white">{t('live')}</button>
              <button onClick={() => onNavigate('artists')} className="text-white/70 hover:text-white">{t('artists')}</button>

              {role === 'artist' && (
                <>
                  <button onClick={() => onNavigate('artistInbox')} className="text-white/70 hover:text-white">
                    {t('inbox')}
                  </button>
                  <button onClick={() => onNavigate('earningsDashboard')} className="text-white/70 hover:text-white">
                    {t('earnings')}
                  </button>
                  <button onClick={() => onNavigate('upload')} className="text-white/70 hover:text-white">
                    {t('upload')}
                  </button>
                </>
              )}

              <button onClick={() => onNavigate('wallet')} className="text-white/70 hover:text-white">{t('coins')}</button>
              <button onClick={() => onNavigate('home')} className="text-white/70 hover:text-white">{t('discover')}</button>
              <button onClick={() => onNavigate('sendGift')} className="text-white/70 hover:text-white">{t('gifts')}</button>
              <button onClick={() => onNavigate('notifications')} className="text-white/70 hover:text-white">
                <Bell className="h-4 w-4" />
              </button>

              <button onClick={() => onNavigate('profile')} className="flex items-center gap-2 text-white/70 hover:text-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                {t('profile')}
              </button>

              <button onClick={handleLogout} className="flex items-center gap-2 text-red-300 hover:text-red-400">
                <LogOut className="h-4 w-4" />
                {t('logout')}
              </button>

              <div className="relative">
                <button onClick={() => setShowLanguages(!showLanguages)} className="text-white/70 hover:text-white">
                  <Globe className="h-5 w-5" />
                </button>
                {showLanguages && languageMenu}
              </div>
            </div>

            <div className="relative flex items-center md:hidden">
              <button onClick={() => setShowLanguages(!showLanguages)} className="text-white/70 hover:text-white">
                <Globe className="h-6 w-6" />
              </button>
              {showLanguages && languageMenu}
            </div>
          </div>
        </div>
      </nav>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl md:hidden">
        <div className="grid grid-cols-5">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.key;

            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`relative flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-all ${
                  active ? 'text-red-500' : 'text-gray-300'
                }`}
              >
                {active && (
                  <div className="absolute top-0 h-1 w-10 rounded-full bg-gradient-to-r from-red-500 to-purple-600 shadow-lg shadow-red-500/40" />
                )}

                <Icon className={`h-5 w-5 ${active ? 'text-red-500' : 'text-white/70'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
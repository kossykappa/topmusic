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
  const [role, setRole] = useState<Role>('fan');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showLanguages, setShowLanguages] = useState(false);

  const { t, i18n } = useTranslation();

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

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }

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
  ];

  return (
    <div>
      <nav
        className={`sticky top-0 z-50 border-b border-red-900/20 bg-black/95 backdrop-blur-sm ${
          hideTopNavOnMobile ? 'hidden md:block' : ''
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between md:h-16">
            <div className="flex items-center space-x-8 rtl:space-x-reverse">
              <button
                onClick={() => onNavigate('feed')}
                className="flex items-center space-x-2 text-base font-bold text-white md:text-xl"
              >
                <Music className="h-6 w-6" />
                <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
                  TOPMUSIC
                </span>
              </button>

              {role === 'artist' && (
                <button
                  onClick={() => onNavigate('artistInbox')}
                  className="relative hidden items-center gap-2 text-sm font-medium text-white/80 hover:text-white md:flex"
                >
                  Inbox

                  {unreadCount > 0 && (
                    <span className="absolute -right-3 -top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              {role === 'artist' && (
                <button
                  onClick={() => onNavigate('earningsDashboard')}
                  className="hidden items-center gap-2 text-sm font-medium text-white/80 transition hover:text-red-400 md:flex"
                >
                  Earnings
                </button>
              )}
            </div>

            <button
  onClick={() => onNavigate('feed')}
  className={`flex items-center gap-2 text-sm font-medium transition ${
    currentPage === 'feed'
      ? 'text-red-400'
      : 'text-white/70 hover:text-white'
  }`}
>
  <Music className="h-4 w-4" />
  {t('feed')}
</button>

<button
  onClick={() => onNavigate('live')}
  className={`flex items-center gap-2 text-sm font-medium transition ${
    currentPage === 'live'
      ? 'text-red-400'
      : 'text-white/70 hover:text-white'
  }`}
>
  <Radio className="h-4 w-4" />
  {t('live')}
</button>

<button
  onClick={() => onNavigate('artists')}
  className={`flex items-center gap-2 text-sm font-medium transition ${
    currentPage === 'artists'
      ? 'text-red-400'
      : 'text-white/70 hover:text-white'
  }`}
>
  <Users className="h-4 w-4" />
  {t('artists')}
</button>

{role === 'artist' && (
  <button
    onClick={() => onNavigate('upload')}
    className={`flex items-center gap-2 text-sm font-medium transition ${
      currentPage === 'upload'
        ? 'text-red-400'
        : 'text-white/70 hover:text-white'
    }`}
  >
    <Upload className="h-4 w-4" />
    {t('upload')}
  </button>
)}

<button
  onClick={() => onNavigate('wallet')}
  className={`flex items-center gap-2 text-sm font-medium transition ${
    currentPage === 'wallet'
      ? 'text-red-400'
      : 'text-white/70 hover:text-white'
  }`}
>
  <Coins className="h-4 w-4" />
  {t('coins')}
</button>

              <button
                onClick={() => onNavigate('home')}
                className={`flex items-center gap-2 text-sm font-medium transition ${
                  currentPage === 'home' ? 'text-red-400' : 'text-white/70 hover:text-white'
                }`}
              >
                <Home className="h-4 w-4" />
                Discover
              </button>

              <button
                onClick={() => onNavigate('sendGift')}
                className={`flex items-center gap-2 text-sm font-medium transition ${
                  currentPage === 'sendGift' ? 'text-red-400' : 'text-white/70 hover:text-white'
                }`}
              >
                <Gift className="h-4 w-4" />
                Gifts
              </button>

              <button
                onClick={() => onNavigate('notifications')}
                className={`flex items-center gap-2 text-sm font-medium transition ${
                  currentPage === 'notifications'
                    ? 'text-red-400'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Bell className="h-4 w-4" />
              </button>

              <button
                onClick={() => onNavigate('profile')}
                className={`flex items-center gap-2 text-sm font-medium transition ${
                  currentPage === 'profile' ? 'text-red-400' : 'text-white/70 hover:text-white'
                }`}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
                Profile
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-red-300 transition hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowLanguages(!showLanguages)}
                  className="flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
                >
                  <Globe className="h-4 w-4" />
                </button>

                {showLanguages && (
                  <div className="absolute right-0 mt-3 w-44 rounded-2xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-xl">
                    {languages.map((lang) => (
                      <button
  key={lang.code}
  onClick={() => {
    i18n.changeLanguage(lang.code);
    localStorage.setItem('topmusic_language', lang.code);
    setShowLanguages(false);
  }}
  className={`block w-full rounded-xl px-4 py-2 text-left text-sm transition ${
    i18n.language === lang.code
      ? 'bg-gradient-to-r from-red-500 to-purple-600 font-bold text-white'
      : 'text-white/70 hover:bg-white/10 hover:text-white'
  }`}
>
  {lang.label}
</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={() => setShowLanguages(!showLanguages)}
                className="text-white/70 hover:text-white"
              >
                <Globe className="h-5 w-5" />
              </button>
              {showLanguages && (
  <div className="absolute right-4 top-14 z-50 w-44 rounded-2xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-xl md:hidden">
    {languages.map((lang) => (
      <button
        key={lang.code}
       onClick={() => {
  i18n.changeLanguage(lang.code);
  localStorage.setItem('topmusic_language', lang.code);
  setShowLanguages(false);
}}
        className="block w-full rounded-xl px-4 py-2 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        {lang.label}
      </button>
    ))}
  </div>
)}
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

          <Icon
            className={`h-5 w-5 transition-all ${
              active ? 'scale-110 text-red-500' : 'text-white/70'
            }`}
          />

          <span>{item.label}</span>
        </button>
      );
    })}
  </div>
  </div>
);
}
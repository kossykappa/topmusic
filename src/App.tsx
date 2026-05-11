import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';
import Navigation from './components/Navigation';
import Homepage from './components/Homepage';
import ArtistsListing from './components/ArtistsListing';
import ArtistPage from './components/ArtistPage';
import UploadMusic from './components/UploadMusic';
import Pricing from './components/Pricing';
import MusicPlayer from './components/MusicPlayer';
import RegionExplorer from './components/RegionExplorer';
import LivePage from './components/LivePage';
import { Feed } from './components/Feed';
import AuthPage from './auth/AuthPage';
import { supabase } from './lib/supabase';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import SendGift from './pages/SendGift';
import BuyCoins from './pages/BuyCoins';
import Wallet from './pages/Wallet';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import AdminWithdraw from './pages/AdminWithdraw';
import EarningsDashboard from './pages/EarningsDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import ArtistInbox from './pages/ArtistInbox';
import Chat from './pages/Chat';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';

type Page =
  | 'feed'
  | 'live'
  | 'artists'
  | 'artist'
  | 'upload'
  | 'wallet'
  | 'home'
  | 'pricing'
  | 'region'
  | 'sendGift'
  | 'buyCoins'
  | 'success'
  | 'adminWithdraw'
  | 'earningsDashboard'
  | 'secret-topmusic-admin'
  | 'financeDashboard'
  | 'artistInbox'
  | 'chat'
  | 'profile'
  | 'notifications'
  | 'cancel';

interface PageData {
  id?: string;
  artistAvatar?: string;
  artist?: unknown;
  live?: unknown;
  artistId?: string;
  artistName?: string;
  artistHandle?: string;
  region?: string;
  fanUserId?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('auth');
  const [pageData, setPageData] = useState<PageData>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function fetchUnreadCount() {
    const { count } = await supabase
      .from('topmusic_chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_type', 'fan')
      .is('read_at', null);

    setUnreadCount(count || 0);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setAuthLoading(false);

        if (!newSession) {
          setCurrentPage('feed');
          setPageData({});
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const payment = url.searchParams.get('payment');

    if (payment === 'success' || payment === 'cancel') {
      setCurrentPage('wallet');
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    fetchUnreadCount();

    const channel = supabase
      .channel('topmusic-global-unread')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topmusic_chat_messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  function handleNavigate(page: string, data?: unknown) {
    setCurrentPage(page as Page);
    setPageData(data ? (data as PageData) : {});
  }

  const hideTopNavOnMobile = currentPage === 'feed' || currentPage === 'live';

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading TopMusic...
      </div>
    );
  }

  if (!session) {
    return (
      <PayPalScriptProvider
        options={{
          clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
          currency: 'USD',
          intent: 'capture',
        }}
      >
        <MusicPlayerProvider>
          <AuthPage
            onSuccess={() => {
              setCurrentPage('feed');
              setPageData({});
            }}
          />
        </MusicPlayerProvider>
      </PayPalScriptProvider>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: 'USD',
        intent: 'capture',
      }}
    >
      <MusicPlayerProvider>
        <div className="min-h-screen bg-black pb-24">
          <Navigation
            currentPage={currentPage}
            onNavigate={handleNavigate}
            hideTopNavOnMobile={hideTopNavOnMobile}
            unreadCount={unreadCount}
          />

          {currentPage === 'feed' && <Feed onNavigate={handleNavigate} />}
          {currentPage === 'live' && <LivePage onNavigate={handleNavigate} />}
          {currentPage === 'wallet' && <Wallet onNavigate={handleNavigate} />}
          {currentPage === 'buyCoins' && <BuyCoins onNavigate={handleNavigate} />}
          {currentPage === 'secret-topmusic-admin' && <AdminWithdraw />}
          {currentPage === 'earningsDashboard' && <EarningsDashboard />}
          {currentPage === 'financeDashboard' && <FinanceDashboard />}
          {currentPage === 'artistInbox' && (
            <ArtistInbox onNavigate={handleNavigate} />
          )}
          {currentPage === 'profile' && <ProfilePage />}
          {currentPage === 'notifications' && <NotificationsPage />}

          {currentPage === 'chat' && pageData?.artistId && (
            <Chat
              artistId={pageData.artistId}
              fanUserId={pageData.fanUserId}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'success' && (
            <CheckoutSuccess onNavigate={handleNavigate} />
          )}

          {currentPage === 'cancel' && (
            <CheckoutCancel onNavigate={handleNavigate} />
          )}

          {currentPage === 'artists' && (
            <ArtistsListing onNavigate={handleNavigate} />
          )}

          {currentPage === 'artist' && (
            <ArtistPage artistId={pageData} onNavigate={handleNavigate} />
          )}

          {currentPage === 'upload' && (
            <UploadMusic onNavigate={handleNavigate} />
          )}

          {currentPage === 'home' && <Homepage onNavigate={handleNavigate} />}

          {currentPage === 'pricing' && <Pricing />}

          {currentPage === 'region' && pageData.region && (
            <RegionExplorer
              region={pageData.region}
              onBack={() => handleNavigate('feed')}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'sendGift' && (
            <SendGift onNavigate={handleNavigate} />
          )}

          <MusicPlayer />
        </div>
      </MusicPlayerProvider>
    </PayPalScriptProvider>
  );
}

export default App;